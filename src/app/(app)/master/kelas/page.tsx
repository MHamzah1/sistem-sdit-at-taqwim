"use client";

import React, { useState } from "react";
import {
  School,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Modal } from "@/src/components/Modal";
import { DataForm, type Field, type Values, type FormSpec } from "@/src/components/DataForm";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type ClassItem = AppState["classes"][number];
type AcademicYear = AppState["academicYears"][number];

export default function MasterKelasPage() {
  const { state, loading, busy, run, save, can, yearName } = useApp();

  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{
    type: "academic-years" | "classes";
    id: string;
    name: string;
  } | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat data kelas & tahun ajaran...</p>
        </div>
      </div>
    );
  }

  const classes = state.classes;
  const academicYears = state.academicYears;
  const students = state.students;

  const yearOptions = academicYears.map((y) => ({
    value: y.id,
    label: y.name + (y.active ? " (Aktif)" : ""),
  }));

  const handleAddYear = () => {
    setFormConfig({
      title: "Tambah Tahun Ajaran",
      fields: [
        { key: "name", label: "Nama Tahun Ajaran (contoh: 2026/2027)" },
        { key: "startDate", label: "Tanggal Mulai", type: "date" },
        { key: "endDate", label: "Tanggal Selesai", type: "date" },
        {
          key: "active",
          label: "Tahun Ajaran Aktif",
          type: "checkbox",
          defaultValue: true,
        },
      ],
      submit: async (values) => {
        await save("academic-years", values);
        setFormConfig(null);
      },
    });
  };

  const handleEditYear = (y: AcademicYear) => {
    setFormConfig({
      title: "Ubah Tahun Ajaran",
      fields: [
        { key: "name", label: "Nama Tahun Ajaran" },
        { key: "startDate", label: "Tanggal Mulai", type: "date" },
        { key: "endDate", label: "Tanggal Selesai", type: "date" },
        {
          key: "active",
          label: "Tahun Ajaran Aktif",
          type: "checkbox",
        },
      ],
      initial: {
        name: y.name,
        startDate: y.startDate,
        endDate: y.endDate,
        active: y.active,
      },
      submit: async (values) => {
        await save("academic-years", values, y.id);
        setFormConfig(null);
      },
    });
  };

  const handleAddClass = () => {
    setFormConfig({
      title: "Tambah Rombel / Kelas",
      fields: [
        { key: "name", label: "Nama Kelas (contoh: 1A, 2B, 6A)" },
        {
          key: "academicYearId",
          label: "Tahun Ajaran",
          options: yearOptions,
        },
      ],
      submit: async (values) => {
        await save("classes", values);
        setFormConfig(null);
      },
    });
  };

  const handleEditClass = (c: ClassItem) => {
    setFormConfig({
      title: "Ubah Data Kelas",
      fields: [
        { key: "name", label: "Nama Kelas" },
        {
          key: "academicYearId",
          label: "Tahun Ajaran",
          options: yearOptions,
        },
      ],
      initial: {
        name: c.name,
        academicYearId: c.academicYearId,
      },
      submit: async (values) => {
        await save("classes", values, c.id);
        setFormConfig(null);
      },
    });
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await run(
      () => api(`${itemToDelete.type}/${itemToDelete.id}`, "DELETE"),
      `Data ${itemToDelete.name} berhasil dihapus`,
    );
    setItemToDelete(null);
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <School size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Master Data</span>
              <span>/</span>
              <span>Kelas & Tahun Ajaran</span>
            </div>
            <h1 className="st-title">Kelas & Tahun Ajaran</h1>
            <p className="st-subtitle">
              Konfigurasi periode akademik dan pengelompokan rombongan belajar (rombel) siswa SDIT AT-TAQWIM.
            </p>
          </div>
        </div>

        {can("master") && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-secondary"
              onClick={handleAddYear}
            >
              <CalendarDays size={16} />
              <span>Tambah Tahun Ajaran</span>
            </button>
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleAddClass}
            >
              <Plus size={16} />
              <span>Tambah Kelas</span>
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {/* Section: Tahun Ajaran */}
        <div className="st-table-card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#16613e", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <CalendarDays size={18} />
              Daftar Kalender Tahun Ajaran
            </h2>
          </div>
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Tahun Ajaran</th>
                  <th>Mulai Periode</th>
                  <th>Akhir Periode</th>
                  <th>Status</th>
                  {can("master") && (
                    <th style={{ textAlign: "right", minWidth: 120 }}>Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {academicYears.map((y, idx) => (
                  <tr key={y.id} className="st-table-row">
                    <td className="st-col-idx">{idx + 1}</td>
                    <td>
                      <strong className="st-user-name">{y.name}</strong>
                    </td>
                    <td>{y.startDate}</td>
                    <td>{y.endDate}</td>
                    <td>
                      <span className={`st-status-pill ${y.active ? "active" : "inactive"}`}>
                        <span className="st-status-dot" />
                        {y.active ? "Aktif Berjalan" : "Arsip / Tutup"}
                      </span>
                    </td>
                    {can("master") && (
                      <td style={{ textAlign: "right" }}>
                        <div className="st-action-row">
                          <button
                            type="button"
                            className="st-btn-action edit"
                            onClick={() => handleEditYear(y)}
                            title="Ubah Tahun Ajaran"
                          >
                            <Pencil size={15} />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            className="st-btn-action delete"
                            onClick={() =>
                              setItemToDelete({
                                type: "academic-years",
                                id: y.id,
                                name: y.name,
                              })
                            }
                            title="Hapus Tahun Ajaran"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: Kelas / Rombel */}
        <div className="st-table-card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#16613e", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <School size={18} />
              Daftar Rombongan Belajar (Kelas)
            </h2>
          </div>
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Kelas</th>
                  <th>Tahun Ajaran Terkait</th>
                  <th>Jumlah Siswa</th>
                  {can("master") && (
                    <th style={{ textAlign: "right", minWidth: 120 }}>Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {classes.map((c, idx) => {
                  const studentCount = students.filter(
                    (s) => s.classId === c.id,
                  ).length;

                  return (
                    <tr key={c.id} className="st-table-row">
                      <td className="st-col-idx">{idx + 1}</td>
                      <td>
                        <strong className="st-user-name">{c.name}</strong>
                      </td>
                      <td>
                        <span className="st-class-year">
                          {yearName(c.academicYearId)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Users size={14} style={{ color: "#64748b" }} />
                          <strong>{studentCount}</strong>
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            siswa terdaftar
                          </span>
                        </div>
                      </td>
                      {can("master") && (
                        <td style={{ textAlign: "right" }}>
                          <div className="st-action-row">
                            <button
                              type="button"
                              className="st-btn-action edit"
                              onClick={() => handleEditClass(c)}
                              title="Ubah Kelas"
                            >
                              <Pencil size={15} />
                              <span>Ubah</span>
                            </button>
                            <button
                              type="button"
                              className="st-btn-action delete"
                              onClick={() =>
                                setItemToDelete({
                                  type: "classes",
                                  id: c.id,
                                  name: c.name,
                                })
                              }
                              title="Hapus Kelas"
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
        </div>
      </div>

      {/* Dynamic Form Modal */}
      {formConfig && (
        <DataForm
          spec={formConfig}
          close={() => setFormConfig(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <Modal
          title={`Konfirmasi Hapus ${itemToDelete.type === "academic-years" ? "Tahun Ajaran" : "Kelas"}`}
          close={() => !busy && setItemToDelete(null)}
        >
          <div className="st-delete-modal-body">
            <p>
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{itemToDelete.name}</strong>?
            </p>
            <div className="notice amber" style={{ marginTop: 12 }}>
              Data yang masih terikat dengan siswa, invoice, atau riwayat nilai
              tidak dapat dihapus untuk menjaga integritas transaksi.
            </div>
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={() => setItemToDelete(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => void handleDelete()}
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
