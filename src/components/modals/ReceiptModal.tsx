"use client";

import React from "react";
import { Printer } from "lucide-react";
import type { AppState } from "@/server/state";
import { Brand } from "../Brand";
import { Modal } from "../Modal";
import { money } from "@/src/lib/formatters";
import { receiptNumber, terbilang } from "@/src/lib/calculations";

interface ReceiptModalProps {
  payment: AppState["payments"][number] | null;
  data: AppState;
  close: () => void;
}

export function ReceiptModal({ payment, data, close }: ReceiptModalProps) {
  if (!payment) return null;

  const student = data.students.find((s) => s.id === payment.studentId);
  const studentName = student?.name || "Siswa";
  const studentNis = student?.nis || "—";
  const className =
    data.classes.find((c) => c.id === student?.classId)?.name || "—";

  const reviewer = data.users.find(
    (u) => u.id === (payment.reviewedBy || payment.createdBy),
  );

  return (
    <Modal title="Kuitansi Pembayaran SPP" close={close}>
      <div className="print-receipt">
        <div className="receipt-header">
          <Brand />
          <div className="receipt-title">
            <h2>BUKTI PEMBAYARAN SPP</h2>
            <small>Kuitansi Resmi SDIT AT-TAQWIM</small>
          </div>
        </div>
        <div className="receipt-meta">
          <div>
            <span>Nomor Registrasi</span>
            <strong>{receiptNumber(payment.paidOn, payment.id)}</strong>
          </div>
          <div>
            <span>Tanggal Bayar</span>
            <strong>{payment.paidOn}</strong>
          </div>
          <div>
            <span>Metode Pembayaran</span>
            <strong>
              {payment.method === "CASH"
                ? "Tunai (Kasir Sekolah)"
                : "Transfer Bank"}
            </strong>
          </div>
        </div>
        <div className="receipt-student">
          <div>
            <span>Nama Siswa</span>
            <strong>{studentName}</strong>
          </div>
          <div>
            <span>NIS</span>
            <strong>{studentNis}</strong>
          </div>
          <div>
            <span>Kelas</span>
            <strong>{className}</strong>
          </div>
        </div>
        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>No</th>
              <th>Uraian Pembayaran</th>
              <th style={{ textAlign: "right", width: 140 }}>Nominal</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const items = data.paymentItems.filter(
                (it) => it.paymentId === payment.id,
              );
              if (items.length === 0) {
                return (
                  <tr>
                    <td>1</td>
                    <td>Iuran SPP Sekolah</td>
                    <td style={{ textAlign: "right" }}>
                      {money(payment.amount)}
                    </td>
                  </tr>
                );
              }
              return items.map((it, idx) => {
                const inv = data.invoices.find((i) => i.id === it.invoiceId);
                return (
                  <tr key={it.invoiceId}>
                    <td>{idx + 1}</td>
                    <td>Iuran SPP Bulan {inv ? inv.month.slice(0, 7) : "—"}</td>
                    <td style={{ textAlign: "right" }}>{money(it.amount)}</td>
                  </tr>
                );
              });
            })()}
            <tr className="receipt-total-row">
              <td colSpan={2}>
                <strong>TOTAL PEMBAYARAN</strong>
              </td>
              <td style={{ textAlign: "right" }}>
                <strong>{money(payment.amount)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="receipt-words">
          <span>Terbilang:</span>
          <em>{terbilang(payment.amount)}</em>
        </div>
        {payment.notes && (
          <div className="receipt-notes">
            <span>Catatan:</span> {payment.notes}
          </div>
        )}
        <div className="receipt-footer">
          <div className="receipt-stamp">
            <span className="stamp-badge">LUNAS / DITERIMA</span>
            <small>SDIT AT-TAQWIM</small>
          </div>
          <div className="receipt-sign">
            <span>Petugas Kasir / Verifikator,</span>
            <div className="sign-space" />
            <strong>{reviewer?.name || "Kasir Tata Usaha"}</strong>
          </div>
        </div>
        <div className="receipt-legal">
          <small>
            Dokumen ini merupakan bukti pembayaran resmi yang diterbitkan secara
            digital oleh Sistem SDIT AT-TAQWIM.
          </small>
        </div>
      </div>
      <button className="primary full no-print" onClick={() => window.print()}>
        <Printer size={16} />
        Cetak / Simpan PDF
      </button>
    </Modal>
  );
}
