"use client";

import React, { useState } from "react";
import {
  BadgeCheck,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { Modal } from "@/src/components/Modal";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import { money } from "@/src/lib/formatters";
import { downloadProof } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type Payment = AppState["payments"][number];

export default function VerifikasiPembayaranPage() {
  const { state, loading, busy, save, can, studentName, run, setToast } =
    useApp();

  const [reviewAction, setReviewAction] = useState<{
    paymentId: string;
    action: "approve" | "reject";
    studentName: string;
  } | null>(null);

  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat antrean verifikasi transfer...</p>
        </div>
      </div>
    );
  }

  const pendingPayments = state.payments.filter(
    (p) => p.status === "PENDING_VERIFICATION",
  );
  const proofs = state.proofs;

  const handleReview = (payment: Payment, action: "approve" | "reject") => {
    const sName = studentName(payment.studentId);
    setFormConfig({
      title: action === "approve" ? "Setujui Pembayaran Transfer" : "Tolak Pembayaran Transfer",
      note:
        action === "approve"
          ? `Menyetujui pembayaran sebesar ${money(payment.amount)} untuk ${sName}. Invoice terkait akan otomatis ditandai LUNAS.`
          : `Menolak bukti transfer untuk ${sName}. Invoice terkait akan kembali berstatus UNPAID / OVERDUE.`,
      fields: [
        {
          key: "reason",
          label: "Catatan Verifikasi (Wajib diisi jika menolak)",
          type: "textarea",
          required: action === "reject",
        },
      ],
      submit: async (values) => {
        await save(`payments/${payment.id}/${action}`, values);
        setToast(
          action === "approve"
            ? "Pembayaran berhasil disetujui & diverifikasi"
            : "Pembayaran telah ditolak",
        );
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
            <BadgeCheck size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Keuangan</span>
              <span>/</span>
              <span>Verifikasi Transfer</span>
            </div>
            <h1 className="st-title">Verifikasi Bukti Transfer</h1>
            <p className="st-subtitle">
              Pemeriksaan keaslian mutasi rekening dan persetujuan invoice SPP yang diunggah wali murid.
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        {pendingPayments.length === 0 ? (
          <div className="st-empty-state">
            <CheckCircle size={48} className="st-empty-icon" style={{ color: "#16613e" }} />
            <h3>Semua transfer telah diverifikasi!</h3>
            <p>Tidak ada transaksi yang menunggu verifikasi petugas saat ini.</p>
          </div>
        ) : (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Siswa</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Nominal Transfer</th>
                  <th>Bukti Transfer</th>
                  <th>Status</th>
                  {can("finance") && (
                    <th style={{ textAlign: "right", minWidth: 160 }}>Keputusan</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p, idx) => {
                  const proofFiles = proofs.filter((f) => f.paymentId === p.id);

                  return (
                    <tr key={p.id} className="st-table-row">
                      <td className="st-col-idx">{idx + 1}</td>
                      <td>
                        <strong className="st-user-name">
                          {studentName(p.studentId)}
                        </strong>
                      </td>
                      <td>{p.paidOn}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: "#16613e" }}>
                          {money(p.amount)}
                        </span>
                      </td>
                      <td>
                        {proofFiles.length === 0 ? (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>
                            Tidak ada berkas
                          </span>
                        ) : (
                          proofFiles.map((proof) => (
                            <button
                              key={proof.id}
                              type="button"
                              className="st-btn-action detail"
                              onClick={() =>
                                void run(
                                  () => downloadProof(proof),
                                  "Bukti transfer diunduh",
                                )
                              }
                              title={`Unduh ${proof.filename}`}
                            >
                              <Download size={14} />
                              <span>Lihat Bukti ({proof.filename})</span>
                            </button>
                          ))
                        )}
                      </td>
                      <td>
                        <Badge status={p.status} />
                      </td>
                      {can("finance") && (
                        <td style={{ textAlign: "right" }}>
                          <div className="st-action-row">
                            <button
                              type="button"
                              className="st-btn-action pay"
                              onClick={() => handleReview(p, "approve")}
                              title="Setujui Pembayaran"
                            >
                              <CheckCircle size={15} />
                              <span>Setujui</span>
                            </button>
                            <button
                              type="button"
                              className="st-btn-action delete"
                              onClick={() => handleReview(p, "reject")}
                              title="Tolak Pembayaran"
                            >
                              <XCircle size={15} />
                              <span>Tolak</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Decision Form */}
      {formConfig && (
        <DataForm
          spec={formConfig}
          close={() => setFormConfig(null)}
        />
      )}
    </div>
  );
}
