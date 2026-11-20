"use client";

import React, { useState } from "react";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Download,
  ReceiptText,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { PaymentModal, ReceiptModal } from "@/src/components/modals";
import { money } from "@/src/lib/formatters";
import { downloadProof } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type Payment = AppState["payments"][number];

export default function PembayaranPage() {
  const { state, loading, busy, run, can, isGuardian, studentName, setToast } =
    useApp();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat riwayat transaksi pembayaran...</p>
        </div>
      </div>
    );
  }

  const payments = state.payments;
  const proofs = state.proofs;

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== "ALL" && p.method !== methodFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const sName = studentName(p.studentId).toLowerCase();
      const date = p.paidOn.toLowerCase();
      if (!sName.includes(q) && !date.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <ArrowLeftRight size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Keuangan</span>
              <span>/</span>
              <span>Pembayaran</span>
            </div>
            <h1 className="st-title">Pembayaran SPP</h1>
            <p className="st-subtitle">
              Pencatatan kasir tunai, pelaporan bukti transfer, serta pencetakan kuitansi resmi sekolah.
            </p>
          </div>
        </div>

        {(can("finance") || isGuardian) && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-primary"
              onClick={() => setPaymentModalOpen(true)}
            >
              <Plus size={16} />
              <span>Catat Pembayaran</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="st-filter-card">
        <div className="st-search-box">
          <Search size={18} className="st-search-icon" />
          <input
            type="text"
            className="st-search-input"
            placeholder="Cari siswa atau tanggal bayar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="st-filter-group">
          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Filter Metode Pembayaran"
            >
              <option value="ALL">Semua Metode</option>
              <option value="CASH">Tunai (Kasir)</option>
              <option value="TRANSFER">Transfer Bank</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        {filteredPayments.length === 0 ? (
          <div className="st-empty-state">
            <ArrowLeftRight size={48} className="st-empty-icon" />
            <h3>Belum ada catatan pembayaran</h3>
            <p>Transaksi pembayaran SPP santri akan tertera di sini.</p>
          </div>
        ) : (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Siswa</th>
                  <th>Tanggal Bayar</th>
                  <th>Nominal</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right", minWidth: 160 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, idx) => {
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
                        <span className={`st-badge-gender ${p.method === "CASH" ? "male" : "female"}`}>
                          {p.method === "CASH" ? "Tunai" : "Transfer"}
                        </span>
                      </td>
                      <td>
                        <Badge status={p.status} />
                        {p.reviewReason && (
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {p.reviewReason}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="st-action-row">
                          {proofFiles.map((proof) => (
                            <button
                              key={proof.id}
                              type="button"
                              className="st-btn-action detail"
                              onClick={() =>
                                void run(
                                  () => downloadProof(proof),
                                  "Bukti transfer sedang diunduh",
                                )
                              }
                              title="Unduh Bukti Transfer"
                            >
                              <Download size={14} />
                              <span>Bukti</span>
                            </button>
                          ))}

                          {p.status === "APPROVED" && (
                            <button
                              type="button"
                              className="st-btn-action pay"
                              onClick={() => setReceiptPayment(p)}
                              title="Buka Lembar Kuitansi Resmi"
                            >
                              <ReceiptText size={14} />
                              <span>Kuitansi</span>
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

      {/* Payment Modal */}
      {paymentModalOpen && (
        <PaymentModal
          data={state}
          initialStudent={state.students[0]?.id || ""}
          close={() => setPaymentModalOpen(false)}
          saved={async () => {
            await run(async () => {}, "Pembayaran tersimpan");
          }}
        />
      )}

      {/* Receipt Modal */}
      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          data={state}
          close={() => setReceiptPayment(null)}
        />
      )}
    </div>
  );
}
