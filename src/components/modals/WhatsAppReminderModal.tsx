"use client";

import React, { useState, useEffect } from "react";
import { Copy, MessageSquare } from "lucide-react";
import type { AppState } from "@/server/state";
import { Modal } from "../Modal";
import { money, formatMonthName } from "@/src/lib/formatters";
import {
  calculateArrearsRisk,
  buildReminderMessage,
  type ReminderTemplateKey,
} from "@/src/lib/calculations";

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
      guardianName,
      studentName: student.name,
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
      <div className="wa-modal-body">
        <div className="wa-meta-box">
          <div className="wa-meta-item">
            <span className="wa-meta-label">Siswa</span>
            <span className="wa-meta-val">
              {student.name} ({student.nis}) · Kelas {className}
            </span>
          </div>
          <div className="wa-meta-item">
            <span className="wa-meta-label">Wali Murid</span>
            <span className="wa-meta-val">
              {guardianName} {rawPhone ? `(${rawPhone})` : "(Belum ada No. WA)"}
            </span>
          </div>
          <div className="wa-meta-item">
            <span className="wa-meta-label">Total Tunggakan</span>
            <span className="wa-meta-val">
              {money(totalAmount)} ({unpaidMonths.length} bulan)
            </span>
          </div>
          <div className="wa-meta-item">
            <span className="wa-meta-label">Tingkat Risiko</span>
            <span className="wa-meta-val">
              <span className={`risk-badge ${risk.badgeClass}`}>
                {risk.label}
              </span>{" "}
              <small style={{ color: "#64748b" }}>{risk.description}</small>
            </span>
          </div>
          {unpaidMonths.length > 0 && (
            <div className="wa-meta-item" style={{ gridColumn: "1 / -1" }}>
              <span className="wa-meta-label">Rincian Bulan Tertunggak</span>
              <span
                className="wa-meta-val"
                style={{ fontSize: "12px", color: "#475569" }}
              >
                {unpaidMonths.map(formatMonthName).join(", ")}
              </span>
            </div>
          )}
        </div>

        <div className="wa-form-group">
          <label className="wa-form-label" htmlFor="wa-template-select">
            <span>Pilihan Template Pesan:</span>
            <small style={{ fontWeight: "normal", color: "#64748b" }}>
              {templateKey === "auto"
                ? `Rekomendasi otomatis: ${risk.label}`
                : ""}
            </small>
          </label>
          <select
            id="wa-template-select"
            className="wa-template-select"
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
          </select>
        </div>

        <div className="wa-form-group">
          <label className="wa-form-label" htmlFor="wa-message-textarea">
            <span>Redaksi Pesan WhatsApp:</span>
            <small style={{ fontWeight: "normal", color: "#64748b" }}>
              Dapat diedit langsung sebelum dikirim
            </small>
          </label>
          <textarea
            id="wa-message-textarea"
            className="wa-message-textarea"
            rows={10}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
        </div>

        {!cleanPhone && (
          <div className="notice amber" style={{ margin: 0 }}>
            Nomor WhatsApp wali murid belum tercatat atau tidak valid. Silakan
            salin pesan dan kirim secara manual.
          </div>
        )}

        <div className="wa-actions-row">
          <button type="button" className="btn secondary" onClick={close}>
            Tutup
          </button>
          <button
            type="button"
            className={`btn-wa-copy ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            title="Salin isi pesan ke clipboard"
          >
            <Copy size={16} />
            {copied ? "Tersalin ke Clipboard!" : "Salin Pesan"}
          </button>
          {cleanPhone ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa-send"
              title="Buka percakapan WhatsApp Web / Aplikasi"
            >
              <MessageSquare size={16} />
              Buka WhatsApp
            </a>
          ) : (
            <button
              type="button"
              className="btn-wa-send"
              disabled
              title="Nomor telepon tidak valid"
            >
              <MessageSquare size={16} />
              Buka WhatsApp
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
