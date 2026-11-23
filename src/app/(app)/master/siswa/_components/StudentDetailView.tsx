"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  UserCheck,
  ShieldCheck,
  CalendarDays,
  Clock,
  IdCard,
  MapPin,
  School,
  Wallet,
  ReceiptText,
  Pencil,
  Trash2,
  Phone,
  Plus,
  BadgeCheck,
  CreditCard,
  Printer,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import QRCode from "qrcode";
import type { AppState } from "@/server/state";
import {
  formatDateIndo,
  formatDateTimeIndo,
  calculateAge,
  whatsappUrl,
  money,
} from "@/src/lib/formatters";
import {
  calculateArrearsRisk,
  examParticipantNumber,
} from "@/src/lib/calculations";
import { Badge } from "@/src/components/Badge";
import { CopyButton } from "@/src/components/CopyButton";
import { Button } from "@/src/components/ui/button";
import { ExamCardView } from "@/src/components/cards";

type Student = AppState["students"][number];
type ClassItem = AppState["classes"][number];
type AcademicYear = AppState["academicYears"][number];
type Invoice = AppState["invoices"][number];
type Payment = AppState["payments"][number];
type Guardian = AppState["guardians"][number];
type GuardianStudent = AppState["guardianStudents"][number];
type ExamPeriod = AppState["exams"][number];
type Eligibility = AppState["eligibilities"][number];

interface StudentDetailViewProps {
  student: Student;
  classes: ClassItem[];
  academicYears: AcademicYear[];
  invoices: Invoice[];
  payments: Payment[];
  dispensations: AppState["dispensations"];
  eligibilities: Eligibility[];
  exams: ExamPeriod[];
  guardians: Guardian[];
  guardianStudents: GuardianStudent[];
  canMaster: boolean;
  canFinance: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPay: (studentId: string) => void;
  onConnectGuardian: () => void;
  onDisconnectGuardian: (guardianId: string) => void;
  onPrintCard: (student: Student) => void;
}

type TabType = "ringkasan" | "keuangan" | "ujian" | "wali";

export function StudentDetailView({
  student,
  classes,
  academicYears,
  invoices,
  payments,
  dispensations,
  eligibilities,
  exams,
  guardians,
  guardianStudents,
  canMaster,
  canFinance,
  onBack,
  onEdit,
  onDelete,
  onPay,
  onConnectGuardian,
  onDisconnectGuardian,
  onPrintCard,
}: StudentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ringkasan");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const studentClass = classes.find((c) => c.id === student.classId);
  const studentYear = academicYears.find(
    (y) => y.id === studentClass?.academicYearId,
  );

  const studentInvoices = invoices.filter((i) => i.studentId === student.id);
  const unpaidInvoices = studentInvoices.filter((i) => i.status !== "PAID");
  const totalArrears = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalInvoiced = studentInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = totalInvoiced - totalArrears;
  const arrearsRisk = calculateArrearsRisk(unpaidInvoices.length);

  const studentPayments = payments.filter((p) => p.studentId === student.id);

  const activeExam = exams[0];
  const examEligibility = eligibilities.find(
    (e) => e.studentId === student.id && e.examPeriodId === activeExam?.id,
  );
  const examDispensation = dispensations.find(
    (d) => d.studentId === student.id && d.examPeriodId === activeExam?.id,
  );

  const linkedGuardianIds = guardianStudents
    .filter((gs) => gs.studentId === student.id)
    .map((gs) => gs.guardianId);
  const connectedGuardians = guardians.filter((g) =>
    linkedGuardianIds.includes(g.id),
  );

  useEffect(() => {
    const code = student.id;
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/ujian/kartu?code=${code}`;
      QRCode.toDataURL(url, { width: 140, margin: 1 })
        .then(setQrCodeUrl)
        .catch(() => {});
    }
  }, [student.id]);

  const participantNum =
    activeExam && studentClass
      ? examParticipantNumber(
          activeExam.name,
          studentYear?.name || "2026/2027",
          studentClass.name,
          student.id,
        )
      : "—";

  return (
    <div className="st-detail-shell">
      <div className="st-header-actions">
        <button type="button" className="st-back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          Kembali ke Daftar Siswa
        </button>
      </div>

      <div className="st-detail-head">
        <div>
          <span className="eyebrow">DATA SISWA</span>
          <h1>Detail Siswa</h1>
          <p>
            Informasi lengkap profil siswa, kelas belajar, riwayat SPP, dan status evaluasi ujian.
          </p>
        </div>

        <div className="st-head-button-group">
          {canMaster && (
            <button type="button" className="primary" onClick={onEdit}>
              <Pencil size={14} />
              Ubah Data Siswa
            </button>
          )}
          {canMaster && (
            <button type="button" className="danger" onClick={onDelete}>
              <Trash2 size={14} />
              Hapus
            </button>
          )}
        </div>
      </div>

      <div className="st-idcard-grid">
        <section className="st-profile-card">
          <div className="st-profile-card__avatar">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="st-profile-avatar-img"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <span className="st-profile-avatar-text">
                {student.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="st-profile-card__info">
            <h2>{student.name}</h2>
            <div className="st-profile-card__badges">
              <span
                className={`st-badge ${
                  student.active ? "st-badge-green" : "st-badge-slate"
                }`}
              >
                ● {student.active ? "Aktif" : "Non-Aktif"}
              </span>
              <span className="st-badge st-badge-blue">
                {studentClass ? studentClass.name : "Belum Ada Kelas"}
              </span>
              {student.gender && (
                <span className="st-badge st-badge-slate">
                  {student.gender === "P" ? "Perempuan (P)" : "Laki-laki (L)"}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="st-idcard">
          <div className="st-idcard__head">
            <span className="st-idcard__icon-badge">
              <UserCheck size={16} />
            </span>
            <h3>Data Pribadi</h3>
          </div>
          <div className="st-idcard__list">
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <MapPin size={13} />
                Tempat Lahir
              </span>
              <strong className="st-idcard__value">
                {student.birthPlace || "—"}
              </strong>
            </div>

            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <CalendarDays size={13} />
                Tanggal Lahir
              </span>
              <strong className="st-idcard__value">
                {formatDateIndo(student.birthDate)}
              </strong>
            </div>

            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <Clock size={13} />
                Usia
              </span>
              <strong className="st-idcard__value">
                {calculateAge(student.birthDate)}
              </strong>
            </div>

            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <School size={13} />
                Jenjang
              </span>
              <span className="st-pill-green">SDIT</span>
            </div>

            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <CalendarDays size={13} />
                Tanggal Masuk
              </span>
              <strong className="st-idcard__value">
                {formatDateIndo(student.enrolledOn)}
              </strong>
            </div>
          </div>
        </section>

        <section className="st-idcard">
          <div className="st-idcard__head">
            <span className="st-idcard__icon-badge">
              <ShieldCheck size={16} />
            </span>
            <h3>Data Administratif</h3>
          </div>
          <div className="st-idcard__list">
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <IdCard size={13} />
                NIS
              </span>
              <span className="st-copy-row">
                <strong>{student.nis}</strong>
                <CopyButton value={student.nis} title="Salin NIS" />
              </span>
            </div>

            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <IdCard size={13} />
                NISN
              </span>
              {student.nisn ? (
                <span className="st-copy-row">
                  <strong>{student.nisn}</strong>
                  <CopyButton value={student.nisn} title="Salin NISN" />
                </span>
              ) : (
                <span
                  className="st-idcard__value"
                  style={{ color: "var(--muted)" }}
                >
                  —
                </span>
              )}
            </div>

            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <ShieldCheck size={13} />
                Status Siswa
              </span>
              <span
                className={`st-badge ${
                  student.active ? "st-badge-green" : "st-badge-slate"
                }`}
              >
                {student.active ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>

            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <CalendarDays size={13} />
                Terdaftar Sejak
              </span>
              <span className="st-idcard__value" style={{ fontSize: 11 }}>
                {formatDateTimeIndo(student.createdAt)}
              </span>
            </div>

            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <Wallet size={13} />
                Status SPP
              </span>
              <span
                className={`st-badge ${
                  totalArrears > 0 ? "st-badge-amber" : "st-badge-green"
                }`}
              >
                {totalArrears > 0 ? "Ada Tunggakan" : "Lancar / Lunas"}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="st-detail-layout">
        <aside className="st-detail-sidebar">
          <div className="st-detail-sidebar__head">
            <span
              className="eyebrow"
              style={{ display: "block", marginBottom: 3 }}
            >
              NAVIGASI DETAIL
            </span>
            <h2 style={{ fontSize: 14, margin: 0 }}>Informasi Siswa</h2>
          </div>
          <nav className="st-detail-sidebar__nav">
            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "ringkasan" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("ringkasan")}
            >
              <span className="st-detail-menu__icon">
                <Users size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Ringkasan Profil</strong>
                <small>Overview status siswa</small>
              </span>
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>

            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "keuangan" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("keuangan")}
            >
              <span className="st-detail-menu__icon">
                <ReceiptText size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Keuangan & SPP</strong>
                <small>Invoice & riwayat bayar</small>
              </span>
              {unpaidInvoices.length > 0 && (
                <span className="st-detail-menu__count st-count-amber">
                  {unpaidInvoices.length}
                </span>
              )}
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>

            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "ujian" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("ujian")}
            >
              <span className="st-detail-menu__icon">
                <BadgeCheck size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Kelayakan & Kartu</strong>
                <small>Syarat ujian & QR kartu</small>
              </span>
              {examEligibility && (
                <span
                  className={`st-detail-menu__count ${
                    examEligibility.status.startsWith("ELIGIBLE")
                      ? "st-count-green"
                      : "st-count-amber"
                  }`}
                >
                  {examEligibility.status === "ELIGIBLE" ? "OK" : "!"}
                </span>
              )}
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>

            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "wali" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("wali")}
            >
              <span className="st-detail-menu__icon">
                <UserCheck size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Data Wali Murid</strong>
                <small>Kontak orang tua siswa</small>
              </span>
              <span className="st-detail-menu__count">
                {connectedGuardians.length}
              </span>
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>
          </nav>
        </aside>

        <section className="st-detail-content">
          {activeTab === "ringkasan" && (
            <div className="st-tab-panel">
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <Users size={18} className="st-card-icon" />
                  <div>
                    <h3>Ringkasan Profil Siswa</h3>
                    <small>
                      Ikhtisar penempatan kelas, keuangan SPP, dan evaluasi kelayakan ujian
                    </small>
                  </div>
                </div>

                <div className="st-section-card__body">
                  <div className="st-summary-grid">
                    <div className="st-summary-box">
                      <div className="st-summary-box__top">
                        <School size={15} />
                        <h4>Kelas Belajar Saat Ini</h4>
                      </div>
                      <div className="st-summary-box__content">
                        <strong>
                          {studentClass ? studentClass.name : "Belum ditempatkan"}
                        </strong>
                        <span>
                          Tahun Ajaran: <b>{studentYear ? studentYear.name : "—"}</b>
                        </span>
                        <span>
                          Tanggal Masuk: {formatDateIndo(student.enrolledOn)}
                        </span>
                      </div>
                    </div>

                    <div className="st-summary-box">
                      <div className="st-summary-box__top">
                        <Wallet size={15} />
                        <h4>Status SPP & Tunggakan</h4>
                      </div>
                      <div className="st-summary-box__content">
                        <strong
                          style={{
                            color:
                              totalArrears > 0
                                ? "var(--red-text, #c1685c)"
                                : "#16613e",
                          }}
                        >
                          {money(totalArrears)}
                        </strong>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            margin: "2px 0",
                          }}
                        >
                          <span
                            className={`risk-badge ${arrearsRisk.badgeClass}`}
                          >
                            {arrearsRisk.label}
                          </span>
                          <span style={{ fontSize: 11 }}>
                            {unpaidInvoices.length} invoice belum lunas
                          </span>
                        </div>
                        {canFinance && totalArrears > 0 && (
                          <button
                            type="button"
                            className="st-btn-small-pay"
                            onClick={() => onPay(student.id)}
                          >
                            <CreditCard size={12} />
                            Bayar SPP Sekarang
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="st-summary-box">
                      <div className="st-summary-box__top">
                        <BadgeCheck size={15} />
                        <h4>Status Kelayakan Ujian</h4>
                      </div>
                      <div className="st-summary-box__content">
                        <strong>
                          {activeExam ? activeExam.name : "Tidak ada periode aktif"}
                        </strong>
                        <div style={{ margin: "3px 0" }}>
                          <Badge
                            status={examEligibility?.status || "NOT_EVALUATED"}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {examEligibility?.reason ||
                            "Belum dievaluasi untuk periode ini"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="st-wali-section" style={{ marginTop: 20 }}>
                    <div className="st-wali-section__head">
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Users
                            size={15}
                            style={{ color: "var(--primary)" }}
                          />
                          Kontak Orang Tua / Wali Murid
                        </h4>
                        <small style={{ color: "var(--muted)" }}>
                          {connectedGuardians.length > 0
                            ? `${connectedGuardians.length} kontak terhubung`
                            : "Belum ada kontak wali yang terhubung"}
                        </small>
                      </div>

                      {canMaster && (
                        <button
                          type="button"
                          className="outline tiny"
                          onClick={onConnectGuardian}
                        >
                          <Plus size={12} />
                          Hubungkan Wali
                        </button>
                      )}
                    </div>

                    {connectedGuardians.length === 0 ? (
                      <div className="st-empty-state">
                        <Users size={28} />
                        <p>
                          Belum ada data wali murid yang terhubung dengan siswa ini.
                        </p>
                        {canMaster && (
                          <button
                            type="button"
                            className="primary tiny"
                            onClick={onConnectGuardian}
                          >
                            <UserPlus size={12} />
                            Hubungkan Wali Murid Sekarang
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="st-wali-grid">
                        {connectedGuardians.map((g, idx) => (
                          <div key={g.id} className="st-wali-card">
                            <div className="st-wali-card__top">
                              <strong>{g.name}</strong>
                              <span className="st-badge st-badge-slate">
                                {idx === 0 ? "Wali Utama" : "Wali Kedua"}
                              </span>
                            </div>
                            <div className="st-wali-card__body">
                              <div className="st-wali-card__row">
                                <Phone size={12} />
                                <span>{g.phone}</span>
                              </div>
                              <div
                                style={{ marginTop: 8, display: "flex", gap: 8 }}
                              >
                                <a
                                  href={whatsappUrl(g.phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="st-btn-whatsapp"
                                >
                                  <Phone size={12} />
                                  Kirim WhatsApp
                                </a>
                                {canMaster && (
                                  <button
                                    type="button"
                                    className="st-btn-disconnect"
                                    onClick={() => onDisconnectGuardian(g.id)}
                                    title="Lepas relasi wali ini"
                                  >
                                    Lepas
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "keuangan" && (
            <div className="st-tab-panel">
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <ReceiptText size={18} className="st-card-icon" />
                  <div>
                    <h3>Keuangan & Tagihan SPP</h3>
                    <small>
                      Rincian lembar tagihan invoice bulanan dan riwayat kwitansi pembayaran
                    </small>
                  </div>
                  {canFinance && totalArrears > 0 && (
                    <button
                      type="button"
                      className="primary tiny"
                      onClick={() => onPay(student.id)}
                      style={{ marginLeft: "auto" }}
                    >
                      <CreditCard size={13} />
                      Bayar SPP
                    </button>
                  )}
                </div>

                <div className="st-section-card__body">
                  <div className="st-finance-stat-row">
                    <div className="st-stat-box">
                      <span>Total Tagihan Terbit</span>
                      <strong>{money(totalInvoiced)}</strong>
                      <small>{studentInvoices.length} invoice total</small>
                    </div>
                    <div className="st-stat-box">
                      <span>Sudah Terbayar</span>
                      <strong style={{ color: "#16613e" }}>
                        {money(totalPaid)}
                      </strong>
                      <small>
                        {studentInvoices.length - unpaidInvoices.length} invoice lunas
                      </small>
                    </div>
                    <div className="st-stat-box st-stat-box--alert">
                      <span>Sisa Tunggakan</span>
                      <strong
                        style={{
                          color: totalArrears > 0 ? "#c1685c" : "#16613e",
                        }}
                      >
                        {money(totalArrears)}
                      </strong>
                      <small>{unpaidInvoices.length} invoice belum lunas</small>
                    </div>
                  </div>

                  <h4 style={{ margin: "20px 0 10px", fontSize: 13 }}>
                    Daftar Invoice SPP Siswa
                  </h4>

                  {studentInvoices.length === 0 ? (
                    <div className="st-empty-state">
                      <ReceiptText size={24} />
                      <p>
                        Belum ada invoice SPP yang diterbitkan untuk siswa ini.
                      </p>
                    </div>
                  ) : (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Bulan</th>
                            <th>Tahun Ajaran</th>
                            <th>Nominal</th>
                            <th>Status Tagihan</th>
                            <th className="right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentInvoices.map((inv) => {
                            const y = academicYears.find(
                              (ay) => ay.id === inv.academicYearId,
                            );
                            return (
                              <tr key={inv.id}>
                                <td>
                                  <strong>{inv.month}</strong>
                                </td>
                                <td>{y ? y.name : "—"}</td>
                                <td>
                                  <strong>{money(inv.amount)}</strong>
                                </td>
                                <td>
                                  <Badge status={inv.status} />
                                </td>
                                <td className="right">
                                  {inv.status !== "PAID" && canFinance && (
                                    <button
                                      type="button"
                                      className="primary tiny"
                                      onClick={() => onPay(student.id)}
                                    >
                                      Bayar
                                    </button>
                                  )}
                                  {inv.status === "PAID" && (
                                    <span
                                      style={{
                                        color: "#16613e",
                                        fontSize: 10,
                                        fontWeight: 600,
                                      }}
                                    >
                                      ✓ Terbayar
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {studentPayments.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: 13 }}>
                        Riwayat Kwitansi & Pembayaran
                      </h4>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Tanggal</th>
                              <th>Metode</th>
                              <th>Nominal</th>
                              <th>Status Verifikasi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentPayments.map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <strong>{formatDateIndo(p.paidOn)}</strong>
                                  <small>
                                    {formatDateTimeIndo(p.createdAt)}
                                  </small>
                                </td>
                                <td>
                                  <span className="class-tag">{p.method}</span>
                                </td>
                                <td>
                                  <strong>{money(p.amount)}</strong>
                                </td>
                                <td>
                                  <Badge status={p.status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ujian" && (
            <div className="st-tab-panel">
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <BadgeCheck size={18} className="st-card-icon" />
                  <div>
                    <h3>Kelayakan Ujian & Kartu Ujian Digital</h3>
                    <small>
                      Evaluasi 3 syarat kelayakan, kartu ujian resmi ber-QR, dan verifikasi
                    </small>
                  </div>
                </div>

                <div className="st-section-card__body">
                  <div className="st-exam-tab-grid">
                    <div className="st-exam-eval-col">
                      <div className="st-exam-eval-box">
                        <h4>Audit 3 Syarat Kelayakan Ujian:</h4>
                        <div className="st-eval-checklist">
                          <div className="st-eval-check-item">
                            <span
                              className={`st-check-icon ${
                                totalArrears === 0 ? "is-valid" : "is-invalid"
                              }`}
                            >
                              {totalArrears === 0 ? "✓" : "✕"}
                            </span>
                            <div>
                              <strong>Syarat 1: SPP Lunas</strong>
                              <small>
                                {totalArrears === 0
                                  ? "SPP siswa lunas hingga bulan berjalan"
                                  : `Terdapat ${unpaidInvoices.length} invoice belum lunas (${money(
                                      totalArrears,
                                    )})`}
                              </small>
                            </div>
                          </div>

                          <div className="st-eval-check-item">
                            <span
                              className={`st-check-icon ${
                                examDispensation?.status === "APPROVED"
                                  ? "is-valid"
                                  : "is-neutral"
                              }`}
                            >
                              {examDispensation?.status === "APPROVED" ? "✓" : "—"}
                            </span>
                            <div>
                              <strong>
                                Syarat 2: Izin Dispensasi Kepala Sekolah
                              </strong>
                              <small>
                                {examDispensation?.status === "APPROVED"
                                  ? "Dispensasi telah disetujui Kepala Sekolah"
                                  : "Tidak ada pengajuan dispensasi aktif"}
                              </small>
                            </div>
                          </div>

                          <div className="st-eval-check-item">
                            <span
                              className={`st-check-icon ${
                                student.active ? "is-valid" : "is-invalid"
                              }`}
                            >
                              {student.active ? "✓" : "✕"}
                            </span>
                            <div>
                              <strong>Syarat 3: Status Siswa Aktif</strong>
                              <small>
                                {student.active
                                  ? "Status siswa aktif terdaftar di sekolah"
                                  : "Siswa tidak aktif"}
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="st-eval-verdict">
                          <span>Vonis Kelayakan Saat Ini:</span>
                          <Badge
                            status={examEligibility?.status || "NOT_EVALUATED"}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="st-exam-card-col max-w-[560px]">
                      <ExamCardView
                        student={{
                          id: student.id,
                          name: student.name,
                          nis: student.nis,
                          nisn: student.nisn,
                          photoUrl: student.photoUrl,
                          classId: student.classId,
                        }}
                        classNameStr={studentClass ? studentClass.name : "—"}
                        participantNumber={participantNum}
                        examName={activeExam ? activeExam.name : "Penilaian Semester"}
                        academicYearName={studentYear?.name || "TA 2026/2027"}
                        startDate={activeExam?.startDate || ""}
                        endDate={activeExam?.endDate || ""}
                        status={examEligibility?.status || "NOT_EVALUATED"}
                        qrCodeUrl={qrCodeUrl}
                        compact={true}
                      />
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          className="gap-2 text-xs font-semibold shadow-xs"
                          onClick={() => onPrintCard(student)}
                        >
                          <Printer className="size-3.5" />
                          Buka & Cetak Kartu Peserta Ujian
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wali" && (
            <div className="st-tab-panel">
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <UserCheck size={18} className="st-card-icon" />
                  <div>
                    <h3>Data Orang Tua / Wali Murid Terhubung</h3>
                    <small>
                      Daftar kontak keluarga dan akses ke Portal Wali Murid
                    </small>
                  </div>
                  {canMaster && (
                    <button
                      type="button"
                      className="primary tiny"
                      onClick={onConnectGuardian}
                      style={{ marginLeft: "auto" }}
                    >
                      <Plus size={13} />
                      Hubungkan Wali Baru
                    </button>
                  )}
                </div>

                <div className="st-section-card__body">
                  {connectedGuardians.length === 0 ? (
                    <div className="st-empty-state">
                      <Users size={32} />
                      <p>
                        Siswa ini belum dihubungkan dengan data wali murid manapun.
                      </p>
                      {canMaster && (
                        <button
                          type="button"
                          className="primary"
                          onClick={onConnectGuardian}
                          style={{ marginTop: 10 }}
                        >
                          <Plus size={14} />
                          Hubungkan Wali Murid Sekarang
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="st-wali-grid">
                      {connectedGuardians.map((g, idx) => (
                        <div key={g.id} className="st-wali-card">
                          <div className="st-wali-card__top">
                            <div>
                              <strong style={{ fontSize: 13, display: "block" }}>
                                {g.name}
                              </strong>
                              <small style={{ color: "var(--muted)" }}>
                                {idx === 0
                                  ? "Kontak Wali Utama"
                                  : "Kontak Wali Kedua"}
                              </small>
                            </div>
                            <span className="st-badge st-badge-slate">
                              {g.userId ? "Akun Aktif" : "Tanpa Akun"}
                            </span>
                          </div>

                          <div className="st-wali-card__body">
                            <div className="st-wali-card__row">
                              <Phone size={13} />
                              <strong>{g.phone}</strong>
                            </div>

                            <div
                              style={{ marginTop: 12, display: "flex", gap: 8 }}
                            >
                              <a
                                href={whatsappUrl(g.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="st-btn-whatsapp"
                              >
                                <Phone size={12} />
                                Chat WhatsApp
                              </a>
                              {canMaster && (
                                <button
                                  type="button"
                                  className="st-btn-disconnect"
                                  onClick={() => onDisconnectGuardian(g.id)}
                                >
                                  Lepas Akses
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
