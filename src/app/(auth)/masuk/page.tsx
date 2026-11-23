"use client";

import React, { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import {
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  X,
  Loader2,
  MessageCircle,
} from "lucide-react";

interface QuickRole {
  label: string;
  roleTitle: string;
  email: string;
  pass: string;
}

const QUICK_ROLES: QuickRole[] = [
  {
    label: "Admin",
    roleTitle: "Super Admin",
    email: "admin@attaqwim.sch.id",
    pass: "admin12345678",
  },
  {
    label: "Tata Usaha",
    roleTitle: "TU & Keuangan",
    email: "tu@attaqwim.sch.id",
    pass: "tu12345678",
  },
  {
    label: "Kepsek",
    roleTitle: "Kepala Sekolah",
    email: "kepsek@attaqwim.sch.id",
    pass: "kepsek12345678",
  },
  {
    label: "Wali Murid",
    roleTitle: "Orang Tua / Wali",
    email: "wali@attaqwim.sch.id",
    pass: "wali12345678",
  },
];

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const togglePasswordVisibility = () => {
    const input = passwordInputRef.current;
    const caret = input?.selectionStart ?? null;

    setShowPassword((prev) => !prev);

    requestAnimationFrame(() => {
      if (!input) return;
      input.focus();
      if (caret !== null) {
        try {
          input.setSelectionRange(caret, caret);
        } catch {
          // Fallback if browser limits selection API
        }
      }
    });
  };

  const handleQuickFill = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await api("auth/login", "POST", { email: email.trim(), password });
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Alamat email atau kata sandi tidak sesuai. Silakan periksa kembali.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-viewport">
      {/* Background ambient decorative glows */}
      <div className="auth-ambient-glow-1" aria-hidden="true" />
      <div className="auth-ambient-glow-2" aria-hidden="true" />
      <div className="auth-lattice-pattern" aria-hidden="true" />

      {/* Main Authentic Card */}
      <div className="auth-card-wrapper">
        {/* Left Side: Brand Showcase & Institutional Identity (Visible on Desktop) */}
        <section className="auth-banner" aria-label="Informasi Sekolah">
          <div className="auth-banner-header">
            <div className="auth-badge-pill">
              <Sparkles size={13} />
              <span>Portal Resmi Akademik &amp; Keuangan</span>
            </div>

            <div className="auth-school-identity">
              <div className="auth-logo-badge">
                <img
                  src="/attachment-0.png"
                  alt="Logo Resmi SDIT AT-TAQWIM"
                  width={52}
                  height={52}
                />
              </div>
              <div>
                <h2 className="auth-school-title">SDIT AT-TAQWIM</h2>
                <p className="auth-school-subtitle">
                  Sekolah Dasar Islam Terpadu • Bandung
                </p>
              </div>
            </div>

            <h3 className="auth-banner-headline">
              Sistem SPP &amp; Kelayakan Ujian Siswa
            </h3>
            <p className="auth-banner-lead">
              Platform administrasi terpadu untuk transparansi pembayaran SPP,
              verifikasi kelayakan ujian, dan penerbitan kartu ujian QR resmi.
            </p>
          </div>

          {/* Core Feature Highlights */}
          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <CreditCard size={18} />
              </div>
              <div className="auth-feature-content">
                <h4>Manajemen SPP Real-time</h4>
                <p>
                  Pencatatan tagihan otomatis, upload bukti transfer bank, dan
                  verifikasi kasir tanpa antre.
                </p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <QrCode size={18} />
              </div>
              <div className="auth-feature-content">
                <h4>Kelayakan Ujian &amp; Kartu QR</h4>
                <p>
                  Evaluasi 3-syarat deterministik serta penerbitan kartu peserta
                  digital ber-QR terverifikasi.
                </p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <ShieldCheck size={18} />
              </div>
              <div className="auth-feature-content">
                <h4>Transparansi &amp; Dispensasi</h4>
                <p>
                  Alur persetujuan resmi Kepala Sekolah dan isolasi data aman
                  khusus bagi Wali Murid.
                </p>
              </div>
            </div>
          </div>

          <div className="auth-banner-footer">
            <ShieldCheck size={16} />
            <span>Enkripsi 256-Bit SSL • Seluruh Data Terlindungi &amp; Aman</span>
          </div>
        </section>

        {/* Right Side: Form Authentication */}
        <section className="auth-form-side" aria-label="Formulir Masuk Akun">
          {/* Mobile Header (Shown on small viewports) */}
          <div className="auth-mobile-header">
            <img
              src="/attachment-0.png"
              alt="Logo SDIT AT-TAQWIM"
              className="auth-mobile-logo"
            />
            <div>
              <strong>SDIT AT-TAQWIM</strong>
              <span>Sistem SPP &amp; Kelayakan Ujian</span>
            </div>
          </div>

          <div className="auth-form-badge">
            <CheckCircle2 size={13} />
            <span>Autentikasi Akun</span>
          </div>

          <h1 className="auth-form-title">Masuk ke Sistem Sekolah</h1>
          <p className="auth-form-subtitle">
            Silakan masukkan alamat email dan kata sandi Anda untuk mengakses
            dashboard.
          </p>

          {/* Error Notification Alert */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={18} />
              <div style={{ flex: 1 }}>{error}</div>
              <button
                type="button"
                className="auth-error-banner-close"
                onClick={() => setError("")}
                aria-label="Tutup pesan error"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field-group">
              <label htmlFor="email" className="auth-label">
                <span>Alamat Email / Akun</span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={17} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  aria-label="Email"
                  placeholder="nama@attaqwim.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="password" className="auth-label">
                <span>Kata Sandi</span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={17} />
                </span>
                <input
                  id="password"
                  name="password"
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input with-toggle"
                  disabled={busy}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={password.length === 0 || busy}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  title={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={busy}
                />
                <span>Ingat akun saya</span>
              </label>

              <button
                type="button"
                className="auth-help-link"
                onClick={() => setShowHelpModal(true)}
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={busy}
              aria-label="Masuk"
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="auth-spin" />
                  <span>Memeriksa Kredensial...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access Testing Chips */}
          <div className="auth-quick-section">
            <div className="auth-quick-title">
              <span className="auth-quick-label">Akses Cepat Pengujian:</span>
            </div>
            <div className="auth-quick-grid">
              {QUICK_ROLES.map((role) => (
                <button
                  key={role.email}
                  type="button"
                  className={`auth-role-chip ${
                    email === role.email ? "active" : ""
                  }`}
                  onClick={() => handleQuickFill(role.email, role.pass)}
                  title={`Gunakan akun demo ${role.roleTitle}`}
                  disabled={busy}
                >
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Support / Help Box */}
          <div className="auth-support-box">
            <div className="auth-support-text">
              <strong>Butuh bantuan login?</strong>
              <div>Hubungi petugas Tata Usaha SDIT AT-TAQWIM via WhatsApp.</div>
            </div>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Tata%20Usaha%20SDIT%20AT-TAQWIM,%20saya%20butuh%20bantuan%20akses%20login%20sistem"
              target="_blank"
              rel="noopener noreferrer"
              className="auth-whatsapp-btn"
            >
              <MessageCircle size={14} />
              <span>WhatsApp TU</span>
            </a>
          </div>
        </section>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="auth-modal-overlay"
          onClick={() => setShowHelpModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="auth-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "#e8f5ee",
                    color: "#16613e",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <HelpCircle size={18} />
                </div>
                <h4 className="auth-modal-title">Bantuan Akses &amp; Akun</h4>
              </div>
              <button
                type="button"
                className="auth-error-banner-close"
                onClick={() => setShowHelpModal(false)}
                aria-label="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              <p style={{ margin: "0 0 10px 0" }}>
                Akun sistem SDIT AT-TAQWIM dikelola terpusat oleh Bagian Tata
                Usaha:
              </p>
              <ul
                style={{
                  paddingLeft: 20,
                  margin: "0 0 14px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <li>
                  <strong>Wali Murid:</strong> Akun diterbitkan otomatis saat
                  pendaftaran siswa baru menggunakan nomor WhatsApp terdaftar.
                </li>
                <li>
                  <strong>Lupa Kata Sandi:</strong> Untuk menjaga keamanan data
                  finansial santri, reset sandi diverifikasi langsung oleh petugas
                  Tata Usaha.
                </li>
                <li>
                  <strong>Jam Pelayanan:</strong> Senin – Jumat, pukul 07.30 –
                  15.00 WIB.
                </li>
              </ul>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="outline"
                onClick={() => setShowHelpModal(false)}
                style={{ fontSize: 13, padding: "8px 16px" }}
              >
                Tutup
              </button>
              <a
                href="https://wa.me/6281234567890?text=Assalamu%27alaikum%20Tata%20Usaha%20SDIT%20AT-TAQWIM,%20saya%20ingin%20mengajukan%20reset%20kata%20sandi%20akun%20sistem."
                target="_blank"
                rel="noopener noreferrer"
                className="auth-whatsapp-btn"
                style={{ fontSize: 13, padding: "8px 16px" }}
              >
                <MessageCircle size={15} />
                <span>Hubungi Tata Usaha</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
