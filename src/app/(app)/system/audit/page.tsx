"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { api } from "@/src/lib/api";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  createdAt: string;
  before: unknown;
  after: unknown;
}

export default function AuditLogPage() {
  const { can, state } = useApp();

  const [rows, setRows] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!can("audit")) return;
    setLoading(true);
    setError("");
    api<AuditLog[]>(`audit-logs?page=${page}`)
      .then((data) => {
        setRows(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat log audit");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, can]);

  if (!can("audit")) {
    return (
      <div className="st-page-shell">
        <div className="notice amber">
          <ShieldAlert size={20} />
          <span>Anda tidak memiliki hak otorisasi untuk mengakses Audit Log sistem.</span>
        </div>
      </div>
    );
  }

  const getUserName = (userId: string) => {
    return state?.users.find((u) => u.id === userId)?.name || userId;
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <ClipboardList size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Sistem</span>
              <span>/</span>
              <span>Audit Log</span>
            </div>
            <h1 className="st-title">Audit Trail & Riwayat Aktivitas</h1>
            <p className="st-subtitle">
              Pencatatan jejak rekam transaksi finansial, persetujuan dispensasi, dan mutasi data SDIT AT-TAQWIM.
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        {loading && (
          <div className="st-table-loading">
            <div className="st-spinner" />
            <p>Memuat riwayat audit trail...</p>
          </div>
        )}

        {error && (
          <div className="notice red" style={{ margin: 16 }}>
            {error}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="st-empty-state">
            <ClipboardList size={48} className="st-empty-icon" />
            <h3>Belum ada catatan audit</h3>
            <p>Aktivitas penambahan atau pengubahan data akan terekam secara otomatis di sini.</p>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>Waktu Transaksi</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Entitas</th>
                  <th>ID Objek</th>
                  <th>Detail Perubahan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="st-table-row">
                    <td>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>
                        {row.createdAt.replace("T", " ").slice(0, 19)}
                      </span>
                    </td>
                    <td>
                      <strong>{getUserName(row.userId)}</strong>
                    </td>
                    <td>
                      <span className={`st-badge-gender ${row.action === "DELETE" ? "female" : "male"}`}>
                        {row.action}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: 12 }}>{row.entity}</code>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>
                        {row.entityId.slice(0, 8)}…
                      </span>
                    </td>
                    <td>
                      <details style={{ fontSize: 11, cursor: "pointer" }}>
                        <summary style={{ color: "#16613e", fontWeight: 600 }}>
                          Lihat Payload JSON
                        </summary>
                        <pre style={{ margin: "6px 0 0 0", padding: 8, background: "#f8fafc", borderRadius: 4, overflowX: "auto" }}>
                          {JSON.stringify({ before: row.before, after: row.after }, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Strip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #e2e8f0" }}>
          <button
            type="button"
            className="st-btn-secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
            <span>Sebelumnya</span>
          </button>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
            Halaman {page}
          </span>
          <button
            type="button"
            className="st-btn-secondary"
            disabled={rows.length < 20 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <span>Selanjutnya</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
