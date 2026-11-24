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
  CheckCircle2,
  FileText,
  Send,
  History,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/src/components/Modal";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { Panel } from "@/src/components/Panel";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  PaymentModal,
  ExamCardModal,
  ReceiptModal,
  type ExamCardData,
} from "@/src/components/modals";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import { money, formatMonthName, formatDateIndo } from "@/src/lib/formatters";
import { receiptNumber } from "@/src/lib/calculations";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
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
  const [changeRequestStudent, setChangeRequestStudent] = useState<Student | null>(null);
  const [changeRequestsList, setChangeRequestsList] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [changeForm, setChangeForm] = useState({
    phone: "",
    street: "",
    rt: "",
    rw: "",
    village: "",
    district: "",
    postalCode: "",
    reason: "",
  });
  const [submittingChange, setSubmittingChange] = useState(false);

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

    const handleOpenChangeRequest = async (student: Student) => {
      setChangeRequestStudent(student);
      setLoadingRequests(true);
      setChangeForm({
        phone: "",
        street: "",
        rt: "",
        rw: "",
        village: "",
        district: "",
        postalCode: "",
        reason: "",
      });
      try {
        const res = await api<{ requests: any[] }>(`students/${student.id}/change-requests`, "GET");
        setChangeRequestsList(res?.requests || []);
      } catch {
        setChangeRequestsList([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    const handleSubmitChangeRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!changeRequestStudent) return;
      if (!changeForm.reason.trim()) {
        setError("Alasan pengajuan perubahan wajib diisi");
        return;
      }
      setSubmittingChange(true);
      try {
        const patchPayload: Record<string, string> = {};
        if (changeForm.phone.trim()) patchPayload.phone = changeForm.phone.trim();
        if (changeForm.street.trim()) patchPayload.street = changeForm.street.trim();
        if (changeForm.rt.trim()) patchPayload.rt = changeForm.rt.trim();
        if (changeForm.rw.trim()) patchPayload.rw = changeForm.rw.trim();
        if (changeForm.village.trim()) patchPayload.village = changeForm.village.trim();
        if (changeForm.district.trim()) patchPayload.district = changeForm.district.trim();
        if (changeForm.postalCode.trim()) patchPayload.postalCode = changeForm.postalCode.trim();
        patchPayload.reason = changeForm.reason.trim();

        await api(`students/${changeRequestStudent.id}/change-requests`, "POST", {
          patch: patchPayload,
        });
        setToast("Pengajuan perubahan biodata berhasil dikirim ke Tata Usaha");
        const res = await api<{ requests: any[] }>(`students/${changeRequestStudent.id}/change-requests`, "GET");
        setChangeRequestsList(res?.requests || []);
        setChangeForm({
          phone: "",
          street: "",
          rt: "",
          rw: "",
          village: "",
          district: "",
          postalCode: "",
          reason: "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengirim pengajuan perubahan");
      } finally {
        setSubmittingChange(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-start md:items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>Portal Wali Murid</span>
                <span>/</span>
                <span className="text-foreground font-semibold">Beranda</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-heading">
                Selamat Datang, {actor?.name}
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pantau tagihan SPP, kuitansi resmi, dan kelayakan ujian putra-putri Anda di SDIT AT-TAQWIM.
              </p>
            </div>
          </div>
        </div>

        {/* Exam Period Announcement Banner */}
        {currentExam && (
          <div className="flex items-start gap-3.5 p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/60 text-emerald-950 shadow-2xs">
            <div className="size-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300/60 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex-1 text-xs leading-relaxed space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="font-semibold text-emerald-900 text-sm">
                  {currentExam.name}
                </strong>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/70 text-emerald-900 border border-emerald-300/80">
                  Periode Ujian Aktif
                </span>
              </div>
              <p className="text-emerald-800/90 text-xs">
                Pelaksanaan: <span className="font-medium text-emerald-950">{formatDateIndo(currentExam.startDate)} s.d. {formatDateIndo(currentExam.endDate)}</span> · Syarat Administrasi: Lunas SPP s.d. <span className="font-semibold text-emerald-950">{formatMonthName(currentExam.requiredUntilMonth.slice(0, 7))}</span>.
              </p>
            </div>
          </div>
        )}

        {students.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Users className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground font-heading">Akun belum terhubung ke data siswa</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Silakan hubungi staf Tata Usaha SDIT AT-TAQWIM untuk menghubungkan akun wali murid Anda dengan santri terdaftar.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
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

              // Fix: Clean redundant "Kelas Kelas" prefix
              const rawClass = className(s.classId);
              const displayClass = rawClass.startsWith("Kelas")
                ? rawClass
                : `Kelas ${rawClass}`;

              return (
                <Card
                  key={s.id}
                  className="flex flex-col justify-between overflow-hidden border border-border/80 shadow-xs hover:shadow-sm transition-all duration-150 bg-card p-5 gap-4"
                >
                  <div className="space-y-4">
                    {/* Header: Avatar, Name, NIS, Class, Status Badge */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-11 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-base font-bold text-foreground truncate font-heading">
                            {s.name}
                          </h3>
                          <span className="text-xs text-muted-foreground truncate">
                            NIS: {s.nis} · {displayClass}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge status={elig?.status || "NOT_EVALUATED"} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          title="Ajukan Pembaruan Biodata"
                          onClick={() => void handleOpenChangeRequest(s)}
                        >
                          <FileText className="size-3.5 mr-1" />
                          <span>Biodata</span>
                        </Button>
                      </div>
                    </div>

                    {/* Balance Alert Box */}
                    <div
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-colors",
                        studentBalance > 0
                          ? "bg-rose-50/60 border-rose-200/80 text-rose-950"
                          : "bg-emerald-50/60 border-emerald-200/80 text-emerald-950"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            studentBalance > 0 ? "bg-rose-600 animate-pulse" : "bg-emerald-600"
                          )}
                        />
                        <span className="text-xs font-semibold">
                          Kewajiban Belum Lunas:
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong
                          className={cn(
                            "text-base font-bold font-mono tracking-tight",
                            studentBalance > 0 ? "text-rose-700" : "text-emerald-700"
                          )}
                        >
                          {money(studentBalance)}
                        </strong>
                        {studentBalance === 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200/70 text-emerald-900">
                            Lunas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unpaid Invoices or All Paid Reassurance */}
                    {studentDebts.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>Rincian Tagihan Tertunggak</span>
                          <span className="text-rose-600 font-semibold">{studentDebts.length} Bulan</span>
                        </div>
                        <div className="space-y-1.5">
                          {studentDebts.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-rose-200/70 shadow-2xs text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <CalendarDays className="size-3.5 text-rose-500 shrink-0" />
                                <span className="font-medium text-foreground">
                                  Bulan {formatMonthName(inv.month.slice(0, 7))} ·{" "}
                                  <strong className="text-rose-700 font-bold font-mono">{money(inv.amount)}</strong>
                                </span>
                              </div>
                              <Badge status={inv.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 flex items-start gap-3">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col text-xs">
                          <strong className="font-semibold text-emerald-900">
                            Semua Tagihan SPP Lunas
                          </strong>
                          <p className="text-[11px] text-emerald-700/90 leading-relaxed mt-0.5">
                            Tidak ada tunggakan pembayaran. Santri tertib administrasi sekolah.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Approved Receipts List */}
                    {approvedPayments.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                          <div className="flex items-center gap-1.5">
                            <ReceiptText className="size-3.5" />
                            <span>Kuitansi Pembayaran Sah</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {approvedPayments.length} Pembayaran
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {approvedPayments.slice(0, 3).map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/70 hover:bg-muted/70 transition-colors text-xs"
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <strong className="font-mono text-xs text-foreground truncate">
                                  {receiptNumber(p.paidOn, p.id)}
                                </strong>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDateIndo(p.paidOn)} · <span className="font-semibold text-emerald-700 font-mono">{money(p.amount)}</span>
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs text-emerald-800 border-emerald-200 bg-card hover:bg-emerald-50 hover:text-emerald-900 shrink-0 shadow-2xs"
                                onClick={() => setReceiptPayment(p)}
                              >
                                <ReceiptText className="size-3 mr-1" />
                                <span>Kuitansi</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center gap-2 pt-3 mt-2 border-t border-border/60">
                    {studentDebts.length > 0 ? (
                      <>
                        <Button
                          type="button"
                          variant="default"
                          className="flex-1 gap-2 shadow-xs"
                          onClick={() => setPaymentStudentId(s.id)}
                        >
                          <CircleDollarSign className="size-4" />
                          <span>Upload Pembayaran</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 shrink-0 border-border/80"
                          onClick={() => handleRequestDispensation(s)}
                        >
                          <FileCheck2 className="size-4" />
                          <span>Dispensasi</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        {isEligible ? (
                          <Button
                            type="button"
                            variant="default"
                            className="flex-1 gap-2 shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                            onClick={() => void handlePrintCard(s)}
                          >
                            <IdCard className="size-4" />
                            <span>Cetak Kartu Ujian</span>
                          </Button>
                        ) : (
                          <div className="flex-1 flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 border border-border/60 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="size-4 text-emerald-600" />
                              <span>Status Ujian: <strong>Menunggu Evaluasi TU</strong></span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-primary"
                              onClick={() => router.push("/keuangan/pembayaran")}
                            >
                              <span>Riwayat</span>
                              <ArrowRight className="size-3 ml-1" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
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

        {/* Profile Change Request Modal */}
        {changeRequestStudent && (
          <Modal
            title={`Pengajuan Pembaruan Biodata — ${changeRequestStudent.name}`}
            close={() => setChangeRequestStudent(null)}
            className="max-w-2xl"
          >
            <div className="space-y-5 text-xs">
              {/* History Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <History className="size-3.5" /> Riwayat Pengajuan Perubahan
                  </span>
                  <span>{changeRequestsList.length} Pengajuan</span>
                </div>
                {loadingRequests ? (
                  <p className="text-muted-foreground italic py-2">Memuat riwayat pengajuan...</p>
                ) : changeRequestsList.length === 0 ? (
                  <p className="text-muted-foreground italic p-3 bg-muted/30 rounded-lg border">
                    Belum ada riwayat usulan pembaruan biodata santri ini.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {changeRequestsList.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-lg border bg-card space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge status={req.status} />
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateIndo(req.createdAt)}
                            </span>
                          </div>
                          {req.status === "SUBMITTED" && (
                            <span className="text-[10px] text-amber-600 font-medium">
                              Menunggu review TU
                            </span>
                          )}
                        </div>
                        {req.rejectionReason && (
                          <div className="p-2 bg-rose-50 border border-rose-200 text-rose-900 rounded text-[11px]">
                            <strong>Alasan Penolakan:</strong> {req.rejectionReason}
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground">
                          <strong>Data Diubah:</strong>{" "}
                          {Object.keys(req.patch || {})
                            .map((k) => `${k}: ${req.patch[k]}`)
                            .join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Section */}
              <form onSubmit={handleSubmitChangeRequest} className="space-y-3 pt-3 border-t border-border/60">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Send className="size-3.5 text-primary" /> Formulir Usulan Pembaruan
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Perubahan data kontak dan alamat domisili akan diverifikasi oleh staf Tata Usaha sebelum diterapkan ke sistem.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      No. Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-background"
                      placeholder="Contoh: 081234567890"
                      value={changeForm.phone}
                      onChange={(e) => setChangeForm({ ...changeForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-background"
                      placeholder="Contoh: 16620"
                      value={changeForm.postalCode}
                      onChange={(e) => setChangeForm({ ...changeForm, postalCode: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Alamat Jalan / Lingkungan
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-background"
                    placeholder="Nama jalan, nomor rumah, RT/RW..."
                    value={changeForm.street}
                    onChange={(e) => setChangeForm({ ...changeForm, street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">RT</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-background"
                      placeholder="01"
                      value={changeForm.rt}
                      onChange={(e) => setChangeForm({ ...changeForm, rt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">RW</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-background"
                      placeholder="02"
                      value={changeForm.rw}
                      onChange={(e) => setChangeForm({ ...changeForm, rw: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Kelurahan/Desa</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-background"
                      placeholder="Benteng"
                      value={changeForm.village}
                      onChange={(e) => setChangeForm({ ...changeForm, village: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Kecamatan</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-background"
                      placeholder="Ciampea"
                      value={changeForm.district}
                      onChange={(e) => setChangeForm({ ...changeForm, district: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Alasan Perubahan Data <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-background"
                    placeholder="Contoh: Pindah rumah domisili baru / ganti nomor WA"
                    value={changeForm.reason}
                    onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setChangeRequestStudent(null)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={submittingChange}
                    className="gap-1.5"
                  >
                    <Send className="size-3.5" />
                    <span>{submittingChange ? "Mengirim..." : "Kirim Pengajuan"}</span>
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
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
