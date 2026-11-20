"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  IdCard,
  QrCode,
  Printer,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { Modal } from "@/src/components/Modal";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import {
  ExamCardModal,
  BulkCardsModal,
  type ExamCardData,
} from "@/src/components/modals";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type Student = AppState["students"][number];

export default function KartuUjianPage() {
  const { state, loading, busy, can, className, setToast, setError } = useApp();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("ALL");
  const [search, setSearch] = useState("");

  const [examCard, setExamCard] = useState<ExamCardData | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    eligibility?: { reason: string; status: string };
    message?: string;
  } | null>(null);

  const exams = state?.exams || [];
  const classes = state?.classes || [];
  const students = state?.students || [];
  const eligibilities = state?.eligibilities || [];

  const currentExam =
    exams.find((e) => e.id === selectedExamId) || exams[0];

  // Auto-validate if ?code= parameter is in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        void handleValidateCode(code);
      }
    }
  }, []);

  const examRoster = useMemo(() => {
    if (!currentExam) return [];
    return students.filter((s) => {
      const cls = classes.find((c) => c.id === s.classId);
      return cls?.academicYearId === currentExam.academicYearId;
    });
  }, [students, classes, currentExam]);

  const filteredStudents = useMemo(() => {
    return examRoster.filter((s) => {
      if (selectedClassId !== "ALL" && s.classId !== selectedClassId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNis = s.nis.toLowerCase().includes(q);
        if (!matchName && !matchNis) return false;
      }
      return true;
    });
  }, [examRoster, selectedClassId, search]);

  const handlePrintCard = async (student: Student) => {
    if (!currentExam) return;
    try {
      const result = await api<ExamCardData>("exam-cards", "POST", {
        studentId: student.id,
        examPeriodId: currentExam.id,
      });
      setExamCard(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menerbitkan kartu ujian",
      );
    }
  };

  const handleValidateCode = async (rawCode: string) => {
    let code = rawCode.trim();
    if (code.startsWith("http")) {
      try {
        const url = new URL(code);
        code = url.searchParams.get("code") || code;
      } catch {
        // use raw code
      }
    }

    try {
      const res = await api<{
        valid: boolean;
        eligibility: { reason: string; status: string };
      }>(`exam-cards/${encodeURIComponent(code)}/validate`);
      setValidationResult(res);
      setValidateModalOpen(false);
    } catch (err) {
      setValidationResult({
        valid: false,
        message: err instanceof Error ? err.message : "Kode verifikasi tidak valid",
      });
      setValidateModalOpen(false);
    }
  };

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat penerbitan kartu ujian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <IdCard size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Ujian</span>
              <span>/</span>
              <span>Kartu & Validasi QR</span>
            </div>
            <h1 className="st-title">Kartu Peserta Ujian</h1>
            <p className="st-subtitle">
              Penerbitan kartu peserta ber-QR, cetak lembar massal format A4, dan validasi keaslian kartu di gerbang ujian.
            </p>
          </div>
        </div>

        <div className="st-header-actions">
          <button
            type="button"
            className="st-btn-secondary"
            onClick={() => setValidateModalOpen(true)}
          >
            <QrCode size={16} />
            <span>Validasi Kode QR</span>
          </button>
          {can("master") && (
            <button
              type="button"
              className="st-btn-primary"
              onClick={() => setBulkModalOpen(true)}
            >
              <Printer size={16} />
              <span>Cetak Massal</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Strip */}
      <div className="st-filter-card">
        <div className="st-search-box">
          <Search size={18} className="st-search-icon" />
          <input
            type="text"
            className="st-search-input"
            placeholder="Cari siswa atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="st-filter-group">
          {/* Exam Period Selector */}
          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={currentExam?.id || ""}
              onChange={(e) => setSelectedExamId(e.target.value)}
              aria-label="Pilih Periode Ujian"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              aria-label="Filter Rombel"
            >
              <option value="ALL">Semua Kelas</option>
              {classes
                .filter((c) => c.academicYearId === currentExam?.academicYearId)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        {filteredStudents.length === 0 ? (
          <div className="st-empty-state">
            <IdCard size={48} className="st-empty-icon" />
            <h3>Tidak ada siswa ditemukan</h3>
            <p>Pilih periode ujian dan rombongan belajar untuk melihat daftar penerbitan kartu ujian.</p>
          </div>
        ) : (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>Status Kelayakan</th>
                  <th>Keterangan</th>
                  <th style={{ textAlign: "right", minWidth: 140 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => {
                  const elig = eligibilities.find(
                    (el) =>
                      el.studentId === s.id && el.examPeriodId === currentExam?.id,
                  );
                  const isEligible =
                    elig?.status === "ELIGIBLE" ||
                    elig?.status === "ELIGIBLE_DISPENSATION";

                  return (
                    <tr key={s.id} className="st-table-row">
                      <td className="st-col-idx">{idx + 1}</td>
                      <td>
                        <strong className="st-user-name">{s.name}</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          NIS: {s.nis}
                        </div>
                      </td>
                      <td>{className(s.classId)}</td>
                      <td>
                        <Badge status={elig?.status || "NOT_EVALUATED"} />
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: elig?.reason ? "#334155" : "#94a3b8" }}>
                          {elig?.reason || "Belum dievaluasi"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="st-action-row">
                          {isEligible ? (
                            <button
                              type="button"
                              className="st-btn-action pay"
                              onClick={() => void handlePrintCard(s)}
                              title="Buka & Cetak Kartu Peserta Ujian"
                            >
                              <IdCard size={15} />
                              <span>Kartu</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>
                              Belum Layak
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validate QR Input Modal */}
      {validateModalOpen && (
        <Modal
          title="Validasi Kartu Ujian (Scan QR / Masukkan Kode)"
          close={() => setValidateModalOpen(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const code = form.get("code") as string;
              if (code) void handleValidateCode(code);
            }}
          >
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Tempelkan URL hasil scan kamera atau ketik kode verifikasi kartu ujian:
            </p>
            <label>
              Kode Verifikasi / Link QR:
              <input
                type="text"
                name="code"
                placeholder="Contoh: https://.../ujian/kartu?code=XXXX-XXXX atau XXXX-XXXX"
                required
                autoFocus
              />
            </label>
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                onClick={() => setValidateModalOpen(false)}
              >
                Batal
              </button>
              <button type="submit" className="primary">
                Validasi Sekarang
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Validation Result Modal */}
      {validationResult && (
        <Modal
          title="Hasil Validasi Kartu Ujian"
          close={() => setValidationResult(null)}
        >
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            {validationResult.valid ? (
              <>
                <div style={{ display: "inline-flex", padding: 16, borderRadius: "50%", background: "#e8f2ec", color: "#16613e", marginBottom: 12 }}>
                  <CheckCircle size={48} />
                </div>
                <h3 style={{ fontSize: 18, color: "#16613e", margin: "0 0 8px 0" }}>
                  KARTU UJIAN SAH & VALID
                </h3>
                <p style={{ fontSize: 14, color: "#334155", margin: "0 0 16px 0" }}>
                  Siswa berstatus layak mengikuti asesmen ujian.
                </p>
                {validationResult.eligibility && (
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, textAlign: "left" }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Status Kelayakan:</div>
                    <strong>{validationResult.eligibility.status}</strong>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Keterangan:</div>
                    <div style={{ fontSize: 13 }}>{validationResult.eligibility.reason}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: "inline-flex", padding: 16, borderRadius: "50%", background: "#fee2e2", color: "#ef4444", marginBottom: 12 }}>
                  <XCircle size={48} />
                </div>
                <h3 style={{ fontSize: 18, color: "#b91c1c", margin: "0 0 8px 0" }}>
                  KARTU UJIAN TIDAK VALID / EXPIRED
                </h3>
                <p style={{ fontSize: 14, color: "#334155" }}>
                  {validationResult.message ||
                    "Status kelayakan siswa saat ini tidak memenuhi syarat ujian atau kode verifikasi palsu."}
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            className="primary full"
            onClick={() => setValidationResult(null)}
            style={{ marginTop: 16 }}
          >
            Tutup
          </button>
        </Modal>
      )}

      {/* Single Exam Card Modal */}
      {examCard && (
        <ExamCardModal
          card={examCard}
          data={state}
          close={() => setExamCard(null)}
        />
      )}

      {/* Bulk Print Modal */}
      {bulkModalOpen && (
        <BulkCardsModal
          data={state}
          initialExam={currentExam}
          close={() => setBulkModalOpen(false)}
        />
      )}
    </div>
  );
}
