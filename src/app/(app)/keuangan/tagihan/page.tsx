"use client";

import React, { useState, useMemo } from "react";
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  Calendar,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import { PaymentModal } from "@/src/components/modals";
import { money } from "@/src/lib/formatters";

export default function TagihanSppPage() {
  const { state, loading, busy, save, can, studentName, run, setToast } =
    useApp();

  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);

  const academicYears = state?.academicYears || [];
  const activeYear = academicYears.find((y) => y.active) || academicYears[0];
  const yearId = selectedYear || activeYear?.id || "";

  const invoices = state?.invoices || [];

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      if (yearId && i.academicYearId !== yearId) return false;
      if (selectedMonth && !i.month.startsWith(selectedMonth)) return false;
      if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const sName = studentName(i.studentId).toLowerCase();
        const month = i.month.toLowerCase();
        if (!sName.includes(q) && !month.includes(q)) return false;
      }
      return true;
    });
  }, [invoices, yearId, selectedMonth, statusFilter, search, studentName]);

  const handleGenerate = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setFormConfig({
      title: "Generate Tagihan SPP Bulanan",
      note: "Nominal tagihan dihitung dari Master SPP tahun ajaran aktif. Invoice yang sudah terbit untuk siswa & bulan terpilih tidak akan digandakan.",
      fields: [
        {
          key: "academicYearId",
          label: "Tahun Ajaran",
          options: academicYears.map((y) => ({
            value: y.id,
            label: y.name + (y.active ? " (Aktif)" : ""),
          })),
          defaultValue: yearId,
        },
        {
          key: "month",
          label: "Bulan Tagihan",
          type: "month",
          defaultValue: currentMonth,
        },
      ],
      submit: async (values) => {
        await save("invoices/generate", {
          ...values,
          month: values.month + "-01",
        });
        setToast("Tagihan bulanan berhasil digenerate");
        setFormConfig(null);
      },
    });
  };

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat daftar tagihan SPP...</p>
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
            <ReceiptText size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Keuangan</span>
              <span>/</span>
              <span>Tagihan SPP</span>
            </div>
            <h1 className="st-title">Tagihan SPP</h1>
            <p className="st-subtitle">
              Penerbitan lembar invoice SPP bulanan, pemantauan tenggat pembayaran, dan status lunas.
            </p>
          </div>
        </div>

        {can("finance") && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleGenerate}
            >
              <Plus size={16} />
              <span>Generate Tagihan</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Strip */}
      <div className="st-filter-card">
        <div className="st-search-box">
          <Search size={18} className="st-search-icon" />
          <input
            type="text"
            className="st-search-input"
            placeholder="Cari siswa atau bulan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="st-filter-group">
          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={yearId}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="Filter Tahun Ajaran"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  TA {y.name} {y.active ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter Status Tagihan"
            >
              <option value="ALL">Semua Status</option>
              <option value="UNPAID">Belum Lunas (UNPAID)</option>
              <option value="PENDING_VERIFICATION">Menunggu Verifikasi (PENDING)</option>
              <option value="OVERDUE">Lewat Jatuh Tempo (OVERDUE)</option>
              <option value="PAID">Lunas (PAID)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="st-table-card">
        {filteredInvoices.length === 0 ? (
          <div className="st-empty-state">
            <ReceiptText size={48} className="st-empty-icon" />
            <h3>Tidak ada lembar tagihan ditemukan</h3>
            <p>Belum ada invoice yang terbit untuk kriteria filter terpilih.</p>
            {can("finance") && (
              <button
                type="button"
                className="st-btn-primary"
                onClick={handleGenerate}
                style={{ marginTop: 12 }}
              >
                <Plus size={16} />
                <span>Generate Tagihan Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Siswa</th>
                  <th>Bulan Tagihan</th>
                  <th>Batas Jatuh Tempo</th>
                  <th>Nominal Tagihan</th>
                  <th>Status</th>
                  {can("finance") && (
                    <th style={{ textAlign: "right", minWidth: 100 }}>Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id} className="st-table-row">
                    <td className="st-col-idx">{idx + 1}</td>
                    <td>
                      <strong className="st-user-name">
                        {studentName(inv.studentId)}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {inv.month.slice(0, 7)}
                      </span>
                    </td>
                    <td>{inv.dueDate}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#16613e" }}>
                        {money(inv.amount)}
                      </span>
                    </td>
                    <td>
                      <Badge status={inv.status} />
                    </td>
                    {can("finance") && (
                      <td style={{ textAlign: "right" }}>
                        {["UNPAID", "OVERDUE"].includes(inv.status) && (
                          <button
                            type="button"
                            className="st-btn-action pay"
                            onClick={() => setPaymentStudentId(inv.studentId)}
                            title="Bayar Invoice Ini"
                          >
                            <Wallet size={15} />
                            <span>Bayar</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
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

      {/* Payment Modal */}
      {paymentStudentId && (
        <PaymentModal
          data={state}
          initialStudent={paymentStudentId}
          close={() => setPaymentStudentId(null)}
          saved={async () => {
            try {
              await run(async () => {}, "Pembayaran tersimpan");
            } catch {
              // Error ditangani di AppContext
            }
          }}
        />
      )}
    </div>
  );
}
