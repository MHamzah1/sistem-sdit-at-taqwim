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
  HeartPulse,
  Award,
  BookOpen,
  FolderOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  AlertCircle,
  Activity,
  FileCheck,
} from "lucide-react";
import QRCode from "qrcode";
import { Modal } from "@/src/components/Modal";
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
import { api, getStudentPhotoUrl } from "@/src/lib/api";

type Student = AppState["students"][number];
type ClassItem = AppState["classes"][number];
type AcademicYear = AppState["academicYears"][number];
type Invoice = AppState["invoices"][number];
type Payment = AppState["payments"][number];
type Dispensation = AppState["dispensations"][number];
type ExamEligibility = AppState["eligibilities"][number];
type ExamPeriod = AppState["exams"][number];
type Guardian = AppState["guardians"][number];
type GuardianStudent = AppState["guardianStudents"][number];
type ExamCard = AppState["examCards"][number];

const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Non-Aktif",
  TRANSFERRED: "Pindah Sekolah",
  WITHDRAWN: "Mengundurkan Diri",
  GRADUATED: "Lulus",
};

const RESIDENCE_LABELS: Record<string, string> = {
  BERSAMA_ORANG_TUA: "Bersama Orang Tua",
  BERSAMA_WALI: "Bersama Wali",
  KOS_ASRAMA: "Kost / Asrama",
  PANTI_ASUHAN: "Panti Asuhan",
  LAINNYA: "Lainnya",
};

const TRANSPORT_LABELS: Record<string, string> = {
  JALAN_KAKI: "Jalan Kaki",
  SEPEDA: "Sepeda",
  SEPEDA_MOTOR: "Sepeda Motor",
  MOBIL_PRIBADI: "Mobil Pribadi",
  ANTAR_JEMPUT: "Antar Jemput Sekolah",
  ANGKUTAN_UMUM: "Angkutan Umum",
  WALK: "Jalan Kaki",
  BICYCLE: "Sepeda",
  MOTORCYCLE: "Sepeda Motor",
};

const INCOME_LABELS: Record<string, string> = {
  TIDAK_BERPENGHASILAN: "Tidak Berpenghasilan",
  KURANG_DARI_500RB: "< Rp500.000",
  RP_500RB_SD_1_JT: "Rp500.000 – Rp1.000.000",
  RP_1_JT_SD_2_JT: "Rp1.000.000 – Rp2.000.000",
  RP_2_JT_SD_5_JT: "Rp2.000.000 – Rp5.000.000",
  RP_5_JT_SD_20_JT: "Rp5.000.000 – Rp20.000.000",
  LEBIH_DARI_20_JT: "> Rp20.000.000",
  TIDAK_DIKETAHUI: "Tidak Diketahui",
};

const FAMILY_ROLE_LABELS: Record<string, string> = {
  FATHER: "Ayah Kandung",
  MOTHER: "Ibu Kandung",
  GRANDFATHER: "Kakek",
  GRANDMOTHER: "Nenek",
  UNCLE: "Paman",
  AUNT: "Bibi",
  OTHER_GUARDIAN: "Wali Siswa",
};

const DOC_STATUS_LABELS: Record<string, string> = {
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
  PENDING: "Menunggu Verifikasi",
};

interface StudentDetailViewProps {
  student: Student;
  fullProfile?: any;
  classes: ClassItem[];
  academicYears: AcademicYear[];
  invoices: Invoice[];
  payments: Payment[];
  dispensations: Dispensation[];
  eligibilities: ExamEligibility[];
  exams: ExamPeriod[];
  examCards?: ExamCard[];
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
  onProfileReload?: () => Promise<void>;
}

type TabType =
  | "ringkasan"
  | "biodata"
  | "akademik"
  | "wali"
  | "kesehatan"
  | "bantuan"
  | "karakteristik"
  | "dokumen"
  | "keuangan"
  | "ujian";

export function StudentDetailView({
  student,
  fullProfile,
  classes,
  academicYears,
  invoices,
  payments,
  dispensations,
  eligibilities,
  exams,
  examCards = [],
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
  onProfileReload,
}: StudentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ringkasan");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showPrintBiodataModal, setShowPrintBiodataModal] = useState(false);
  const [showPrintBukuIndukModal, setShowPrintBukuIndukModal] = useState(false);

  // Sub-modal states
  const [showAddMeasurementModal, setShowAddMeasurementModal] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({
    date: new Date().toISOString().split("T")[0],
    heightCm: "",
    weightKg: "",
    headCircumferenceCm: "",
    semester: "1",
    notes: "",
  });
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);

  const [showAddAidModal, setShowAddAidModal] = useState(false);
  const [aidForm, setAidForm] = useState({
    aidType: "PIP",
    programName: "",
    year: new Date().getFullYear().toString(),
    amount: "",
    status: "ACTIVE",
    notes: "",
  });
  const [isSavingAid, setIsSavingAid] = useState(false);

  const [docReviewModal, setDocReviewModal] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);

  const profile = fullProfile || {};
  const addresses = profile.addresses || [];
  const enrollments = profile.enrollments || [];
  const family = profile.family || [];
  const health = profile.health;
  const measurements = profile.measurements || [];
  const aidRecords = profile.aidRecords || [];
  const documents = profile.documents || [];
  const completeness = profile.completeness;

  const kkAddress =
    addresses.find(
      (a: any) => a.addressType === "IDENTITY" || a.addressType === "KK",
    ) || addresses[0];
  const domAddress =
    addresses.find(
      (a: any) => a.addressType === "DOMICILE" || a.addressType === "DOMISILI",
    ) || kkAddress;

  const studentExtended = (fullProfile?.student || student) as any;

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
  const studentExamCard = examCards.find(
    (c) => c.studentId === student.id && c.examPeriodId === activeExam?.id,
  );

  const linkedGuardianIds = guardianStudents
    .filter((gs) => gs.studentId === student.id)
    .map((gs) => gs.guardianId);
  const connectedGuardians = guardians.filter((g) =>
    linkedGuardianIds.includes(g.id),
  );

  useEffect(() => {
    const code = studentExamCard?.verificationCode;
    if (code && typeof window !== "undefined") {
      const url = `${window.location.origin}/ujian/kartu?code=${code}`;
      QRCode.toDataURL(url, { width: 140, margin: 1 })
        .then(setQrCodeUrl)
        .catch(() => {});
    } else {
      setQrCodeUrl("");
    }
  }, [studentExamCard?.verificationCode]);

  const participantNum =
    activeExam && studentClass
      ? examParticipantNumber(
          activeExam.name,
          studentYear?.name || "2026/2027",
          studentClass.name,
          student.id,
        )
      : "—";

  // Action handlers
  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!measurementForm.heightCm || !measurementForm.weightKg) {
      alert("Tinggi dan berat badan wajib diisi.");
      return;
    }
    setIsSavingMeasurement(true);
    try {
      const res = await fetch(`/api/students/${student.id}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measurementDate: measurementForm.date,
          measuredAt: measurementForm.date,
          heightCm: Number(measurementForm.heightCm),
          weightKg: Number(measurementForm.weightKg),
          headCircumferenceCm: measurementForm.headCircumferenceCm ? Number(measurementForm.headCircumferenceCm) : null,
          semester: Number(measurementForm.semester) || 1,
          notes: measurementForm.notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan data pengukuran.");
      }
      setShowAddMeasurementModal(false);
      if (onProfileReload) {
        await onProfileReload();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const handleSaveAid = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAid(true);
    try {
      const res = await fetch(`/api/students/${student.id}/aid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aidType: aidForm.aidType,
          aidSource: aidForm.programName || aidForm.aidType,
          programName: aidForm.programName || aidForm.aidType,
          startDate: aidForm.year ? `${aidForm.year}-01-01` : null,
          endDate: aidForm.year ? `${aidForm.year}-12-31` : null,
          year: Number(aidForm.year),
          amount: aidForm.amount ? Number(aidForm.amount) : null,
          status: aidForm.status,
          notes: aidForm.notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan data bantuan.");
      }
      setShowAddAidModal(false);
      if (onProfileReload) {
        await onProfileReload();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingAid(false);
    }
  };

  const handleReviewDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docReviewModal) return;
    if (reviewStatus === "REJECTED" && !reviewNotes.trim()) {
      alert("Alasan penolakan dokumen wajib diisi");
      return;
    }
    setIsSavingReview(true);
    try {
      await api(`student-documents/${docReviewModal.id}/review`, "POST", {
        status: reviewStatus,
        rejectionReason: reviewStatus === "REJECTED" ? reviewNotes.trim() : undefined,
      });
      setDocReviewModal(null);
      if (onProfileReload) {
        await onProfileReload();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || "Gagal memproses verifikasi dokumen");
    } finally {
      setIsSavingReview(false);
    }
  };

  // Mask NIK helper
  const maskNik = (nik?: string | null) => {
    if (!nik || nik.length < 8) return nik || "—";
    return nik.substring(0, 6) + "******" + nik.substring(nik.length - 4);
  };

  return (
    <div className="st-detail-shell">
      {/* Print Style Inject */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-form,
          #printable-form * {
            visibility: visible;
          }
          #printable-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            font-size: 11pt;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="st-header-actions no-print">
        <button type="button" className="st-back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          Kembali ke Daftar Siswa
        </button>
      </div>

      <div className="st-detail-head no-print">
        <div>
          <span className="eyebrow">DATA SISWA</span>
          <h1>Detail Siswa</h1>
          <p>
            Informasi lengkap profil siswa, kelas belajar, riwayat SPP, dan status evaluasi ujian.
          </p>
        </div>

        <div className="st-head-button-group">
          <button
            type="button"
            className="st-btn-secondary"
            onClick={() => setShowPrintBiodataModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "7px 12px" }}
          >
            <Printer size={14} />
            Cetak Formulir A4
          </button>
          <button
            type="button"
            className="st-btn-secondary"
            onClick={() => setShowPrintBukuIndukModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "7px 12px" }}
          >
            <FileText size={14} />
            Buku Induk
          </button>
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

      {/* Top Identity Cards */}
      <div className="st-idcard-grid no-print">
        <section className="st-profile-card">
          <div className="st-profile-card__avatar">
            {getStudentPhotoUrl(student) ? (
              <img
                src={getStudentPhotoUrl(student)!}
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
                  style={{ color: "var(--muted-foreground)" }}
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

      {/* Completeness Banner Card */}
      {completeness && (
        <div
          className="no-print"
          style={{
            margin: "16px 0 24px",
            background: "#ffffff",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2
                size={20}
                color={
                  completeness.overallPercent === 100
                    ? "#16613e"
                    : completeness.overallPercent >= 70
                    ? "#d97706"
                    : "#dc2626"
                }
              />
              <div>
                <strong style={{ fontSize: 14 }}>
                  Tingkat Kelengkapan Berkas & Biodata Siswa: {completeness.overallPercent}%
                </strong>
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted-foreground)" }}>
                  {completeness.overallPercent === 100
                    ? "Seluruh komponen identitas, orang tua, dan dokumen fisik telah lengkap diverifikasi."
                    : `Terdapat ${completeness.missingFields?.length || 0} kolom atau berkas yang belum dilengkapi.`}
                </p>
              </div>
            </div>
            <span
              className={`st-badge ${
                completeness.overallPercent === 100
                  ? "st-badge-green"
                  : completeness.overallPercent >= 70
                  ? "st-badge-amber"
                  : "st-badge-slate"
              }`}
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              {completeness.overallPercent}% Lengkap
            </span>
          </div>

          {/* Progress track */}
          <div
            style={{
              width: "100%",
              height: 8,
              background: "#f1f5f9",
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: `${completeness.overallPercent}%`,
                height: "100%",
                background:
                  completeness.overallPercent === 100
                    ? "#16613e"
                    : completeness.overallPercent >= 70
                    ? "#d97706"
                    : "#dc2626",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
              gap: 10,
              fontSize: 11,
              color: "#475569",
            }}
          >
            {[
              { key: "identitas", label: "Identitas" },
              { key: "alamat", label: "Alamat" },
              { key: "registrasi", label: "Registrasi" },
              { key: "ayah", label: "Data Ayah" },
              { key: "ibu", label: "Data Ibu" },
              { key: "wali_darurat", label: "Kontak Darurat" },
              { key: "kesehatan", label: "Kesehatan" },
              { key: "bantuan", label: "Bantuan" },
              { key: "karakteristik", label: "Karakteristik" },
              { key: "dokumen", label: "Dokumen" },
            ].map((sec) => {
              const secData = completeness.sections?.[sec.key];
              const isOk = secData?.status === "COMPLETE";
              return (
                <div
                  key={sec.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: isOk ? "#ecfdf5" : "#fffbeb",
                    border: `1px solid ${isOk ? "#a7f3d0" : "#fde68a"}`,
                  }}
                >
                  <span>{sec.label}:</span>
                  <b style={{ color: isOk ? "#16613e" : "#b45309" }}>
                    {isOk ? "Lengkap" : "Belum"}
                  </b>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tab Layout */}
      <div className="st-detail-layout no-print">
        {/* Sidebar Nav */}
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
                activeTab === "biodata" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("biodata")}
            >
              <span className="st-detail-menu__icon">
                <IdCard size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Biodata Lengkap</strong>
                <small>Identitas & alamat domisili</small>
              </span>
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>

            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "akademik" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("akademik")}
            >
              <span className="st-detail-menu__icon">
                <School size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Riwayat Akademik</strong>
                <small>Registrasi & riwayat kelas</small>
              </span>
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
                <strong>Data Orang Tua & Wali</strong>
                <small>Ayah, Ibu & akun wali</small>
              </span>
              <span className="st-detail-menu__count">
                {connectedGuardians.length}
              </span>
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>

            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "kesehatan" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("kesehatan")}
            >
              <span className="st-detail-menu__icon">
                <HeartPulse size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Kesehatan & Fisik</strong>
                <small>Golongan darah & pengukuran</small>
              </span>
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>

            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "bantuan" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("bantuan")}
            >
              <span className="st-detail-menu__icon">
                <Award size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Bantuan Pendidikan</strong>
                <small>KIP, PIP, PKH, Beasiswa</small>
              </span>
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>

            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "karakteristik" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("karakteristik")}
            >
              <span className="st-detail-menu__icon">
                <BookOpen size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Karakteristik Santri</strong>
                <small>Minat, bakat & kebiasaan</small>
              </span>
              <ChevronRight size={14} className="st-detail-menu__arrow" />
            </button>

            <button
              type="button"
              className={`st-detail-menu ${
                activeTab === "dokumen" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("dokumen")}
            >
              <span className="st-detail-menu__icon">
                <FolderOpen size={16} />
              </span>
              <span className="st-detail-menu__label">
                <strong>Dokumen Persyaratan</strong>
                <small>KK, Akta & berkas verifikasi</small>
              </span>
              {documents.length > 0 && (
                <span className="st-detail-menu__count">
                  {documents.length}
                </span>
              )}
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
          </nav>
        </aside>

        {/* Tab Content Panels */}
        <section className="st-detail-content">
          {/* TAB 1: RINGKASAN */}
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
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                          {examEligibility?.reason ||
                            "Belum dievaluasi untuk periode ini"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Wali Kontak */}
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
                        <small style={{ color: "var(--muted-foreground)" }}>
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

          {/* TAB 2: BIODATA LENGKAP */}
          {activeTab === "biodata" && (
            <div className="st-tab-panel">
              {/* Identitas Diri */}
              <div className="st-section-card" style={{ marginBottom: 20 }}>
                <div className="st-section-card__header">
                  <IdCard size={18} className="st-card-icon" />
                  <div>
                    <h3>Identitas Lengkap Siswa</h3>
                    <small>Data nomor kependudukan, akta kelahiran, dan atribut personal</small>
                  </div>
                  {canMaster && (
                    <button
                      type="button"
                      className="st-btn-secondary"
                      onClick={onEdit}
                      style={{ marginLeft: "auto", fontSize: 11 }}
                    >
                      <Pencil size={12} /> Ubah Biodata
                    </button>
                  )}
                </div>
                <div className="st-section-card__body">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Nama Lengkap</span>
                      <strong>{student.name}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Nama Panggilan</span>
                      <strong>{studentExtended.nickname || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Nomor Induk Siswa (NIS)</span>
                      <strong>{student.nis}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>NISN</span>
                      <strong>{student.nisn || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>NIK Siswa</span>
                      <strong>{maskNik(studentExtended.nik)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Nomor Kartu Keluarga (KK)</span>
                      <strong>{maskNik(studentExtended.familyCardNumber)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>No. Registrasi Akta Lahir</span>
                      <strong>{studentExtended.birthCertificateNumber || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Tempat, Tanggal Lahir</span>
                      <strong>
                        {student.birthPlace || "—"}, {formatDateIndo(student.birthDate)} ({calculateAge(student.birthDate)})
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Jenis Kelamin</span>
                      <strong>{student.gender === "L" ? "Laki-laki" : student.gender === "P" ? "Perempuan" : "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Agama</span>
                      <strong>{studentExtended.religion || "Islam"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Kewarganegaraan</span>
                      <strong>{studentExtended.citizenship || "WNI"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Anak Ke / Dari Bersaudara</span>
                      <strong>
                        Anak ke-{studentExtended.birthOrder || "—"} dari {studentExtended.siblingCount || "—"} bersaudara
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Bahasa Sehari-hari</span>
                      <strong>{studentExtended.dailyLanguage || "Bahasa Indonesia"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Status Siswa</span>
                      <span className={`st-badge ${student.active ? "st-badge-green" : "st-badge-slate"}`}>
                        {STUDENT_STATUS_LABELS[studentExtended.studentStatus] ||
                          (student.active ? "Aktif" : "Non-Aktif")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alamat KK & Domisili */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 20,
                }}
              >
                <div className="st-section-card">
                  <div className="st-section-card__header">
                    <MapPin size={18} className="st-card-icon" />
                    <div>
                      <h3>Alamat Sesuai KK</h3>
                      <small>Alamat resmi tertera pada dokumen Kartu Keluarga</small>
                    </div>
                  </div>
                  <div className="st-section-card__body">
                    {kkAddress ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                          <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Jalan / Alamat</span>
                          <strong>{kkAddress.address || kkAddress.street || "—"}</strong>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>RT / RW</span>
                            <strong>RT {kkAddress.rt || "—"} / RW {kkAddress.rw || "—"}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Dusun / Kampung</span>
                            <strong>{kkAddress.hamlet || "—"}</strong>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Kelurahan / Desa</span>
                            <strong>{kkAddress.village || "—"}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Kecamatan</span>
                            <strong>{kkAddress.district || "—"}</strong>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Kabupaten / Kota</span>
                            <strong>{kkAddress.regency || kkAddress.city || "—"}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Provinsi</span>
                            <strong>{kkAddress.province || "—"}</strong>
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Kode Pos</span>
                          <strong>{kkAddress.postalCode || "—"}</strong>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: "var(--muted-foreground)", fontSize: 12 }}>Belum ada data alamat Kartu Keluarga.</p>
                    )}
                  </div>
                </div>

                <div className="st-section-card">
                  <div className="st-section-card__header">
                    <MapPin size={18} className="st-card-icon" />
                    <div>
                      <h3>Alamat Domisili & Transportasi</h3>
                      <small>Tempat tinggal saat ini serta akses menuju sekolah</small>
                    </div>
                  </div>
                  <div className="st-section-card__body">
                    {domAddress ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                          <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Status Tempat Tinggal</span>
                          <strong>
                            {RESIDENCE_LABELS[domAddress.residenceType || kkAddress?.residenceType] ||
                              domAddress.residenceType ||
                              domAddress.livingWith ||
                              "—"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Alamat Tinggal</span>
                          <strong>
                            {domAddress.address ||
                              domAddress.street ||
                              kkAddress?.address ||
                              "Sama dengan KK"}
                          </strong>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Jarak ke Sekolah</span>
                            <strong>
                              {domAddress.distanceToSchool ?? kkAddress?.distanceToSchool ?? domAddress.distanceKm
                                ? `${domAddress.distanceToSchool ?? kkAddress?.distanceToSchool ?? domAddress.distanceKm} km`
                                : "—"}
                            </strong>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Waktu Tempuh</span>
                            <strong>
                              {domAddress.travelTimeMinutes ?? kkAddress?.travelTimeMinutes
                                ? `${domAddress.travelTimeMinutes ?? kkAddress?.travelTimeMinutes} menit`
                                : "—"}
                            </strong>
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Moda Transportasi</span>
                          <strong>
                            {TRANSPORT_LABELS[domAddress.transportationType || kkAddress?.transportationType] ||
                              domAddress.transportationType ||
                              domAddress.transportMode ||
                              "—"}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: "var(--muted-foreground)", fontSize: 12 }}>Belum ada data domisili.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AKADEMIK */}
          {activeTab === "akademik" && (
            <div className="st-tab-panel">
              <div className="st-section-card" style={{ marginBottom: 20 }}>
                <div className="st-section-card__header">
                  <School size={18} className="st-card-icon" />
                  <div>
                    <h3>Data Riwayat Pendaftaran & Asal Sekolah</h3>
                    <small>Informasi registrasi awal dan jenjang pendidikan sebelumnya</small>
                  </div>
                </div>
                <div className="st-section-card__body">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Nomor Registrasi / Pendaftaran</span>
                      <strong>{enrollments[0]?.registrationNumber || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Tanggal Masuk / Terdaftar</span>
                      <strong>{formatDateIndo(student.enrolledOn)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Jenis Pendaftaran</span>
                      <span className="st-pill-green">
                        {enrollments[0]?.registrationType === "TRANSFER_STUDENT"
                          ? "Siswa Pindahan"
                          : enrollments[0]?.registrationType === "NEW_STUDENT"
                            ? "Siswa Baru"
                            : enrollments[0]?.enrollmentType || "Siswa Baru"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Masuk di Tingkat / Kelas</span>
                      <strong>Kelas {enrollments[0]?.entryGrade || "1"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Pernah PAUD / TK</span>
                      <strong>
                        {(enrollments[0]?.attendedPaud ?? enrollments[0]?.hasAttendedPaud) === true
                          ? "Ya, Pernah"
                          : (enrollments[0]?.attendedPaud ?? enrollments[0]?.hasAttendedPaud) === false
                            ? "Tidak"
                            : "—"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Nama Sekolah Asal</span>
                      <strong>{enrollments[0]?.previousSchoolName || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>NPSN Sekolah Asal</span>
                      <strong>{enrollments[0]?.previousSchoolNpsn || "—"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Riwayat Penempatan Kelas */}
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <CalendarDays size={18} className="st-card-icon" />
                  <div>
                    <h3>Riwayat Penempatan Kelas & Tahun Ajaran</h3>
                    <small>Catatan historis rombongan belajar yang pernah diikuti santri</small>
                  </div>
                </div>
                <div className="st-section-card__body">
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Tahun Ajaran</th>
                          <th>Kelas Belajar</th>
                          <th>Tingkat</th>
                          <th>Status Penempatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <strong>{studentYear ? studentYear.name : "TA 2026/2027"}</strong>
                          </td>
                          <td>
                            <strong>{studentClass ? studentClass.name : "Belum Ditempatkan"}</strong>
                          </td>
                          <td>Tingkat {studentClass ? studentClass.name.split(" ")[0] : "—"}</td>
                          <td>
                            <span className="st-badge st-badge-green">Aktif Berjalan</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORANG TUA & WALI */}
          {activeTab === "wali" && (
            <div className="st-tab-panel">
              {/* Family Members from Master */}
              <div className="st-section-card" style={{ marginBottom: 20 }}>
                <div className="st-section-card__header">
                  <UserCheck size={18} className="st-card-icon" />
                  <div>
                    <h3>Data Orang Tua & Wali Kandung (Master Keluarga)</h3>
                    <small>Profil ayah, ibu, dan wali yang tercatat dalam berkas kependudukan</small>
                  </div>
                  {canMaster && (
                    <button
                      type="button"
                      className="st-btn-secondary"
                      onClick={onEdit}
                      style={{ marginLeft: "auto", fontSize: 11 }}
                    >
                      <Pencil size={12} /> Kelola Data Keluarga
                    </button>
                  )}
                </div>
                <div className="st-section-card__body">
                  {family.length === 0 ? (
                    <p style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                      Belum ada data anggota keluarga yang tercatat. Silakan lengkapi melalui formulir ubah data siswa.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {family.map((item: any, idx: number) => {
                        const m = item.member;
                        const r = item.relation;
                        const roleLabel =
                          FAMILY_ROLE_LABELS[r.relationshipType] ||
                          r.relationshipType ||
                          "Wali Siswa";
                        const incomeKey = m.monthlyIncomeRange || m.monthlyIncome;
                        return (
                          <div
                            key={idx}
                            style={{
                              border: "1px solid var(--border, #e2e8f0)",
                              borderRadius: 10,
                              padding: 16,
                              background: "#f8fafc",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                              }}
                            >
                              <strong style={{ fontSize: 13 }}>{roleLabel}</strong>
                              <div style={{ display: "flex", gap: 6 }}>
                                {r.isPrimaryContact && (
                                  <span className="st-badge st-badge-blue">Kontak Utama</span>
                                )}
                                {r.isPaymentResponsible && (
                                  <span className="st-badge st-badge-green">PJ SPP</span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                              <div>
                                <span style={{ color: "var(--muted-foreground)", fontSize: 11, display: "block" }}>Nama Lengkap:</span>
                                <strong>{m.fullName}</strong>
                              </div>
                              <div>
                                <span style={{ color: "var(--muted-foreground)", fontSize: 11, display: "block" }}>NIK:</span>
                                <strong>{maskNik(m.nik)}</strong>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div>
                                  <span style={{ color: "var(--muted-foreground)", fontSize: 11, display: "block" }}>Pendidikan:</span>
                                  <span>{m.education || "—"}</span>
                                </div>
                                <div>
                                  <span style={{ color: "var(--muted-foreground)", fontSize: 11, display: "block" }}>Pekerjaan:</span>
                                  <span>{m.occupation || "—"}</span>
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div>
                                  <span style={{ color: "var(--muted-foreground)", fontSize: 11, display: "block" }}>Penghasilan:</span>
                                  <span>{(incomeKey && INCOME_LABELS[incomeKey]) || incomeKey || "—"}</span>
                                </div>
                                <div>
                                  <span style={{ color: "var(--muted-foreground)", fontSize: 11, display: "block" }}>Telepon/WA:</span>
                                  <strong>{m.phone || "—"}</strong>
                                </div>
                              </div>
                              {m.phone && (
                                <a
                                  href={whatsappUrl(m.phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="st-btn-whatsapp"
                                  style={{ marginTop: 6, display: "inline-flex", width: "fit-content" }}
                                >
                                  <Phone size={12} /> Kirim WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Portal Guardians Account */}
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <UserPlus size={18} className="st-card-icon" />
                  <div>
                    <h3>Akun Portal Wali Murid</h3>
                    <small>Daftar wali murid yang memiliki otorisasi akses ke Portal Informasi Wali Murid</small>
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
                      <p>Siswa ini belum dihubungkan dengan data wali murid manapun.</p>
                      {canMaster && (
                        <button
                          type="button"
                          className="primary"
                          onClick={onConnectGuardian}
                          style={{ marginTop: 10 }}
                        >
                          <Plus size={14} /> Hubungkan Wali Murid Sekarang
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="st-wali-grid">
                      {connectedGuardians.map((g, idx) => (
                        <div key={g.id} className="st-wali-card">
                          <div className="st-wali-card__top">
                            <div>
                              <strong style={{ fontSize: 13, display: "block" }}>{g.name}</strong>
                              <small style={{ color: "var(--muted-foreground)" }}>
                                {idx === 0 ? "Kontak Wali Utama" : "Kontak Wali Kedua"}
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

                            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                              <a
                                href={whatsappUrl(g.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="st-btn-whatsapp"
                              >
                                <Phone size={12} /> Chat WhatsApp
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

          {/* TAB 5: KESEHATAN */}
          {activeTab === "kesehatan" && (
            <div className="st-tab-panel">
              {/* Profil Medis */}
              <div className="st-section-card" style={{ marginBottom: 20 }}>
                <div className="st-section-card__header">
                  <HeartPulse size={18} className="st-card-icon" />
                  <div>
                    <h3>Profil Medis & Kebutuhan Khusus</h3>
                    <small>Catatan riwayat kesehatan umum, alergi, dan kebutuhan khusus santri</small>
                  </div>
                  {canMaster && (
                    <button
                      type="button"
                      className="st-btn-secondary"
                      onClick={onEdit}
                      style={{ marginLeft: "auto", fontSize: 11 }}
                    >
                      <Pencil size={12} /> Ubah Profil Kesehatan
                    </button>
                  )}
                </div>
                <div className="st-section-card__body">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Golongan Darah</span>
                      <strong style={{ fontSize: 16 }}>{health?.bloodType || "Tidak Diketahui"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Tinggi & Berat Terbaru</span>
                      <strong>
                        {measurements[0]?.heightCm ? `${measurements[0].heightCm} cm` : "—"} /{" "}
                        {measurements[0]?.weightKg ? `${measurements[0].weightKg} kg` : "—"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Riwayat Penyakit</span>
                      <strong>{health?.medicalHistory || "Tidak Ada"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Alergi Makanan / Obat</span>
                      <strong>
                        {[
                          health?.foodAllergies && `Makanan: ${health.foodAllergies}`,
                          health?.drugAllergies && `Obat: ${health.drugAllergies}`,
                        ]
                          .filter(Boolean)
                          .join(" • ") ||
                          health?.allergies ||
                          "Tidak Ada Alergi"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Kebutuhan Khusus (Disabilitas)</span>
                      <strong>
                        {health?.hasSpecialNeeds
                          ? (Array.isArray(health.specialNeedsTypes) && health.specialNeedsTypes.length > 0
                              ? health.specialNeedsTypes.join(", ")
                              : health?.assistanceNeeds || "Ada Kebutuhan Khusus")
                          : health?.specialNeeds || "Tidak Ada"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block" }}>Catatan Darurat / Pengobatan Rutin</span>
                      <strong>
                        {health?.emergencyHandlingNotes ||
                          health?.routineMedication ||
                          health?.emergencyNotes ||
                          "—"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pengukuran Fisik Periodik */}
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <Activity size={18} className="st-card-icon" />
                  <div>
                    <h3>Riwayat Pengukuran Fisik Periodik</h3>
                    <small>Data perkembangan tinggi badan, berat badan, dan lingkar kepala tiap semester</small>
                  </div>
                  {canMaster && (
                    <button
                      type="button"
                      className="primary tiny"
                      onClick={() => setShowAddMeasurementModal(true)}
                      style={{ marginLeft: "auto" }}
                    >
                      <Plus size={13} /> Tambah Pengukuran
                    </button>
                  )}
                </div>
                <div className="st-section-card__body">
                  {measurements.length === 0 ? (
                    <p style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                      Belum ada riwayat pengukuran fisik periodik untuk santri ini.
                    </p>
                  ) : (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Tanggal Ukur</th>
                            <th>Semester</th>
                            <th>Tinggi Badan</th>
                            <th>Berat Badan</th>
                            <th>Lingkar Kepala</th>
                            <th>Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {measurements.map((m: any) => (
                            <tr key={m.id}>
                              <td>
                                <strong>{formatDateIndo(m.measuredAt || m.measurementDate)}</strong>
                              </td>
                              <td>
                                <span className="st-pill-green">
                                  {Number(m.semester) === 1 || m.semester === "SEMESTER_1"
                                    ? "Semester Ganjil"
                                    : "Semester Genap"}
                                </span>
                              </td>
                              <td>{m.heightCm} cm</td>
                              <td>{m.weightKg} kg</td>
                              <td>{m.headCircumferenceCm ? `${m.headCircumferenceCm} cm` : "—"}</td>
                              <td>{m.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BANTUAN PENDIDIKAN */}
          {activeTab === "bantuan" && (
            <div className="st-tab-panel">
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <Award size={18} className="st-card-icon" />
                  <div>
                    <h3>Riwayat Bantuan Pendidikan (KIP, PIP, PKH, Beasiswa)</h3>
                    <small>Data jaminan sosial pendidikan dan program afirmasi yang diterima siswa</small>
                  </div>
                  {canMaster && (
                    <button
                      type="button"
                      className="primary tiny"
                      onClick={() => setShowAddAidModal(true)}
                      style={{ marginLeft: "auto" }}
                    >
                      <Plus size={13} /> Tambah Bantuan
                    </button>
                  )}
                </div>
                <div className="st-section-card__body">
                  {aidRecords.length === 0 ? (
                    <p style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                      Belum ada data bantuan pendidikan atau beasiswa yang terdaftar.
                    </p>
                  ) : (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Jenis Program</th>
                            <th>Nama Program</th>
                            <th>Tahun</th>
                            <th>Nominal</th>
                            <th>Status Bantuan</th>
                            <th>Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aidRecords.map((a: any) => (
                            <tr key={a.id}>
                              <td>
                                <strong>{a.aidType}</strong>
                              </td>
                              <td>{a.programName || a.aidSource || a.aidType}</td>
                              <td>{a.year || (a.startDate ? a.startDate.slice(0, 4) : "—")}</td>
                              <td>{a.amount ? money(a.amount) : "—"}</td>
                              <td>
                                <span
                                  className={`st-badge ${
                                    a.status === "ACTIVE" ? "st-badge-green" : "st-badge-slate"
                                  }`}
                                >
                                  {a.status === "ACTIVE" ? "Aktif Menerima" : a.status}
                                </span>
                              </td>
                              <td>{a.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: KARAKTERISTIK SANTRI */}
          {activeTab === "karakteristik" && (
            <div className="st-tab-panel">
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <BookOpen size={18} className="st-card-icon" />
                  <div>
                    <h3>Karakteristik & Perkembangan Santri</h3>
                    <small>Profil minat bakat, kebiasaan belajar, dan catatan pembinaan akhlak</small>
                  </div>
                </div>
                <div className="st-section-card__body">
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px dashed var(--border, #cbd5e1)",
                      borderRadius: 10,
                      padding: 24,
                      textAlign: "center",
                    }}
                  >
                    <BookOpen size={32} style={{ margin: "0 auto 10px", color: "var(--primary)" }} />
                    <h4 style={{ margin: "0 0 6px", fontSize: 14 }}>Lembar Karakteristik Santri</h4>
                    <p style={{ margin: "0 auto 16px", maxWidth: 480, fontSize: 12, color: "var(--muted-foreground)" }}>
                      Modul pemetaan karakteristik meliputi minat bakat seni/olahraga/tahfidz, kemandirian santri,
                      dan catatan bimbingan konseling terintegrasi dengan rapor karakter SDIT AT-TAQWIM.
                    </p>
                    {profile?.characteristic?.status === "FILLED" ? (
                      <span className="st-badge st-badge-green">
                        ✓ Kuesioner Sudah Diisi ({formatDateTimeIndo(profile.characteristic.submittedAt)})
                      </span>
                    ) : (
                      <span className="st-badge st-badge-amber">
                        Belum Diisi — Silakan lengkapi melalui menu Karakteristik Anak
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: DOKUMEN PERSYARATAN */}
          {activeTab === "dokumen" && (
            <div className="st-tab-panel">
              <div className="st-section-card">
                <div className="st-section-card__header">
                  <FolderOpen size={18} className="st-card-icon" />
                  <div>
                    <h3>Dokumen Fisik & Berkas Persyaratan Siswa</h3>
                    <small>Berkas pendaftaran, verifikasi keabsahan dokumen kependudukan oleh TU</small>
                  </div>
                </div>
                <div className="st-section-card__body">
                  {documents.length === 0 ? (
                    <div className="st-empty-state">
                      <FolderOpen size={32} />
                      <p>Belum ada berkas dokumen persyaratan yang diunggah untuk siswa ini.</p>
                      {canMaster && (
                        <button
                          type="button"
                          className="primary"
                          onClick={onEdit}
                          style={{ marginTop: 10 }}
                        >
                          <Pencil size={14} /> Buka Form untuk Unggah Berkas
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Jenis Dokumen</th>
                            <th>Nama File</th>
                            <th>Ukuran</th>
                            <th>Status Verifikasi</th>
                            <th>Catatan TU</th>
                            <th className="right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc: any) => (
                            <tr key={doc.id}>
                              <td>
                                <strong>{doc.documentType}</strong>
                              </td>
                              <td>{doc.documentName || doc.originalFilename || doc.fileName || "—"}</td>
                              <td>
                                {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "—"}
                              </td>
                              <td>
                                <span
                                  className={`st-badge ${
                                    doc.verificationStatus === "VERIFIED"
                                      ? "st-badge-green"
                                      : doc.verificationStatus === "REJECTED"
                                      ? "st-badge-amber"
                                      : "st-badge-slate"
                                  }`}
                                >
                                  {DOC_STATUS_LABELS[doc.verificationStatus] || doc.verificationStatus}
                                </span>
                              </td>
                              <td>{doc.rejectionReason || doc.verificationNotes || "—"}</td>
                              <td className="right">
                                <div style={{ display: "inline-flex", gap: 6 }}>
                                  <a
                                    href={`/api/student-documents/${doc.id}/content`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="st-btn-secondary"
                                    style={{ padding: "4px 8px", fontSize: 11 }}
                                  >
                                    <Download size={12} /> Unduh
                                  </a>
                                  {canMaster && (
                                    <button
                                      type="button"
                                      className="outline tiny"
                                      onClick={() => {
                                        setDocReviewModal(doc);
                                        setReviewStatus(doc.verificationStatus === "REJECTED" ? "REJECTED" : "VERIFIED");
                                        setReviewNotes(doc.rejectionReason || doc.verificationNotes || "");
                                      }}
                                    >
                                      <FileCheck size={12} /> Review
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: KEUANGAN (EXISTING FEATURE KEPT INTACT) */}
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
                      <p>Belum ada invoice SPP yang diterbitkan untuk siswa ini.</p>
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

          {/* TAB 10: UJIAN (EXISTING FEATURE KEPT INTACT) */}
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
        </section>
      </div>

      {/* MODAL: Tambah Pengukuran Fisik */}
      {showAddMeasurementModal && (
        <Modal
          title="Tambah Pengukuran Fisik Periodik"
          close={() => setShowAddMeasurementModal(false)}
        >
          <form onSubmit={handleSaveMeasurement} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Tanggal Pengukuran *
              </label>
              <input
                type="date"
                required
                value={measurementForm.date}
                onChange={(e) => setMeasurementForm({ ...measurementForm, date: e.target.value })}
                className="st-input"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Tinggi Badan (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Contoh: 125.5"
                  value={measurementForm.heightCm}
                  onChange={(e) => setMeasurementForm({ ...measurementForm, heightCm: e.target.value })}
                  className="st-input"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Berat Badan (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Contoh: 26.0"
                  value={measurementForm.weightKg}
                  onChange={(e) => setMeasurementForm({ ...measurementForm, weightKg: e.target.value })}
                  className="st-input"
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Lingkar Kepala (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Contoh: 51.0 (opsional)"
                value={measurementForm.headCircumferenceCm}
                onChange={(e) => setMeasurementForm({ ...measurementForm, headCircumferenceCm: e.target.value })}
                className="st-input"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Periode Semester *
              </label>
              <select
                value={measurementForm.semester}
                onChange={(e) => setMeasurementForm({ ...measurementForm, semester: e.target.value })}
                className="st-input"
              >
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Catatan Tambahan
              </label>
              <input
                type="text"
                placeholder="Catatan kesehatan UKS"
                value={measurementForm.notes}
                onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
                className="st-input"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="outline"
                onClick={() => setShowAddMeasurementModal(false)}
              >
                Batal
              </button>
              <button type="submit" className="primary" disabled={isSavingMeasurement}>
                {isSavingMeasurement ? "Menyimpan..." : "Simpan Pengukuran"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Tambah Bantuan Pendidikan */}
      {showAddAidModal && (
        <Modal
          title="Tambah Catatan Bantuan Pendidikan"
          close={() => setShowAddAidModal(false)}
        >
          <form onSubmit={handleSaveAid} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Jenis Bantuan *
              </label>
              <select
                value={aidForm.aidType}
                onChange={(e) => setAidForm({ ...aidForm, aidType: e.target.value })}
                className="st-input"
              >
                <option value="PIP">Program Indonesia Pintar (PIP)</option>
                <option value="KIP">Kartu Indonesia Pintar (KIP)</option>
                <option value="PKH">Program Keluarga Harapan (PKH)</option>
                <option value="KKS">Kartu Keluarga Sejahtera (KKS)</option>
                <option value="KPS">Kartu Perlindungan Sosial (KPS)</option>
                <option value="BEASISWA_INTERNAL">Beasiswa Yayasan SDIT At-Taqwim</option>
                <option value="BEASISWA_EKSTERNAL">Beasiswa Eksternal</option>
                <option value="OTHER">Bantuan / Beasiswa Lainnya</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Nama Program / Beasiswa
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PIP Fase A Kelas 1"
                  value={aidForm.programName}
                  onChange={(e) => setAidForm({ ...aidForm, programName: e.target.value })}
                  className="st-input"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Tahun Anggaran *
                </label>
                <input
                  type="number"
                  required
                  value={aidForm.year}
                  onChange={(e) => setAidForm({ ...aidForm, year: e.target.value })}
                  className="st-input"
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Nominal Bantuan (Rp)
              </label>
              <input
                type="number"
                placeholder="Contoh: 450000"
                value={aidForm.amount}
                onChange={(e) => setAidForm({ ...aidForm, amount: e.target.value })}
                className="st-input"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Catatan / Keterangan
              </label>
              <input
                type="text"
                placeholder="Nomor kartu KIP / rekening penyalur"
                value={aidForm.notes}
                onChange={(e) => setAidForm({ ...aidForm, notes: e.target.value })}
                className="st-input"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="outline"
                onClick={() => setShowAddAidModal(false)}
              >
                Batal
              </button>
              <button type="submit" className="primary" disabled={isSavingAid}>
                {isSavingAid ? "Menyimpan..." : "Simpan Bantuan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Review / Verifikasi Dokumen oleh TU */}
      {docReviewModal && (
        <Modal
          title={`Verifikasi Dokumen: ${docReviewModal.documentType}`}
          close={() => setDocReviewModal(null)}
        >
          <form onSubmit={handleReviewDoc} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={{ fontSize: 12, color: "#475569", margin: "0 0 10px" }}>
                Nama Berkas: <b>{docReviewModal.documentName || docReviewModal.originalFilename || docReviewModal.fileName}</b>
              </p>
              <a
                href={`/api/student-documents/${docReviewModal.id}/content`}
                target="_blank"
                rel="noopener noreferrer"
                className="st-btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, marginBottom: 12 }}
              >
                <Download size={13} /> Buka / Unduh Berkas untuk Diperiksa
              </a>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Hasil Pemeriksaan Berkas *
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as any)}
                className="st-input"
              >
                <option value="VERIFIED">Valid / Sesuai (VERIFIED)</option>
                <option value="REJECTED">Ditolak / Berkas Buram / Salah (REJECTED)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Catatan Verifikasi Tata Usaha
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Dokumen jelas dan sesuai dengan Kartu Keluarga asli."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="st-input"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="outline"
                onClick={() => setDocReviewModal(null)}
              >
                Tutup
              </button>
              <button type="submit" className="primary" disabled={isSavingReview}>
                {isSavingReview ? "Menyimpan..." : "Simpan Status Verifikasi"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL PRINT: Formulir Biodata A4 */}
      {showPrintBiodataModal && (
        <Modal
          title="Pratinjau Formulir Biodata Siswa (A4)"
          close={() => setShowPrintBiodataModal(false)}
        >
          <div style={{ maxHeight: "75vh", overflowY: "auto", padding: 10 }}>
            <div
              id="printable-form"
              style={{
                fontFamily: "serif",
                color: "#111827",
                background: "#ffffff",
                padding: "24px 30px",
                border: "1px solid #cbd5e1",
              }}
            >
              {/* Kop Surat Resmi */}
              <div
                style={{
                  textAlign: "center",
                  borderBottom: "3px double #000000",
                  paddingBottom: 10,
                  marginBottom: 16,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: "bold", textTransform: "uppercase" }}>
                  SDIT AT-TAQWIM
                </h2>
                <p style={{ margin: "2px 0", fontSize: 11 }}>
                  Jl. Raya Cileungsi - Setu, Pasirangin, Kec. Cileungsi, Kab. Bogor, Jawa Barat 16820
                </p>
                <p style={{ margin: 0, fontSize: 11, fontStyle: "italic" }}>
                  Email: info@sdit-attaqwim.sch.id | NPSN: 69949182
                </p>
              </div>

              <h3
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  textDecoration: "underline",
                  margin: "10px 0 16px",
                  fontWeight: "bold",
                }}
              >
                LEMBAR BIODATA RESMI PESERTA DIDIK
              </h3>

              {/* Data Section */}
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", marginBottom: 16 }}>
                <tbody>
                  <tr>
                    <td style={{ width: "30%", padding: "4px 0", verticalAlign: "top" }}>Nama Lengkap Peserta Didik</td>
                    <td style={{ width: "3%", padding: "4px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ fontWeight: "bold", padding: "4px 0" }}>{student.name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>NIS / NISN</td>
                    <td style={{ padding: "4px 0" }}>:</td>
                    <td>{student.nis} / {student.nisn || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Nomor Induk Kependudukan (NIK)</td>
                    <td style={{ padding: "4px 0" }}>:</td>
                    <td>{studentExtended.nik || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Nomor Kartu Keluarga (KK)</td>
                    <td style={{ padding: "4px 0" }}>:</td>
                    <td>{studentExtended.familyCardNumber || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Tempat, Tanggal Lahir</td>
                    <td style={{ padding: "4px 0" }}>:</td>
                    <td>{student.birthPlace || "—"}, {formatDateIndo(student.birthDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Jenis Kelamin / Agama</td>
                    <td style={{ padding: "4px 0" }}>:</td>
                    <td>
                      {student.gender === "L"
                        ? "Laki-laki"
                        : student.gender === "P"
                          ? "Perempuan"
                          : "—"}{" "}
                      / {studentExtended.religion || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Anak Ke / Saudara</td>
                    <td style={{ padding: "4px 0" }}>:</td>
                    <td>Anak ke-{studentExtended.birthOrder || "—"} dari {studentExtended.siblingCount || "—"} bersaudara</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0", verticalAlign: "top" }}>Alamat Lengkap KK</td>
                    <td style={{ padding: "4px 0", verticalAlign: "top" }}>:</td>
                    <td>
                      {kkAddress ? `${kkAddress.address || kkAddress.street || ""}, RT ${kkAddress.rt || "—"}/RW ${kkAddress.rw || "—"}, Desa ${kkAddress.village || "—"}, Kec. ${kkAddress.district || "—"}, ${kkAddress.regency || kkAddress.city || "—"}` : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Kelas Belajar</td>
                    <td style={{ padding: "4px 0" }}>:</td>
                    <td>{studentClass ? studentClass.name : "—"} ({studentYear ? studentYear.name : "TA 2026/2027"})</td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 30,
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 50px" }}>Mengetahui,<br />Orang Tua / Wali Santri</p>
                  <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>( .................................................... )</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 50px" }}>Bogor, {formatDateIndo(new Date().toISOString())}<br />Petugas Tata Usaha</p>
                  <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>( Tata Usaha SDIT At-Taqwim )</p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                className="outline"
                onClick={() => setShowPrintBiodataModal(false)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => window.print()}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Printer size={14} /> Cetak Formulir (Ctrl+P)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL PRINT: Ringkasan Buku Induk */}
      {showPrintBukuIndukModal && (
        <Modal
          title="Pratinjau Lembar Buku Induk Siswa"
          close={() => setShowPrintBukuIndukModal(false)}
        >
          <div style={{ maxHeight: "75vh", overflowY: "auto", padding: 10 }}>
            <div
              id="printable-form"
              style={{
                fontFamily: "serif",
                color: "#111827",
                background: "#ffffff",
                padding: "24px 30px",
                border: "1px solid #cbd5e1",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  borderBottom: "2px solid #000000",
                  paddingBottom: 8,
                  marginBottom: 16,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 16, textTransform: "uppercase" }}>
                  BUKU INDUK PESERTA DIDIK
                </h2>
                <h3 style={{ margin: "2px 0 0", fontSize: 13 }}>
                  SEKOLAH DASAR ISLAM TERPADU AT-TAQWIM
                </h3>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 11 }}>
                <span>NOMOR INDUK SISWA: <b>{student.nis}</b></span>
                <span>NISN: <b>{student.nisn || "—"}</b></span>
              </div>

              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ width: "35%", padding: "5px 0" }}>1. Nama Lengkap</td>
                    <td style={{ fontWeight: "bold" }}>: {student.name}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "5px 0" }}>2. Tempat, Tanggal Lahir</td>
                    <td>: {student.birthPlace || "—"}, {formatDateIndo(student.birthDate)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "5px 0" }}>3. NIK / No. Akta Kelahiran</td>
                    <td>: {studentExtended.nik || "—"} / {studentExtended.birthCertificateNumber || "—"}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "5px 0" }}>4. Tanggal Terdaftar Masuk</td>
                    <td>: {formatDateIndo(student.enrolledOn)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "5px 0" }}>5. Sekolah Asal / TK</td>
                    <td>: {enrollments[0]?.previousSchoolName || "—"}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "5px 0" }}>6. Golongan Darah</td>
                    <td>: {health?.bloodType || "—"}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "5px 0" }}>7. Status Terakhir</td>
                    <td>: {student.active ? "AKTIF" : "TIDAK AKTIF"}</td>
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 35,
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 50px" }}>Kepala SDIT At-Taqwim,</p>
                  <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>( H. Ahmad Fauzi, S.Pd.I )</p>
                  <p style={{ margin: 0 }}>NIP/NIY: 198204152008011002</p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                className="outline"
                onClick={() => setShowPrintBukuIndukModal(false)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => window.print()}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Printer size={14} /> Cetak Buku Induk (Ctrl+P)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
