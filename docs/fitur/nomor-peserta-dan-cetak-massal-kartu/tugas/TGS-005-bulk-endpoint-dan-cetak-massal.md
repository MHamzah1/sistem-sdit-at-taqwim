# TGS-005: Endpoint Batch Kartu Ujian & Komponen Cetak Massal Kartu Ujian (2 Kartu / Lembar A4)

**Status:** selesai · **Fitur:** `nomor-peserta-dan-cetak-massal-kartu` · **Jenis:** Mandiri
**Bergantung pada:** TGS-004 (membutuhkan helper nomor peserta dan state examCards)
**Kesiapan data:** tidak perlu migrasi

## Tujuan
Menyediakan endpoint `POST /api/exam-cards/bulk` di server, tombol aksi cetak massal dan modal lembar cetak (`BulkCardsModal`) di antarmuka web, serta styling cetak isolatif `@media print` untuk mencetak 2 kartu per lembar A4 dengan garis potong dan QR code tajam.

## Migrasi Data
Tidak ada.

## Cakupan Spesifikasi
- US-1, US-2
- KF-2, KF-3, KF-4, KF-5, KF-6, KF-8
- KNF-1, KNF-2
- KT-4, KT-5

## File
### Dibuat
- Tidak ada

### Diubah
- `server/app.ts` — Endpoint `POST /api/exam-cards/bulk` dengan autentikasi staf (principal/master), evaluasi otomatis kelayakan tiap siswa, insert kartu idempoten (`onConflictDoNothing`), dan pengembalian daftar kartu siswa layak beserta ringkasan lewati siswa tidak layak.
- `src/main.tsx` — Menambahkan tombol "Cetak Massal Kartu" di halaman kartu ujian (`/ujian/kartu`), komponen `BulkCardsModal`, filter kelas / semua kelas, kalkulasi QR code massal via `Promise.all()`, dan pemanggilan cetak.
- `src/production.css` — Penambahan gaya tata letak lembar cetak massal `.bulk-cards-sheet`, `.bulk-card-page`, `.bulk-card-item`, `.bulk-cut-line`, serta konfigurasi `@media print` 2 kartu per lembar A4.
- `tests/business.test.ts` — Integration test untuk endpoint batch kartu ujian (`/api/exam-cards/bulk`).

### Di Luar Cakupan
- Pencetakan kartu untuk siswa berstatus `NOT_ELIGIBLE` (dilarang oleh aturan bisnis).

## Langkah
1. Buat endpoint `POST /api/exam-cards/bulk` di `server/app.ts`.
2. Tambahkan CSS `.bulk-cards-sheet` dan styling pemotong di `src/production.css`.
3. Implementasikan `BulkCardsModal` dan tombol cetak massal di `src/main.tsx`.
4. Tambahkan integration test di `tests/business.test.ts`.
5. Jalankan verifikasi lengkap: `npm run typecheck`, `npm test`, dan `npm run build`.

## Test
Integration test di `tests/business.test.ts`:
- Endpoint `POST /api/exam-cards/bulk` hanya membuat kartu untuk siswa berstatus `ELIGIBLE` / `ELIGIBLE_DISPENSATION`.
- Siswa yang tidak layak (`NOT_ELIGIBLE`) dilewati dan dihitung dalam ringkasan.

## Acceptance Criteria
- [x] Tombol "Cetak Massal Kartu" muncul di `/ujian/kartu`.
- [x] Staf dapat memfilter per kelas atau mencetak semua siswa layak sekaligus.
- [x] Modal menampilkan pratinjau lembar cetak massal 2 kartu per lembar A4 dengan garis putus-putus pembatas dan QR code ter-render jelas.
- [x] `npm test`, `npm run typecheck`, dan `npm run build` lulus 100% (22/22 unit tests lulus).

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui oleh pengguna
- 2026-11-19 berjalan — implementasi endpoint batch, UI lembar cetak massal, styling cetak A4
- 2026-11-19 selesai — verifikasi typecheck, 22/22 test suite, dan build Next.js sukses

