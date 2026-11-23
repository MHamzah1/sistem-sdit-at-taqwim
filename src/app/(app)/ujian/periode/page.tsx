"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Wallet,
  CheckCircle,
  Users,
  IdCard,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  List,
  UserCheck,
  GraduationCap,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { DataForm, type Field, type FormSpec } from "@/src/components/DataForm";
import { Modal } from "@/src/components/Modal";
import { api } from "@/src/lib/api";
import { formatDateIndo, formatMonthName } from "@/src/lib/formatters";
import type { AppState } from "@/server/state";

type ExamPeriod = AppState["exams"][number];
type ExamType = AppState["examTypes"][number];

function formatExamDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "—";
  const startStr = String(startDate).slice(0, 10);
  const endStr = String(endDate).slice(0, 10);
  if (startStr === endStr) return formatDateIndo(startStr);

  const startParts = startStr.split("-").map(Number);
  const endParts = endStr.split("-").map(Number);

  const NAMA_BULAN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  if (startParts[0] === endParts[0] && startParts[1] === endParts[1]) {
    const month = NAMA_BULAN[startParts[1] - 1];
    return `${startParts[2]} – ${endParts[2]} ${month} ${startParts[0]}`;
  }

  if (startParts[0] === endParts[0]) {
    return `${startParts[2]} ${NAMA_BULAN[startParts[1] - 1]} – ${endParts[2]} ${NAMA_BULAN[endParts[1] - 1]} ${startParts[0]}`;
  }

  return `${formatDateIndo(startStr)} s.d. ${formatDateIndo(endStr)}`;
}

function getExamStatus(e: ExamPeriod, todayStr: string): {
  code: "ONGOING" | "UPCOMING" | "COMPLETED";
  label: string;
} {
  const start = String(e.startDate).slice(0, 10);
  const end = String(e.endDate).slice(0, 10);
  if (todayStr >= start && todayStr <= end) {
    return { code: "ONGOING", label: "Sedang Berlangsung" };
  }
  if (todayStr < start) {
    return { code: "UPCOMING", label: "Akan Datang" };
  }
  return { code: "COMPLETED", label: "Selesai" };
}

export default function PeriodeUjianPage() {
  const router = useRouter();
  const { state, loading, busy, save, run, can, yearName, setToast, setError } = useApp();

  const [activeTab, setActiveTab] = useState<"periods" | "types">("periods");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);
  const [examToDelete, setExamToDelete] = useState<ExamPeriod | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<ExamType | null>(null);

  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }, []);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat data periode ujian...</p>
        </div>
      </div>
    );
  }

  const exams = state.exams || [];
  const examTypes = state.examTypes || [];
  const academicYears = state.academicYears || [];
  const students = state.students || [];
  const classes = state.classes || [];
  const eligibilities = state.eligibilities || [];

  const activeCount = exams.filter((e) => getExamStatus(e, todayStr).code === "ONGOING").length;
  const upcomingCount = exams.filter((e) => getExamStatus(e, todayStr).code === "UPCOMING").length;

  const filteredExams = exams.filter((e) => {
    if (yearFilter !== "ALL" && e.academicYearId !== yearFilter) {
      return false;
    }
    const status = getExamStatus(e, todayStr).code;
    if (statusFilter !== "ALL" && status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchYear = yearName(e.academicYearId).toLowerCase().includes(q);
      const matchType = (examTypes.find((t) => t.id === e.examTypeId)?.name || "")
        .toLowerCase()
        .includes(q);
      if (!matchName && !matchYear && !matchType) return false;
    }
    return true;
  });

  const handleAddType = () => {
    setFormConfig({
      title: "Tambah Jenis Ujian Baru",
      fields: [
        {
          key: "name",
          label: "Nama / Singkatan Jenis Ujian (contoh: PTS, PAS, PAT, US)",
          required: true,
        },
      ],
      note: "Jenis ujian menjadi kategori penilaian yang dapat dipilih saat membuat periode ujian.",
      submit: async (values) => {
        await save("exam-types", { name: String(values.name).trim() });
        setToast("Jenis ujian berhasil ditambahkan");
        setFormConfig(null);
      },
    });
  };

  const handleEditType = (type: ExamType) => {
    setFormConfig({
      title: "Ubah Nama Jenis Ujian",
      fields: [
        {
          key: "name",
          label: "Nama Jenis Ujian",
          defaultValue: type.name,
          required: true,
        },
      ],
      initial: {
        name: type.name,
      },
      submit: async (values) => {
        await save("exam-types", { name: String(values.name).trim() }, type.id);
        setToast("Jenis ujian berhasil diperbarui");
        setFormConfig(null);
      },
    });
  };

  const handleAddExam = () => {
    const defaultYear =
      academicYears.find((y) => y.active)?.id || academicYears[0]?.id || "";

    const examFields: Field[] = [
      {
        key: "examTypeId",
        label: "Jenis Ujian",
        options: examTypes.map((t) => ({ value: t.id, label: t.name })),
        required: true,
      },
      {
        key: "academicYearId",
        label: "Tahun Ajaran",
        options: academicYears.map((y) => ({
          value: y.id,
          label: `${y.name} ${y.active ? "(Aktif)" : ""}`,
        })),
        defaultValue: defaultYear,
        required: true,
      },
      {
        key: "name",
        label: "Nama Periode Ujian (contoh: PTS Ganjil 2026/2027)",
        required: true,
      },
      {
        key: "semester",
        label: "Semester",
        options: [
          { value: "1", label: "Semester 1 (Ganjil)" },
          { value: "2", label: "Semester 2 (Genap)" },
        ],
        defaultValue: "1",
        required: true,
      },
      { key: "startDate", label: "Tanggal Mulai Ujian", type: "date", required: true },
      { key: "endDate", label: "Tanggal Selesai Ujian", type: "date", required: true },
      {
        key: "administrativeDeadline",
        label: "Batas Akhir Administrasi Keuangan SPP",
        type: "date",
        required: true,
      },
      {
        key: "requiredUntilMonth",
        label: "Syarat Lunas SPP Sampai Bulan",
        type: "month",
        defaultValue: currentMonth,
        required: true,
      },
      {
        key: "guardianDownload",
        label: "Izinkan Wali Murid Mengunduh Kartu Ujian Mandiri",
        type: "checkbox",
        defaultValue: false,
      },
    ];

    setFormConfig({
      title: "Buat Periode Ujian Baru",
      fields: examFields,
      note: "Catatan: Tahun Ajaran dan Syarat Lunas SPP bersifat permanen (immutable) setelah periode dibuat demi integritas riwayat evaluasi siswa.",
      submit: async (values) => {
        await save("exams", {
          ...values,
          semester: Number(values.semester),
          requiredUntilMonth: values.requiredUntilMonth + "-01",
          guardianDownload: Boolean(values.guardianDownload),
        });
        setToast("Periode ujian berhasil dibuat");
        setFormConfig(null);
      },
    });
  };

  const handleEditExam = (exam: ExamPeriod) => {
    const editFields: Field[] = [
      {
        key: "name",
        label: "Nama Periode Ujian",
        required: true,
      },
      {
        key: "examTypeId",
        label: "Jenis Ujian",
        options: examTypes.map((t) => ({ value: t.id, label: t.name })),
        required: true,
      },
      {
        key: "semester",
        label: "Semester",
        options: [
          { value: "1", label: "Semester 1 (Ganjil)" },
          { value: "2", label: "Semester 2 (Genap)" },
        ],
        required: true,
      },
      { key: "startDate", label: "Tanggal Mulai Ujian", type: "date", required: true },
      { key: "endDate", label: "Tanggal Selesai Ujian", type: "date", required: true },
      {
        key: "administrativeDeadline",
        label: "Batas Akhir Administrasi Keuangan SPP",
        type: "date",
        required: true,
      },
      {
        key: "guardianDownload",
        label: "Izinkan Wali Murid Mengunduh Kartu Ujian Mandiri",
        type: "checkbox",
      },
    ];

    setFormConfig({
      title: "Ubah Periode Ujian",
      fields: editFields,
      initial: {
        name: exam.name,
        examTypeId: exam.examTypeId,
        semester: String(exam.semester),
        startDate: exam.startDate,
        endDate: exam.endDate,
        administrativeDeadline: exam.administrativeDeadline,
        guardianDownload: Boolean(exam.guardianDownload),
      },
      note: `Tahun Ajaran: ${yearName(exam.academicYearId)} · Syarat SPP: Sampai ${formatMonthName(exam.requiredUntilMonth.slice(0, 7))} (Kedua parameter ini terkunci permanen).`,
      submit: async (values) => {
        await save(
          "exams",
          {
            ...values,
            academicYearId: exam.academicYearId,
            semester: Number(values.semester),
            requiredUntilMonth: exam.requiredUntilMonth,
            guardianDownload: Boolean(values.guardianDownload),
          },
          exam.id,
        );
        setToast("Periode ujian berhasil diperbarui");
        setFormConfig(null);
      },
    });
  };

  const handleDelete = async () => {
    if (!examToDelete) return;
    await run(
      () => api(`exams/${examToDelete.id}`, "DELETE"),
      `Periode ujian ${examToDelete.name} berhasil dihapus`,
    );
    setExamToDelete(null);
  };

  const confirmDeleteType = async () => {
    if (!typeToDelete) return;
    const usedCount = exams.filter((e) => e.examTypeId === typeToDelete.id).length;
    if (usedCount > 0) {
      setError(
        `Jenis ujian "${typeToDelete.name}" tidak dapat dihapus karena sedang digunakan oleh ${usedCount} periode ujian.`,
      );
      setTypeToDelete(null);
      return;
    }
    await run(
      () => api(`exam-types/${typeToDelete.id}`, "DELETE"),
      `Jenis ujian ${typeToDelete.name} berhasil dihapus`,
    );
    setTypeToDelete(null);
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner Header */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <CalendarDays size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Ujian</span>
              <span>/</span>
              <span>Periode Ujian</span>
            </div>
            <h1 className="st-title">Periode Ujian</h1>
            <p className="st-subtitle">
              Konfigurasi jadwal pelaksanaan asesmen sekolah, batas administrasi, dan syarat pelunasan SPP.
            </p>
          </div>
        </div>

        {can("master") && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-secondary"
              onClick={handleAddType}
            >
              <Layers size={16} />
              <span>Jenis Ujian</span>
            </button>
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleAddExam}
            >
              <Plus size={16} />
              <span>Buat Periode Ujian</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Metric Summary Cards */}
      <div
        className="metrics"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="metric">
          <div className="metric-top">
            <span>Total Periode Ujian</span>
            <span className="metric-icon green">
              <CalendarDays size={17} />
            </span>
          </div>
          <div className="metric-value">{exams.length}</div>
          <div className="metric-bottom">
            <span>Jadwal asesmen terdaftar</span>
          </div>
        </div>

        <div className="metric">
          <div className="metric-top">
            <span>Sedang Berlangsung</span>
            <span className="metric-icon green">
              <Clock size={17} />
            </span>
          </div>
          <div
            className="metric-value"
            style={{ color: activeCount > 0 ? "#166534" : "#283b34" }}
          >
            {activeCount}
          </div>
          <div className="metric-bottom">
            <span style={{ color: activeCount > 0 ? "#166534" : undefined }}>
              {activeCount > 0 ? "Asesmen aktif berlangsung" : "Tidak ada ujian berjalan"}
            </span>
          </div>
        </div>

        <div className="metric">
          <div className="metric-top">
            <span>Akan Datang</span>
            <span className="metric-icon blue">
              <Calendar size={17} />
            </span>
          </div>
          <div className="metric-value" style={{ color: "#2563eb" }}>
            {upcomingCount}
          </div>
          <div className="metric-bottom">
            <span>Jadwal asesmen mendatang</span>
          </div>
        </div>

        <div className="metric">
          <div className="metric-top">
            <span>Master Jenis Ujian</span>
            <span className="metric-icon neutral">
              <Layers size={17} />
            </span>
          </div>
          <div className="metric-value">{examTypes.length}</div>
          <div className="metric-bottom">
            <span>PTS, PAS, PAT, US</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="st-tabs-filter">
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "periods" ? "active" : ""}`}
            onClick={() => setActiveTab("periods")}
          >
            <CalendarDays size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
            Periode Ujian ({exams.length})
          </button>
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "types" ? "active" : ""}`}
            onClick={() => setActiveTab("types")}
          >
            <Layers size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
            Master Jenis Ujian ({examTypes.length})
          </button>
        </div>

        {activeTab === "periods" && exams.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginRight: 2 }}>
              Tampilan:
            </span>
            <div className="st-tabs-filter" style={{ padding: 2 }}>
              <button
                type="button"
                className={`st-tab-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Tampilan Kartu Ringkas"
                style={{ padding: "5px 10px" }}
              >
                <LayoutGrid size={14} style={{ display: "inline", marginRight: 4, verticalAlign: "text-bottom" }} />
                Kartu
              </button>
              <button
                type="button"
                className={`st-tab-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Tampilan Tabel Padat"
                style={{ padding: "5px 10px" }}
              >
                <List size={14} style={{ display: "inline", marginRight: 4, verticalAlign: "text-bottom" }} />
                Tabel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: PERIODE UJIAN */}
      {activeTab === "periods" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Search & Filter Bar */}
          {exams.length > 0 && (
            <div className="st-filter-card">
              <div className="st-search-box">
                <Search size={15} className="st-search-icon" />
                <input
                  type="text"
                  className="st-search-input"
                  placeholder="Cari periode ujian, semester, atau tahun ajaran..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="st-search-clear"
                    onClick={() => setSearch("")}
                    title="Hapus pencarian"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="st-filter-group">
                <div className="st-select-wrapper">
                  <Filter size={13} className="st-select-icon" />
                  <select
                    className="st-select"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    aria-label="Filter Tahun Ajaran"
                  >
                    <option value="ALL">Semua Tahun Ajaran</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.active ? "(Aktif)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="st-select-wrapper">
                  <select
                    className="st-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter Status Ujian"
                    style={{ paddingLeft: 12 }}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ONGOING">Sedang Berlangsung</option>
                    <option value="UPCOMING">Akan Datang</option>
                    <option value="COMPLETED">Selesai</option>
                  </select>
                </div>

                {(search || yearFilter !== "ALL" || statusFilter !== "ALL") && (
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={() => {
                      setSearch("");
                      setYearFilter("ALL");
                      setStatusFilter("ALL");
                    }}
                    style={{ padding: "8px 12px", fontSize: 11 }}
                    title="Reset Filter"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty State when no exams exist */}
          {exams.length === 0 ? (
            <div className="st-table-card">
              <div className="st-empty-state" style={{ padding: "60px 20px" }}>
                <CalendarDays size={48} className="st-empty-icon" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "10px 0 6px" }}>
                  Belum ada periode ujian
                </h3>
                <p style={{ color: "#64748b", maxWidth: 440, margin: "0 auto 16px" }}>
                  Buat jadwal periode ujian untuk memulai evaluasi kelayakan SPP dan penerbitan kartu peserta ujian ber-QR.
                </p>
                {can("master") && (
                  <button
                    type="button"
                    className="st-btn-primary"
                    onClick={handleAddExam}
                  >
                    <Plus size={16} />
                    <span>Buat Periode Ujian Sekarang</span>
                  </button>
                )}
              </div>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="st-table-card">
              <div className="st-empty-state" style={{ padding: "48px 20px" }}>
                <Search size={36} className="st-empty-icon" />
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "10px 0 6px" }}>
                  Tidak ada periode ujian yang sesuai
                </h3>
                <p style={{ color: "#64748b", margin: "0 auto 14px" }}>
                  Tidak ditemukan periode ujian yang cocok dengan filter atau kata kunci pencarian Anda.
                </p>
                <button
                  type="button"
                  className="st-btn-secondary"
                  onClick={() => {
                    setSearch("");
                    setYearFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Reset Filter</span>
                </button>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                gap: 20,
              }}
            >
              {filteredExams.map((e) => {
                const status = getExamStatus(e, todayStr);
                const isDlPassed =
                  String(todayStr) > String(e.administrativeDeadline).slice(0, 10);

                // Count student eligibility for this exam period
                const periodEligibilities = eligibilities.filter(
                  (el) => el.examPeriodId === e.id,
                );
                const eligibleCount = periodEligibilities.filter(
                  (el) =>
                    el.status === "ELIGIBLE" || el.status === "ELIGIBLE_DISPENSATION",
                ).length;

                // Total students in the academic year
                const totalYearStudents = students.filter((s) => {
                  const cls = classes.find((c) => c.id === s.classId);
                  return cls?.academicYearId === e.academicYearId;
                }).length;

                return (
                  <div
                    key={e.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Card Header */}
                    <div
                      style={{
                        padding: "18px 20px 14px",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              background: "#e8f2ec",
                              color: "#16613e",
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                            }}
                          >
                            <GraduationCap size={22} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h3
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                margin: 0,
                                color: "#145538",
                                fontFamily: "Manrope, sans-serif",
                                lineHeight: 1.3,
                              }}
                            >
                              {e.name}
                            </h3>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 4,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontSize: 12, color: "#64748b" }}>
                                {yearName(e.academicYearId)}
                              </span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>•</span>
                              <span
                                className="st-badge st-badge-slate"
                                style={{ fontSize: 10 }}
                              >
                                Semester {e.semester} (
                                {e.semester === 1 ? "Ganjil" : "Genap"})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {status.code === "ONGOING" && (
                            <span
                              className="st-status-pill active"
                              title="Ujian sedang berlangsung saat ini"
                            >
                              <span className="st-status-dot" />
                              Berlangsung
                            </span>
                          )}
                          {status.code === "UPCOMING" && (
                            <span
                              className="st-badge st-badge-blue"
                              title="Jadwal ujian belum dimulai"
                            >
                              <Calendar size={11} style={{ marginRight: 4 }} />
                              Akan Datang
                            </span>
                          )}
                          {status.code === "COMPLETED" && (
                            <span
                              className="st-badge st-badge-slate"
                              title="Periode ujian telah usai"
                            >
                              <CheckCircle size={11} style={{ marginRight: 4 }} />
                              Selesai
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div
                      style={{
                        padding: "16px 20px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          gap: 10,
                          fontSize: 12.5,
                          background: "#f8fafc",
                          padding: "14px 16px",
                          borderRadius: 9,
                          border: "1px solid #edf2f7",
                        }}
                      >
                        {/* Row 1: Pelaksanaan */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              color: "#64748b",
                            }}
                          >
                            <CalendarDays size={14} color="#16613e" />
                            <span>Pelaksanaan:</span>
                          </div>
                          <strong style={{ color: "#1e293b", fontWeight: 650 }}>
                            {formatExamDateRange(e.startDate, e.endDate)}
                          </strong>
                        </div>

                        {/* Row 2: Batas Administrasi */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              color: "#64748b",
                            }}
                          >
                            <Clock size={14} color="#d97706" />
                            <span>Batas Administrasi:</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <strong style={{ color: "#1e293b" }}>
                              {formatDateIndo(e.administrativeDeadline)}
                            </strong>
                            {isDlPassed ? (
                              <span
                                className="st-badge st-badge-amber"
                                style={{ fontSize: 9.5 }}
                              >
                                Lewat
                              </span>
                            ) : (
                              <span
                                className="st-badge st-badge-green"
                                style={{ fontSize: 9.5 }}
                              >
                                Aktif
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Row 3: Syarat Lunas SPP */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              color: "#64748b",
                            }}
                          >
                            <Wallet size={14} color="#16613e" />
                            <span>Syarat Lunas SPP:</span>
                          </div>
                          <strong style={{ color: "#16613e", fontWeight: 700 }}>
                            Sampai {formatMonthName(e.requiredUntilMonth.slice(0, 7))}
                          </strong>
                        </div>

                        {/* Row 4: Unduh Mandiri Wali */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              color: "#64748b",
                            }}
                          >
                            <UserCheck size={14} color="#64748b" />
                            <span>Unduh Mandiri:</span>
                          </div>
                          <div>
                            {e.guardianDownload ? (
                              <span
                                className="st-badge st-badge-green"
                                title="Wali murid dapat mengunduh kartu ujian langsung dari portal"
                              >
                                Diizinkan Wali
                              </span>
                            ) : (
                              <span
                                className="st-badge st-badge-slate"
                                title="Hanya TU/Sekolah yang dapat mencetak kartu ujian"
                              >
                                Khusus Sekolah
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Evaluated Student Summary Bar (if any) */}
                      {totalYearStudents > 0 && (
                        <div
                          style={{
                            padding: "9px 12px",
                            background: "#f0fdf4",
                            border: "1px solid #dcfce7",
                            borderRadius: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              color: "#166534",
                            }}
                          >
                            <ShieldCheck size={14} />
                            <span>Kesiapan Siswa:</span>
                          </div>
                          <span style={{ fontWeight: 650, color: "#166534" }}>
                            {eligibleCount} / {totalYearStudents} Siswa Layak (
                            {Math.round((eligibleCount / totalYearStudents) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div
                      style={{
                        padding: "12px 20px",
                        borderTop: "1px solid #f1f5f9",
                        background: "#fafafa",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="st-btn-secondary"
                        onClick={() => router.push("/ujian/kelayakan")}
                        style={{ flex: 1, justifyContent: "center" }}
                        title="Evaluasi Kelayakan Siswa untuk Ujian Ini"
                      >
                        <Users size={14} />
                        <span>Kelayakan</span>
                      </button>
                      <button
                        type="button"
                        className="st-btn-secondary"
                        onClick={() => router.push("/ujian/kartu")}
                        style={{ justifyContent: "center" }}
                        title="Buka Cetak Kartu Ujian Ber-QR"
                      >
                        <IdCard size={14} />
                        <span>Kartu</span>
                      </button>

                      {can("master") && (
                        <>
                          <button
                            type="button"
                            className="st-btn-action edit"
                            onClick={() => handleEditExam(e)}
                            title="Ubah Periode Ujian"
                          >
                            <Pencil size={14} />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            className="st-btn-action delete"
                            onClick={() => setExamToDelete(e)}
                            title="Hapus Periode Ujian"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="st-table-card">
              <div className="st-table-responsive">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th style={{ width: 45 }}>No</th>
                      <th>Nama Periode</th>
                      <th>Tahun Ajaran & Semester</th>
                      <th>Jadwal Pelaksanaan</th>
                      <th>Batas Administrasi</th>
                      <th>Syarat Lunas SPP</th>
                      <th>Unduh Mandiri</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right", minWidth: 160 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((e, idx) => {
                      const status = getExamStatus(e, todayStr);
                      const isDlPassed =
                        String(todayStr) >
                        String(e.administrativeDeadline).slice(0, 10);
                      return (
                        <tr key={e.id} className="st-table-row">
                          <td className="st-col-idx">{idx + 1}</td>
                          <td>
                            <strong
                              className="st-user-name"
                              style={{ color: "#145538" }}
                            >
                              {e.name}
                            </strong>
                          </td>
                          <td>
                            <div>{yearName(e.academicYearId)}</div>
                            <small style={{ color: "#64748b" }}>
                              Semester {e.semester} (
                              {e.semester === 1 ? "Ganjil" : "Genap"})
                            </small>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <CalendarDays size={14} color="#16613e" />
                              <span>
                                {formatExamDateRange(e.startDate, e.endDate)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Clock size={14} color="#d97706" />
                              <span>{formatDateIndo(e.administrativeDeadline)}</span>
                              {isDlPassed ? (
                                <span
                                  className="st-badge st-badge-amber"
                                  style={{ fontSize: 9 }}
                                >
                                  Lewat
                                </span>
                              ) : (
                                <span
                                  className="st-badge st-badge-green"
                                  style={{ fontSize: 9 }}
                                >
                                  Aktif
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 650, color: "#16613e" }}>
                              Sampai{" "}
                              {formatMonthName(e.requiredUntilMonth.slice(0, 7))}
                            </span>
                          </td>
                          <td>
                            {e.guardianDownload ? (
                              <span className="st-badge st-badge-green">
                                Diizinkan
                              </span>
                            ) : (
                              <span className="st-badge st-badge-slate">
                                Sekolah
                              </span>
                            )}
                          </td>
                          <td>
                            {status.code === "ONGOING" && (
                              <span className="st-status-pill active">
                                <span className="st-status-dot" />
                                Berlangsung
                              </span>
                            )}
                            {status.code === "UPCOMING" && (
                              <span className="st-badge st-badge-blue">
                                Akan Datang
                              </span>
                            )}
                            {status.code === "COMPLETED" && (
                              <span className="st-badge st-badge-slate">
                                Selesai
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="st-action-row">
                              <button
                                type="button"
                                className="st-btn-action detail"
                                onClick={() => router.push("/ujian/kelayakan")}
                                title="Kelayakan Siswa"
                              >
                                <Users size={13} />
                                <span>Kelayakan</span>
                              </button>
                              <button
                                type="button"
                                className="st-btn-action"
                                onClick={() => router.push("/ujian/kartu")}
                                title="Kartu Peserta Ujian"
                              >
                                <IdCard size={13} />
                                <span>Kartu</span>
                              </button>
                              {can("master") && (
                                <>
                                  <button
                                    type="button"
                                    className="st-btn-action edit"
                                    onClick={() => handleEditExam(e)}
                                    title="Ubah Periode Ujian"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="st-btn-action delete"
                                    onClick={() => setExamToDelete(e)}
                                    title="Hapus Periode Ujian"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER JENIS UJIAN */}
      {activeTab === "types" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="notice" style={{ margin: 0 }}>
            <AlertCircle size={18} />
            <span>
              <strong>Master Jenis Asesmen:</strong> Jenis ujian (seperti PTS, PAS, PAT, US) digunakan sebagai klasifikasi penilaian asesmen sekolah. Jenis ujian yang sedang dikaitkan dengan periode ujian aktif tidak dapat dihapus untuk menjaga integritas data.
            </span>
          </div>

          <div className="st-table-card">
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={18} color="#16613e" />
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#16613e",
                    margin: 0,
                  }}
                >
                  Daftar Jenis Ujian Terdaftar ({examTypes.length})
                </h2>
              </div>
              {can("master") && (
                <button
                  type="button"
                  className="st-btn-primary"
                  onClick={handleAddType}
                >
                  <Plus size={15} />
                  <span>Tambah Jenis Ujian</span>
                </button>
              )}
            </div>

            <div className="st-table-responsive">
              <table className="st-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>No</th>
                    <th>Nama Jenis Ujian</th>
                    <th>Penggunaan pada Periode Ujian</th>
                    <th>Status Relasi</th>
                    {can("master") && (
                      <th style={{ textAlign: "right", minWidth: 120 }}>Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {examTypes.map((t, idx) => {
                    const usedExams = exams.filter((e) => e.examTypeId === t.id);
                    const isUsed = usedExams.length > 0;
                    return (
                      <tr key={t.id} className="st-table-row">
                        <td className="st-col-idx">{idx + 1}</td>
                        <td>
                          <strong
                            className="st-user-name"
                            style={{ fontSize: 13, color: "#145538" }}
                          >
                            {t.name}
                          </strong>
                        </td>
                        <td>
                          {isUsed ? (
                            <span style={{ fontWeight: 600, color: "#166534" }}>
                              {usedExams.length} Periode Ujian (
                              {usedExams.map((e) => e.name).join(", ")})
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>
                              Belum ada periode terkait
                            </span>
                          )}
                        </td>
                        <td>
                          {isUsed ? (
                            <span className="st-badge st-badge-green">
                              Aktif Digunakan
                            </span>
                          ) : (
                            <span className="st-badge st-badge-slate">
                              Dapat Dihapus
                            </span>
                          )}
                        </td>
                        {can("master") && (
                          <td style={{ textAlign: "right" }}>
                            <div className="st-action-row">
                              <button
                                type="button"
                                className="st-btn-action edit"
                                onClick={() => handleEditType(t)}
                                title="Ubah Nama Jenis Ujian"
                              >
                                <Pencil size={14} />
                                <span>Ubah</span>
                              </button>
                              <button
                                type="button"
                                className="st-btn-action delete"
                                onClick={() => setTypeToDelete(t)}
                                disabled={isUsed}
                                title={
                                  isUsed
                                    ? "Jenis ujian tidak dapat dihapus karena sedang digunakan oleh periode ujian"
                                    : "Hapus Jenis Ujian"
                                }
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {examTypes.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: 36,
                          color: "#94a3b8",
                        }}
                      >
                        Belum ada master jenis ujian. Silakan tambahkan (misal: PTS, PAS, PAT).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Form Modal */}
      {formConfig && (
        <DataForm spec={formConfig} close={() => setFormConfig(null)} />
      )}

      {/* Delete Exam Confirmation Modal */}
      {examToDelete && (
        <Modal
          title="Konfirmasi Hapus Periode Ujian"
          close={() => !busy && setExamToDelete(null)}
        >
          <div className="st-delete-modal-body">
            <p>
              Apakah Anda yakin ingin menghapus periode ujian{" "}
              <strong>{examToDelete.name}</strong>?
            </p>
            <div className="notice amber" style={{ marginTop: 12 }}>
              Periode ujian yang sudah memiliki riwayat kartu peserta ujian atau
              evaluasi kelayakan tidak dapat dihapus untuk menjaga integritas audit.
            </div>
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={() => setExamToDelete(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                {busy ? "Menghapus..." : "Ya, Hapus Periode Ujian"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Exam Type Confirmation Modal */}
      {typeToDelete && (
        <Modal
          title="Konfirmasi Hapus Jenis Ujian"
          close={() => !busy && setTypeToDelete(null)}
        >
          <div className="st-delete-modal-body">
            <p>
              Apakah Anda yakin ingin menghapus jenis ujian{" "}
              <strong>{typeToDelete.name}</strong>?
            </p>
            <div className="notice amber" style={{ marginTop: 12 }}>
              Jenis ujian yang sudah digunakan oleh periode ujian tidak dapat dihapus.
            </div>
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={() => setTypeToDelete(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => void confirmDeleteType()}
              >
                {busy ? "Menghapus..." : "Ya, Hapus Jenis Ujian"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
