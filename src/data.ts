export const money = (amount: number) => 'Rp' + amount.toLocaleString('id-ID');
export const statusLabels: Record<string, string> = { UNPAID: 'Belum bayar', PENDING_VERIFICATION: 'Menunggu verifikasi', PAID: 'Lunas', OVERDUE: 'Lewat jatuh tempo', APPROVED: 'Disetujui', REJECTED: 'Ditolak', SUBMITTED: 'Diajukan', REVIEWED: 'Direview TU', NOT_EVALUATED: 'Belum dievaluasi', NOT_ELIGIBLE: 'Belum layak', ELIGIBLE: 'Layak ujian', ELIGIBLE_DISPENSATION: 'Layak · Dispensasi' };
export const menuGroups = [
  { label: '', items: [['Dashboard', '/dashboard', 'dashboard']] },
  { label: 'MASTER DATA', items: [['Siswa', '/master/siswa', 'students'], ['Wali Murid', '/master/wali', 'guardians'], ['Kelas & Tahun Ajaran', '/master/kelas', 'classes']] },
  { label: 'KEUANGAN', items: [['Master SPP', '/keuangan/master-spp', 'master'], ['Tagihan SPP', '/keuangan/tagihan', 'invoices'], ['Pembayaran', '/keuangan/pembayaran', 'payments'], ['Verifikasi Transfer', '/keuangan/verifikasi', 'verify'], ['Tunggakan & Reminder', '/keuangan/tunggakan', 'arrears']] },
  { label: 'UJIAN', items: [['Periode Ujian', '/ujian/periode', 'exams'], ['Kelayakan Ujian', '/ujian/kelayakan', 'eligibility'], ['Dispensasi', '/ujian/dispensasi', 'dispensation'], ['Kartu & Validasi QR', '/ujian/kartu', 'cards']] },
  { label: 'LAINNYA', items: [['Karakteristik Anak', '/karakteristik/template', 'forms'], ['Laporan', '/laporan/spp', 'reports'], ['Pengaturan Sistem', '/system/configuration', 'settings'], ['Audit Log', '/system/audit', 'audit']] },
];
