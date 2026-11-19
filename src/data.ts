export const money = (amount: number) => "Rp" + amount.toLocaleString("id-ID");

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
export const menuGroups = [
  { label: "", items: [["Dashboard", "/dashboard", "dashboard"]] },
  {
    label: "MASTER DATA",
    items: [
      ["Siswa", "/master/siswa", "students"],
      ["Wali Murid", "/master/wali", "guardians"],
      ["Kelas & Tahun Ajaran", "/master/kelas", "classes"],
    ],
  },
  {
    label: "KEUANGAN",
    items: [
      ["Master SPP", "/keuangan/master-spp", "master"],
      ["Tagihan SPP", "/keuangan/tagihan", "invoices"],
      ["Pembayaran", "/keuangan/pembayaran", "payments"],
      ["Verifikasi Transfer", "/keuangan/verifikasi", "verify"],
      ["Tunggakan & Reminder", "/keuangan/tunggakan", "arrears"],
    ],
  },
  {
    label: "UJIAN",
    items: [
      ["Periode Ujian", "/ujian/periode", "exams"],
      ["Kelayakan Ujian", "/ujian/kelayakan", "eligibility"],
      ["Dispensasi", "/ujian/dispensasi", "dispensation"],
      ["Kartu & Validasi QR", "/ujian/kartu", "cards"],
    ],
  },
  {
    label: "LAINNYA",
    items: [
      ["Karakteristik Anak", "/karakteristik/template", "forms"],
      ["Laporan", "/laporan/spp", "reports"],
      ["Pengaturan Sistem", "/system/configuration", "settings"],
      ["Audit Log", "/system/audit", "audit"],
    ],
  },
];

export function examParticipantNumber(
  examName: string,
  yearName: string,
  className: string,
  studentId: string,
  classStudents: Array<{ id: string; name: string }> = [],
): string {
  // 1. Singkatan jenis ujian (PTS, PAS, PAT, dsb.)
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

  // 2. Tahun ajaran 2-digit (misal: "2026/2027" -> "26")
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

  // 3. Nama rombel kelas yang dibersihkan (misal: "Kelas 1A" -> "1A")
  let cleanClass = (className || "")
    .replace(/kelas|rombel/gi, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  if (!cleanClass) cleanClass = "XX";

  // 4. Nomor urut 3 digit berdasarkan urutan alfabetis nama siswa di kelas
  const sortedStudents = [...classStudents].sort((a, b) =>
    a.name.localeCompare(b.name, "id-ID", { sensitivity: "base" }),
  );
  const studentIndex = sortedStudents.findIndex((s) => s.id === studentId);
  const seqNumber =
    studentIndex >= 0 ? String(studentIndex + 1).padStart(3, "0") : "001";

  return `${examCode}${yearCode}-${cleanClass}-${seqNumber}`;
}
