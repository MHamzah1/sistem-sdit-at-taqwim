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
