"use client";

import React, { useState } from "react";
import {
  ClipboardList,
  Plus,
  Calendar,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { DataForm, type FormSpec } from "@/src/components/DataForm";
import type { AppState } from "@/server/state";

type Template = AppState["templates"][number];

export default function KarakteristikAnakPage() {
  const { state, loading, busy, save, can, isGuardian, studentName, setToast } =
    useApp();

  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat formulir karakteristik santri...</p>
        </div>
      </div>
    );
  }

  const templates = state.templates;
  const fields = state.fields;
  const submissions = state.submissions;
  const answers = state.answers;
  const students = state.students;

  const handleCreateTemplate = () => {
    setFormConfig({
      title: "Buat Template Kuisioner Karakteristik",
      fields: [
        { key: "name", label: "Nama Template (contoh: Evaluasi Karakter Triwulan 1)" },
        {
          key: "deadline",
          label: "Batas Akhir Pengisian",
          type: "date",
        },
        {
          key: "questions",
          label: "Daftar Pertanyaan (Tulis satu pertanyaan per baris)",
          type: "textarea",
        },
      ],
      submit: async (values) => {
        await save("forms", {
          name: values.name,
          deadline: values.deadline,
          fields: String(values.questions)
            .split("\n")
            .filter((q) => q.trim())
            .map((label) => ({ label, required: true })),
        });
        setToast("Template kuisioner berhasil dibuat");
        setFormConfig(null);
      },
    });
  };

  const handleFillForm = (template: Template) => {
    const templateFields = fields.filter((f) => f.templateId === template.id);

    setFormConfig({
      title: `Pengisian: ${template.name}`,
      note: `Batas pengisian: ${template.deadline}. Silakan isi pertanyaan di bawah ini dengan seksama.`,
      fields: [
        {
          key: "studentId",
          label: "Pilih Siswa / Santri",
          options: students.map((s) => ({
            value: s.id,
            label: `${s.name} (${s.nis})`,
          })),
        },
        ...templateFields.map((f) => ({
          key: f.id,
          label: f.label,
          type: "textarea",
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
        setToast("Jawaban formulir berhasil disimpan");
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
            <ClipboardList size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Lainnya</span>
              <span>/</span>
              <span>Karakteristik Anak</span>
            </div>
            <h1 className="st-title">Karakteristik & Perkembangan Anak</h1>
            <p className="st-subtitle">
              Instrumen pengamatan karakter santri, kepribadian, kedisiplinan ibadah, dan formulir isian wali.
            </p>
          </div>
        </div>

        {can("master") && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleCreateTemplate}
            >
              <Plus size={16} />
              <span>Buat Template</span>
            </button>
          </div>
        )}
      </div>

      {/* Templates Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
        {templates.map((t) => {
          const subCount = submissions.filter((s) => s.templateId === t.id).length;
          return (
            <div key={t.id} className="st-section-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div className="st-header-icon-box" style={{ width: 40, height: 40 }}>
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{t.name}</h3>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      Batas pengisian: {t.deadline}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                  {subCount} tanggapan santri telah tersimpan.
                </div>
              </div>

              <button
                type="button"
                className="st-btn-primary"
                onClick={() => handleFillForm(t)}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <ClipboardList size={15} />
                <span>Isi Formulir Ini</span>
              </button>
            </div>
          );
        })}
        {templates.length === 0 && (
          <div className="st-table-card" style={{ gridColumn: "1 / -1" }}>
            <div className="st-empty-state">
              <ClipboardList size={48} className="st-empty-icon" />
              <h3>Belum ada template kuisioner</h3>
              <p>Buat template instrumen kuisioner untuk memulai pengumpulan data karakteristik santri.</p>
            </div>
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="st-table-card">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#16613e", margin: 0 }}>
            Daftar Tanggapan & Jawaban Tersimpan
          </h2>
        </div>

        {submissions.length === 0 ? (
          <div className="st-empty-state">
            <UserCheck size={48} className="st-empty-icon" />
            <h3>Belum ada tanggapan masuk</h3>
            <p>Jawaban kuisioner yang telah diisi akan ditampilkan di sini.</p>
          </div>
        ) : (
          <div className="st-table-responsive">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Santri</th>
                  <th>Template Kuisioner</th>
                  <th>Isi Tanggapan</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => {
                  const tmpl = templates.find((t) => t.id === sub.templateId);
                  const subAnswers = answers.filter((a) => a.submissionId === sub.id);

                  return (
                    <tr key={sub.id} className="st-table-row">
                      <td className="st-col-idx">{idx + 1}</td>
                      <td>
                        <strong className="st-user-name">
                          {studentName(sub.studentId)}
                        </strong>
                      </td>
                      <td>{tmpl?.name || "—"}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                          {subAnswers.map((ans) => {
                            const fld = fields.find((f) => f.id === ans.fieldId);
                            return (
                              <div key={ans.id} style={{ background: "#f8fafc", padding: "6px 10px", borderRadius: 6 }}>
                                <strong style={{ color: "#475569", display: "block", fontSize: 12 }}>
                                  {fld?.label || "Pertanyaan"}:
                                </strong>
                                <span style={{ color: "#1e293b" }}>{ans.value}</span>
                              </div>
                            );
                          })}
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
