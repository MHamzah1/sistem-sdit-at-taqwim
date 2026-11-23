"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import type { AppState } from "@/server/state";
import { Modal } from "../Modal";
import { Button } from "../ui/button";
import { examParticipantNumber } from "@/src/lib/calculations";
import { ExamCardView } from "../cards";

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
        { width: 160, margin: 1 },
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
      <div className="print-card max-w-[560px] mx-auto">
        <ExamCardView
          student={{
            id: cardStudent?.id || card.studentId,
            name: studentName,
            nis: cardStudent?.nis || "—",
            nisn: cardStudent?.nisn,
            photoUrl: cardStudent?.photoUrl,
            classId: cardStudent?.classId,
          }}
          classNameStr={className}
          participantNumber={partNumber}
          examName={card.exam.name}
          academicYearName={yearName}
          startDate={card.exam.startDate}
          endDate={card.exam.endDate}
          status={card.eligibility.status}
          qrCodeUrl={qr}
        />
      </div>
      <div className="pt-3 no-print max-w-[560px] mx-auto">
        <Button
          className="w-full h-10 gap-2 font-semibold shadow-sm"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          Cetak / Simpan PDF
        </Button>
      </div>
    </Modal>
  );
}
