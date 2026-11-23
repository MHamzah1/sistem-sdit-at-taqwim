"use client";

import React, { useState, useMemo } from "react";
import {
  Settings,
  KeyRound,
  School,
  UserPlus,
  Users,
  ShieldAlert,
  ShieldCheck,
  Check,
  Minus,
  Server,
  Clock,
  Lock,
  User,
  Mail,
  Fingerprint,
  CheckCircle2,
  Globe,
  ReceiptText,
  Building2,
  CalendarDays,
  Search,
  Sliders,
  Database,
  HardDrive,
  FileCheck2,
  BadgeCheck,
  Info,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import { CopyButton } from "@/src/components/CopyButton";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type TabType = "profil" | "sekolah" | "pengguna" | "sistem";

const ALL_PERMISSIONS = [
  {
    key: "read",
    name: "Akses Data Master & Direktori",
    description: "Melihat data siswa, rombel kelas, tahun ajaran aktif, dan arsip tagihan sekolah.",
    category: "Master Data",
  },
  {
    key: "finance",
    name: "Transaksi Keuangan & Kasir SPP",
    description: "Mencatat setoran tunai kasir, verifikasi bukti transfer wali, dan cetak kuitansi resmi.",
    category: "Keuangan",
  },
  {
    key: "master",
    name: "Pengelolaan Master Siswa & Tarif",
    description: "Menambah dan mengedit profil santri, data wali, penempatan kelas, dan skema tarif SPP.",
    category: "Master Data",
  },
  {
    key: "principal",
    name: "Otoritas Dispensasi Ujian",
    description: "Wewenang Kepala Sekolah untuk menyetujui dispensasi ujian bersyarat dengan janji bayar.",
    category: "Ujian",
  },
  {
    key: "settings",
    name: "Konfigurasi Identitas Sekolah",
    description: "Mengubah nama resmi lembaga, nomor WhatsApp hotline TU, dan parameter institusi.",
    category: "Sistem",
  },
  {
    key: "audit",
    name: "Audit Trail & Log Aktivitas",
    description: "Memantau riwayat mutasi transaksi keuangan, perubahan status, dan rekam jejak pengguna.",
    category: "Sistem",
  },
  {
    key: "users",
    name: "Manajemen Akun & Otoritas",
    description: "Membuat akun baru, menonaktifkan pengguna, dan mengatur pembagian peran dalam sistem.",
    category: "Sistem",
  },
  {
    key: "guardian",
    name: "Portal Orang Tua / Wali Murid",
    description: "Akses mandiri bagi wali murid untuk memantau tagihan dan mengunduh kartu ujian anak.",
    category: "Portal",
  },
];

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "Administrator Sistem";
    case "TU_KEUANGAN":
      return "Tata Usaha & Keuangan";
    case "KEPALA_SEKOLAH":
      return "Kepala Sekolah";
    case "WALI_MURID":
      return "Wali Murid";
    default:
      return role || "Pengguna";
  }
};

const getRoleBadgeClass = (role?: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "st-badge-blue";
    case "TU_KEUANGAN":
      return "st-badge-green";
    case "KEPALA_SEKOLAH":
      return "st-badge-amber";
    case "WALI_MURID":
      return "st-badge-slate";
    default:
      return "st-badge-slate";
  }
};

export default function SystemConfigurationPage() {
  const { state, loading, save, can, actor, setToast, refresh } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>("profil");
  const [searchUser, setSearchUser] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);

  const users = state?.users || [];
  const settings = state?.settings || [];
  const academicYears = state?.academicYears || [];
  const classes = state?.classes || [];

  const activeYear = academicYears.find((y) => y.active);
  const schoolSetting = settings.find((s) => s.key === "school")?.value as
    | Record<string, string>
    | undefined;

  const schoolName = schoolSetting?.schoolName || "SDIT AT-TAQWIM";
  const schoolPhone = schoolSetting?.phone || "0812-3456-7890";
  const primaryRole = actor?.roles?.[0] || "USER";

  const userInitials = useMemo(() => {
    if (!actor?.name) return "US";
    const parts = actor.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return actor.name.slice(0, 2).toUpperCase();
  }, [actor?.name]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterStatus === "ACTIVE" && !u.active) return false;
      if (filterStatus === "INACTIVE" && u.active) return false;
      if (searchUser.trim()) {
        const q = searchUser.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [users, filterStatus, searchUser]);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat konfigurasi sistem...</p>
        </div>
      </div>
    );
  }

  const handleChangePassword = () => {
    setFormConfig({
      title: "Ubah Kata Sandi Akun",
      note: "Minimal 12 karakter. Demi keamanan, seluruh sesi login aktif pada perangkat lain akan dikeluarkan setelah kata sandi berhasil diperbarui.",
      fields: [
        {
          key: "currentPassword",
          label: "Kata Sandi Saat Ini",
          type: "password",
          required: true,
        },
        {
          key: "newPassword",
          label: "Kata Sandi Baru (Minimal 12 Karakter)",
          type: "password",
          required: true,
        },
      ],
      submit: async (values) => {
        await api("auth/password", "POST", values);
        await refresh();
        setToast("Kata sandi berhasil diubah");
        setFormConfig(null);
      },
    });
  };

  const handleEditSchool = () => {
    setFormConfig({
      title: "Ubah Identitas Sekolah",
      note: "Informasi ini akan dicantumkan secara otomatis pada lembar invoice SPP, kuitansi bukti pembayaran, dan pesan reminder WhatsApp.",
      fields: [
        {
          key: "schoolName",
          label: "Nama Lembaga / Sekolah",
          defaultValue: schoolSetting?.schoolName || "SDIT AT-TAQWIM",
          required: true,
        },
        {
          key: "phone",
          label: "Nomor WhatsApp Sekolah (Hotline TU)",
          defaultValue: schoolSetting?.phone || "",
          required: true,
        },
      ],
      submit: async (values) => {
        await save("settings", values);
        setToast("Identitas sekolah berhasil diperbarui");
        setFormConfig(null);
      },
    });
  };

  const handleCreateUser = () => {
    setFormConfig({
      title: "Buat Akun Pengguna Baru",
      note: "Untuk akun dengan peran WALI_MURID, pastikan menghubungkan akun ke data siswa melalui menu Master Wali Murid.",
      fields: [
        { key: "name", label: "Nama Lengkap Pengguna", required: true },
        { key: "email", label: "Alamat Email (Username Login)", type: "email", required: true },
        {
          key: "password",
          label: "Kata Sandi Awal (Minimal 12 Karakter)",
          type: "password",
          required: true,
        },
        {
          key: "role",
          label: "Peran / Otoritas Pengguna",
          options: [
            { value: "SUPER_ADMIN", label: "SUPER_ADMIN (Administrator Sistem)" },
            { value: "TU_KEUANGAN", label: "TU_KEUANGAN (Tata Usaha & Kasir SPP)" },
            { value: "KEPALA_SEKOLAH", label: "KEPALA_SEKOLAH (Kepala Sekolah & Dispensasi)" },
            { value: "WALI_MURID", label: "WALI_MURID (Portal Orang Tua)" },
          ],
          required: true,
        },
      ],
      submit: async (values) => {
        await save("users", values);
        setToast(`Akun pengguna ${values.name} berhasil dibuat`);
        setFormConfig(null);
      },
    });
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner Header */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <Settings size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Sistem</span>
              <span>/</span>
              <span>Pengaturan & Keamanan</span>
            </div>
            <h1 className="st-title">Pengaturan Sistem & Pengguna</h1>
            <p className="st-subtitle">
              Konfigurasi keamanan akun, profil lembaga sekolah, parameter sistem, dan manajemen hak akses pengguna.
            </p>
          </div>
        </div>

        <div className="st-header-actions">
          <button
            type="button"
            className="st-btn-secondary"
            onClick={handleChangePassword}
          >
            <KeyRound size={16} />
            <span>Ubah Password</span>
          </button>

          {can("settings") && (
            <button
              type="button"
              className="st-btn-secondary"
              onClick={handleEditSchool}
            >
              <School size={16} />
              <span>Identitas Sekolah</span>
            </button>
          )}

          {can("users") && (
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleCreateUser}
            >
              <UserPlus size={16} />
              <span>Buat Akun</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Identity 3-Card Grid */}
      <div className="st-idcard-grid">
        {/* Card 1: User Profile */}
        <div className="st-profile-card">
          <div
            className="st-profile-card__avatar"
            style={{ width: 80, height: 80, borderRadius: "50%" }}
          >
            <span className="st-profile-avatar-text" style={{ fontSize: 24 }}>
              {userInitials}
            </span>
          </div>
          <div className="st-profile-card__info">
            <h2>{actor?.name}</h2>
            <div className="st-profile-card__badges">
              <span className={`st-badge ${getRoleBadgeClass(primaryRole)}`}>
                {getRoleLabel(primaryRole)}
              </span>
              <span className="st-status-pill active" style={{ fontSize: 10 }}>
                <span className="st-status-dot" />
                Aktif
              </span>
            </div>
          </div>
          <button
            type="button"
            className="st-btn-secondary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: 4,
              padding: "7px 12px",
            }}
            onClick={handleChangePassword}
          >
            <KeyRound size={14} />
            <span>Ganti Kata Sandi</span>
          </button>
        </div>

        {/* Card 2: Account & Credential Details */}
        <div className="st-idcard">
          <div className="st-idcard__head">
            <span className="st-idcard__icon-badge">
              <User size={16} />
            </span>
            <h3>Detail Akun & Kredensial</h3>
          </div>
          <div className="st-idcard__list">
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <Mail size={13} />
                Email Login
              </span>
              <span className="st-idcard__value">{actor?.email}</span>
            </div>
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <Fingerprint size={13} />
                ID Pengguna
              </span>
              <span className="st-copy-row">
                <span
                  className="st-idcard__value"
                  style={{ fontFamily: "monospace", fontSize: 11 }}
                >
                  {actor?.id?.slice(0, 10)}…
                </span>
                <CopyButton value={actor?.id || ""} title="Salin ID Pengguna" />
              </span>
            </div>
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <ShieldCheck size={13} />
                Peran Utama
              </span>
              <span className="st-idcard__value">{getRoleLabel(primaryRole)}</span>
            </div>
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <CheckCircle2 size={13} />
                Hak Akses Aktif
              </span>
              <span
                className="st-idcard__value"
                style={{ color: "#16613e", fontWeight: 700 }}
              >
                {actor?.permissions?.length || 0} Otoritas Terhubung
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Session Policy */}
        <div className="st-idcard">
          <div className="st-idcard__head">
            <span className="st-idcard__icon-badge">
              <Lock size={16} />
            </span>
            <h3>Keamanan & Kebijakan Sesi</h3>
          </div>
          <div className="st-idcard__list">
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <KeyRound size={13} />
                Enkripsi Sandi
              </span>
              <span className="st-idcard__value">scrypt KDF (64-byte key)</span>
            </div>
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <Clock size={13} />
                Masa Berlaku Sesi
              </span>
              <span className="st-idcard__value">8 Jam (HttpOnly Cookie)</span>
            </div>
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <ShieldAlert size={13} />
                Anti-Brute Force
              </span>
              <span className="st-idcard__value">Maks 20x / 15 Menit</span>
            </div>
            <div className="st-idcard__row">
              <span className="st-idcard__label">
                <Globe size={13} />
                Proteksi CSRF
              </span>
              <span
                className="st-idcard__value"
                style={{ color: "#16613e", fontWeight: 700 }}
              >
                SameSite Lax · Protected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tab Bar */}
      <div className="st-filter-card" style={{ padding: "8px 16px" }}>
        <div className="st-tabs-filter" style={{ flexWrap: "wrap" }}>
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "profil" ? "active" : ""}`}
            onClick={() => setActiveTab("profil")}
          >
            <ShieldCheck
              size={14}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: 6,
              }}
            />
            Hak Akses & Otoritas
          </button>
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "sekolah" ? "active" : ""}`}
            onClick={() => setActiveTab("sekolah")}
          >
            <School
              size={14}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: 6,
              }}
            />
            Identitas Sekolah
          </button>
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "pengguna" ? "active" : ""}`}
            onClick={() => setActiveTab("pengguna")}
          >
            <Users
              size={14}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: 6,
              }}
            />
            Manajemen Pengguna
            {can("users") ? (
              <span
                style={{
                  marginLeft: 6,
                  padding: "1px 6px",
                  borderRadius: 8,
                  background: "#e8f2ec",
                  color: "#176442",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {users.length}
              </span>
            ) : (
              <Lock
                size={11}
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginLeft: 6,
                  opacity: 0.6,
                }}
              />
            )}
          </button>
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "sistem" ? "active" : ""}`}
            onClick={() => setActiveTab("sistem")}
          >
            <Server
              size={14}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: 6,
              }}
            />
            Status Server & Kebijakan
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {/* 1. TAB: PROFIL & HAK AKSES */}
      {activeTab === "profil" && (
        <div className="st-tab-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="st-section-card">
            <div className="st-section-card__header">
              <Sliders size={18} className="st-card-icon" />
              <div>
                <h3>Matriks Hak Akses & Kewenangan Peran</h3>
                <small>
                  Hak akses berikut dikonfigurasi secara deterministik pada peran {getRoleLabel(primaryRole)}.
                </small>
              </div>
            </div>
            <div className="st-section-card__body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 12,
                }}
              >
                {ALL_PERMISSIONS.map((perm) => {
                  const isAllowed = can(perm.key);
                  return (
                    <div
                      key={perm.key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: 8,
                        border: isAllowed
                          ? "1px solid #d1ebd8"
                          : "1px solid #e2e8e4",
                        background: isAllowed ? "#fbfdfb" : "#f8faf9",
                      }}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          background: isAllowed ? "#e9f3ec" : "#f1f4f2",
                          color: isAllowed ? "#2a7850" : "#8c9b91",
                        }}
                      >
                        {isAllowed ? (
                          <Check size={16} strokeWidth={2.5} />
                        ) : (
                          <Minus size={16} />
                        )}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 13,
                              color: isAllowed ? "#1e3629" : "#5c6c63",
                            }}
                          >
                            {perm.name}
                          </strong>
                          <span
                            className={`st-badge ${
                              isAllowed ? "st-badge-green" : "st-badge-slate"
                            }`}
                            style={{ fontSize: 9.5 }}
                          >
                            {isAllowed ? "Diizinkan" : "Dibatasi"}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11.5,
                            color: "#6c7971",
                            lineHeight: 1.4,
                          }}
                        >
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Security Banner */}
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "#f0f6f2",
                  border: "1px solid #d1ebd8",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <ShieldCheck size={20} style={{ color: "#176442", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#283b34", lineHeight: 1.5 }}>
                  <strong>Standar Keamanan Kredensial SDIT AT-TAQWIM:</strong> Seluruh kata sandi
                  dienkripsi menggunakan algoritma <code>scrypt</code> dengan random salt 16-byte. Demi
                  menjaga keamanan data sekolah, mengganti kata sandi akan otomatis mengeluarkan (logout)
                  sesi aktif pada perangkat lain.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: IDENTITAS SEKOLAH */}
      {activeTab === "sekolah" && (
        <div className="st-tab-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="st-section-card">
            <div className="st-section-card__header">
              <School size={18} className="st-card-icon" />
              <div style={{ flex: 1 }}>
                <h3>Profil Lembaga SDIT AT-TAQWIM</h3>
                <small>
                  Identitas resmi lembaga yang dicetak pada invoice SPP, kuitansi kasir, dan pesan WhatsApp.
                </small>
              </div>
              {can("settings") ? (
                <button
                  type="button"
                  className="st-btn-secondary"
                  onClick={handleEditSchool}
                >
                  <School size={15} />
                  <span>Ubah Identitas</span>
                </button>
              ) : (
                <span className="st-badge st-badge-slate">Hanya-Baca</span>
              )}
            </div>
            <div className="st-section-card__body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 14,
                }}
              >
                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <School size={15} />
                    <h4>Nama Lembaga Resmi</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong>{schoolName}</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Sekolah Dasar Islam Terpadu
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <Globe size={15} />
                    <h4>Hotline WhatsApp TU</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <strong>{schoolPhone}</strong>
                      <CopyButton value={schoolPhone} title="Salin Nomor WhatsApp" />
                    </div>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Layanan Kasir SPP & Administrasi
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <CalendarDays size={15} />
                    <h4>Tahun Ajaran Aktif</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong>{activeYear?.name || "Belum Ditentukan"}</strong>
                      <span className="st-badge st-badge-green" style={{ fontSize: 9.5 }}>
                        Aktif
                      </span>
                    </div>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      {classes.length} Rombongan Belajar Terdaftar
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <Building2 size={15} />
                    <h4>Afiliasi & Kurikulum</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong>Kurikulum Nasional & Karakter</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Pendidikan Islam Terpadu (JSIT)
                    </small>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: can("settings") ? "#f0f6f2" : "#fbf2df",
                  border: can("settings")
                    ? "1px solid #d1ebd8"
                    : "1px solid #f4e3c3",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {can("settings") ? (
                  <CheckCircle2 size={20} style={{ color: "#176442", flexShrink: 0 }} />
                ) : (
                  <Info size={20} style={{ color: "#a0732b", flexShrink: 0 }} />
                )}
                <p style={{ margin: 0, fontSize: 12, color: "#283b34", lineHeight: 1.5 }}>
                  {can("settings")
                    ? "Perubahan pada nama sekolah atau hotline WhatsApp langsung tersinkronisasi ke kop invoice SPP, lembar cetak kuitansi, dan template pesan WhatsApp."
                    : "Pengubahan identitas resmi sekolah hanya dapat dilakukan oleh pengguna dengan hak akses Administrator Sistem (SUPER_ADMIN)."}
                </p>
              </div>
            </div>
          </div>

          <div className="st-section-card">
            <div className="st-section-card__header">
              <ReceiptText size={18} className="st-card-icon" />
              <div>
                <h3>Standar Dokumen Finansial & Ujian</h3>
                <small>Konfigurasi format nomor resmi dan verifikasi keabsahan dokumen SDIT AT-TAQWIM.</small>
              </div>
            </div>
            <div className="st-section-card__body">
              <div className="st-summary-grid">
                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <ReceiptText size={15} />
                    <h4>Format Kuitansi Kasir</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong style={{ fontFamily: "monospace" }}>KW-YYYYMM-XXXX</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Dihasilkan otomatis saat pembayaran diverifikasi
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <BadgeCheck size={15} />
                    <h4>Nomor Peserta Ujian</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong style={{ fontFamily: "monospace" }}>[UJN][TH]-[KLS]-[NO]</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Urut otomatis alfabetis per kelas santri
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <ShieldCheck size={15} />
                    <h4>Validasi Kartu QR</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong>QR Code Terenkripsi</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Terhubung langsung ke status kelayakan server
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: MANAJEMEN PENGGUNA */}
      {activeTab === "pengguna" && (
        <div className="st-tab-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {can("users") ? (
            <>
              {/* Summary Metrics */}
              <div className="st-summary-grid">
                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <Users size={15} />
                    <h4>Total Pengguna Sistem</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong style={{ fontSize: 20 }}>{users.length}</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Akun terdaftar dalam database
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <CheckCircle2 size={15} />
                    <h4>Pengguna Aktif</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong style={{ fontSize: 20, color: "#16613e" }}>
                      {users.filter((u) => u.active).length}
                    </strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Dapat login dan beraktivitas
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <ShieldAlert size={15} />
                    <h4>Pengguna Nonaktif</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong style={{ fontSize: 20, color: "#64748b" }}>
                      {users.filter((u) => !u.active).length}
                    </strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Akses login dibekukan
                    </small>
                  </div>
                </div>
              </div>

              {/* Filter Strip */}
              <div className="st-filter-card">
                <div className="st-search-box">
                  <Search size={18} className="st-search-icon" />
                  <input
                    type="text"
                    className="st-search-input"
                    placeholder="Cari pengguna berdasarkan nama atau email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                  {searchUser && (
                    <button
                      type="button"
                      className="st-search-clear"
                      onClick={() => setSearchUser("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <select
                    className="st-select"
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
                    }
                  >
                    <option value="ALL">Semua Status Akun</option>
                    <option value="ACTIVE">Hanya Pengguna Aktif</option>
                    <option value="INACTIVE">Hanya Pengguna Nonaktif</option>
                  </select>

                  <button
                    type="button"
                    className="st-btn-primary"
                    onClick={handleCreateUser}
                  >
                    <UserPlus size={16} />
                    <span>Buat Akun</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="st-table-card">
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h2
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#16613e",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      margin: 0,
                    }}
                  >
                    <Users size={18} />
                    Daftar Pengguna Sistem SDIT AT-TAQWIM
                  </h2>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Menampilkan {filteredUsers.length} dari {users.length} akun
                  </span>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="st-empty-state">
                    <Users size={48} className="st-empty-icon" />
                    <h3>Tidak ada pengguna ditemukan</h3>
                    <p>Coba ubah kata kunci pencarian atau filter status pengguna.</p>
                  </div>
                ) : (
                  <div className="st-table-responsive">
                    <table className="st-table">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>No</th>
                          <th>Pengguna</th>
                          <th>Alamat Email</th>
                          <th>Status Akun</th>
                          <th>ID Pengguna</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, idx) => {
                          const initials = u.name
                            ? u.name
                                .trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                            : "U";
                          return (
                            <tr key={u.id} className="st-table-row">
                              <td className="st-col-idx">{idx + 1}</td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: "50%",
                                      background: "#e8f2ec",
                                      color: "#176442",
                                      fontWeight: 700,
                                      fontSize: 12,
                                      display: "grid",
                                      placeItems: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {initials}
                                  </div>
                                  <strong className="st-user-name">{u.name}</strong>
                                </div>
                              </td>
                              <td>{u.email}</td>
                              <td>
                                <span
                                  className={`st-status-pill ${
                                    u.active ? "active" : "inactive"
                                  }`}
                                >
                                  <span className="st-status-dot" />
                                  {u.active ? "Aktif" : "Nonaktif"}
                                </span>
                              </td>
                              <td>
                                <span className="st-copy-row">
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: 11,
                                      color: "#64748b",
                                    }}
                                  >
                                    {u.id.slice(0, 8)}…
                                  </span>
                                  <CopyButton value={u.id} title="Salin ID" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Restricted Guidance for Non-Super Admin Users (e.g. TU_KEUANGAN) */
            <div className="st-section-card">
              <div className="st-section-card__header">
                <ShieldAlert size={18} className="st-card-icon" style={{ color: "#a0732b" }} />
                <div>
                  <h3>Manajemen Pengguna Dikelola Terpusat</h3>
                  <small>Kebijakan otorisasi pembagian hak akses pengguna SDIT AT-TAQWIM.</small>
                </div>
              </div>
              <div className="st-section-card__body">
                <div
                  style={{
                    padding: "16px 20px",
                    borderRadius: 8,
                    background: "#fbf2df",
                    border: "1px solid #f4e3c3",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <Lock size={22} style={{ color: "#a0732b", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h4
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#784f17",
                      }}
                    >
                      Akses Direktori Pengguna Dibatasi
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        color: "#5f4015",
                        lineHeight: 1.5,
                      }}
                    >
                      Akun Anda saat ini masuk dengan peran{" "}
                      <strong>{getRoleLabel(primaryRole)}</strong>. Demi menegakkan prinsip
                      tata kelola dan kepatuhan sistem keamanan (RBAC), pembuatan akun baru,
                      penonaktifan pengguna, dan pembagian hak akses dikhususkan untuk{" "}
                      <strong>Administrator Sistem (SUPER_ADMIN)</strong>.
                    </p>
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#283b34",
                    marginBottom: 12,
                  }}
                >
                  Struktur Peran & Otoritas Sistem SDIT AT-TAQWIM:
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#fafcfb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span className="st-badge st-badge-blue">SUPER_ADMIN</span>
                      <strong style={{ fontSize: 12.5 }}>Administrator Sistem</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                      Memiliki wewenang penuh atas seluruh modul, konfigurasi sekolah, manajemen
                      pengguna, dan audit trail sistem.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#fafcfb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span className="st-badge st-badge-green">TU_KEUANGAN</span>
                      <strong style={{ fontSize: 12.5 }}>Tata Usaha & Keuangan</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                      Mengelola direktori santri, rombel kelas, penerbitan tagihan SPP, kasir tunai,
                      verifikasi bukti transfer, dan reminder WhatsApp.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#fafcfb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span className="st-badge st-badge-amber">KEPALA_SEKOLAH</span>
                      <strong style={{ fontSize: 12.5 }}>Kepala Sekolah</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                      Mengevaluasi kelayakan ujian santri dan memiliki otoritas tunggal untuk
                      memberikan dispensasi ujian bersyarat.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#fafcfb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span className="st-badge st-badge-slate">WALI_MURID</span>
                      <strong style={{ fontSize: 12.5 }}>Portal Orang Tua</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                      Akses portal mandiri khusus untuk santri binaan: memantau tunggakan SPP, unggah
                      bukti transfer, dan unduh kartu ujian digital.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 14px",
                    borderRadius: 6,
                    background: "#f8faf9",
                    border: "1px solid #e1e7e3",
                    fontSize: 12,
                    color: "#5c6c63",
                  }}
                >
                  💡 <em>Butuh akun baru atau reset kredensial pengguna lain?</em> Silakan berkoordinasi
                  langsung dengan Administrator Sistem SDIT AT-TAQWIM.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: STATUS SERVER & KEBIJAKAN */}
      {activeTab === "sistem" && (
        <div className="st-tab-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="st-section-card">
            <div className="st-section-card__header">
              <Server size={18} className="st-card-icon" />
              <div>
                <h3>Infrastruktur & Lingkungan Teknis</h3>
                <small>Spesifikasi platform dan arsitektur sistem SDIT AT-TAQWIM.</small>
              </div>
            </div>
            <div className="st-section-card__body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                }}
              >
                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <Server size={15} />
                    <h4>Framework & Runtime</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong>Next.js 15 · React 19</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Serverless Node.js Environment
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <Database size={15} />
                    <h4>Database Relasional</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong>PostgreSQL (Neon)</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Drizzle ORM Engine · Type-Safe SQL
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <HardDrive size={15} />
                    <h4>Penyimpanan Berkas</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong>Private Vercel Blob</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      Upload Bukti Bayar (Maks 5 MB)
                    </small>
                  </div>
                </div>

                <div className="st-summary-box">
                  <div className="st-summary-box__top">
                    <Clock size={15} />
                    <h4>Zona Waktu Operasional</h4>
                  </div>
                  <div className="st-summary-box__content">
                    <strong>Asia/Jakarta (WIB)</strong>
                    <small style={{ color: "#798a80", fontSize: 11 }}>
                      UTC+07:00 · Waktu Indonesia Barat
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="st-section-card">
            <div className="st-section-card__header">
              <FileCheck2 size={18} className="st-card-icon" />
              <div>
                <h3>Prinsip Integritas Keuangan & Syarat Ujian</h3>
                <small>Pedoman aturan bisnis inti yang ditegakkan secara deterministik oleh server.</small>
              </div>
            </div>
            <div className="st-section-card__body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: "1px solid #d1ebd8",
                    background: "#fbfdfb",
                  }}
                >
                  <strong style={{ fontSize: 13, color: "#1e3629", display: "block", marginBottom: 4 }}>
                    1. Evaluasi 3 Syarat Kelayakan Ujian
                  </strong>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#5c6c63", lineHeight: 1.45 }}>
                    Siswa berstatus <code>ELIGIBLE</code> hanya jika: (a) SPP lunas s/d bulan ujian,
                    (b) bebas tunggakan tahun ajaran lampau, dan (c) formulir karakteristik telah diisi
                    100%.
                  </p>
                </div>

                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: "1px solid #d1ebd8",
                    background: "#fbfdfb",
                  }}
                >
                  <strong style={{ fontSize: 13, color: "#1e3629", display: "block", marginBottom: 4 }}>
                    2. Kebijakan Dispensasi Ujian
                  </strong>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#5c6c63", lineHeight: 1.45 }}>
                    Dispensasi hanya dapat disetujui oleh Kepala Sekolah dengan tanggal janji bayar
                    (promise date). Dispensasi tidak memutihkan hutang, namun meloloskan kartu ujian.
                  </p>
                </div>

                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: "1px solid #d1ebd8",
                    background: "#fbfdfb",
                  }}
                >
                  <strong style={{ fontSize: 13, color: "#1e3629", display: "block", marginBottom: 4 }}>
                    3. Immutability Tagihan SPP
                  </strong>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#5c6c63", lineHeight: 1.45 }}>
                    Penyesuaian master tarif SPP di masa depan tidak akan mengubah nilai nominal
                    invoice yang telah diterbitkan pada bulan-bulan sebelumnya.
                  </p>
                </div>

                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: "1px solid #d1ebd8",
                    background: "#fbfdfb",
                  }}
                >
                  <strong style={{ fontSize: 13, color: "#1e3629", display: "block", marginBottom: 4 }}>
                    4. Perlindungan Anti-IDOR Wali
                  </strong>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#5c6c63", lineHeight: 1.45 }}>
                    Pengguna peran WALI_MURID diisolasi secara ketat di sisi server (query scoping),
                    hanya dapat melihat data santri yang terhubung di tabel relasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
