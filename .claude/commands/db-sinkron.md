---
name: db-sinkron
description: Terapkan migrasi Drizzle ORM yang tertunda ke database PostgreSQL development
argument-hint: [opsional: migrate|init]
---

# Database — Sinkronisasi

Skill untuk mengeksekusi migrasi skema database yang tertunda ke database PostgreSQL target development.
Konvensi: `.claude/rules/database.md`.

Input user:
$ARGUMENTS

---

## Gerbang Keselamatan

1. **Hanya Database Development:** Pastikan `DATABASE_URL` di `.env` mengarah ke database development Neon, bukan database production.
2. Dilarang melakukan reset database sembarangan tanpa persetujuan eksplisit.

## Langkah Eksekusi

1. **Sinkronkan Migrasi Drizzle:**
   ```sh
   npm run db:migrate
   ```
2. **Inisialisasi Master & Super Admin (Jika Database Kosong):**
   ```sh
   npm run db:init
   ```
3. **Verifikasi:**
   Jalankan `npm test` untuk memastikan tes integrasi tetap lulus dengan skema terbaru.
4. **Laporkan Hasil:**
   Sajikan ringkasan hasil eksekusi migrasi di chat.
