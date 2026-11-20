"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Wallet,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { CopyButton } from "@/src/components/CopyButton";
import { Modal } from "@/src/components/Modal";
import {
  PaymentModal,
  WhatsAppReminderModal,
} from "@/src/components/modals";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type Student = AppState["students"][number];

export default function MasterSiswaPage() {
  const router = useRouter();
  const { state, loading, busy, run, can, isGuardian } = useApp();

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");

  // Modals state
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);
  const [reminderStudent, setReminderStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const students = state?.students || [];
  const classes = state?.classes || [];
  const academicYears = state?.academicYears || [];

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Filter by class
      if (selectedClass !== "ALL" && s.classId !== selectedClass) {
        return false;
      }
      // Filter by status
      if (statusFilter === "ACTIVE" && !s.active) return false;
      if (statusFilter === "INACTIVE" && s.active) return false;

      // Filter by search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNis = s.nis.toLowerCase().includes(q);
        const matchNisn = s.nisn?.toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchNisn) return false;
      }

      return true;
    });
  }, [students, selectedClass, statusFilter, search]);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    await run(
      () => api(`students/${studentToDelete.id}`, "DELETE"),
      `Data siswa ${studentToDelete.name} berhasil dihapus`,
    );
    setStudentToDelete(null);
  };

  const activeCount = useMemo(
    () => students.filter((s) => s.active).length,
    [students],
  );
  const inactiveCount = useMemo(
    () => students.filter((s) => !s.active).length,
    [students],
  );

  return (
    <div className="st-page-shell">
      {/* Top Banner / Header */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <Users size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Master Data</span>
              <span>/</span>
              <span>Data Siswa</span>
            </div>
            <h1 className="st-title">Data Siswa / Santri</h1>
            <p className="st-subtitle">
              Kelola direktori siswa, administrasi identitas NIS/NISN, data wali, dan status aktif SDIT AT-TAQWIM.
            </p>
          </div>
        </div>

        {can("master") && (
          <div className="st-header-actions">
            <Link href="/master/siswa/tambah" className="st-btn-primary">
              <UserPlus size={18} />
              <span>Tambah Siswa Baru</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Metrics Strip */}
      <div className="st-filter-card">
        <div className="st-search-box">
          <Search size={18} className="st-search-icon" />
          <input
            type="text"
            className="st-search-input"
            placeholder="Cari berdasarkan nama lengkap, NIS, atau NISN..."
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

        <div className="st-filter-group">
          <div className="st-select-wrapper">
            <Filter size={16} className="st-select-icon" />
            <select
              className="st-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              aria-label="Filter Rombongan Belajar"
            >
              <option value="ALL">Semua Kelas ({classes.length} Rombel)</option>
              {classes.map((c) => {
                const year = academicYears.find((y) => y.id === c.academicYearId);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {year ? `(${year.name})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="st-tabs-filter">
            <button
              type="button"
              className={`st-tab-btn ${statusFilter === "ACTIVE" ? "active" : ""}`}
              onClick={() => setStatusFilter("ACTIVE")}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              className={`st-tab-btn ${statusFilter === "INACTIVE" ? "active" : ""}`}
              onClick={() => setStatusFilter("INACTIVE")}
            >
              Nonaktif ({inactiveCount})
            </button>
            <button
              type="button"
              className={`st-tab-btn ${statusFilter === "ALL" ? "active" : ""}`}
              onClick={() => setStatusFilter("ALL")}
            >
              Semua ({students.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="st-table-card">
        {loading && (
          <div className="st-table-loading">
            <div className="st-spinner" />
            <p>Memuat data siswa...</p>
          </div>
        )}

        {!loading && filteredStudents.length === 0 && (
          <div className="st-empty-state">
            <Users size={48} className="st-empty-icon" />
            <h3>Tidak ada data siswa ditemukan</h3>
            <p>
              {search || selectedClass !== "ALL" || statusFilter !== "ALL"
                ? "Coba ubah kata kunci pencarian atau sesuaikan filter kelas/status di atas."
                : "Belum ada data siswa yang tersimpan di sistem."}
            </p>
            {can("master") && (
              <Link href="/master/siswa/tambah" className="st-btn-secondary" style={{ marginTop: 12 }}>
                <UserPlus size={16} />
                <span>Tambah Siswa Sekarang</span>
              </Link>
            )}
          </div>
        )}

        {!loading && filteredStudents.length > 0 && (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Siswa / Santri</th>
                  <th>NIS & NISN</th>
                  <th>Kelas & Tahun Ajaran</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right", minWidth: 200 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => {
                  const classItem = classes.find((c) => c.id === s.classId);
                  const academicYear = academicYears.find(
                    (y) => y.id === classItem?.academicYearId,
                  );

                  return (
                    <tr key={s.id} className="st-table-row">
                      <td className="st-col-idx">{idx + 1}</td>
                      <td className="st-col-name">
                        <div className="st-user-cell">
                          {s.photoUrl ? (
                            <img
                              src={s.photoUrl}
                              alt={s.name}
                              className="st-user-avatar-img"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="st-user-avatar-placeholder">
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="st-user-info">
                            <span className="st-user-name">{s.name}</span>
                            <div className="st-user-badges">
                              {s.gender && (
                                <span className={`st-badge-gender ${s.gender === "L" ? "male" : "female"}`}>
                                  {s.gender === "L" ? "Laki-laki (L)" : "Perempuan (P)"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="st-ident-cell">
                          <div className="st-ident-row">
                            <span className="st-ident-label">NIS:</span>
                            <code className="st-ident-code">{s.nis}</code>
                            <CopyButton value={s.nis} title="Salin NIS" />
                          </div>
                          <div className="st-ident-row">
                            <span className="st-ident-label">NISN:</span>
                            {s.nisn ? (
                              <>
                                <code className="st-ident-code">{s.nisn}</code>
                                <CopyButton value={s.nisn} title="Salin NISN" />
                              </>
                            ) : (
                              <span className="st-ident-empty">—</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="st-class-cell">
                          <strong className="st-class-name">
                            {classItem?.name || "Belum ada kelas"}
                          </strong>
                          <span className="st-class-year">
                            TA {academicYear?.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`st-status-pill ${s.active ? "active" : "inactive"}`}>
                          <span className="st-status-dot" />
                          {s.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="st-action-row">
                          <button
                            type="button"
                            className="st-btn-action detail"
                            onClick={() => router.push(`/master/siswa/${s.id}`)}
                            title="Buka Halaman Detail Siswa 360°"
                          >
                            <Eye size={15} />
                            <span>Detail</span>
                          </button>

                          {can("master") && (
                            <button
                              type="button"
                              className="st-btn-action edit"
                              onClick={() => router.push(`/master/siswa/${s.id}/ubah`)}
                              title="Ubah Data Siswa"
                            >
                              <Pencil size={15} />
                              <span>Ubah</span>
                            </button>
                          )}

                          {(can("finance") || isGuardian) && (
                            <button
                              type="button"
                              className="st-btn-action pay"
                              onClick={() => setPaymentStudentId(s.id)}
                              title="Catat Pembayaran SPP"
                            >
                              <Wallet size={15} />
                              <span>Bayar</span>
                            </button>
                          )}

                          {can("finance") && (
                            <button
                              type="button"
                              className="st-btn-action wa"
                              onClick={() => setReminderStudent(s)}
                              title="Kirim Pengingat Tagihan SPP WhatsApp"
                            >
                              <MessageSquare size={15} />
                              <span>WA</span>
                            </button>
                          )}

                          {can("master") && (
                            <button
                              type="button"
                              className="st-btn-action delete"
                              onClick={() => setStudentToDelete(s)}
                              title="Hapus Siswa"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <Modal
          title="Konfirmasi Hapus Siswa"
          close={() => !busy && setStudentToDelete(null)}
        >
          <div className="st-delete-modal-body">
            <p>
              Apakah Anda yakin ingin menghapus data siswa{" "}
              <strong>{studentToDelete.name}</strong> (NIS: {studentToDelete.nis})?
            </p>
            <div className="notice amber" style={{ marginTop: 12 }}>
              Data siswa yang telah memiliki transaksi keuangan (invoice/pembayaran) atau evaluasi ujian tidak dapat dihapus untuk menjaga integritas audit.
            </div>
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={() => setStudentToDelete(null)}
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

      {/* Payment Modal */}
      {paymentStudentId && state && (
        <PaymentModal
          data={state}
          initialStudent={paymentStudentId}
          close={() => setPaymentStudentId(null)}
          saved={async () => {
            await run(async () => {}, "Pembayaran tersimpan");
          }}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      {reminderStudent && state && (
        <WhatsAppReminderModal
          student={reminderStudent}
          data={state}
          exam={state.exams[0]}
          close={() => setReminderStudent(null)}
        />
      )}
    </div>
  );
}
