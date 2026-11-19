# TGS-008: Kalkulator Risiko & Endpoint WhatsApp Fleksibel

**Status:** disetujui · **Fitur:** `risiko-tunggakan-dan-whatsapp` · **Jenis:** Mandiri
**Bergantung pada:** tidak ada
**Kesiapan data:** tidak perlu migrasi

## Tujuan
Menyediakan helper kalkulasi tingkat risiko tunggakan (`calculateArrearsRisk()`), generator template pesan WhatsApp dinamis multi-skenario di `src/data.ts`, serta pembaruan endpoint `GET /api/students/:id/reminder` di `server/app.ts` agar dapat dipanggil dengan atau tanpa periode ujian dan merinci daftar bulan tunggakan.

## Migrasi Data
Tidak ada.

## Cakupan Spesifikasi
- US-1, US-2, US-3
- KF-6, KF-7, KF-8
- KT-1, KT-2, KT-3, KT-4

## File
### Dibuat
- Tidak ada

### Diubah
- `src/data.ts` — Fungsi `calculateArrearsRisk(debtsCount)` dan generator pesan WhatsApp `buildReminderMessage(...)` dengan 4 skenario template.
- `server/app.ts` — Peningkatan route `students/:id/reminder` agar parameter `examId` bersifat opsional, mendukung `templateKey`, menyertakan rincian bulan menunggak, dan mengembalikan data terstruktur.
- `tests/business.test.ts` — Unit test logika tingkat risiko dan integration test pemanggilan reminder tanpa ujian.

### Di Luar Cakupan
- Tampilan modal antarmuka dan badge di tabel (dikerjakan pada TGS-009).

## Langkah
1. Implementasikan `calculateArrearsRisk` dan `buildReminderMessage` di `src/data.ts`.
2. Perbarui endpoint `GET /api/students/:id/reminder` di `server/app.ts`.
3. Tambahkan skenario test di `tests/business.test.ts`.
4. Jalankan `npm test` dan `npm run typecheck`.

## Test
Unit & integration test di `tests/business.test.ts`:
- Perhitungan tingkat risiko: 1 bulan = LOW, 2 bulan = MEDIUM, ≥3 bulan = HIGH.
- Endpoint reminder dapat dipanggil tanpa `examId` dan menghasilkan pesan tanggal jatuh tempo SPP bulanan.
- Pesan merinci daftar bulan yang menunggak.

## Acceptance Criteria
- [ ] Endpoint `students/:id/reminder` berhasil dipanggil baik dengan maupun tanpa `examId`.
- [ ] `npm test` dan `npm run typecheck` lulus 100%.

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui oleh pengguna
