# TGS-009: Badge Risiko Tabel & Modal WhatsApp Interaktif

**Status:** selesai · **Fitur:** `risiko-tunggakan-dan-whatsapp` · **Jenis:** Mandiri
**Bergantung pada:** TGS-008 (membutuhkan helper kalkulasi risiko dan generator template pesan)
**Kesiapan data:** tidak perlu migrasi

## Tujuan
Menampilkan badge tingkat risiko (`RiskBadge`) pada kolom tunggakan di tabel siswa dan dashboard, serta menyediakan modal interaktif `WhatsAppReminderModal` di `src/main.tsx` lengkap dengan pilihan template pesan, editor teks live, tombol salin pesan, dan tombol buka WhatsApp.

## Migrasi Data
Tidak ada.

## Cakupan Spesifikasi
- US-1, US-2, US-3
- KF-1, KF-2, KF-3, KF-4, KF-5
- KNF-1, KNF-2
- KT-1, KT-5

## File
### Dibuat
- Tidak ada

### Diubah
- `src/main.tsx` — Menambahkan rendering `RiskBadge` di tabel siswa (`studentTable`), komponen `WhatsAppReminderModal`, tombol pemicu reminder yang membuka modal pratinjau, dan integrasi clipboard salin teks.
- `src/production.css` — Penambahan styling `.risk-badge`, `.risk-low`, `.risk-medium`, `.risk-high`, dan tata letak modal reminder WhatsApp.
- `tests/business.test.ts` — Pengujian integrasi alur reminder.

### Di Luar Cakupan
- Pengiriman otomatis bot backend (tetap Click-to-WhatsApp manual sesuai PRD).

## Langkah
1. Tambahkan CSS `.risk-badge` dan `.wa-modal` di `src/production.css`.
2. Integrasikan `RiskBadge` pada kolom tunggakan di `studentTable` pada `src/main.tsx`.
3. Implementasikan `WhatsAppReminderModal` di `src/main.tsx`.
4. Jalankan verifikasi lengkap: `npm run typecheck`, `npm test`, dan `npm run build`.

## Test
- Verifikasi badge risiko muncul pada siswa yang memiliki invoice tertunggak.
- `npm test` lulus tanpa error.
- Next.js production build berhasil.

## Acceptance Criteria
- [x] Buka halaman `/keuangan/tunggakan`, setiap siswa menunggak memiliki badge tingkat risiko (Rendah / Sedang / Kritis).
- [x] Klik tombol "WhatsApp" membuka modal pratinjau pesan, template bisa dipilih, pesan bisa diedit, tombol salin dan buka WA berfungsi.
- [x] `npm test`, `npm run typecheck`, dan `npm run build` lulus 100%.

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui oleh pengguna
- 2026-11-19 berjalan — mulai implementasi UI dan modal interaktif
- 2026-11-19 selesai — lolos verifikasi typecheck, 23/23 unit tests, dan build Next.js Turbopack
