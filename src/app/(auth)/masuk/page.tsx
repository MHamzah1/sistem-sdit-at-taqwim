"use client";

import React, { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import {
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  X,
  Loader2,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  Globe,
} from "lucide-react";

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
    <div className="payoneer-auth-viewport">
      {/* Ambient background glow */}
      <div className="payoneer-ambient-glow" aria-hidden="true" />

      {/* Master 36px Rounded Card */}
      <div className="payoneer-card">
        {/* ===================================================================
            LEFT SECTION: DARK FOREST SECTION + SMARTPHONE 3D MOCKUP
            =================================================================== */}
        <section className="payoneer-left" aria-label="Informasi Sistem">
          {/* Subtle concentric circles in background */}
          <div className="payoneer-circle-accent-1" aria-hidden="true" />
          <div className="payoneer-circle-accent-2" aria-hidden="true" />

          {/* Top Eyebrow Tagline */}
          <div className="payoneer-eyebrow">
            Sistem Informasi SPP &amp; Kelayakan Ujian — Solusi administrasi digital
            terpadu sekolah.
          </div>

          {/* Large Hero Display Title */}
          <h1 className="payoneer-hero-title">
            <span>Kelola SPP &amp;</span>
            <span className="highlight-text">Ujian Siswa</span>
          </h1>

          {/* 3D Tilted Smartphone Mockup Frame */}
          <div className="payoneer-phone-stage" aria-hidden="true">
            <div className="payoneer-phone">
              {/* Dynamic Island */}
              <div className="phone-island">
                <div className="phone-camera-dot" />
              </div>

              {/* Screen Top Header */}
              <div className="phone-screen-header">
                <span>SDIT AT-TAQWIM</span>
                <span className="phone-screen-badge">T.A 2026/2027</span>
              </div>

              {/* Main Balance Card */}
              <div className="phone-balance-card">
                <div className="phone-balance-label">
                  <span>Tagihan SPP Aktif</span>
                  <span>LUNAS ✓</span>
                </div>
                <div className="phone-balance-amount">Rp 450.000</div>

                {/* Spark Bar Chart */}
                <div className="phone-chart-bars">
                  <div className="phone-bar" style={{ height: "45%" }} />
                  <div className="phone-bar" style={{ height: "65%" }} />
                  <div className="phone-bar" style={{ height: "55%" }} />
                  <div className="phone-bar" style={{ height: "80%" }} />
                  <div className="phone-bar active" style={{ height: "100%" }} />
                  <div className="phone-bar" style={{ height: "70%" }} />
                </div>
              </div>

              {/* Secondary Feature Tiles */}
              <div className="phone-card-grid">
                <div className="phone-mini-tile">
                  <strong>Kartu Ujian QR</strong>
                  <small>✓ Memenuhi Syarat</small>
                </div>
                <div className="phone-mini-tile">
                  <strong>Dispensasi TU</strong>
                  <small>Tervalidasi</small>
                </div>
              </div>

              {/* Bottom Notch Bar */}
              <div className="phone-bottom-notch" />
            </div>
          </div>

          {/* Left Footer Seal */}
          <div className="payoneer-left-footer">
            <div className="payoneer-left-logo-icon">
              <img
                src="/attachment-0.png"
                alt="Logo SDIT AT-TAQWIM"
                width={20}
                height={20}
              />
            </div>
            <span>SDIT AT-TAQWIM • Enkripsi Keamanan SSL 256-Bit</span>
          </div>
        </section>

        {/* ===================================================================
            RIGHT SECTION: CLEAN WHITE SECTION + PILL-SHAPED FORM
            =================================================================== */}
        <section className="payoneer-right" aria-label="Form Masuk">
          {/* Top Brand Bar */}
          <div className="payoneer-right-top">
            <div className="payoneer-brand-link">
              <img
                src="/attachment-0.png"
                alt="Logo SDIT AT-TAQWIM"
                className="payoneer-brand-emblem"
              />
              <div>
                <span className="payoneer-brand-text">SDIT AT-TAQWIM</span>
                <span className="payoneer-brand-sub">Sistem SPP &amp; Kelayakan Ujian</span>
              </div>
            </div>

            <button
              type="button"
              className="payoneer-top-help"
              onClick={() => setShowHelpModal(true)}
              title="Bantuan masuk ke sistem"
            >
              <HelpCircle size={15} />
              <span>Bantuan</span>
            </button>
          </div>

          {/* Main Form Area */}
          <div className="payoneer-form-area">
            <h2 className="payoneer-title">Masuk ke Sistem</h2>
            <p className="payoneer-subtitle">
              Gunakan email atau akun pengguna Anda untuk mengakses sistem.
            </p>

            {/* Error Notification */}
            {error && (
              <div className="payoneer-error-box" role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  style={{
                    border: "none",
                    background: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: 2,
                  }}
                  aria-label="Tutup error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Field 1: Email / Username (Pill shape) */}
              <div className="payoneer-field">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  aria-label="Email"
                  placeholder="Email atau Nama Pengguna"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="payoneer-input-pill"
                  disabled={busy}
                />
              </div>

              {/* Field 2: Password (Pill shape with Eye Toggle) */}
              <div className="payoneer-field">
                <input
                  id="password"
                  name="password"
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                  placeholder="Kata Sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="payoneer-input-pill with-toggle"
                  disabled={busy}
                />
                <button
                  type="button"
                  className="payoneer-eye-btn"
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

              {/* Helper Row: Remember Me & Forgot Password */}
              <div className="payoneer-helper-row">
                <label className="payoneer-remember-label">
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
                  className="payoneer-forgot-link"
                  onClick={() => setShowHelpModal(true)}
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Pill CTA Submit Button */}
              <button
                type="submit"
                className="payoneer-submit-btn"
                disabled={busy}
                aria-label="Masuk"
              >
                {busy ? (
                  <>
                    <Loader2 size={18} className="auth-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Masuk Sekarang</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Bottom Footer Bar */}
          <div className="payoneer-right-footer">
            <span>© 2026 SDIT AT-TAQWIM. All rights reserved.</span>
            <div className="payoneer-footer-links">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Tata%20Usaha%20SDIT%20AT-TAQWIM,%20saya%20butuh%20bantuan%20akses%20login%20sistem"
                target="_blank"
                rel="noopener noreferrer"
              >
                Kontak TU
              </a>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Globe size={12} />
                <span>Indonesia</span>
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="payoneer-modal-overlay"
          onClick={() => setShowHelpModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="payoneer-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payoneer-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#e8f5ee",
                    color: "#176442",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <HelpCircle size={18} />
                </div>
                <h3 className="payoneer-modal-title">Bantuan Akses &amp; Akun</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  border: "none",
                  background: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 4,
                }}
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
                marginBottom: 22,
              }}
            >
              <p style={{ margin: "0 0 10px 0" }}>
                Pengaturan akun sistem SDIT AT-TAQWIM dikelola terpusat oleh
                Bagian Tata Usaha:
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
                  <strong>Akun Wali Murid:</strong> Terdaftar otomatis saat
                  pendaftaran siswa baru menggunakan nomor WhatsApp terdata.
                </li>
                <li>
                  <strong>Reset Sandi:</strong> Untuk menjaga kerahasiaan data
                  keuangan siswa, reset sandi dapat diverifikasi langsung oleh TU.
                </li>
                <li>
                  <strong>Jam Operasional TU:</strong> Senin – Jumat, pukul 07.30
                  – 15.00 WIB.
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
                className="payoneer-chip"
                onClick={() => setShowHelpModal(false)}
                style={{ fontSize: 13, padding: "8px 16px" }}
              >
                Tutup
              </button>
              <a
                href="https://wa.me/6281234567890?text=Assalamu%27alaikum%20Tata%20Usaha%20SDIT%20AT-TAQWIM,%20saya%20ingin%20mengajukan%20reset%20kata%20sandi%20akun%20sistem."
                target="_blank"
                rel="noopener noreferrer"
                className="payoneer-submit-btn"
                style={{
                  fontSize: 13,
                  padding: "0 18px",
                  height: 40,
                  width: "auto",
                  textDecoration: "none",
                }}
              >
                <MessageCircle size={15} />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
