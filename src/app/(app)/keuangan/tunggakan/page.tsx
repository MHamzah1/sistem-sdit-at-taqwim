"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleDollarSign,
  Search,
  Filter,
  MessageSquare,
  Wallet,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { WhatsAppReminderModal, PaymentModal } from "@/src/components/modals";
import { money } from "@/src/lib/formatters";
import { calculateArrearsRisk } from "@/src/lib/calculations";
import type { AppState } from "@/server/state";

type Student = AppState["students"][number];

export default function TunggakanPage() {
  const router = useRouter();
  const { state, loading, busy, run, can, isGuardian, balance, debts, className } =
    useApp();

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [reminderStudent, setReminderStudent] = useState<Student | null>(null);
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);

  const students = state?.students ?? [];
  const classes = state?.classes ?? [];

  // Filter students who have unpaid balance
  const arrearsStudents = useMemo(() => {
    return students
      .filter((s) => balance(s.id) > 0)
      .sort((a, b) => balance(b.id) - balance(a.id))
      .filter((s) => {
        if (selectedClass !== "ALL" && s.classId !== selectedClass) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchNis = s.nis.toLowerCase().includes(q);
          if (!matchName && !matchNis) return false;
        }
        return true;
      });
  }, [students, balance, selectedClass, search]);

  const totalOutstanding = arrearsStudents.reduce(
    (sum, s) => sum + balance(s.id),
    0,
  );

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat rekapitulasi tunggakan SPP...</p>
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
            <CircleDollarSign size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Keuangan</span>
              <span>/</span>
              <span>Tunggakan & Reminder</span>
            </div>
            <h1 className="st-title">Tunggakan & Pengingat SPP</h1>
            <p className="st-subtitle">
              Monitoring piutang SPP santri, kategorisasi tingkat risiko, dan pengiriman pesan WhatsApp otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="st-summary-grid">
        <div className="st-summary-item">
          <span className="st-summary-label">Total Piutang Tertunggak</span>
          <span className="st-summary-val" style={{ color: "#b91c1c" }}>
            {money(totalOutstanding)}
          </span>
          <span className="st-summary-sub">
            Dari {arrearsStudents.length} santri yang memiliki tunggakan
          </span>
        </div>
        <div className="st-summary-item">
          <span className="st-summary-label">Santri Tertunggak</span>
          <span className="st-summary-val">{arrearsStudents.length}</span>
          <span className="st-summary-sub">Perlu tindak lanjut / reminder</span>
        </div>
      </div>

      {/* Filter */}
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
          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              aria-label="Filter Rombel"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="st-table-card">
        {arrearsStudents.length === 0 ? (
          <div className="st-empty-state">
            <CircleDollarSign size={48} className="st-empty-icon" style={{ color: "#16613e" }} />
            <h3>Alhamdulillah, tidak ada tunggakan!</h3>
            <p>Seluruh santri terpilih telah melunasi kewajiban iuran SPP.</p>
          </div>
        ) : (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>Total Tunggakan</th>
                  <th>Jumlah Bulan</th>
                  <th>Tingkat Risiko</th>
                  <th style={{ textAlign: "right", minWidth: 180 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {arrearsStudents.map((s, idx) => {
                  const studentDebts = debts(s.id);
                  const debtAmount = balance(s.id);
                  const risk = calculateArrearsRisk(studentDebts.length);

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
                        <span style={{ fontWeight: 700, color: "#b91c1c" }}>
                          {money(debtAmount)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {studentDebts.length} bulan
                        </span>
                      </td>
                      <td>
                        <span className={`risk-badge ${risk.badgeClass}`}>
                          {risk.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="st-action-row">
                          {can("finance") && (
                            <button
                              type="button"
                              className="st-btn-action wa"
                              onClick={() => setReminderStudent(s)}
                              title="Kirim Pesan WhatsApp Pengingat SPP"
                            >
                              <MessageSquare size={15} />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          {(can("finance") || isGuardian) && (
                            <button
                              type="button"
                              className="st-btn-action pay"
                              onClick={() => setPaymentStudentId(s.id)}
                              title="Catat Pembayaran"
                            >
                              <Wallet size={15} />
                              <span>Bayar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="st-btn-action detail"
                            onClick={() => router.push(`/master/siswa/${s.id}`)}
                            title="Buka Profil Lengkap Siswa"
                          >
                            <Eye size={15} />
                            <span>Detail</span>
                          </button>
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

      {/* WhatsApp Modal */}
      {reminderStudent && (
        <WhatsAppReminderModal
          student={reminderStudent}
          data={state}
          exam={state.exams[0]}
          close={() => setReminderStudent(null)}
        />
      )}

      {/* Payment Modal */}
      {paymentStudentId && (
        <PaymentModal
          data={state}
          initialStudent={paymentStudentId}
          close={() => setPaymentStudentId(null)}
          saved={async () => {
            await run(async () => {}, "Pembayaran tersimpan");
          }}
        />
      )}
    </div>
  );
}
