"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  Download,
  Printer,
  Search,
  Filter,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { Badge } from "@/src/components/Badge";
import { money } from "@/src/lib/formatters";
import { statusLabels } from "@/src/lib/calculations";

export default function LaporanSppPage() {
  const { state, loading, balance, className, yearName } = useApp();

  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("ALL");
  const [search, setSearch] = useState("");

  const students = state?.students ?? [];
  const classes = state?.classes ?? [];
  const academicYears = state?.academicYears ?? [];
  const exams = state?.exams ?? [];
  const eligibilities = state?.eligibilities ?? [];

  const currentYear =
    academicYears.find((y) => y.id === selectedYearId) ||
    academicYears.find((y) => y.active) ||
    academicYears[0];

  const currentExam = exams.find(
    (e) => e.academicYearId === currentYear?.id,
  ) || exams[0];

  const roster = useMemo(() => {
    return students.filter((s) => {
      const cls = classes.find((c) => c.id === s.classId);
      if (currentYear && cls?.academicYearId !== currentYear.id) return false;
      if (selectedClassId !== "ALL" && s.classId !== selectedClassId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNis = s.nis.toLowerCase().includes(q);
        if (!matchName && !matchNis) return false;
      }
      return true;
    });
  }, [students, classes, currentYear, selectedClassId, search]);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat laporan rekapitulasi...</p>
        </div>
      </div>
    );
  }

  const handleExportCsv = () => {
    const headers = [
      "NIS",
      "Nama Siswa",
      "Kelas",
      "Total Belum Lunas",
      "Periode Ujian",
      "Kelayakan Ujian",
    ];

    const rows = roster.map((s) => {
      const elig = eligibilities.find(
        (e) => e.studentId === s.id && e.examPeriodId === currentExam?.id,
      );
      return [
        `"${s.nis}"`,
        `"${s.name}"`,
        `"${className(s.classId)}"`,
        balance(s.id),
        `"${currentExam?.name || ""}"`,
        `"${statusLabels[elig?.status || "NOT_EVALUATED"]}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_SPP_${currentYear?.name || "Semua"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card no-print">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <BarChart3 size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Lainnya</span>
              <span>/</span>
              <span>Laporan SPP & Ujian</span>
            </div>
            <h1 className="st-title">Laporan SPP & Kesiapan Ujian</h1>
            <p className="st-subtitle">
              Rekapitulasi komprehensif status pelunasan iuran, posisi piutang santri, dan kelayakan ujian.
            </p>
          </div>
        </div>

        <div className="st-header-actions">
          <button
            type="button"
            className="st-btn-secondary"
            onClick={handleExportCsv}
          >
            <Download size={16} />
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            className="st-btn-primary"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="st-filter-card no-print">
        <div className="st-search-box">
          <Search size={18} className="st-search-icon" />
          <input
            type="text"
            className="st-search-input"
            placeholder="Cari siswa atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="st-filter-group">
          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={currentYear?.id || ""}
              onChange={(e) => setSelectedYearId(e.target.value)}
              aria-label="Filter Tahun Ajaran"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  TA {y.name} {y.active ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="st-select-wrapper">
            <select
              className="st-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              aria-label="Filter Rombel"
            >
              <option value="ALL">Semua Kelas</option>
              {classes
                .filter((c) => c.academicYearId === currentYear?.id)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="print-only" style={{ marginBottom: 20 }}>
        <h2>LAPORAN REKAPITULASI SPP & KELAYAKAN UJIAN</h2>
        <p>SDIT AT-TAQWIM · Tahun Ajaran {currentYear?.name || "—"}</p>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        <div className="st-table-responsive">
          <table className="st-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th>
                <th>NIS</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Total Belum Lunas</th>
                <th>Status Kelayakan</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s, idx) => {
                const elig = eligibilities.find(
                  (el) =>
                    el.studentId === s.id && el.examPeriodId === currentExam?.id,
                );
                const sBalance = balance(s.id);

                return (
                  <tr key={s.id} className="st-table-row">
                    <td className="st-col-idx">{idx + 1}</td>
                    <td>{s.nis}</td>
                    <td>
                      <strong className="st-user-name">{s.name}</strong>
                    </td>
                    <td>{className(s.classId)}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: sBalance > 0 ? "#b91c1c" : "#16613e",
                        }}
                      >
                        {money(sBalance)}
                      </span>
                    </td>
                    <td>
                      <Badge status={elig?.status || "NOT_EVALUATED"} />
                    </td>
                  </tr>
                );
              })}
              {roster.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}
                  >
                    Tidak ada data siswa untuk tahun ajaran dan kelas terpilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
