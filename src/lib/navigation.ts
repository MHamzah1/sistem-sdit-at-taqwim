export interface MenuItem {
  label: string;
  url: string;
  key: string;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const menuGroups: MenuGroup[] = [
  {
    label: "",
    items: [{ label: "Dashboard", url: "/dashboard", key: "dashboard" }],
  },
  {
    label: "MASTER DATA",
    items: [
      { label: "Siswa", url: "/master/siswa", key: "students" },
      { label: "Wali Murid", url: "/master/wali", key: "guardians" },
      { label: "Kelas & Tahun Ajaran", url: "/master/kelas", key: "classes" },
    ],
  },
  {
    label: "KEUANGAN",
    items: [
      { label: "Master SPP", url: "/keuangan/master-spp", key: "master" },
      { label: "Tagihan SPP", url: "/keuangan/tagihan", key: "invoices" },
      { label: "Pembayaran", url: "/keuangan/pembayaran", key: "payments" },
      { label: "Verifikasi Transfer", url: "/keuangan/verifikasi", key: "verify" },
      { label: "Tunggakan & Reminder", url: "/keuangan/tunggakan", key: "arrears" },
    ],
  },
  {
    label: "UJIAN",
    items: [
      { label: "Periode Ujian", url: "/ujian/periode", key: "exams" },
      { label: "Kelayakan Ujian", url: "/ujian/kelayakan", key: "eligibility" },
      { label: "Dispensasi", url: "/ujian/dispensasi", key: "dispensation" },
      { label: "Kartu & Validasi QR", url: "/ujian/kartu", key: "cards" },
    ],
  },
  {
    label: "LAINNYA",
    items: [
      { label: "Karakteristik Anak", url: "/karakteristik/template", key: "forms" },
      { label: "Laporan", url: "/laporan/spp", key: "reports" },
      { label: "Pengaturan Sistem", url: "/system/configuration", key: "settings" },
      { label: "Audit Log", url: "/system/audit", key: "audit" },
    ],
  },
];
