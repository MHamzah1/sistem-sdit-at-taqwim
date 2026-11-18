---
name: audit-progres
description: >-
  READ-ONLY, hasil di chat — evaluasi progres modul sistem SDIT AT-TAQWIM vs spesifikasi menu dan fitur (done/partial/scaffold/missing/blocked) Gunakan ketika pengguna meminta evaluasi progres atau status kelengkapan modul dan menu SDIT AT-TAQWIM.
---

# Audit — Progres

Audit progres kelengkapan modul dan menu pada sistem SDIT AT-TAQWIM.
**Hasil hanya disajikan di chat**.
Konvensi: `.agents/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

---

## Modul yang Dievaluasi

1. **Master Data:**
   - Siswa (Data diri, NIS, NISN, relasi kelas, tanggal masuk).
   - Wali Murid (Akun login peran `WALI_MURID`, relasi ke siswa).
   - Kelas & Tahun Ajaran (Kapasitas, tahun aktif).
2. **Keuangan & SPP:**
   - Master SPP (Konfigurasi tarif nominal per tahun ajaran).
   - Tagihan SPP (Generate bulanan idempoten, status `UNPAID`/`PAID`/`OVERDUE`).
   - Pembayaran (Catat tunai langsung lunas, input transfer wali).
   - Verifikasi Transfer (Pengecekan bukti blob oleh TU, approval/rejection).
   - Tunggakan & Reminder (Daftar siswa tertunggak, tautan pesan WhatsApp).
3. **Ujian & Kelayakan:**
   - Periode Ujian (Jenis ujian, semester, batas bulan wajib bayar).
   - Kelayakan Ujian (Evaluasi otomatis 3 syarat: lunas, tanpa tunggakan lama, dispensasi).
   - Dispensasi (Pengajuan wali/TU, review TU, approval Kepala Sekolah).
   - Kartu & Validasi QR (Cetak kartu ber-QR, validasi live UUID via server).
4. **Lainnya:**
   - Karakteristik Anak (Template survei & pengisian jawaban).
   - Laporan SPP (Rekapitulasi transaksi, ekspor CSV, print view).
   - Pengaturan Sistem (Identitas sekolah, ganti password, manajemen akun).
   - Audit Log (Pencatatan riwayat aksi sensitif).

---

## Kategori Status

| Status | Makna |
|---|---|
| `done` | Berfungsi penuh ujung-ke-ujung (UI, API, database, otorisasi). |
| `partial` | UI atau API ada, namun ada alur yang belum terhubung atau belum divalidasi. |
| `scaffold` | Tampilan ada namun data masih statis/mock. |
| `missing` | Belum ada implementasi di kode. |
| `blocked` | Tertunda menunggu keputusan kebijakan sekolah atau data eksternal. |
