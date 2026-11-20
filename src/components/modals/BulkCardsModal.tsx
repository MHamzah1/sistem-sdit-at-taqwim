"use client";

import React, { useState, useEffect, Fragment } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import type { AppState } from "@/server/state";
import { Brand } from "../Brand";
import { Badge } from "../Badge";
import { Modal } from "../Modal";
import { examParticipantNumber } from "@/src/lib/calculations";
import { api } from "@/src/lib/api";

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
    <Modal title="Cetak Massal Kartu Ujian" close={close}>
      <div className="bulk-modal-wrapper">
        <div className="no-print" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Periode Ujian
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                }}
              >
                {data.exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Rombel / Kelas
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="">Semua Kelas</option>
                {data.classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="outline"
              disabled={busy}
              onClick={() => void loadCards()}
              style={{ height: 38 }}
            >
              {busy ? "Memproses..." : "Muat Ulang"}
            </button>
          </div>

          {error && (
            <p className="error" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}

          {bulkResult && (
            <div className="bulk-summary-bar" style={{ marginTop: 14 }}>
              <div>
                <strong>Siap Cetak: </strong>
                <span>
                  {bulkResult.cards.length} kartu ({pages.length} lembar A4).{" "}
                  {bulkResult.ineligibleCount > 0
                    ? `${bulkResult.ineligibleCount} siswa belum layak dilewati otomatis.`
                    : "Semua siswa terdaftar berstatus layak."}
                </span>
              </div>
              <button
                className="primary"
                disabled={bulkResult.cards.length === 0}
                onClick={() => window.print()}
              >
                <Printer size={16} />
                Cetak Lembar Kartu ({bulkResult.cards.length})
              </button>
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
                      <div className="bulk-card-item">
                        <Brand />
                        <div className="card-heading">
                          <h2>KARTU PESERTA UJIAN</h2>
                          <p>
                            {examObj?.name} · {academicYear?.name}
                          </p>
                        </div>
                        <div className="exam-card-body">
                          <div>
                            <div className="participant-badge">
                              <strong>No. Peserta: </strong>
                              <span className="participant-number">
                                {partNumber}
                              </span>
                            </div>
                            <h3>{student?.name}</h3>
                            <p>
                              NIS: {student?.nis} · NISN: {student?.nisn || "—"}
                            </p>
                            <p>Kelas: {classItem?.name}</p>
                            {eligibility && (
                              <Badge status={eligibility.status} />
                            )}
                          </div>
                          <div className="exam-card-media">
                            {student?.photoUrl ? (
                              <div className="student-photo-frame">
                                <img
                                  src={student.photoUrl}
                                  alt="Pas foto siswa"
                                  className="student-card-photo"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display =
                                      "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="student-photo-placeholder">
                                <span>
                                  Pas Foto
                                  <br />3 x 4
                                </span>
                              </div>
                            )}
                            {qrCodes[c.id] && (
                              <img
                                src={qrCodes[c.id]}
                                alt={`QR ${student?.name}`}
                                width={120}
                                height={120}
                              />
                            )}
                          </div>
                        </div>
                        <p>
                          Pelaksanaan: {examObj?.startDate} – {examObj?.endDate}
                        </p>
                        <small>Kode verifikasi: {c.verificationCode}</small>
                        <p style={{ fontSize: 11, color: "#64748b" }}>
                          Validasi QR oleh petugas sekolah yang sudah masuk.
                        </p>
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
