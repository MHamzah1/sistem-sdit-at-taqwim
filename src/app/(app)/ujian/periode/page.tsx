"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { DataForm, type Field, type FormSpec } from "@/src/components/DataForm";
import { Modal } from "@/src/components/Modal";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type ExamPeriod = AppState["exams"][number];

export default function PeriodeUjianPage() {
  const { state, loading, busy, save, run, can, yearName, setToast } = useApp();

  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);
  const [examToDelete, setExamToDelete] = useState<ExamPeriod | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat data periode ujian...</p>
        </div>
      </div>
    );
  }

  const exams = state.exams;
  const examTypes = state.examTypes;
  const academicYears = state.academicYears;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const examFields: Field[] = [
    {
      key: "examTypeId",
      label: "Jenis Ujian",
      options: examTypes.map((t) => ({ value: t.id, label: t.name })),
    },
    {
      key: "academicYearId",
      label: "Tahun Ajaran",
      options: academicYears.map((y) => ({
        value: y.id,
        label: `${y.name} ${y.active ? "(Aktif)" : ""}`,
      })),
    },
    { key: "name", label: "Nama Periode Ujian (contoh: PTS Ganjil 2026/2027)" },
    {
      key: "semester",
      label: "Semester",
      options: [
        { value: "1", label: "Semester 1 (Ganjil)" },
        { value: "2", label: "Semester 2 (Genap)" },
      ],
      defaultValue: "1",
    },
    { key: "startDate", label: "Tanggal Mulai Ujian", type: "date" },
    { key: "endDate", label: "Tanggal Selesai Ujian", type: "date" },
    {
      key: "administrativeDeadline",
      label: "Batas Akhir Administrasi Keuangan",
      type: "date",
    },
    {
      key: "requiredUntilMonth",
      label: "Syarat Lunas SPP Sampai Bulan",
      type: "month",
      defaultValue: currentMonth,
    },
  ];

  const handleAddType = () => {
    setFormConfig({
      title: "Tambah Jenis Ujian",
      fields: [{ key: "name", label: "Nama Jenis Ujian (contoh: PTS, PAS, PAT, US)" }],
      submit: async (values) => {
        await save("exam-types", values);
        setToast("Jenis ujian berhasil ditambahkan");
        setFormConfig(null);
      },
    });
  };

  const handleAddExam = () => {
    setFormConfig({
      title: "Buat Periode Ujian Baru",
      fields: examFields,
      submit: async (values) => {
        await save("exams", {
          ...values,
          semester: Number(values.semester),
          requiredUntilMonth: values.requiredUntilMonth + "-01",
        });
        setToast("Periode ujian berhasil dibuat");
        setFormConfig(null);
      },
    });
  };

  const handleEditExam = (exam: ExamPeriod) => {
    setFormConfig({
      title: "Ubah Periode Ujian",
      fields: examFields,
      initial: {
        examTypeId: exam.examTypeId,
        academicYearId: exam.academicYearId,
        name: exam.name,
        semester: String(exam.semester),
        startDate: exam.startDate,
        endDate: exam.endDate,
        administrativeDeadline: exam.administrativeDeadline,
        requiredUntilMonth: exam.requiredUntilMonth.slice(0, 7),
      },
      submit: async (values) => {
        await save(
          "exams",
          {
            ...values,
            semester: Number(values.semester),
            requiredUntilMonth: values.requiredUntilMonth + "-01",
          },
          exam.id,
        );
        setToast("Periode ujian berhasil diperbarui");
        setFormConfig(null);
      },
    });
  };

  const handleDelete = async () => {
    if (!examToDelete) return;
    await run(
      () => api(`exams/${examToDelete.id}`, "DELETE"),
      `Periode ujian ${examToDelete.name} berhasil dihapus`,
    );
    setExamToDelete(null);
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <CalendarDays size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Ujian</span>
              <span>/</span>
              <span>Periode Ujian</span>
            </div>
            <h1 className="st-title">Periode Ujian</h1>
            <p className="st-subtitle">
              Konfigurasi jadwal pelaksanaan asesmen sekolah, batas administrasi, dan syarat pelunasan SPP.
            </p>
          </div>
        </div>

        {can("master") && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-secondary"
              onClick={handleAddType}
            >
              <Plus size={16} />
              <span>Jenis Ujian</span>
            </button>
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleAddExam}
            >
              <Plus size={16} />
              <span>Buat Periode Ujian</span>
            </button>
          </div>
        )}
      </div>

      {/* Exam Grid */}
      {exams.length === 0 ? (
        <div className="st-table-card">
          <div className="st-empty-state">
            <CalendarDays size={48} className="st-empty-icon" />
            <h3>Belum ada periode ujian</h3>
            <p>Buat periode ujian untuk memulai evaluasi kelayakan dan penerbitan kartu ujian ber-QR.</p>
            {can("master") && (
              <button
                type="button"
                className="st-btn-primary"
                onClick={handleAddExam}
                style={{ marginTop: 12 }}
              >
                <Plus size={16} />
                <span>Buat Periode Ujian Sekarang</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
          {exams.map((e) => (
            <div
              key={e.id}
              className="st-section-card"
              style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="st-header-icon-box" style={{ width: 40, height: 40, fontSize: 18 }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#16613e" }}>
                        {e.name}
                      </h3>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        {yearName(e.academicYearId)} · Semester {e.semester}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, fontSize: 13, background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Pelaksanaan:</span>
                    <strong>{e.startDate} s.d {e.endDate}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Batas Administrasi:</span>
                    <strong>{e.administrativeDeadline}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Syarat Lunas SPP:</span>
                    <strong style={{ color: "#16613e" }}>Sampai {e.requiredUntilMonth.slice(0, 7)}</strong>
                  </div>
                </div>
              </div>

              {can("master") && (
                <div style={{ display: "flex", gap: 8, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={() => handleEditExam(e)}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <Pencil size={14} />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    className="st-btn-action delete"
                    onClick={() => setExamToDelete(e)}
                    title="Hapus Periode Ujian"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Form Modal */}
      {formConfig && (
        <DataForm
          spec={formConfig}
          close={() => setFormConfig(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {examToDelete && (
        <Modal
          title="Konfirmasi Hapus Periode Ujian"
          close={() => !busy && setExamToDelete(null)}
        >
          <div className="st-delete-modal-body">
            <p>
              Apakah Anda yakin ingin menghapus periode ujian{" "}
              <strong>{examToDelete.name}</strong>?
            </p>
            <div className="notice amber" style={{ marginTop: 12 }}>
              Periode ujian yang sudah memiliki riwayat kartu peserta ujian atau
              evaluasi kelayakan tidak dapat dihapus.
            </div>
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={() => setExamToDelete(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                {busy ? "Menghapus..." : "Ya, Hapus Periode Ujian"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
