# TGS-007: Antarmuka Master Siswa & Integrasi Pas Foto pada Kartu Ujian

**Status:** selesai · **Fitur:** `kelengkapan-identitas-siswa` · **Jenis:** Mandiri
**Bergantung pada:** TGS-006 (membutuhkan kolom skema dan validasi server)
**Kesiapan data:** tidak perlu migrasi tambahan

## Tujuan
Memperbarui form dialog Tambah/Edit Siswa dan tabel Master Siswa di menu Tata Usaha (`/master/siswa`), serta menampilkan NISN dan pas foto 3x4 (dengan fallback placeholder avatar) pada kartu ujian individual dan lembar cetak massal A4 (`/ujian/kartu`).

## Migrasi Data
Tidak ada.

## Cakupan Spesifikasi
- US-1, US-2, US-3
- KF-1, KF-2, KF-3, KF-4
- KNF-1, KNF-2
- KT-3, KT-4, KT-5

## File
### Dibuat
- Tidak ada

### Diubah
- `src/main.tsx` — Menambahkan field form siswa (`nisn`, `gender`, `birthPlace`, `birthDate`, `photoUrl`), memperbarui tabel siswa dengan badge gender dan thumbnail foto/avatar, memperluas pencarian cepat untuk NISN, serta mengintegrasikan NISN dan pas foto 3x4 pada modal kartu ujian individual dan komponen `BulkCardsModal`.
- `src/production.css` — Penambahan gaya pas foto 3x4 `.student-card-photo`, `.student-photo-frame`, `.student-photo-placeholder`, badge gender, dan penyesuaian `@media print`.
- `tests/business.test.ts` — Pengujian rendering dan integritas data identitas pada kartu ujian.

### Di Luar Cakupan
- Sinkronisasi Dapodik online langsung.

## Langkah
1. Tambahkan konfigurasi field form baru di `studentFields` pada `src/main.tsx`.
2. Perbarui kolom tabel siswa dan filter pencarian cepat di `src/main.tsx`.
3. Tambahkan komponen pas foto 3x4 dan label NISN pada kartu individual di `src/main.tsx`.
4. Tambahkan komponen pas foto 3x4 dan label NISN pada lembar cetak massal `BulkCardsModal` di `src/main.tsx`.
5. Tambahkan gaya visual di `src/production.css`.
6. Jalankan verifikasi lengkap: `npm run typecheck`, `npm test`, dan `npm run build`.

## Test
- Verifikasi pencarian NISN di tabel siswa.
- `npm test` lulus tanpa error.
- Next.js build sukses.

## Acceptance Criteria
- [x] Buka menu `/master/siswa`, form tambah/edit memiliki input NISN, Jenis Kelamin, Tempat Lahir, Tanggal Lahir, dan URL Foto.
- [x] Buka modal kartu ujian individual dan modal cetak massal, tertera label NISN dan pas foto 3x4 (atau placeholder avatar rapi jika foto belum diisi).
- [x] `npm test`, `npm run typecheck`, dan `npm run build` lulus 100%.

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui oleh pengguna
- 2026-11-19 berjalan — implementasi UI form, tabel, kartu foto 3x4
- 2026-11-19 selesai — verifikasi typecheck, 22/22 unit tests, dan build Next.js lulus

