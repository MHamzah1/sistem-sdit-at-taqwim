"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  RefreshCw,
  X,
  FileCheck,
  ChevronRight,
  ArrowRight,
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
import { formatDateIndo } from "@/src/lib/formatters";
import * as XLSX from "xlsx";

type Student = AppState["students"][number];

function calculateCompletenessScore(
  s: Student,
  summaryMap?: Record<string, { percentage: number }>,
): number | null {
  if (summaryMap && summaryMap[s.id]) {
    return summaryMap[s.id].percentage;
  }
  // Authoritative backend engine is the single source of truth; never forge fake 100%
  return null;
}

export default function MasterSiswaPage() {
  const router = useRouter();
  const { state, loading, busy, run, can, isGuardian, refresh } = useApp();

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [completenessFilter, setCompletenessFilter] = useState<"ALL" | "COMPLETE" | "INCOMPLETE">("ALL");

  // Drafts state
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);

  // Change requests state
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [showChangeRequestsModal, setShowChangeRequestsModal] = useState(false);
  const [reviewingReqId, setReviewingReqId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Import wizard state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importCommitResult, setImportCommitResult] = useState<{
    createdCount: number;
    failedCount: number;
  } | null>(null);
  const [importPreviewToken, setImportPreviewToken] = useState<string>("");

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<"FILTERED" | "ALL">("FILTERED");
  const [exportCols, setExportCols] = useState({
    identity: true,
    academic: true,
    parents: true,
  });

  // Action modals
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);
  const [reminderStudent, setReminderStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const students = state?.students || [];
  const classes = state?.classes || [];
  const academicYears = state?.academicYears || [];

  const [completenessSummary, setCompletenessSummary] = useState<
    Record<string, { percentage: number; isComplete: boolean; missingCount: number }>
  >({});

  // Fetch drafts, change requests & completeness summary on mount
  useEffect(() => {
    fetch("/api/student-drafts")
      .then((res) => (res.ok ? res.json() : { drafts: [] }))
      .then((data) => setDrafts(data.drafts || (Array.isArray(data) ? data : [])))
      .catch(() => setDrafts([]));

    fetch("/api/student-profile-change-requests")
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((data) => setChangeRequests(data.requests || (Array.isArray(data) ? data : [])))
      .catch(() => setChangeRequests([]));

    fetch("/api/students/completeness-summary")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setCompletenessSummary(data || {}))
      .catch(() => {});
  }, []);

  const pendingRequests = useMemo(
    () => changeRequests.filter((r) => r.status === "SUBMITTED"),
    [changeRequests],
  );

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Filter by class
      if (selectedClass !== "ALL" && s.classId !== selectedClass) {
        return false;
      }
      // Filter by status
      if (statusFilter === "ACTIVE" && !s.active) return false;
      if (statusFilter === "INACTIVE" && s.active) return false;

      // Filter by completeness
      const comp = completenessSummary[s.id]?.percentage ?? null;
      if (completenessFilter === "COMPLETE" && (comp === null || comp < 100)) return false;
      if (completenessFilter === "INCOMPLETE" && (comp === null || comp >= 100)) return false;

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
  }, [
    students,
    selectedClass,
    statusFilter,
    completenessFilter,
    search,
    completenessSummary,
  ]);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    await run(
      () => api(`students/${studentToDelete.id}`, "DELETE"),
      `Data siswa ${studentToDelete.name} berhasil dihapus`,
    );
    setStudentToDelete(null);
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Hapus draf pendaftaran ini?")) return;
    try {
      const res = await fetch(`/api/student-drafts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (e) {
      alert("Gagal menghapus draf");
    }
  };

  const handleReviewChangeRequest = async (id: string, action: "APPROVED" | "REJECTED") => {
    if (action === "REJECTED" && !reviewNotes.trim()) {
      alert("Alasan penolakan pengajuan wajib diisi");
      return;
    }
    try {
      await api(`student-profile-change-requests/${id}/review`, "POST", {
        approved: action === "APPROVED",
        rejectionReason: action === "REJECTED" ? reviewNotes.trim() : undefined,
      });
      setChangeRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: action, rejectionReason: reviewNotes } : r,
        ),
      );
      setReviewingReqId(null);
      setReviewNotes("");
      alert(`Pengajuan berhasil di-${action === "APPROVED" ? "setujui" : "tolak"}`);
    } catch (err: any) {
      alert(err.message || "Gagal memproses review pengajuan.");
    }
  };

  const activeCount = useMemo(
    () => students.filter((s) => s.active).length,
    [students],
  );
  const inactiveCount = useMemo(
    () => students.filter((s) => !s.active).length,
    [students],
  );
  const completeCount = useMemo(
    () =>
      students.filter((s) => {
        const comp = completenessSummary[s.id]?.percentage ?? null;
        return comp !== null && comp >= 100;
      }).length,
    [students, completenessSummary],
  );
  const incompleteCount = useMemo(
    () => students.length - completeCount,
    [students, completeCount],
  );

  // XLSX & CSV Export handler
  const handleExportCsv = () => {
    const listToExport = exportScope === "FILTERED" ? filteredStudents : students;
    const headers: string[] = [];
    if (exportCols.identity) {
      headers.push("NIS", "NISN", "NAMA_LENGKAP", "JENIS_KELAMIN", "TEMPAT_LAHIR", "TANGGAL_LAHIR");
    }
    if (exportCols.academic) {
      headers.push("KELAS", "STATUS_SISWA");
    }

    const sanitizeCell = (val: string | null | undefined): string => {
      let clean = String(val || "").trim();
      // Formula injection guard
      if (["=", "+", "-", "@", "\t", "\r"].includes(clean.charAt(0))) {
        clean = `'${clean}`;
      }
      return clean;
    };

    const rows = listToExport.map((s) => {
      const row: string[] = [];
      const classItem = classes.find((c) => c.id === s.classId);
      if (exportCols.identity) {
        row.push(
          sanitizeCell(s.nis),
          sanitizeCell(s.nisn || ""),
          sanitizeCell(s.name),
          sanitizeCell(s.gender || ""),
          sanitizeCell(s.birthPlace || ""),
          sanitizeCell(s.birthDate || ""),
        );
      }
      if (exportCols.academic) {
        row.push(
          sanitizeCell(classItem?.name || "Belum ada kelas"),
          sanitizeCell(s.active ? "Aktif" : "Non-Aktif"),
        );
      }
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Data_Siswa");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Data_Siswa_SDIT_At_Taqwim_${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // Download Sample Template XLSX
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      "NIS",
      "NISN",
      "NIK",
      "NO_KK",
      "NAMA_LENGKAP",
      "JENIS_KELAMIN",
      "TEMPAT_LAHIR",
      "TANGGAL_LAHIR",
      "KELAS",
      "NAMA_AYAH",
      "NAMA_IBU",
      "NO_HP_WALI",
      "ALAMAT",
    ];
    const sampleRow = [
      "262701099",
      "0158912345",
      "3201011505180001",
      "3201012001150002",
      "Ahmad Fauzan Al-Baqir",
      "L",
      "Bogor",
      "2018-05-14",
      "1-A Abu Bakar",
      "Muhammad Ridwan",
      "Siti Nurhaliza",
      "081234567890",
      "Jl. Pasirangin No. 12 RT 02/03",
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template_Import_Siswa_SDIT_At_Taqwim.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import File Parser (XLSX and CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsProcessingImport(true);
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array", raw: false, cellText: true });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          setImportErrors(["Berkas lembar kerja kosong."]);
          return;
        }
        const ws = wb.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
          defval: "",
          raw: false,
        });

        if (rawRows.length === 0) {
          setImportErrors(["Berkas data kosong atau tidak memiliki baris data."]);
          return;
        }

        const preview = await api<any>("students/import/preview", "POST", rawRows);
        setImportPreviewToken(preview.previewToken || "");
        setImportRows(preview.rows || []);
        const errs: string[] = [];
        (preview.rows || []).forEach((r: any) => {
          if (!r.isValid && r.errors?.length) {
            errs.push(`Baris ${r.rowNum}: ${r.errors.join(", ")}`);
          }
        });
        setImportErrors(errs);
        setImportStep(3);
      } catch (err: any) {
        setImportErrors([err.message || "Gagal memproses pratinjau impor berkas."]);
      } finally {
        setIsProcessingImport(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

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
            <h1 className="st-title">Master Data Siswa & Santri</h1>
            <p className="st-subtitle">
              Direktori resmi kependudukan siswa, rombongan belajar, verifikasi berkas, dan profil terpadu SDIT AT-TAQWIM.
            </p>
          </div>
        </div>

        {can("master") && (
          <div className="st-header-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {drafts.length > 0 && (
              <button
                type="button"
                className="st-btn-secondary"
                onClick={() => setShowDraftsModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 12px" }}
              >
                <Clock size={15} />
                <span>Draf ({drafts.length})</span>
              </button>
            )}

            {pendingRequests.length > 0 && (
              <button
                type="button"
                className="st-btn-secondary"
                onClick={() => setShowChangeRequestsModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  padding: "8px 12px",
                  borderColor: "#d97706",
                  color: "#b45309",
                }}
              >
                <FileCheck size={15} />
                <span>Usulan Wali ({pendingRequests.length})</span>
              </button>
            )}

            <button
              type="button"
              className="st-btn-secondary"
              onClick={() => {
                setImportStep(1);
                setImportRows([]);
                setImportErrors([]);
                setShowImportModal(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 12px" }}
            >
              <Upload size={15} />
              <span>Import Excel</span>
            </button>

            <button
              type="button"
              className="st-btn-secondary"
              onClick={() => setShowExportModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 12px" }}
            >
              <Download size={15} />
              <span>Export</span>
            </button>

            <Link href="/master/siswa/tambah" className="st-btn-primary">
              <UserPlus size={16} />
              <span>Tambah Siswa</span>
            </Link>
          </div>
        )}
      </div>

      {/* Summary Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          margin: "16px 0",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#334155",
            }}
          >
            <Users size={18} />
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>Total Terdaftar</span>
            <strong style={{ fontSize: 18, color: "#0f172a" }}>{students.length}</strong>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16613e",
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>Siswa Aktif</span>
            <strong style={{ fontSize: 18, color: "#16613e" }}>{activeCount}</strong>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
            }}
          >
            <FileCheck size={18} />
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>Biodata Lengkap</span>
            <strong style={{ fontSize: 18, color: "#2563eb" }}>{completeCount}</strong>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#fffbeb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>Belum Lengkap</span>
            <strong style={{ fontSize: 18, color: "#d97706" }}>{incompleteCount}</strong>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#f5f3ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7c3aed",
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>Draf Pendaftaran</span>
            <strong style={{ fontSize: 18, color: "#7c3aed" }}>{drafts.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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

        <div className="st-filter-group" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={completenessFilter}
              onChange={(e) => setCompletenessFilter(e.target.value as any)}
              aria-label="Filter Kelengkapan Berkas"
            >
              <option value="ALL">Semua Kelengkapan</option>
              <option value="COMPLETE">Lengkap (≥ 80%)</option>
              <option value="INCOMPLETE">Belum Lengkap (&lt; 80%)</option>
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
              {search || selectedClass !== "ALL" || statusFilter !== "ALL" || completenessFilter !== "ALL"
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
                  <th>Kelengkapan</th>
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
                  const completenessPercent =
                    completenessSummary[s.id]?.percentage ?? null;

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
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 110 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                            <span style={{ color: "var(--muted)" }}>Biodata</span>
                            <strong
                              style={{
                                color:
                                  completenessPercent === null
                                    ? "var(--muted)"
                                    : completenessPercent >= 80
                                    ? "#16613e"
                                    : completenessPercent >= 50
                                    ? "#d97706"
                                    : "#dc2626",
                              }}
                            >
                              {completenessPercent === null ? "—" : `${completenessPercent}%`}
                            </strong>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 5,
                              background: "#f1f5f9",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  completenessPercent === null
                                    ? "0%"
                                    : `${completenessPercent}%`,
                                height: "100%",
                                background:
                                  completenessPercent === null
                                    ? "transparent"
                                    : completenessPercent >= 80
                                    ? "#16613e"
                                    : completenessPercent >= 50
                                    ? "#d97706"
                                    : "#dc2626",
                              }}
                            />
                          </div>
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

      {/* MODAL: Draf Pendaftaran Tersimpan */}
      {showDraftsModal && (
        <Modal
          title={`Draf Pendaftaran Siswa (${drafts.length})`}
          close={() => setShowDraftsModal(false)}
        >
          <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
            {drafts.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 20 }}>
                Tidak ada draf pendaftaran tersimpan.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      border: "1px solid var(--border, #e2e8f0)",
                      borderRadius: 8,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#f8fafc",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, display: "block" }}>
                        {d.studentName || "Calon Siswa Tanpa Nama"}
                      </strong>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        Langkah Terakhir: <b>{d.stepName || "Identitas"}</b> • Diperbarui:{" "}
                        {formatDateIndo(d.updatedAt)}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="st-btn-secondary"
                        onClick={() => handleDeleteDraft(d.id)}
                        style={{ padding: "6px 10px", fontSize: 11 }}
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          setShowDraftsModal(false);
                          router.push(`/master/siswa/tambah?draftId=${d.id}`);
                        }}
                        style={{ padding: "6px 12px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <span>Lanjutkan</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: Usulan Pembaruan Biodata dari Wali */}
      {showChangeRequestsModal && (
        <Modal
          title={`Pengajuan Pembaruan Biodata Wali (${pendingRequests.length} Menunggu Review)`}
          close={() => setShowChangeRequestsModal(false)}
        >
          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {pendingRequests.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 20 }}>
                Semua pengajuan telah diproses atau belum ada pengajuan baru dari wali murid.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      border: "1px solid var(--border, #e2e8f0)",
                      borderRadius: 10,
                      padding: 14,
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: 13 }}>Siswa ID: {req.studentId}</strong>
                        <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>
                          Diajukan pada: {formatDateIndo(req.createdAt)}
                        </span>
                      </div>
                      <span className="st-badge st-badge-amber">Menunggu Verifikasi</span>
                    </div>

                    <div style={{ fontSize: 12, margin: "8px 0" }}>
                      <span style={{ color: "var(--muted)", display: "block" }}>Alasan Perubahan:</span>
                      <p style={{ margin: "2px 0 8px", fontStyle: "italic" }}>
                        &ldquo;{req.reason || "Pembaruan data kependudukan / nomor kontak"}&rdquo;
                      </p>
                      <span style={{ color: "var(--muted)", display: "block" }}>Data yang Diusulkan:</span>
                      <pre
                        style={{
                          background: "#f1f5f9",
                          padding: 8,
                          borderRadius: 6,
                          fontSize: 11,
                          overflowX: "auto",
                        }}
                      >
                        {JSON.stringify(req.requestedData, null, 2)}
                      </pre>
                    </div>

                    {reviewingReqId === req.id ? (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
                        <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>
                          Catatan Review Tata Usaha
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Catatan persetujuan / alasan penolakan..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="st-input"
                          style={{ marginBottom: 10 }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            type="button"
                            className="outline tiny"
                            onClick={() => setReviewingReqId(null)}
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            className="danger tiny"
                            onClick={() => handleReviewChangeRequest(req.id, "REJECTED")}
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            className="primary tiny"
                            onClick={() => handleReviewChangeRequest(req.id, "APPROVED")}
                          >
                            Setujui Pembaruan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button
                          type="button"
                          className="primary tiny"
                          onClick={() => {
                            setReviewingReqId(req.id);
                            setReviewNotes("");
                          }}
                        >
                          Review Pengajuan Ini
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: Wizard Import Excel (5 Tahap) */}
      {showImportModal && (
        <Modal
          title="Wizard Import Data Siswa (Excel / CSV)"
          close={() => setShowImportModal(false)}
        >
          <div style={{ minWidth: 480, maxHeight: "75vh", overflowY: "auto" }}>
            {/* Steps Indicator */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 12,
                fontSize: 11,
              }}
            >
              <span style={{ fontWeight: importStep === 1 ? 700 : 400, color: importStep === 1 ? "var(--primary)" : "inherit" }}>
                1. Template
              </span>
              <ChevronRight size={14} color="#94a3b8" />
              <span style={{ fontWeight: importStep === 2 ? 700 : 400, color: importStep === 2 ? "var(--primary)" : "inherit" }}>
                2. Unggah
              </span>
              <ChevronRight size={14} color="#94a3b8" />
              <span style={{ fontWeight: importStep === 3 ? 700 : 400, color: importStep === 3 ? "var(--primary)" : "inherit" }}>
                3. Validasi
              </span>
              <ChevronRight size={14} color="#94a3b8" />
              <span style={{ fontWeight: importStep === 4 ? 700 : 400, color: importStep === 4 ? "var(--primary)" : "inherit" }}>
                4. Konfirmasi
              </span>
              <ChevronRight size={14} color="#94a3b8" />
              <span style={{ fontWeight: importStep === 5 ? 700 : 400, color: importStep === 5 ? "var(--primary)" : "inherit" }}>
                5. Selesai
              </span>
            </div>

            {/* STEP 1: Unduh Template */}
            {importStep === 1 && (
              <div>
                <h4 style={{ margin: "0 0 8px", fontSize: 13 }}>Langkah 1: Unduh Format Template Standar</h4>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>
                  Pastikan susunan kolom berkas impor sesuai dengan struktur baku SDIT AT-TAQWIM agar tidak terjadi kesalahan pemetaan data.
                </p>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                    fontSize: 11,
                  }}
                >
                  <strong>Ketentuan Data:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "#475569" }}>
                    <li>NIS wajib unik dan tidak boleh duplikat dengan siswa yang sudah ada.</li>
                    <li>Kolom NAMA_LENGKAP wajib diisi.</li>
                    <li>Format tanggal lahir menggunakan format YYYY-MM-DD (Contoh: 2018-05-14).</li>
                  </ul>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={handleDownloadTemplate}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                  >
                    <Download size={14} /> Unduh Template Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => setImportStep(2)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <span>Lanjut ke Unggah Berkas</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Unggah Berkas */}
            {importStep === 2 && (
              <div>
                <h4 style={{ margin: "0 0 8px", fontSize: 13 }}>Langkah 2: Pilih Berkas Excel / CSV</h4>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>
                  Pilih berkas XLSX atau CSV yang sudah Anda lengkapi sesuai template.
                </p>
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: 10,
                    padding: "30px 20px",
                    textAlign: "center",
                    marginBottom: 20,
                    background: "#f8fafc",
                  }}
                >
                  <Upload size={32} style={{ margin: "0 auto 10px", color: "var(--primary)" }} />
                  <p style={{ margin: "0 0 10px", fontSize: 12 }}>Pilih file dari komputer Anda:</p>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                    onChange={handleFileUpload}
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <button
                    type="button"
                    className="outline"
                    onClick={() => setImportStep(1)}
                  >
                    Kembali
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Validasi Baris */}
            {importStep === 3 && (
              <div>
                <h4 style={{ margin: "0 0 8px", fontSize: 13 }}>
                  Langkah 3: Hasil Validasi Baris Data ({importRows.length} Baris Terdeteksi)
                </h4>
                {importErrors.length > 0 ? (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 16,
                      fontSize: 11,
                      color: "#991b1b",
                    }}
                  >
                    <strong>Ditemukan {importErrors.length} Kesalahan:</strong>
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                      {importErrors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importErrors.length > 5 && <li>...dan {importErrors.length - 5} kesalahan lainnya.</li>}
                    </ul>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 16,
                      fontSize: 12,
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Seluruh baris data valid dan siap untuk diimpor ke sistem.</span>
                  </div>
                )}

                <div className="table-scroll" style={{ maxHeight: 200, marginBottom: 16 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Baris</th>
                        <th>NIS</th>
                        <th>Nama Siswa</th>
                        <th>Kelas</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 10).map((r, i) => (
                        <tr key={i}>
                          <td>{r.rowNum}</td>
                          <td>{r.nis}</td>
                          <td>{r.name}</td>
                          <td>{r.className || "—"}</td>
                          <td>
                            {r.isValid ? (
                              <span className="st-badge st-badge-green">Valid</span>
                            ) : (
                              <span className="st-badge st-badge-amber">Gagal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    className="outline"
                    onClick={() => setImportStep(2)}
                  >
                    Unggah Ulang
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={importErrors.length > 0}
                    onClick={() => setImportStep(4)}
                  >
                    Lanjut ke Konfirmasi
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Konfirmasi */}
            {importStep === 4 && (
              <div>
                <h4 style={{ margin: "0 0 8px", fontSize: 13 }}>Langkah 4: Konfirmasi Komit Impor</h4>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>
                  Sebanyak <b>{importRows.length}</b> siswa akan ditambahkan ke database SDIT AT-TAQWIM.
                </p>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 20,
                    fontSize: 12,
                  }}
                >
                  <p style={{ margin: 0 }}>
                    Sistem akan membuat record master siswa baru dengan status <b>Aktif</b>. Anda dapat melengkapi
                    data orang tua dan dokumen fisik kapan saja setelah proses selesai.
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    className="outline"
                    onClick={() => setImportStep(3)}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={isProcessingImport}
                    onClick={async () => {
                      const validRows = importRows.filter((r) => r.isValid);
                      if (validRows.length === 0) {
                        alert("Tidak ada baris data valid untuk diimpor");
                        return;
                      }
                      setIsProcessingImport(true);
                      try {
                        const result = await api<any>(
                          "students/import/commit",
                          "POST",
                          {
                            token: importPreviewToken,
                            rows: validRows,
                          },
                        );
                        setImportCommitResult(result);
                        await refresh();
                        setImportStep(5);
                      } catch (err: any) {
                        alert(err.message || "Gagal melakukan impor ke server");
                      } finally {
                        setIsProcessingImport(false);
                      }
                    }}
                  >
                    {isProcessingImport ? "Mengimpor..." : "Ya, Impor Sekarang"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Selesai */}
            {importStep === 5 && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <CheckCircle2 size={42} color="#16613e" style={{ margin: "0 auto 10px" }} />
                <h4 style={{ margin: "0 0 6px", fontSize: 15 }}>Impor Berhasil Selesai!</h4>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px" }}>
                  Sebanyak {importCommitResult?.createdCount ?? 0} siswa berhasil didaftarkan ke sistem master siswa.
                  {importCommitResult?.failedCount ? ` (${importCommitResult.failedCount} baris gagal).` : ""}
                </p>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setShowImportModal(false);
                    window.location.reload();
                  }}
                >
                  Selesai & Muat Ulang Daftar
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: Export Data Siswa */}
      {showExportModal && (
        <Modal
          title="Export Data Master Siswa"
          close={() => setShowExportModal(false)}
        >
          <div style={{ minWidth: 420 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Cakupan Data yang Diexport
              </label>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === "FILTERED"}
                    onChange={() => setExportScope("FILTERED")}
                  />
                  <span>Data Terfilter ({filteredStudents.length} siswa)</span>
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === "ALL"}
                    onChange={() => setExportScope("ALL")}
                  />
                  <span>Seluruh Siswa ({students.length} siswa)</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Pilihan Kolom Data
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={exportCols.identity}
                    onChange={(e) => setExportCols({ ...exportCols, identity: e.target.checked })}
                  />
                  <span>Identitas Lengkap (NIS, NISN, NIK, Nama, JK, TTL)</span>
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={exportCols.academic}
                    onChange={(e) => setExportCols({ ...exportCols, academic: e.target.checked })}
                  />
                  <span>Rombel & Status (Kelas, Tahun Ajaran, Status Aktif)</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="outline"
                onClick={() => setShowExportModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleExportCsv}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Download size={14} /> Unduh Berkas CSV / Excel
              </button>
            </div>
          </div>
        </Modal>
      )}

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
