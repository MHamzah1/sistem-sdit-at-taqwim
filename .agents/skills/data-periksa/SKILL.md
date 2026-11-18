---
name: data-periksa
description: >-
  READ-ONLY — periksa skema/data database dev (PostgreSQL); bila data/skema perlu diubah, tulis rencana migrasi DAT-NNN yang nanti dijalankan agent lewat /data-jalankan Gunakan ketika pengguna meminta pengecekan data atau merencanakan migrasi skema/data baru.
---

# Data — Periksa

Skill ini **memeriksa dan merencanakan** migrasi data/skema PostgreSQL; eksekusinya dilakukan melalui **`/data-jalankan DAT-NNN`** setelah disetujui. Skill ini sendiri **read-only** dan tidak pernah mengubah data.
Konvensi: `.agents/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Lingkungan Database

- **Target Dev:** Neon PostgreSQL development yang dikonfigurasi pada `.env` (`DATABASE_URL`).
- **Target Test:** PGlite in-memory PostgreSQL (`tests/fixture.ts`).
- **Production:** Dikelola melalui pipeline deployment Vercel + Neon. Agent tidak menyentuh database production secara langsung.

## Langkah Pemeriksaan & Perencanaan

1. **Analisis Kebutuhan Data/Skema:**
   - Periksa `src/db/schema.ts` dan tabel yang ada.
   - Apakah membutuhkan tabel baru, penambahan kolom, enum status baru, atau seeding master data awal.
2. **Kategorikan Operasi:**
   - **tambah:** `pgTable` baru, kolom baru dengan default, enum baru.
   - **ubah:** migrasi tipe data, pembaruan data yang ada.
   - ⚠️ **hapus massal:** `dropTable`, drop column, reset data (wajib persetujuan eksplisit).
3. **Pilih Bentuk Perintah:**
   - Perubahan skema DDL: `npm run db:generate` lalu `npm run db:migrate`.
   - Seeding/inisialisasi: script mandiri di `scripts/` (seperti `scripts/init.ts`).
4. **Tulis Dokumen:**
   - Simpan di `docs/data/DAT-NNN-[nama].md` dengan status `usulan`.
   - Cantumkan: tujuan, kondisi saat ini, script/perintah migrasi, dan hasil verifikasi yang diharapkan.
5. **Balas di Chat:**
   - Tampilkan ringkasan rencana perubahan dan minta persetujuan: *"Silakan balas 'Setujui DAT-NNN' untuk mengeksekusi via /data-jalankan"*.
