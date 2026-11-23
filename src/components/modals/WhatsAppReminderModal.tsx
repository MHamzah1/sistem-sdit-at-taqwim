"use client";

import React, { useState, useEffect } from "react";
import { Copy, MessageSquare, Check, AlertCircle } from "lucide-react";
import type { AppState } from "@/server/state";
import { Modal } from "../Modal";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { money, formatMonthName } from "@/src/lib/formatters";
import {
  calculateArrearsRisk,
  buildReminderMessage,
  type ReminderTemplateKey,
} from "@/src/lib/calculations";
import { cn } from "@/src/lib/utils";

type Student = AppState["students"][number];

interface WhatsAppReminderModalProps {
  student: Student;
  data: AppState;
  exam?: AppState["exams"][number];
  close: () => void;
}

export function WhatsAppReminderModal({
  student,
  data,
  exam,
  close,
}: WhatsAppReminderModalProps) {
  const link = data.guardianStudents.find((gs) => gs.studentId === student.id);
  const guardian = link
    ? data.guardians.find((g) => g.id === link.guardianId)
    : null;
  const guardianName = guardian ? guardian.name : "Wali Murid";
  const rawPhone = guardian?.phone || "";
  let cleanPhone = rawPhone.replace(/[\s()+.-]/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);

  const classroom = data.classes.find((c) => c.id === student.classId);
  const className = classroom ? classroom.name : "—";

  const unpaidInvoices = data.invoices
    .filter((i) => i.studentId === student.id && i.status !== "PAID")
    .sort((a, b) => a.month.localeCompare(b.month));
  const totalAmount = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const unpaidMonths = unpaidInvoices.map((i) => i.month);

  const hasDispensation = exam
    ? data.dispensations.some(
        (d) =>
          d.studentId === student.id &&
          d.examPeriodId === exam.id &&
          d.status === "APPROVED",
      )
    : false;

  const risk = calculateArrearsRisk(unpaidMonths.length);

  const [templateKey, setTemplateKey] = useState<ReminderTemplateKey>("auto");
  const [messageText, setMessageText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const msg = buildReminderMessage({
      studentName: student.name,
      guardianName,
      className,
      totalAmount,
      unpaidMonths,
      examName: exam?.name,
      deadline: exam?.administrativeDeadline,
      templateKey,
      hasDispensation,
    });
    setMessageText(msg);
  }, [
    student.name,
    guardianName,
    className,
    totalAmount,
    unpaidMonths,
    exam?.name,
    exam?.administrativeDeadline,
    templateKey,
    hasDispensation,
  ]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
    : "";

  return (
    <Modal title="Pengingat Tagihan SPP (WhatsApp)" close={close}>
      <div className="space-y-4 text-xs">
        {/* Metadata Information Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/30">
          <div>
            <span className="block text-[11px] font-medium text-muted-foreground">Siswa</span>
            <span className="font-semibold text-foreground">
              {student.name} ({student.nis}) · Kelas {className}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-muted-foreground">Wali Murid</span>
            <span className="font-semibold text-foreground">
              {guardianName} {rawPhone ? `(${rawPhone})` : "(Belum ada No. WA)"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-muted-foreground">Total Tunggakan</span>
            <span className="font-bold text-destructive">
              {money(totalAmount)} ({unpaidMonths.length} bulan)
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-muted-foreground">Tingkat Risiko</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant={
                  unpaidMonths.length >= 3
                    ? "destructive"
                    : unpaidMonths.length >= 2
                      ? "warning"
                      : "neutral"
                }
              >
                {risk.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {risk.description}
              </span>
            </div>
          </div>

          {unpaidMonths.length > 0 && (
            <div className="sm:col-span-2 pt-2 border-t border-border/50">
              <span className="block text-[11px] font-medium text-muted-foreground">
                Rincian Bulan Tertunggak
              </span>
              <span className="font-medium text-foreground">
                {unpaidMonths.map(formatMonthName).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Template Selector */}
        <div className="space-y-1.5">
          <label
            htmlFor="wa-template-select"
            className="block text-xs font-semibold text-foreground/90"
          >
            Pilihan Template Pesan
          </label>
          <Select
            id="wa-template-select"
            value={templateKey}
            onChange={(e) =>
              setTemplateKey(e.target.value as ReminderTemplateKey)
            }
          >
            <option value="auto">
              Otomatis (Sesuai Tingkat Risiko: {risk.label})
            </option>
            <option value="routine">Pengingat Rutin SPP (1 Bulan)</option>
            <option value="due_date">Peringatan Jatuh Tempo (2 Bulan)</option>
            <option value="exam_critical">
              Peringatan Kritis Kelayakan Ujian (≥3 Bulan)
            </option>
            <option value="dispensation">Pengingat Janji Bayar Dispensasi</option>
          </Select>
        </div>

        {/* Message Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="wa-message-textarea"
              className="block text-xs font-semibold text-foreground/90"
            >
              Redaksi Pesan WhatsApp
            </label>
            <span className="text-[10px] text-muted-foreground">
              Dapat disunting langsung
            </span>
          </div>
          <textarea
            id="wa-message-textarea"
            rows={8}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex w-full rounded-lg border border-input bg-card p-3 font-mono text-xs text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 leading-relaxed resize-y"
          />
        </div>

        {!cleanPhone && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs">
            <AlertCircle className="size-4 shrink-0 text-amber-600" />
            <span>
              Nomor WhatsApp wali murid belum tercatat atau tidak valid. Silakan
              salin pesan dan kirim secara manual.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={close} className="w-full sm:w-auto">
            Tutup
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full sm:w-auto gap-2"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>Salin Pesan</span>
              </>
            )}
          </Button>

          {cleanPhone ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button type="button" className="w-full gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white">
                <MessageSquare className="size-4" />
                Buka WhatsApp
              </Button>
            </a>
          ) : (
            <Button
              type="button"
              disabled
              className="w-full sm:w-auto gap-2"
            >
              <MessageSquare className="size-4" />
              Buka WhatsApp
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
