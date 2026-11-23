"use client";

import React, { useState, useMemo } from "react";
import {
  ClipboardList,
  Plus,
  Calendar,
  UserCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  FileText,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  HelpCircle,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import { CharacteristicDetailModal } from "@/src/components/modals";
import { Modal } from "@/src/components/Modal";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { formatDateIndo, formatDateTimeIndo } from "@/src/lib/formatters";
import { cn } from "@/src/lib/utils";
import type { AppState } from "@/server/state";

type Template = AppState["templates"][number];
type Submission = AppState["submissions"][number];

export default function KarakteristikAnakPage() {
  const {
    state,
    loading,
    busy,
    save,
    can,
    isGuardian,
    studentName,
    className,
    setToast,
  } = useApp();

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<"submissions" | "templates">("submissions");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedTemplate, setSelectedTemplate] = useState("ALL");

  // Modal States
  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);
  const [detailSubmission, setDetailSubmission] = useState<Submission | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const templates = state?.templates || [];
  const fields = state?.fields || [];
  const submissions = state?.submissions || [];
  const answers = state?.answers || [];
  const students = state?.students || [];
  const classes = state?.classes || [];

  // ==================== FILTERED SUBMISSIONS ====================
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const student = students.find((s) => s.id === sub.studentId);
      if (!student) return false;

      // Filter by template
      if (selectedTemplate !== "ALL" && sub.templateId !== selectedTemplate) {
        return false;
      }

      // Filter by class
      if (selectedClass !== "ALL" && student.classId !== selectedClass) {
        return false;
      }

      // Filter by search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = student.name.toLowerCase().includes(q);
        const matchNis = student.nis.toLowerCase().includes(q);
        const matchNisn = student.nisn?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchNis && !matchNisn) return false;
      }

      return true;
    });
  }, [submissions, students, selectedTemplate, selectedClass, search]);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat instrumen karakteristik & perkembangan santri...</p>
        </div>
      </div>
    );
  }

  // ==================== METRIC CALCULATIONS ====================
  const activeStudentsCount = students.filter((s) => s.active).length;
  const activeTemplatesCount = templates.filter((t) => t.active).length;
  const totalSubmissionsCount = submissions.length;

  // Unik santri yang sudah mengisi
  const uniqueStudentsFilled = new Set(submissions.map((s) => s.studentId)).size;
  const participationRate =
    activeStudentsCount > 0
      ? Math.round((uniqueStudentsFilled / activeStudentsCount) * 100)
      : 0;

  // Deadline terdekat
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingDeadlines = templates
    .filter((t) => t.active && t.deadline >= todayStr)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const nearestTemplate = upcomingDeadlines[0] || templates[0];

  const getDaysLeft = (deadline: string) => {
    const dDate = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil(
      (dDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  };

  // ==================== FORM ACTIONS ====================
  const handleCreateTemplate = () => {
    setFormConfig({
      title: "Buat Template Kuisioner Karakteristik",
      note: "Tuliskan satu butir instrumen pengamatan per baris. Setiap butir akan menjadi pertanyaan yang wajib diisi oleh responden.",
      fields: [
        {
          key: "name",
          label: "Nama Template (contoh: Evaluasi Karakter & Ibadah Harian Santri)",
          required: true,
        },
        {
          key: "deadline",
          label: "Batas Akhir Pengisian (Deadline)",
          type: "date",
          required: true,
        },
        {
          key: "questions",
          label: "Daftar Pertanyaan (Tuliskan satu butir instrumen per baris)",
          type: "textarea",
          required: true,
        },
      ],
      submit: async (values) => {
        await save("forms", {
          name: values.name,
          deadline: values.deadline,
          fields: String(values.questions)
            .split("\n")
            .map((q) => q.replace(/^\d+[\.\)]\s*/, "").trim())
            .filter((q) => q.length > 0)
            .map((label) => ({ label, required: true })),
        });
        setToast("Template kuisioner berhasil dibuat");
        setFormConfig(null);
      },
    });
  };

  const handleFillForm = (template: Template) => {
    const templateFields = fields
      .filter((f) => f.templateId === template.id)
      .sort((a, b) => a.position - b.position);

    setFormConfig({
      title: `Pengisian: ${template.name}`,
      note: `Batas pengisian: ${formatDateIndo(template.deadline)}. Silakan isi seluruh pertanyaan di bawah ini dengan seksama.`,
      fields: [
        {
          key: "studentId",
          label: "Pilih Siswa / Santri",
          options: students.map((s) => ({
            value: s.id,
            label: `${s.name} (${className(s.classId)} - NIS: ${s.nis})`,
          })),
          required: true,
        },
        ...templateFields.map((f) => ({
          key: f.id,
          label: f.label,
          type: "textarea" as const,
          required: f.required,
        })),
      ],
      submit: async (values) => {
        await save("form-submissions", {
          templateId: template.id,
          studentId: values.studentId,
          answers: templateFields.map((f) => ({
            fieldId: f.id,
            value: String(values[f.id] || ""),
          })),
        });
        setToast("Jawaban kuisioner karakteristik berhasil disimpan");
        setFormConfig(null);
      },
    });
  };

  return (
    <div className="st-page-shell">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-start sm:items-center gap-4">
          <div className="size-12 sm:size-14 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
            <ClipboardList className="size-6 sm:size-7" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
              <span>Lainnya</span>
              <span>/</span>
              <span className="text-primary font-semibold">Karakteristik Anak</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
              Karakteristik & Perkembangan Anak
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Instrumen pengamatan karakter santri, kepribadian, kedisiplinan ibadah, dan formulir evaluasi berkala.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          {can("master") && (
            <Button
              type="button"
              onClick={handleCreateTemplate}
              className="gap-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="size-4" />
              <span>Buat Template Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Instrumen Aktif */}
        <div className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Instrumen Kuisioner
            </span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground">
                {activeTemplatesCount}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                dari {templates.length} aktif
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Template instrumen evaluasi
            </p>
          </div>
        </div>

        {/* Metric 2: Tanggapan Masuk */}
        <div className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Tanggapan Masuk
            </span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground">
                {totalSubmissionsCount}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                formulir
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total jawaban santri tersimpan
            </p>
          </div>
        </div>

        {/* Metric 3: Partisipasi Santri */}
        <div className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Partisipasi Santri
            </span>
            <div className="size-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground">
                {participationRate}%
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {uniqueStudentsFilled}/{activeStudentsCount} Santri
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(participationRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: Batas Pengisian Terdekat */}
        <div className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Batas Waktu Terdekat
            </span>
            <div className="size-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            {nearestTemplate ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-bold font-heading text-foreground truncate">
                    {formatDateIndo(nearestTemplate.deadline)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {getDaysLeft(nearestTemplate.deadline) >= 0 ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/80 text-emerald-800">
                      Sisa {getDaysLeft(nearestTemplate.deadline)} hari lagi
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">
                      Telah berakhir
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Belum ada jadwal</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-1">
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger
            active={activeTab === "submissions"}
            onClick={() => setActiveTab("submissions")}
            className="gap-2 text-xs py-1.5 px-3.5"
          >
            <UserCheck className="size-3.5" />
            <span>Tanggapan Santri</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-semibold">
              {submissions.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            active={activeTab === "templates"}
            onClick={() => setActiveTab("templates")}
            className="gap-2 text-xs py-1.5 px-3.5"
          >
            <FileText className="size-3.5" />
            <span>Katalog Template Kuisioner</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted-foreground/15 text-muted-foreground font-semibold">
              {templates.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ==================== TAB 1: TANGGAPAN SANTRI ==================== */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Cari nama santri, NIS, atau NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 text-xs bg-muted/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Kelas */}
              <div className="flex items-center gap-1.5 border border-border rounded-lg bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-2xs">
                <GraduationCap className="size-3.5 text-primary" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent border-none text-foreground font-medium text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Template */}
              <div className="flex items-center gap-1.5 border border-border rounded-lg bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-2xs">
                <ClipboardList className="size-3.5 text-primary" />
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="bg-transparent border-none text-foreground font-medium text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ALL">Semua Kuisioner</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {(search || selectedClass !== "ALL" || selectedTemplate !== "ALL") && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setSelectedClass("ALL");
                    setSelectedTemplate("ALL");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>

          {/* Submissions Data Table */}
          <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Instrumen Kuisioner</th>
                    <th className="py-3 px-4">Waktu Pengisian</th>
                    <th className="py-3 px-4">Kelengkapan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {filteredSubmissions.map((sub, idx) => {
                    const student = students.find((s) => s.id === sub.studentId);
                    const studentClass = classes.find(
                      (c) => c.id === student?.classId,
                    );
                    const tmpl = templates.find((t) => t.id === sub.templateId);
                    const tmplFields = fields.filter(
                      (f) => f.templateId === sub.templateId,
                    );
                    const subAnswers = answers.filter(
                      (a) => a.submissionId === sub.id,
                    );
                    const answeredCount = subAnswers.filter(
                      (a) => a.value.trim().length > 0,
                    ).length;

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-center font-mono text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                              {student?.name?.charAt(0) || "S"}
                            </div>
                            <div>
                              <strong className="block font-semibold text-foreground text-xs leading-snug">
                                {student?.name || "Nama Santri"}
                              </strong>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                NIS: {student?.nis || "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground border border-border">
                            {studentClass?.name || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-foreground block truncate max-w-[220px]">
                            {tmpl?.name || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                          {formatDateTimeIndo(sub.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            {answeredCount}/{tmplFields.length} Terisi
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailSubmission(sub)}
                            className="gap-1.5 text-xs h-8 px-3 font-medium hover:border-primary hover:text-primary transition-all"
                          >
                            <Eye className="size-3.5" />
                            <span>Lihat Jawaban</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <UserCheck className="size-10 text-muted-foreground/50" />
                          <h4 className="font-heading font-semibold text-foreground text-sm">
                            Tidak Ada Tanggapan Ditemukan
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {search || selectedClass !== "ALL" || selectedTemplate !== "ALL"
                              ? "Tidak ada hasil yang cocok dengan kriteria pencarian atau filter yang dipilih."
                              : "Belum ada santri atau wali murid yang mengisi formulir karakteristik."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredSubmissions.length > 0 && (
              <div className="p-3.5 border-t border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  Menampilkan <strong>{filteredSubmissions.length}</strong> tanggapan santri
                </span>
                <span className="text-[11px]">SDIT AT-TAQWIM • Evaluasi Karakter</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: KATALOG TEMPLATE ==================== */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((t) => {
              const subCount = submissions.filter((s) => s.templateId === t.id).length;
              const templateFields = fields
                .filter((f) => f.templateId === t.id)
                .sort((a, b) => a.position - b.position);
              const daysLeft = getDaysLeft(t.deadline);
              const isActive = t.active && daysLeft >= 0;

              return (
                <div
                  key={t.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-2xs hover:shadow-xs transition-all hover:border-primary/40 group"
                >
                  <div className="space-y-4">
                    {/* Header Kartu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                        <ClipboardList className="size-5" />
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                          isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-800 border-red-200",
                        )}
                      >
                        {isActive ? "Aktif" : "Ditutup"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {t.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>Batas: {formatDateIndo(t.deadline)}</span>
                        <span>•</span>
                        <span className={daysLeft < 3 ? "text-amber-600 font-medium" : ""}>
                          {daysLeft >= 0 ? `${daysLeft} hari lagi` : "Selesai"}
                        </span>
                      </div>
                    </div>

                    {/* Progress Pengisian */}
                    <div className="rounded-lg bg-muted/40 p-3 border border-border/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          Tanggapan Santri
                        </span>
                        <strong className="text-foreground font-semibold">
                          {subCount} tersimpan
                        </strong>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{
                            width: `${
                              activeStudentsCount > 0
                                ? Math.min(
                                    Math.round((subCount / activeStudentsCount) * 100),
                                    100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Preview Butir Pertanyaan */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <span>Indikator Penilaian</span>
                        <span>{templateFields.length} butir</span>
                      </div>
                      <div className="space-y-1">
                        {templateFields.slice(0, 3).map((fld, fIdx) => (
                          <div
                            key={fld.id}
                            className="text-xs text-foreground/80 flex items-start gap-1.5 truncate"
                          >
                            <span className="size-4 rounded-full bg-muted text-[10px] text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                              {fIdx + 1}
                            </span>
                            <span className="truncate">{fld.label}</span>
                          </div>
                        ))}
                        {templateFields.length > 3 && (
                          <p className="text-[11px] text-muted-foreground pl-5 italic">
                            +{templateFields.length - 3} butir instrumen lainnya...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex items-center gap-2 pt-5 border-t border-border mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(t)}
                      className="text-xs flex-1 gap-1"
                    >
                      <Eye className="size-3.5" />
                      <span>Lihat Butir</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleFillForm(t)}
                      className="text-xs flex-1 gap-1 font-semibold"
                    >
                      <ClipboardList className="size-3.5" />
                      <span>Isi Formulir</span>
                    </Button>
                  </div>
                </div>
              );
            })}

            {templates.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center bg-card">
                <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                  <ClipboardList className="size-12 text-muted-foreground/40" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Belum Ada Template Kuisioner
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Buat instrumen pengamatan karakter santri untuk mulai mengumpulkan evaluasi dari wali murid atau guru.
                  </p>
                  {can("master") && (
                    <Button
                      type="button"
                      onClick={handleCreateTemplate}
                      className="mt-3 gap-2 text-xs"
                    >
                      <Plus className="size-4" />
                      <span>Buat Template Pertama</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Detail Jawaban Santri Modal */}
      {detailSubmission && (
        <CharacteristicDetailModal
          submission={detailSubmission}
          state={state}
          close={() => setDetailSubmission(null)}
        />
      )}

      {/* Preview Butir Pertanyaan Template Modal */}
      {previewTemplate && (
        <Modal
          title={`Daftar Butir: ${previewTemplate.name}`}
          close={() => setPreviewTemplate(null)}
          className="max-w-xl"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground flex items-center justify-between">
              <span>Batas Akhir: {formatDateIndo(previewTemplate.deadline)}</span>
              <span className="font-semibold text-primary">
                {fields.filter((f) => f.templateId === previewTemplate.id).length} Butir Pertanyaan
              </span>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {fields
                .filter((f) => f.templateId === previewTemplate.id)
                .sort((a, b) => a.position - b.position)
                .map((fld, idx) => (
                  <div
                    key={fld.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card text-xs shadow-2xs"
                  >
                    <span className="size-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-foreground font-medium leading-relaxed">
                      {fld.label}
                    </p>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate(null)}
                className="text-xs"
              >
                Tutup
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const tmpl = previewTemplate;
                  setPreviewTemplate(null);
                  handleFillForm(tmpl);
                }}
                className="text-xs gap-1.5"
              >
                <ClipboardList className="size-3.5" />
                <span>Isi Formulir Ini</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dynamic Form Modal (Buat Template / Isi Kuisioner) */}
      {formConfig && (
        <DataForm
          spec={formConfig}
          close={() => setFormConfig(null)}
        />
      )}
    </div>
  );
}
