"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CircleDollarSign,
  ReceiptText,
  Users,
  CalendarDays,
  ShieldCheck,
  Plus,
  ArrowRight,
  FileCheck2,
  IdCard,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { Panel } from "@/src/components/Panel";
import {
  PaymentModal,
  ExamCardModal,
  ReceiptModal,
  type ExamCardData,
} from "@/src/components/modals";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import { money, formatMonthName } from "@/src/lib/formatters";
import { receiptNumber } from "@/src/lib/calculations";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type Student = AppState["students"][number];
type Payment = AppState["payments"][number];

export default function DashboardPage() {
  const router = useRouter();
  const {
    state,
    loading,
    busy,
    save,
    run,
    can,
    isGuardian,
    actor,
    balance,
    debts,
    className,
    yearName,
    setToast,
    setError,
  } = useApp();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Modals state
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);
  const [examCard, setExamCard] = useState<ExamCardData | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [dispensationForm, setDispensationForm] = useState<FormSpec | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat dasbor sistem...</p>
        </div>
      </div>
    );
  }

  const students = state.students;
  const invoices = state.invoices;
  const payments = state.payments;
  const exams = state.exams;
  const eligibilities = state.eligibilities;

  const currentExam = exams[0];

  // ==================== WALI MURID VIEW ====================
  if (isGuardian) {
    const handlePrintCard = async (student: Student) => {
      if (!currentExam) {
        setError("Belum ada periode ujian aktif.");
        return;
      }
      try {
        const res = await api<ExamCardData>("exam-cards", "POST", {
          studentId: student.id,
          examPeriodId: currentExam.id,
        });
        setExamCard(res);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal menerbitkan kartu ujian",
        );
      }
    };

    const handleRequestDispensation = (student: Student) => {
      if (!currentExam) return;
      setDispensationForm({
        title: "Ajukan Permohonan Dispensasi Ujian",
        note: "Pengajuan akan direview oleh TU dan disetujui Kepala Sekolah. Dispensasi tidak melunasi tunggakan invoice SPP.",
        fields: [
          {
            key: "studentName",
            label: "Nama Siswa",
            defaultValue: `${student.name} (${student.nis})`,
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
            studentId: student.id,
            examPeriodId: currentExam.id,
            reason: values.reason,
            amount: Number(values.amount || 0),
            promisedOn: values.promisedOn,
          });
          setToast("Permohonan dispensasi berhasil diajukan");
          setDispensationForm(null);
        },
      });
    };

    return (
      <div className="st-page-shell">
        <div className="st-header-card">
          <div className="st-header-left">
            <div className="st-header-icon-box">
              <Users size={28} />
            </div>
            <div>
              <div className="st-breadcrumb">
                <span>Portal Wali Murid</span>
                <span>/</span>
                <span>Beranda</span>
              </div>
              <h1 className="st-title">Selamat Datang, {actor?.name}</h1>
              <p className="st-subtitle">
                Pantau tagihan SPP, kuitansi resmi, dan kelayakan ujian putra-putri Anda di SDIT AT-TAQWIM.
              </p>
            </div>
          </div>
        </div>

        {currentExam && (
          <div className="notice" style={{ marginBottom: 20 }}>
            <ShieldCheck size={20} />
            <span>
              <strong>{currentExam.name}</strong> · Pelaksanaan {currentExam.startDate} s.d {currentExam.endDate}. Syarat lunas SPP sampai <strong>{currentExam.requiredUntilMonth.slice(0, 7)}</strong>.
            </span>
          </div>
        )}

        {students.length === 0 ? (
          <div className="st-table-card">
            <div className="st-empty-state">
              <Users size={48} className="st-empty-icon" />
              <h3>Akun belum terhubung ke data siswa</h3>
              <p>Silakan hubungi staf Tata Usaha SDIT AT-TAQWIM untuk menghubungkan akun wali murid Anda dengan santri terdaftar.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
            {students.map((s) => {
              const studentDebts = debts(s.id);
              const studentBalance = balance(s.id);
              const elig = eligibilities.find(
                (el) => el.studentId === s.id && el.examPeriodId === currentExam?.id,
              );
              const isEligible =
                elig?.status === "ELIGIBLE" ||
                elig?.status === "ELIGIBLE_DISPENSATION";
              const approvedPayments = payments.filter(
                (p) => p.studentId === s.id && p.status === "APPROVED",
              );

              return (
                <div key={s.id} className="st-section-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="st-user-avatar-placeholder" style={{ width: 44, height: 44, fontSize: 16 }}>
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{s.name}</h3>
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            NIS: {s.nis} · Kelas {className(s.classId)}
                          </span>
                        </div>
                      </div>
                      <Badge status={elig?.status || "NOT_EVALUATED"} />
                    </div>

                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#64748b" }}>Kewajiban Belum Lunas:</span>
                        <strong style={{ fontSize: 16, color: studentBalance > 0 ? "#b91c1c" : "#16613e" }}>
                          {money(studentBalance)}
                        </strong>
                      </div>
                    </div>

                    {/* Invoices list */}
                    {studentDebts.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <small style={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                          Rincian Tagihan Tertunggak:
                        </small>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {studentDebts.map((inv) => (
                            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                              <span>Bulan {inv.month.slice(0, 7)} · {money(inv.amount)}</span>
                              <Badge status={inv.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Receipts list */}
                    {approvedPayments.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <small style={{ fontWeight: 600, color: "#16613e", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                          Kuitansi Pembayaran Sah:
                        </small>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {approvedPayments.slice(0, 3).map((p) => (
                            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6 }}>
                              <div>
                                <strong>{receiptNumber(p.paidOn, p.id)}</strong>
                                <div style={{ fontSize: 11, color: "#166534" }}>{p.paidOn} · {money(p.amount)}</div>
                              </div>
                              <button
                                type="button"
                                className="st-btn-action pay"
                                onClick={() => setReceiptPayment(p)}
                                style={{ padding: "3px 8px", fontSize: 11 }}
                              >
                                <ReceiptText size={12} />
                                <span>Kuitansi</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, borderTop: "1px solid #e2e8f0", paddingTop: 12, marginTop: 8 }}>
                    <button
                      type="button"
                      className="st-btn-primary"
                      onClick={() => setPaymentStudentId(s.id)}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      <CircleDollarSign size={15} />
                      <span>Upload Pembayaran</span>
                    </button>
                    {isEligible ? (
                      <button
                        type="button"
                        className="st-btn-secondary"
                        onClick={() => void handlePrintCard(s)}
                      >
                        <IdCard size={15} />
                        <span>Kartu Ujian</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="st-btn-secondary"
                        onClick={() => handleRequestDispensation(s)}
                      >
                        <FileCheck2 size={15} />
                        <span>Dispensasi</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

        {/* Exam Card Modal */}
        {examCard && (
          <ExamCardModal
            card={examCard}
            data={state}
            close={() => setExamCard(null)}
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

        {/* Dispensation Modal */}
        {dispensationForm && (
          <DataForm
            spec={dispensationForm}
            close={() => setDispensationForm(null)}
          />
        )}
      </div>
    );
  }

  // ==================== STAFF / EXECUTIVE VIEW ====================
  const periodInvoices = invoices.filter((i) =>
    i.month.startsWith(selectedMonth),
  );
  const totalPeriodBilled = periodInvoices.reduce((sum, i) => sum + i.amount, 0);

  const receivedPayments = payments
    .filter((p) => p.status === "APPROVED" && p.paidOn.startsWith(selectedMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  const arrearsStudents = students.filter((s) => balance(s.id) > 0);

  // 6 months historical trend
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selectedMonth + "-01T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() - (5 - i));
    const m = d.toISOString().slice(0, 7);
    return {
      month: m,
      paid: payments
        .filter((p) => p.status === "APPROVED" && p.paidOn.startsWith(m))
        .reduce((sum, p) => sum + p.amount, 0),
      debt: invoices
        .filter((v) => v.month.startsWith(m) && v.status !== "PAID")
        .reduce((sum, p) => sum + p.amount, 0),
    };
  });
  const maximum = Math.max(1, ...buckets.flatMap((b) => [b.paid, b.debt]));

  // Exam eligibility distribution
  const examStudents = students.filter((s) => {
    const cls = state.classes.find((c) => c.id === s.classId);
    return cls?.academicYearId === currentExam?.academicYearId;
  });
  const eligibleCount = examStudents.filter(
    (s) =>
      eligibilities.find((e) => e.studentId === s.id && e.examPeriodId === currentExam?.id)?.status === "ELIGIBLE",
  ).length;
  const dispensedCount = examStudents.filter(
    (s) =>
      eligibilities.find((e) => e.studentId === s.id && e.examPeriodId === currentExam?.id)?.status === "ELIGIBLE_DISPENSATION",
  ).length;
  const totalExamStudents = examStudents.length || 1;

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Sistem SPP & Ujian</span>
              <span>/</span>
              <span>Dasbor Utama</span>
            </div>
            <h1 className="st-title">Selamat Datang, {actor?.name}</h1>
            <p className="st-subtitle">
              Ringkasan performa finansial SPP, tren pelunasan kasir, dan kesiapan peserta asesmen SDIT AT-TAQWIM.
            </p>
          </div>
        </div>

        <div className="st-header-actions">
          <div className="st-select-wrapper" style={{ minWidth: 160 }}>
            <input
              type="month"
              className="st-select"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              aria-label="Pilih Bulan Dasbor"
            />
          </div>

          {can("finance") && (
            <button
              type="button"
              className="st-btn-primary"
              onClick={() => setPaymentStudentId(students[0]?.id || "")}
            >
              <Plus size={16} />
              <span>Catat Pembayaran</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="metrics">
        <button
          type="button"
          className="metric metric-green"
          onClick={() => router.push("/keuangan/tagihan")}
          style={{ textAlign: "left", cursor: "pointer" }}
        >
          <div className="metric-top">
            <span>Tagihan Bulan {selectedMonth}</span>
            <span className="metric-icon green">
              <Wallet size={18} />
            </span>
          </div>
          <div className="metric-value">{money(totalPeriodBilled)}</div>
          <div className="metric-bottom">{periodInvoices.length} invoice diterbitkan</div>
        </button>

        <button
          type="button"
          className="metric metric-green"
          onClick={() => router.push("/keuangan/pembayaran")}
          style={{ textAlign: "left", cursor: "pointer" }}
        >
          <div className="metric-top">
            <span>Pembayaran Masuk</span>
            <span className="metric-icon green">
              <CircleDollarSign size={18} />
            </span>
          </div>
          <div className="metric-value">{money(receivedPayments)}</div>
          <div className="metric-bottom">Pembayaran disetujui bulan ini</div>
        </button>

        <button
          type="button"
          className="metric metric-amber"
          onClick={() => router.push("/keuangan/tunggakan")}
          style={{ textAlign: "left", cursor: "pointer" }}
        >
          <div className="metric-top">
            <span>Total Tunggakan Sistem</span>
            <span className="metric-icon green">
              <ReceiptText size={18} />
            </span>
          </div>
          <div className="metric-value">{money(totalOutstanding)}</div>
          <div className="metric-bottom">Seluruh invoice belum lunas</div>
        </button>

        <button
          type="button"
          className="metric metric-amber"
          onClick={() => router.push("/keuangan/tunggakan")}
          style={{ textAlign: "left", cursor: "pointer" }}
        >
          <div className="metric-top">
            <span>Siswa Menunggak</span>
            <span className="metric-icon green">
              <Users size={18} />
            </span>
          </div>
          <div className="metric-value">{arrearsStudents.length} Santri</div>
          <div className="metric-bottom">Perlu tindak lanjut & reminder WA</div>
        </button>
      </div>

      {/* Middle Dashboard Section: Chart & Eligibility */}
      <div className="dashboard-middle" style={{ marginTop: 24 }}>
        {/* Trend Bar Chart */}
        <Panel title="Tren Pembayaran SPP (6 Bulan Terakhir)">
          <div className="chart-tools">
            <div className="legend">
              <span>
                <i className="green-dot" />
                Pembayaran Disetujui
              </span>
              <span>
                <i className="pale-dot" />
                Belum Lunas
              </span>
            </div>
          </div>
          <div className="chart">
            <div className="y-axis">
              <span>{money(maximum)}</span>
              <span>{money(Math.round(maximum / 2))}</span>
              <span>Rp0</span>
            </div>
            <div className="plot">
              <div className="grid-lines">
                <i />
                <i />
                <i />
              </div>
              <div className="chart-columns">
                {buckets.map((b) => (
                  <button
                    key={b.month}
                    className="chart-column"
                    title={`${b.month}: Diterima ${money(b.paid)}, Tertunggak ${money(b.debt)}`}
                    onClick={() => setSelectedMonth(b.month)}
                  >
                    <div className="bar-pair">
                      <i
                        className="bar-paid"
                        style={{ height: (b.paid / maximum) * 100 + "%" }}
                      />
                      <i
                        className="bar-arrears"
                        style={{ height: (b.debt / maximum) * 100 + "%" }}
                      />
                    </div>
                    <span>{b.month}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-foot">
            Dihitung berdasarkan tanggal pembayaran kasir dan bulan tagihan invoice aktual.
          </div>
        </Panel>

        {/* Eligibility Distribution */}
        <Panel title="Kesiapan & Kelayakan Ujian">
          <div className="exam-label">
            <CalendarDays size={20} />
            <strong>{currentExam?.name || "Belum ada periode aktif"}</strong>
          </div>
          <div className="donut-wrap">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#176442 0 ${(eligibleCount / totalExamStudents) * 100}%,#d97706 ${(eligibleCount / totalExamStudents) * 100}% ${((eligibleCount + dispensedCount) / totalExamStudents) * 100}%,#e2e8f0 ${((eligibleCount + dispensedCount) / totalExamStudents) * 100}% 100%)`,
              }}
            >
              <div>
                <span>Total Santri</span>
                <strong>{examStudents.length}</strong>
                <small>TA Ujian</small>
              </div>
            </div>
          </div>
          <div className="eligibility-legend">
            <button type="button" onClick={() => router.push("/ujian/kelayakan")}>
              <span>Layak Ujian (Lunas)</span>
              <strong>{eligibleCount}</strong>
            </button>
            <button type="button" onClick={() => router.push("/ujian/kelayakan")}>
              <span>Layak (Dispensasi)</span>
              <strong>{dispensedCount}</strong>
            </button>
            <button type="button" onClick={() => router.push("/ujian/kelayakan")}>
              <span>Belum Layak / Menunggu</span>
              <strong>{examStudents.length - eligibleCount - dispensedCount}</strong>
            </button>
          </div>
          <div className="deadline">
            Batas Administrasi: {currentExam?.administrativeDeadline || "—"}
          </div>
        </Panel>
      </div>

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
