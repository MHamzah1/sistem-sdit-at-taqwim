"use client";

import React, { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/src/components/Brand";
import { api } from "@/src/lib/api";
import { LogIn, Lock, Mail, AlertCircle } from "lucide-react";

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await api("auth/login", "POST", { email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk ke sistem");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f6f8f7",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 10px 25px -5px rgba(23, 100, 66, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          padding: "36px 32px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-block", marginBottom: 12 }}>
            <Brand />
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#16613e",
              margin: "0 0 6px 0",
            }}
          >
            Masuk ke Sistem Sekolah
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Sistem Informasi SPP & Kelayakan Ujian SDIT AT-TAQWIM
          </p>
        </div>

        {error && (
          <div
            className="notice red"
            style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Alamat Email / Akun
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="nama@sdit-attaqwim.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Kata Sandi
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="st-btn-primary"
            disabled={busy}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontSize: 15,
              marginTop: 8,
            }}
          >
            <LogIn size={18} />
            <span>{busy ? "Memeriksa kredensial..." : "Masuk Sekarang"}</span>
          </button>
        </form>

        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          Lupa kata sandi atau butuh akses akun wali murid? Hubungi petugas Tata Usaha SDIT AT-TAQWIM.
        </div>
      </div>
    </div>
  );
}
