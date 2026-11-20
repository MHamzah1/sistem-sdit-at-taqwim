"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import type { AppState } from "@/server/state";
import { Brand } from "../Brand";
import { Badge } from "../Badge";
import { Modal } from "../Modal";
import { examParticipantNumber } from "@/src/lib/calculations";

export interface ExamCardData {
  eligibility: AppState["eligibilities"][number];
  exam: AppState["exams"][number];
  verificationCode: string;
  studentId: string;
}

interface ExamCardModalProps {
  card: ExamCardData | null;
  data: AppState;
  close: () => void;
}

export function ExamCardModal({ card, data, close }: ExamCardModalProps) {
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (card && typeof window !== "undefined") {
      void QRCode.toDataURL(
        `${window.location.origin}/ujian/kartu?code=${card.verificationCode}`,
        { width: 160 },
      ).then(setQr);
    } else {
      setQr("");
    }
  }, [card]);

  if (!card) return null;

  const cardStudent = data.students.find((s) => s.id === card.studentId);
  const cardClassStudents = data.students.filter(
    (s) => s.classId === cardStudent?.classId,
  );
  const yearName =
    data.academicYears.find((y) => y.id === card.exam.academicYearId)?.name || "—";
  const className =
    data.classes.find((c) => c.id === cardStudent?.classId)?.name || "—";
  const studentName = cardStudent?.name || "Siswa";

  const partNumber = examParticipantNumber(
    card.exam.name,
    yearName,
    className,
    card.studentId,
    cardClassStudents,
  );

  return (
    <Modal title="Kartu peserta ujian" close={close}>
      <div className="print-card">
        <Brand />
        <div className="card-heading">
          <h2>KARTU PESERTA UJIAN</h2>
          <p>
            {card.exam.name} · {yearName}
          </p>
        </div>
        <div className="exam-card-body">
          <div>
            <div className="participant-badge">
              <strong>No. Peserta: </strong>
              <span className="participant-number">{partNumber}</span>
            </div>
            <h3>{studentName}</h3>
            <p>
              NIS: {cardStudent?.nis} · NISN: {cardStudent?.nisn || "—"}
            </p>
            <p>Kelas: {className}</p>
            <Badge status={card.eligibility.status} />
          </div>
          <div className="exam-card-media">
            {cardStudent?.photoUrl ? (
              <div className="student-photo-frame">
                <img
                  src={cardStudent.photoUrl}
                  alt="Pas foto siswa"
                  className="student-card-photo"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="student-photo-placeholder">
                <span>
                  Pas Foto
                  <br />3 x 4
                </span>
              </div>
            )}
            {qr && (
              <img
                src={qr}
                alt="QR validasi kartu ujian"
                width={120}
                height={120}
              />
            )}
          </div>
        </div>
        <p>
          Pelaksanaan: {card.exam.startDate} – {card.exam.endDate}
        </p>
        <small>Kode verifikasi: {card.verificationCode}</small>
        <p>Validasi QR oleh petugas sekolah yang sudah masuk.</p>
      </div>
      <button className="primary full no-print" onClick={() => window.print()}>
        <Printer size={16} />
        Cetak / Simpan PDF
      </button>
    </Modal>
  );
}
