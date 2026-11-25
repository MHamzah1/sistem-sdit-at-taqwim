"use client";

import React, { useState, useEffect, Fragment } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import type { AppState } from "@/server/state";
import { Modal } from "../Modal";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { examParticipantNumber } from "@/src/lib/calculations";
import { api } from "@/src/lib/api";
import { ExamCardView } from "../cards";

interface BulkCardsModalProps {
  data: AppState;
  initialExam?: AppState["exams"][number];
  close: () => void;
}

export function BulkCardsModal({
  data,
  initialExam,
  close,
}: BulkCardsModalProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExam?.id || data.exams[0]?.id || "",
  );
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bulkResult, setBulkResult] = useState<{
    totalStudents: number;
    eligibleCount: number;
    ineligibleCount: number;
    cards: Array<AppState["examCards"][number]>;
    eligibleStudentIds: string[];
  } | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  async function loadCards() {
    if (!selectedExamId) {
      setError("Pilih periode ujian terlebih dahulu");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api<{
        totalStudents: number;
        eligibleCount: number;
        ineligibleCount: number;
        cards: Array<AppState["examCards"][number]>;
        eligibleStudentIds: string[];
      }>("exam-cards/bulk", "POST", {
        examPeriodId: selectedExamId,
        classId: selectedClassId || undefined,
      });

      const qrEntries = await Promise.all(
        res.cards.map(async (c) => {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          const url = await QRCode.toDataURL(
            `${origin}/ujian/kartu?code=${c.verificationCode}`,
            { width: 140, margin: 1 },
          );
          return [c.id, url] as const;
        }),
      );
      setQrCodes(Object.fromEntries(qrEntries));
      setBulkResult(res);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Gagal memproses kartu ujian massal",
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (selectedExamId) {
      void loadCards();
    }
  }, [selectedExamId, selectedClassId]);

  const examObj = data.exams.find((e) => e.id === selectedExamId);
  const academicYear = data.academicYears.find(
    (y) => y.id === examObj?.academicYearId,
  );

  const pages: Array<Array<AppState["examCards"][number]>> = [];
  if (bulkResult) {
    for (let i = 0; i < bulkResult.cards.length; i += 2) {
      pages.push(bulkResult.cards.slice(i, i + 2));
    }
  }

  return (
    <Modal title="Cetak Massal Kartu Ujian" close={close} className="max-w-4xl">
      <div className="bulk-modal-wrapper">
        <div className="no-print space-y-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end">
            <div className="min-w-0 space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/90">
                Periode Ujian
              </label>
              <Select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full min-w-0"
              >
                {data.exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-0 space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/90">
                Rombel / Kelas
              </label>
              <Select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full min-w-0"
              >
                <option value="">Semua Kelas</option>
                {data.classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void loadCards()}
                className="w-full sm:w-auto h-9 px-4 text-xs whitespace-nowrap"
              >
                {busy ? "Memproses..." : "Muat Ulang"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium">
              <span>{error}</span>
            </div>
          )}

          {bulkResult && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
              <div className="space-y-0.5">
                <strong className="text-primary font-semibold block">Siap Cetak:</strong>
                <span className="text-muted-foreground text-[11px]">
                  {bulkResult.cards.length} kartu ({pages.length} lembar A4).{" "}
                  {bulkResult.ineligibleCount > 0
                    ? `${bulkResult.ineligibleCount} siswa belum layak dilewati otomatis.`
                    : "Semua siswa terdaftar berstatus layak."}
                </span>
              </div>
              <Button
                disabled={bulkResult.cards.length === 0}
                onClick={() => window.print()}
                className="w-full sm:w-auto gap-2 text-xs font-semibold shadow-sm"
              >
                <Printer className="size-4" />
                Cetak Lembar Kartu ({bulkResult.cards.length})
              </Button>
            </div>
          )}
        </div>

        {bulkResult && bulkResult.cards.length > 0 && (
          <div className="bulk-cards-sheet">
            {pages.map((page, pageIdx) => (
              <div key={pageIdx} className="bulk-card-page">
                {page.map((c, idx) => {
                  const student = data.students.find(
                    (s) => s.id === c.studentId,
                  );
                  const classItem = data.classes.find(
                    (cl) => cl.id === student?.classId,
                  );
                  const classStudents = data.students.filter(
                    (s) => s.classId === student?.classId,
                  );
                  const partNumber = examParticipantNumber(
                    examObj?.name || "",
                    academicYear?.name || "",
                    classItem?.name || "",
                    c.studentId,
                    classStudents,
                  );
                  const eligibility = data.eligibilities.find(
                    (el) =>
                      el.studentId === c.studentId &&
                      el.examPeriodId === c.examPeriodId,
                  );

                  return (
                    <Fragment key={c.id}>
                      <div className="bulk-card-item p-0 border-0 bg-transparent shadow-none">
                        <ExamCardView
                          student={{
                            id: student?.id || c.studentId,
                            name: student?.name || "Siswa",
                            nis: student?.nis || "—",
                            nisn: student?.nisn,
                            photoUrl: student?.photoUrl,
                            classId: student?.classId,
                          }}
                          classNameStr={classItem?.name || "—"}
                          participantNumber={partNumber}
                          examName={examObj?.name || "Ujian"}
                          academicYearName={academicYear?.name || "—"}
                          startDate={examObj?.startDate || ""}
                          endDate={examObj?.endDate || ""}
                          status={eligibility?.status || "ELIGIBLE"}
                          qrCodeUrl={qrCodes[c.id]}
                          compact={true}
                        />
                      </div>
                      {idx === 0 && page.length === 2 && (
                        <div className="bulk-cut-line">
                          <span className="bulk-cut-badge">
                            ✂ Gunting di sini
                          </span>
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {bulkResult && bulkResult.cards.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "30px 10px",
              color: "#64748b",
            }}
          >
            Tidak ada siswa yang berstatus layak ujian untuk kriteria yang
            dipilih.
          </div>
        )}
      </div>
    </Modal>
  );
}
