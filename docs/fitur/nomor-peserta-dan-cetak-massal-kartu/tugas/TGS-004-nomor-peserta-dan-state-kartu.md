# TGS-004: Format Nomor Peserta Ujian & Integrasi State Kartu Ujian

**Status:** selesai · **Fitur:** `nomor-peserta-dan-cetak-massal-kartu` · **Jenis:** Mandiri
**Bergantung pada:** tidak ada
**Kesiapan data:** tidak perlu migrasi

## Tujuan
Menyediakan generator format Nomor Peserta Ujian deterministik (`[Singkatan Ujian][2 Digit Tahun]-[Kelas]-[Urutan 3 Digit]`), menyertakan data `examCards` pada `AppState` yang terproteksi anti-IDOR, dan menampilkan nomor peserta pada modal kartu ujian individual.

## Migrasi Data
Tidak ada (menggunakan skema tabel `exam_cards` dan data yang sudah ada).

## Cakupan Spesifikasi
- US-2, US-3
- KF-1, KF-7, KF-9
- KT-1, KT-2, KT-3

## File
### Dibuat
- Tidak ada

### Diubah
- `server/state.ts` — Menyertakan query tabel `examCards` pada fungsi `readState()` dengan pengamanan scoped guardian (`scoped(s.examCards.studentId)`).
- `src/data.ts` — Menambahkan fungsi helper `examParticipantNumber()` dengan parsing singkatan jenis ujian, tahun ajaran 2-digit, nama kelas, dan urutan alfabetis siswa (A–Z).
- `src/main.tsx` — Menampilkan nomor peserta resmi pada kartu ujian individual di modal pratinjau kartu.
- `src/production.css` — Penambahan badge gaya visual `.participant-badge` dan `.participant-number`.
- `tests/business.test.ts` — Unit test untuk pengujian deterministik generator `examParticipantNumber()` dan pembatasan IDOR state `examCards`.

### Di Luar Cakupan
- Endpoint batch dan modal cetak massal (dikerjakan pada TGS-005).

## Langkah
1. Update `server/state.ts` agar `readState()` memuat `examCards`.
2. Implementasikan fungsi `examParticipantNumber()` di `src/data.ts`.
3. Tambahkan tampilan nomor peserta pada komponen modal kartu ujian di `src/main.tsx`.
4. Tambahkan test di `tests/business.test.ts`.
5. Jalankan `npm test` dan `npm run typecheck`.

## Test
Unit test di `tests/business.test.ts`:
- Perhitungan nomor peserta `examParticipantNumber()` tepat sesuai urutan alfabetis nama siswa.
- Pemformatan singkatan ujian (`PTS`, `PAS`, dsb.) dan 2 digit tahun ajaran.

## Acceptance Criteria
- [x] Buka modal kartu ujian individual di browser, nomor peserta resmi tertera rapi (misal: `PTS26-1A-001`).
- [x] `npm test` lulus tanpa error (21/21 lulus).

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui oleh pengguna
- 2026-11-19 berjalan — implementasi generator & state
- 2026-11-19 selesai — verifikasi typecheck & 21/21 test suite lulus

