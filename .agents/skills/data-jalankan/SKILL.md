---
name: data-jalankan
description: >-
  Jalankan SATU migrasi skema/data DAT-NNN yang sudah disetujui ke database PostgreSQL — perintah persis dari file DAT, lalu cocokkan hasilnya Gunakan ketika pengguna menyetujui migrasi skema/data DAT-NNN untuk dieksekusi ke database PostgreSQL development.
---

# Data — Jalankan

Agent **menjalankan** migrasi data/skema database dari rencana `DAT-NNN` yang ditulis `/data-periksa`.
File DAT = sumber kebenaran: hanya perintah yang tertulis di file yang boleh dieksekusi.
Konvensi: `.agents/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Gerbang (Cek Sebelum Eksekusi)

1. Input harus satu ID `DAT-NNN`.
2. Temukan file: Glob `docs/data/DAT-NNN-*.md`.
3. **Status harus `disetujui`** oleh user (atau *"ikut TGS-NNN"* jika direncanakan di tugas yang disetujui).
4. Jika ada operasi ⚠️ *hapus massal*, wajib ada persetujuan eksplisit yang menyebut ID `DAT-NNN`.
5. Pastikan koneksi database development di `.env` (`DATABASE_URL`) valid.

## Langkah Eksekusi

1. **Baca Berkas DAT:**
   - Pastikan perintah migrasi sudah siap (misalnya: `npm run db:generate`, `npm run db:migrate`, atau pemanggilan script via `npx tsx scripts/...`).
2. **Mulai Eksekusi:**
   - Ubah status menjadi `berjalan` (+ Riwayat Status).
3. **Jalankan Perintah Sesuai Rencana:**
   - Eksekusi perintah secara berurutan dan baca output lognya.
   - Jika terjadi kegagalan atau error database, **berhenti seketika**. Jangan lanjutkan langkah berikutnya.
4. **Verifikasi Hasil:**
   - Jalankan query verifikasi atau `npm test` untuk memastikan integritas skema dan data tetap terjaga.
5. **Catat Hasil:**
   - Isi bagian **Hasil** di file DAT: waktu eksekusi, ringkasan output, dan konfirmasi kecocokan.
6. **Perbarui Status:**
   - Jika berhasil: ubah status menjadi `selesai`.
   - Jika gagal: ubah status menjadi `terblokir` dan laporkan kendala ke user.
7. **Penutup:**
   - Tawarkan `/laporan` untuk menutup tiket.
