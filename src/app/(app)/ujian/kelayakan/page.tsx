"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileCheck2,
  IdCard,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { ExamCardModal, type ExamCardData } from "@/src/components/modals";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type Student = AppState["students"][number];

export default function KelayakanUjianPage() {
  const { state, loading, busy, run, save, can, isGuardian, className, setToast, setError } =
    useApp();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [examCard, setExamCard] = useState<ExamCardData | null>(null);
  const [dispensationForm, setDispensationForm] = useState<FormSpec | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat data kelayakan ujian...</p>
        </div>
      </div>
    );
  }

  const exams = state.exams;
  const classes = state.classes;
  const students = state.students;
  const eligibilities = state.eligibilities;

  const currentExam =
    exams.find((e) => e.id === selectedExamId) || exams[0];

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

      const elig = eligibilities.find(
        (e) => e.studentId === s.id && e.examPeriodId === currentExam?.id,
      );
      const currentStatus = elig?.status || "NOT_EVALUATED";

      if (statusFilter !== "ALL" && currentStatus !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNis = s.nis.toLowerCase().includes(q);
        if (!matchName && !matchNis) return false;
      }

      return true;
    });
  }, [examRoster, selectedClassId, eligibilities, currentExam, statusFilter, search]);

  const handleEvaluate = async (student: Student) => {
    if (!currentExam) return;
    await run(
      () =>
        api(`exams/${currentExam.id}/eligibility`, "POST", {
          studentId: student.id,
        }),
      `Kelayakan untuk ${student.name} diperbarui`,
    );
  };

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

  const handleRequestDispensation = (student: Student) => {
    if (!currentExam) return;
    setDispensationForm({
      title: "Ajukan Dispensasi Ujian",
      note: "Pengajuan dispensasi akan direview oleh Tata Usaha dan disetujui final oleh Kepala Sekolah. Dispensasi tidak melunasi invoice SPP.",
      fields: [
        {
          key: "studentName",
          label: "Nama Siswa",
          defaultValue: `${student.name} (${student.nis})`,
        },
        {
          key: "reason",
          label: "Alasan Pengajuan Dispensasi",
          type: "textarea",
          required: true,
        },
        {
          key: "amount",
          label: "Kemampuan Bayar Saat Ini (Rp)",
          type: "number",
          min: 0,
          defaultValue: 0,
        },
        {
          key: "promisedOn",
          label: "Tanggal Janji Pelunasan",
          type: "date",
          required: true,
        },
      ],
      submit: async (values) => {
        await save("dispensations", {
          studentId: student.id,
          examPeriodId: currentExam.id,
          reason: values.reason,
          amount: Number(values.amount || 0),
          promisedOn: values.promisedOn,
        });
        setToast("Pengajuan dispensasi berhasil dikirim");
        setDispensationForm(null);
      },
    });
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Ujian</span>
              <span>/</span>
              <span>Kelayakan Ujian</span>
            </div>
            <h1 className="st-title">Evaluasi Kelayakan Ujian</h1>
            <p className="st-subtitle">
              Pemeriksaan syarat deterministik kepesertaan asesmen berbasis pelunasan SPP dan dispensasi sah.
            </p>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {currentExam ? (
        <div className="notice" style={{ marginBottom: 20 }}>
          <ShieldCheck size={20} />
          <span>
            <strong>
              {currentExam.name} · Pelaksanaan {currentExam.startDate} s.d {currentExam.endDate}
            </strong>
            <br />
            Syarat SPP wajib lunas sampai{" "}
            <strong>{currentExam.requiredUntilMonth.slice(0, 7)}</strong>. Batas
            administrasi: {currentExam.administrativeDeadline}.
          </span>
        </div>
      ) : (
        <div className="notice amber" style={{ marginBottom: 20 }}>
          <AlertTriangle size={20} />
          <span>
            Belum ada periode ujian. Silakan buat periode ujian terlebih dahulu
            pada menu Periode Ujian.
          </span>
        </div>
      )}

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

          {/* Status Filter */}
          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter Status Kelayakan"
            >
              <option value="ALL">Semua Kelayakan</option>
              <option value="ELIGIBLE">Layak (Lunas)</option>
              <option value="ELIGIBLE_DISPENSATION">Layak (Dispensasi)</option>
              <option value="INELIGIBLE">Belum Layak</option>
              <option value="NOT_EVALUATED">Belum Dievaluasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        {filteredStudents.length === 0 ? (
          <div className="st-empty-state">
            <ShieldCheck size={48} className="st-empty-icon" />
            <h3>Tidak ada siswa yang sesuai filter</h3>
            <p>Pastikan tahun ajaran periode ujian sesuai dengan penempatan kelas siswa.</p>
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
                  <th>Keterangan / Alasan</th>
                  <th style={{ textAlign: "right", minWidth: 220 }}>Aksi</th>
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
                          {elig?.reason || "Belum dievaluasi oleh sistem"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="st-action-row">
                          <button
                            type="button"
                            className="st-btn-action detail"
                            onClick={() => void handleEvaluate(s)}
                            title="Jalankan Evaluasi Deterministik"
                          >
                            <RefreshCw size={14} />
                            <span>Evaluasi</span>
                          </button>

                          {isEligible && (
                            <button
                              type="button"
                              className="st-btn-action pay"
                              onClick={() => void handlePrintCard(s)}
                              title="Terbitkan Kartu Ujian Resmi"
                            >
                              <IdCard size={14} />
                              <span>Kartu</span>
                            </button>
                          )}

                          {!isEligible && (can("finance") || isGuardian) && (
                            <button
                              type="button"
                              className="st-btn-action wa"
                              onClick={() => handleRequestDispensation(s)}
                              title="Ajukan Permohonan Dispensasi Ujian"
                            >
                              <FileCheck2 size={14} />
                              <span>Dispensasi</span>
                            </button>
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

      {/* Exam Card Modal */}
      {examCard && (
        <ExamCardModal
          card={examCard}
          data={state}
          close={() => setExamCard(null)}
        />
      )}

      {/* Dispensation Form Modal */}
      {dispensationForm && (
        <DataForm
          spec={dispensationForm}
          close={() => setDispensationForm(null)}
        />
      )}
    </div>
  );
}
