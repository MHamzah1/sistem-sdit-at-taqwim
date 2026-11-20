import { formatMonthName } from "./formatters";

const satuan = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
];

function angkaKeKata(n: number): string {
  n = Math.floor(n);
  if (n <= 0) return "";
  if (n < 12) return satuan[n];
  if (n < 20) return (angkaKeKata(n - 10) + " Belas").trim();
  if (n < 100)
    return (
      angkaKeKata(Math.floor(n / 10)) +
      " Puluh " +
      angkaKeKata(n % 10)
    ).trim();
  if (n < 200) return ("Seratus " + angkaKeKata(n - 100)).trim();
  if (n < 1000)
    return (
      angkaKeKata(Math.floor(n / 100)) +
      " Ratus " +
      angkaKeKata(n % 100)
    ).trim();
  if (n < 2000) return ("Seribu " + angkaKeKata(n - 1000)).trim();
  if (n < 1000000)
    return (
      angkaKeKata(Math.floor(n / 1000)) +
      " Ribu " +
      angkaKeKata(n % 1000)
    ).trim();
  if (n < 1000000000)
    return (
      angkaKeKata(Math.floor(n / 1000000)) +
      " Juta " +
      angkaKeKata(n % 1000000)
    ).trim();
  if (n < 1000000000000)
    return (
      angkaKeKata(Math.floor(n / 1000000000)) +
      " Milyar " +
      angkaKeKata(n % 1000000000)
    ).trim();
  return (
    angkaKeKata(Math.floor(n / 1000000000000)) +
    " Triliun " +
    angkaKeKata(n % 1000000000000)
  ).trim();
}

export function terbilang(amount: number): string {
  if (amount <= 0) return "Nol Rupiah";
  const kata = angkaKeKata(amount).replace(/\s+/g, " ").trim();
  return kata ? `${kata} Rupiah` : "Nol Rupiah";
}

export function receiptNumber(paidOn: string, id: string): string {
  const dateStr = paidOn.replace(/-/g, "");
  const code = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `KW-${dateStr}-${code}`;
}

export const statusLabels: Record<string, string> = {
  UNPAID: "Belum bayar",
  PENDING_VERIFICATION: "Menunggu verifikasi",
  PAID: "Lunas",
  OVERDUE: "Lewat jatuh tempo",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  SUBMITTED: "Diajukan",
  REVIEWED: "Direview TU",
  NOT_EVALUATED: "Belum dievaluasi",
  NOT_ELIGIBLE: "Belum layak",
  ELIGIBLE: "Layak ujian",
  ELIGIBLE_DISPENSATION: "Layak · Dispensasi",
};

export function examParticipantNumber(
  examName: string,
  yearName: string,
  className: string,
  studentId: string,
  classStudents: Array<{ id: string; name: string }> = [],
): string {
  let examCode = "UJN";
  const upperExam = (examName || "").toUpperCase();
  if (
    upperExam.includes("PENILAIAN TENGAH SEMESTER") ||
    upperExam.includes("PTS") ||
    upperExam.includes("UTS")
  ) {
    examCode = "PTS";
  } else if (
    upperExam.includes("PENILAIAN AKHIR SEMESTER") ||
    upperExam.includes("PAS") ||
    upperExam.includes("UAS")
  ) {
    examCode = "PAS";
  } else if (
    upperExam.includes("PENILAIAN AKHIR TAHUN") ||
    upperExam.includes("PAT") ||
    upperExam.includes("UKK")
  ) {
    examCode = "PAT";
  } else if (
    upperExam.includes("UJIAN SEKOLAH") ||
    upperExam.includes("US") ||
    upperExam.includes("USEK")
  ) {
    examCode = "UAS";
  } else {
    const acronymMatch = upperExam.match(/\b[A-Z]{2,4}\b/);
    if (acronymMatch) {
      examCode = acronymMatch[0];
    } else {
      const words = upperExam
        .replace(/[^A-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean);
      if (words.length > 1) {
        examCode = words
          .map((w) => w[0])
          .join("")
          .slice(0, 4);
      } else if (words.length === 1 && words[0].length >= 3) {
        examCode = words[0].slice(0, 3);
      }
    }
  }

  let yearCode = new Date().getFullYear().toString().slice(-2);
  const yearMatch = (yearName || "").match(/20(\d{2})/);
  if (yearMatch) {
    yearCode = yearMatch[1];
  } else {
    const digitsMatch = (yearName || "").match(/(\d{2})/);
    if (digitsMatch) {
      yearCode = digitsMatch[1];
    }
  }

  let cleanClass = (className || "")
    .replace(/kelas|rombel/gi, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  if (!cleanClass) cleanClass = "XX";

  const sortedStudents = [...classStudents].sort((a, b) =>
    a.name.localeCompare(b.name, "id-ID", { sensitivity: "base" }),
  );
  const studentIndex = sortedStudents.findIndex((s) => s.id === studentId);
  const seqNumber =
    studentIndex >= 0 ? String(studentIndex + 1).padStart(3, "0") : "001";

  return `${examCode}${yearCode}-${cleanClass}-${seqNumber}`;
}

export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export type RiskInfo = {
  level: RiskLevel;
  label: string;
  badgeClass: string;
  description: string;
};

export function calculateArrearsRisk(unpaidMonths: number): RiskInfo {
  if (unpaidMonths <= 0) {
    return {
      level: "NONE",
      label: "Lancar",
      badgeClass: "risk-none",
      description: "Tidak ada tunggakan SPP",
    };
  }
  if (unpaidMonths === 1) {
    return {
      level: "LOW",
      label: "Risiko Rendah",
      badgeClass: "risk-low",
      description: "Tunggakan 1 bulan",
    };
  }
  if (unpaidMonths === 2) {
    return {
      level: "MEDIUM",
      label: "Risiko Sedang",
      badgeClass: "risk-medium",
      description: "Tunggakan 2 bulan",
    };
  }
  return {
    level: "HIGH",
    label: "Risiko Tinggi",
    badgeClass: "risk-high",
    description: "Tunggakan ≥3 bulan (kritis ujian)",
  };
}

export type ReminderTemplateKey =
  | "auto"
  | "routine"
  | "due_date"
  | "exam_critical"
  | "dispensation";

export type ReminderMessageParams = {
  guardianName: string;
  studentName: string;
  className: string;
  totalAmount: number;
  unpaidMonths: string[];
  examName?: string;
  deadline?: string;
  templateKey?: ReminderTemplateKey;
  hasDispensation?: boolean;
};

export function buildReminderMessage(params: ReminderMessageParams): string {
  const {
    guardianName,
    studentName,
    className,
    totalAmount,
    unpaidMonths,
    examName,
    deadline,
    templateKey = "auto",
    hasDispensation = false,
  } = params;

  const count = unpaidMonths.length;
  const formattedMonths = unpaidMonths.map(formatMonthName).join(", ");
  const formattedAmount = "Rp" + totalAmount.toLocaleString("id-ID");
  const defaultDeadline = deadline || "tanggal 10 bulan berjalan";

  let key = templateKey;
  if (key === "auto") {
    if (hasDispensation) {
      key = "dispensation";
    } else if (count >= 3 || examName) {
      key = "exam_critical";
    } else if (count === 2) {
      key = "due_date";
    } else {
      key = "routine";
    }
  }

  if (key === "routine") {
    const examNote = examName ? ` untuk administrasi *${examName}*` : "";
    return `Assalamu’alaikum Wr. Wb. Bapak/Ibu ${guardianName},
Semoga Bapak/Ibu sekeluarga senantiasa dalam keadaan sehat dan penuh berkah.

Kami menginformasikan bahwa iuran SPP ananda *${studentName}* (Kelas ${className}) untuk bulan ${formattedMonths || "berjalan"} sebesar *${formattedAmount}* telah terbit.

Pembayaran dapat dilakukan melalui transfer rekening sekolah atau langsung di kasir Tata Usaha sebelum ${defaultDeadline}${examNote}.

Terima kasih atas perhatian dan kerja sama Bapak/Ibu.
Wassalamu’alaikum Wr. Wb.
*Tata Usaha SDIT AT-TAQWIM*`;
  }

  if (key === "due_date") {
    const examNote = examName ? ` untuk administrasi *${examName}*` : "";
    return `Assalamu’alaikum Wr. Wb. Bapak/Ibu ${guardianName},
Mengingatkan kembali kewajiban administrasi SPP ananda *${studentName}* (Kelas ${className}) yang saat ini tercatat menunggak *${count} bulan* (${formattedMonths}) dengan total *${formattedAmount}*.

Mohon kesediaan Bapak/Ibu untuk menyelesaikan pelunasan sebelum ${defaultDeadline}${examNote} demi kelancaran operasional pendidikan ananda.

Apabila pembayaran telah dilakukan, mohon konfirmasi ke kami atau unggah bukti transfer di portal wali.
Wassalamu’alaikum Wr. Wb.
*Tata Usaha SDIT AT-TAQWIM*`;
  }

  if (key === "dispensation") {
    const examNote = examName ? ` untuk administrasi *${examName}*` : "";
    return `Assalamu’alaikum Wr. Wb. Bapak/Ibu ${guardianName},
Menindaklanjuti pengajuan dispensasi administrasi${examNote} untuk ananda *${studentName}* (Kelas ${className}) dengan sisa tanggungan sebesar *${formattedAmount}* (${formattedMonths}).

Kami mengingatkan kesepakatan komitmen pembayaran yang dijadwalkan sebelum *${defaultDeadline}*.

Terima kasih atas kerja sama dan komitmen Bapak/Ibu.
Wassalamu’alaikum Wr. Wb.
*Tata Usaha SDIT AT-TAQWIM*`;
  }

  const examInfo = examName
    ? `administrasi pelaksanaan *${examName}*`
    : "administrasi ujian sekolah";
  return `Assalamu’alaikum Wr. Wb. Bapak/Ibu ${guardianName},
Diberitahukan dengan hormat mengenai administrasi ananda *${studentName}* (Kelas ${className}), tercatat tunggakan SPP sebanyak *${count} bulan* (${formattedMonths}) sebesar *${formattedAmount}*.

Sehubungan dengan ${examInfo}, kami menghimbau pelunasan sebelum *${defaultDeadline}* agar kartu ujian ananda dapat segera diterbitkan.

Bagi Bapak/Ibu yang memiliki kendala khusus, silakan segera berkoordinasi dengan pihak sekolah atau mengajukan permohonan dispensasi resmi kepada Kepala Sekolah.

Terima kasih.
Wassalamu’alaikum Wr. Wb.
*Tata Usaha SDIT AT-TAQWIM*`;
}
