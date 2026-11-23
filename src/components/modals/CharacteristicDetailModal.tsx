"use client";

import React from "react";
import {
  Printer,
  Calendar,
  User,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import type { AppState } from "@/server/state";
import { Modal } from "../Modal";
import { Button } from "../ui/button";
import { Badge } from "../Badge";
import { formatDateTimeIndo } from "@/src/lib/formatters";

type Submission = AppState["submissions"][number];

interface CharacteristicDetailModalProps {
  submission: Submission | null;
  state: AppState;
  close: () => void;
}

export function CharacteristicDetailModal({
  submission,
  state,
  close,
}: CharacteristicDetailModalProps) {
  if (!submission) return null;

  const student = state.students.find((s) => s.id === submission.studentId);
  const studentClass = state.classes.find((c) => c.id === student?.classId);
  const template = state.templates.find((t) => t.id === submission.templateId);
  const templateFields = state.fields
    .filter((f) => f.templateId === submission.templateId)
    .sort((a, b) => a.position - b.position);

  const subAnswers = state.answers.filter(
    (a) => a.submissionId === submission.id,
  );

  const submitter = state.users.find((u) => u.id === submission.submittedBy);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const answeredCount = subAnswers.filter((a) => a.value.trim().length > 0).length;
  const totalCount = templateFields.length;
  const isComplete = totalCount > 0 && answeredCount >= totalCount;

  return (
    <Modal
      title="Lembar Evaluasi Karakter & Perkembangan Santri"
      close={close}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="flex flex-col gap-5 pt-1">
        {/* Header Profil Santri */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-full bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center font-bold text-base font-heading">
              {student?.name?.charAt(0) || "S"}
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                {student?.name || "Nama Santri"}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-mono">
                  <User className="size-3 text-muted-foreground/80" />
                  NIS: {student?.nis || "—"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="size-3 text-muted-foreground/80" />
                  {studentClass?.name || "Kelas —"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              {isComplete ? "Tuntas Diisi" : `${answeredCount}/${totalCount} Terisi`}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {formatDateTimeIndo(submission.createdAt)}
            </span>
          </div>
        </div>

        {/* Informasi Kuisioner & Pengisi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-card border border-border/80 flex items-start gap-2.5">
            <ClipboardList className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block text-[11px]">
                Instrumen Kuisioner
              </span>
              <strong className="text-foreground font-semibold">
                {template?.name || "Instrumen Karakter"}
              </strong>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border/80 flex items-start gap-2.5">
            <User className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block text-[11px]">
                Diisi Oleh
              </span>
              <strong className="text-foreground font-semibold">
                {submitter?.name || "Wali Murid / Guru"}
              </strong>
            </div>
          </div>
        </div>

        {/* Daftar Pertanyaan & Jawaban Terstruktur */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" />
              Butir Pengamatan & Tanggapan
            </h4>
            <span className="text-xs text-muted-foreground">
              {templateFields.length} Butir Penilaian
            </span>
          </div>

          <div className="space-y-3">
            {templateFields.map((field, idx) => {
              const ans = subAnswers.find((a) => a.fieldId === field.id);
              const answerText = ans?.value || "— (Belum diisi)";

              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-2xs transition-all hover:border-primary/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-semibold text-foreground leading-snug">
                        {field.label}
                      </p>
                      <div className="rounded-lg bg-muted/30 border-l-3 border-primary/60 px-3.5 py-2.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {answerText}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="gap-2 text-xs"
          >
            <Printer className="size-3.5" />
            <span>Cetak Lembar Santri</span>
          </Button>

          <Button
            type="button"
            onClick={close}
            className="text-xs px-5"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
