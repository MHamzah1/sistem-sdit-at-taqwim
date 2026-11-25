"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { DataForm, type FormSpec, type Field } from "@/src/components/DataForm";
import { money } from "@/src/lib/formatters";
import type { AppState } from "@/server/state";

type Dispensation = AppState["dispensations"][number];

export default function DispensasiPage() {
  const { state, loading, busy, save, can, isGuardian, studentName, setToast } =
    useApp();

  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat daftar dispensasi ujian...</p>
        </div>
      </div>
    );
  }

  const dispensations = state.dispensations;
  const exams = state.exams;
  const students = state.students;
  const promises = state.promises;
  const reviews = state.reviews;

  const currentExam = exams[0];

  const handleRequest = () => {
    setFormConfig({
      title: "Ajukan Permohonan Dispensasi Ujian",
      note: "Persetujuan final berada di kewenangan Kepala Sekolah setelah rekomendasi dari staf Tata Usaha. Dispensasi tidak menghapus tunggakan invoice SPP.",
      fields: [
        {
          key: "studentId",
          label: "Pilih Siswa",
          options: students.map((s) => ({
            value: s.id,
            label: `${s.name} (${s.nis})`,
          })),
        },
        {
          key: "examPeriodId",
          label: "Periode Ujian",
          options: exams.map((e) => ({
            value: e.id,
            label: e.name,
          })),
          defaultValue: currentExam?.id || "",
        },
        {
          key: "reason",
          label: "Alasan Permohonan Dispensasi",
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
          studentId: values.studentId,
          examPeriodId: values.examPeriodId,
          reason: values.reason,
          amount: Number(values.amount || 0),
          promisedOn: values.promisedOn,
        });
        setToast("Pengajuan dispensasi berhasil dikirim");
        setFormConfig(null);
      },
    });
  };

  const handleReviewAction = (
    dispensation: Dispensation,
    action: "review" | "approve" | "reject",
  ) => {
    const actionLabel =
      action === "review"
        ? "Review Tata Usaha (TU)"
        : action === "approve"
          ? "Setujui Dispensasi (Kepala Sekolah)"
          : "Tolak Dispensasi (Kepala Sekolah)";

    setFormConfig({
      title: actionLabel,
      note: `Masukkan catatan atau pertimbangan resmi untuk dispensasi santri ${studentName(dispensation.studentId)}.`,
      fields: [
        {
          key: "notes",
          label: "Catatan Pertimbangan / Rekomendasi (Minimal 3 karakter)",
          type: "textarea",
          required: true,
        },
      ],
      submit: async (values) => {
        await save(`dispensations/${dispensation.id}/${action}`, values);
        setToast(`Keputusan dispensasi (${actionLabel}) berhasil disimpan`);
        setFormConfig(null);
      },
    });
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <FileCheck2 size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Ujian</span>
              <span>/</span>
              <span>Dispensasi</span>
            </div>
            <h1 className="st-title">Dispensasi Ujian</h1>
            <p className="st-subtitle">
              Alur persetujuan bertingkat bagi siswa yang membutuhkan penangguhan pembayaran SPP menjelang ujian.
            </p>
          </div>
        </div>

        {(can("finance") || isGuardian) && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleRequest}
            >
              <Plus size={16} />
              <span>Ajukan Dispensasi</span>
            </button>
          </div>
        )}
      </div>

      <div className="notice amber" style={{ marginBottom: 20 }}>
        <AlertCircle size={18} />
        <span>
          <strong>Prosedur Dua Tahap:</strong> Pengajuan dispensasi harus direview
          oleh staf TU terlebih dahulu, sebelum keputusan akhir (Setujui/Tolak)
          ditetapkan oleh <strong>Kepala Sekolah</strong>. Persetujuan dispensasi
          memberikan izin cetak kartu ujian, namun invoice SPP tetap tercatat belum lunas.
        </span>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        {dispensations.length === 0 ? (
          <div className="st-empty-state">
            <FileCheck2 size={48} className="st-empty-icon" />
            <h3>Belum ada pengajuan dispensasi</h3>
            <p>Pengajuan dispensasi ujian santri akan dicatat dan diproses di sini.</p>
          </div>
        ) : (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Siswa & Ujian</th>
                  <th>Alasan Pengajuan</th>
                  <th>Komitmen Janji Bayar</th>
                  <th>Status & Riwayat Review</th>
                  <th style={{ textAlign: "right", minWidth: 160 }}>Keputusan</th>
                </tr>
              </thead>
              <tbody>
                {dispensations.map((d, idx) => {
                  const examObj = exams.find((e) => e.id === d.examPeriodId);
                  const promise = promises.find((p) => p.dispensationId === d.id);
                  const reviewList = reviews.filter((r) => r.dispensationId === d.id);

                  return (
                    <tr key={d.id} className="st-table-row">
                      <td className="st-col-idx">{idx + 1}</td>
                      <td>
                        <strong className="st-user-name">
                          {studentName(d.studentId)}
                        </strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {examObj?.name || "Periode Ujian"}
                        </div>
                      </td>
                      <td>
                        <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
                          {d.reason}
                        </p>
                      </td>
                      <td>
                        {promise ? (
                          <div>
                            <strong style={{ color: "#16613e" }}>
                              {money(promise.amount)}
                            </strong>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              Janji: {promise.promisedOn}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <Badge status={d.status} />
                        {reviewList.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                            {reviewList.map((r) => (
                              <small key={r.id} style={{ color: "#64748b", fontSize: 11 }}>
                                • {r.action}: {r.notes}
                              </small>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="st-action-row">
                          {d.status === "SUBMITTED" && can("finance") && (
                            <button
                              type="button"
                              className="st-btn-action detail"
                              onClick={() => handleReviewAction(d, "review")}
                              title="Lakukan Review Awal TU"
                            >
                              <Clock size={14} />
                              <span>Review TU</span>
                            </button>
                          )}

                          {d.status === "REVIEWED" && can("principal") && (
                            <>
                              <button
                                type="button"
                                className="st-btn-action pay"
                                onClick={() => handleReviewAction(d, "approve")}
                                title="Setujui Dispensasi Ujian (Kepala Sekolah)"
                              >
                                <CheckCircle size={14} />
                                <span>Setujui</span>
                              </button>
                              <button
                                type="button"
                                className="st-btn-action delete"
                                onClick={() => handleReviewAction(d, "reject")}
                                title="Tolak Permohonan Dispensasi"
                              >
                                <XCircle size={14} />
                                <span>Tolak</span>
                              </button>
                            </>
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

      {/* Dynamic Form Modal */}
      {formConfig && (
        <DataForm
          spec={formConfig}
          close={() => setFormConfig(null)}
        />
      )}
    </div>
  );
}
