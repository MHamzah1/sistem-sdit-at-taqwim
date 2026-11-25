"use client";

import React, { useState } from "react";
import {
  ContactRound,
  UserPlus,
  Link as LinkIcon,
  Phone,
  Pencil,
  Trash2,
  Unlink,
  Search,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Panel } from "@/src/components/Panel";
import { Modal } from "@/src/components/Modal";
import { DataForm, type Field, type Values, type FormSpec } from "@/src/components/DataForm";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type Guardian = AppState["guardians"][number];

export default function MasterWaliPage() {
  const { state, loading, busy, run, save, can, studentName } = useApp();

  const [search, setSearch] = useState("");
  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);
  const [guardianToDelete, setGuardianToDelete] = useState<Guardian | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat data wali murid...</p>
        </div>
      </div>
    );
  }

  const guardians = state.guardians;
  const guardianStudents = state.guardianStudents;
  const users = state.users;

  const filteredGuardians = guardians.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchName = g.name.toLowerCase().includes(q);
    const matchPhone = g.phone.includes(q);
    return matchName || matchPhone;
  });

  const guardianFields: Field[] = [
    { key: "name", label: "Nama Lengkap Wali Murid" },
    { key: "phone", label: "Nomor WhatsApp (contoh: 08123456789)" },
    ...(can("users")
      ? [
          {
            key: "userId",
            label: "Tautkan Akun Login (Opsional)",
            options: users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })),
            required: false,
          },
        ]
      : []),
  ];

  const handleAddGuardian = () => {
    setFormConfig({
      title: "Tambah Wali Murid",
      fields: guardianFields,
      submit: async (values) => {
        await save("guardians", {
          ...values,
          ...(can("users") ? { userId: values.userId || null } : {}),
        });
        setFormConfig(null);
      },
    });
  };

  const handleEditGuardian = (g: Guardian) => {
    setFormConfig({
      title: "Ubah Data Wali Murid",
      fields: guardianFields,
      initial: {
        name: g.name,
        phone: g.phone,
        userId: g.userId || "",
      },
      submit: async (values) => {
        await save(
          "guardians",
          {
            ...values,
            ...(can("users") ? { userId: values.userId || null } : {}),
          },
          g.id,
        );
        setFormConfig(null);
      },
    });
  };

  const handleConnect = () => {
    setFormConfig({
      title: "Hubungkan Wali & Siswa",
      fields: [
        {
          key: "guardianId",
          label: "Pilih Wali Murid",
          options: guardians.map((g) => ({
            value: g.id,
            label: `${g.name} (${g.phone})`,
          })),
        },
        {
          key: "studentId",
          label: "Pilih Siswa",
          options: state.students.map((s) => ({
            value: s.id,
            label: `${s.name} (${s.nis})`,
          })),
        },
      ],
      submit: async (values) => {
        await save("guardian-students", values);
        setFormConfig(null);
      },
    });
  };

  const handleDisconnect = async (guardianId: string, studentId: string) => {
    if (confirm("Lepas akses wali ini dari data siswa?")) {
      try {
        await run(
          () =>
            api("guardian-students", "DELETE", {
              guardianId,
              studentId,
            }),
          "Relasi wali dan siswa dilepas",
        );
      } catch {
        // Pesan error ditampilkan oleh AppContext
      }
    }
  };

  const handleDeleteGuardian = async () => {
    if (!guardianToDelete) return;
    try {
      await run(
        () => api(`guardians/${guardianToDelete.id}`, "DELETE"),
        `Data wali ${guardianToDelete.name} berhasil dihapus`,
      );
    } catch {
      // Pesan error ditampilkan oleh AppContext
    } finally {
      setGuardianToDelete(null);
    }
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <ContactRound size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Master Data</span>
              <span>/</span>
              <span>Wali Murid</span>
            </div>
            <h1 className="st-title">Data Wali Murid</h1>
            <p className="st-subtitle">
              Kelola nomor WhatsApp, keterhubungan akun portal wali, serta relasi santri terdaftar.
            </p>
          </div>
        </div>

        {can("master") && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-secondary"
              onClick={handleConnect}
            >
              <LinkIcon size={16} />
              <span>Hubungkan Siswa</span>
            </button>
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleAddGuardian}
            >
              <UserPlus size={16} />
              <span>Tambah Wali</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="st-filter-card">
        <div className="st-search-box">
          <Search size={18} className="st-search-icon" />
          <input
            type="text"
            className="st-search-input"
            placeholder="Cari berdasarkan nama wali atau nomor WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="st-search-clear"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        {filteredGuardians.length === 0 ? (
          <div className="st-empty-state">
            <ContactRound size={48} className="st-empty-icon" />
            <h3>Tidak ada data wali murid</h3>
            <p>
              {search
                ? "Tidak ada wali murid yang cocok dengan pencarian Anda."
                : "Belum ada wali murid yang tersimpan."}
            </p>
          </div>
        ) : (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Wali Murid</th>
                  <th>Nomor WhatsApp</th>
                  <th>Akun Login</th>
                  <th>Siswa Terhubung</th>
                  {can("master") && (
                    <th style={{ textAlign: "right", minWidth: 140 }}>Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredGuardians.map((g, idx) => {
                  const linkedStudents = guardianStudents.filter(
                    (l) => l.guardianId === g.id,
                  );
                  const linkedUser = users.find((u) => u.id === g.userId);

                  return (
                    <tr key={g.id} className="st-table-row">
                      <td className="st-col-idx">{idx + 1}</td>
                      <td>
                        <strong className="st-user-name">{g.name}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Phone size={14} style={{ color: "#16613e" }} />
                          <span style={{ fontFamily: "monospace", fontSize: 13 }}>
                            {g.phone}
                          </span>
                        </div>
                      </td>
                      <td>
                        {linkedUser ? (
                          <span className="st-badge-gender male">
                            {linkedUser.email}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>
                            Belum ada akun
                          </span>
                        )}
                      </td>
                      <td>
                        {linkedStudents.length === 0 ? (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>
                            Belum ada siswa terhubung
                          </span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {linkedStudents.map((l) => (
                              <div
                                key={l.studentId}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  fontSize: 12,
                                  background: "#f1f5f9",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                }}
                              >
                                <span>{studentName(l.studentId)}</span>
                                {can("master") && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDisconnect(g.id, l.studentId)
                                    }
                                    style={{
                                      border: "none",
                                      background: "none",
                                      cursor: "pointer",
                                      color: "#ef4444",
                                      padding: 0,
                                    }}
                                    title="Lepas relasi dengan siswa ini"
                                  >
                                    <Unlink size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      {can("master") && (
                        <td style={{ textAlign: "right" }}>
                          <div className="st-action-row">
                            <button
                              type="button"
                              className="st-btn-action edit"
                              onClick={() => handleEditGuardian(g)}
                              title="Ubah Data Wali"
                            >
                              <Pencil size={15} />
                              <span>Ubah</span>
                            </button>
                            <button
                              type="button"
                              className="st-btn-action delete"
                              onClick={() => setGuardianToDelete(g)}
                              title="Hapus Wali"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
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

      {/* Delete Confirmation Modal */}
      {guardianToDelete && (
        <Modal
          title="Konfirmasi Hapus Wali"
          close={() => !busy && setGuardianToDelete(null)}
        >
          <div className="st-delete-modal-body">
            <p>
              Apakah Anda yakin ingin menghapus wali murid{" "}
              <strong>{guardianToDelete.name}</strong> ({guardianToDelete.phone})?
            </p>
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={() => setGuardianToDelete(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => void handleDeleteGuardian()}
              >
                {busy ? "Menghapus..." : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
