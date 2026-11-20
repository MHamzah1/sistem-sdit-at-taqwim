"use client";

import React, { useState } from "react";
import {
  Settings,
  KeyRound,
  School,
  UserPlus,
  Users,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

export default function SystemConfigurationPage() {
  const { state, loading, busy, save, run, can, actor, setToast, refresh } =
    useApp();

  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);

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

  const users = state.users;
  const settings = state.settings;

  const handleChangePassword = () => {
    setFormConfig({
      title: "Ubah Kata Sandi Akun",
      note: "Minimal 12 karakter. Demi keamanan, seluruh sesi login aktif akan dikeluarkan setelah kata sandi berhasil diperbarui.",
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
    const schoolSetting = settings.find((s) => s.key === "school")?.value as
      | Record<string, string>
      | undefined;

    setFormConfig({
      title: "Ubah Identitas Sekolah",
      fields: [
        {
          key: "schoolName",
          label: "Nama Lembaga / Sekolah",
          defaultValue: schoolSetting?.schoolName || "SDIT AT-TAQWIM",
        },
        {
          key: "phone",
          label: "Nomor WhatsApp Sekolah (Hotline TU)",
          defaultValue: schoolSetting?.phone || "",
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
      note: "Untuk akun peran WALI_MURID, pastikan menghubungkan akun ke data wali melalui menu Master Wali Murid.",
      fields: [
        { key: "name", label: "Nama Lengkap Pengguna" },
        { key: "email", label: "Alamat Email (Username Login)", type: "email" },
        {
          key: "password",
          label: "Kata Sandi Awal (Minimal 12 Karakter)",
          type: "password",
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
      {/* Top Banner */}
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
              Konfigurasi keamanan akun, identitas sekolah, dan pengelolaan manajemen hak akses pengguna.
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

      {/* Account Info Box */}
      <div className="st-section-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px 0", color: "#16613e" }}>
          Informasi Akun Anda
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, fontSize: 13 }}>
          <div>
            <span style={{ color: "#64748b", display: "block" }}>Nama Pengguna:</span>
            <strong>{actor?.name}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block" }}>Email:</span>
            <strong>{actor?.email}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block" }}>Peran / Otoritas:</span>
            <strong className="st-badge-gender male">{actor?.roles?.join(", ") || "—"}</strong>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {can("users") && (
        <div className="st-table-card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#16613e", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <Users size={18} />
              Daftar Pengguna Sistem
            </h2>
          </div>
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Pengguna</th>
                  <th>Alamat Email</th>
                  <th>Status Akun</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} className="st-table-row">
                    <td className="st-col-idx">{idx + 1}</td>
                    <td>
                      <strong className="st-user-name">{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`st-status-pill ${u.active ? "active" : "inactive"}`}>
                        <span className="st-status-dot" />
                        {u.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
