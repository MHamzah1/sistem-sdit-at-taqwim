---
name: db-bandingkan
description: READ-ONLY — Periksa kesesuaian skema Drizzle ORM (schema.ts) terhadap berkas migrasi dan database PostgreSQL
argument-hint: [opsional: dev|test]
---

# Database — Bandingkan Skema

Skill **READ-ONLY** untuk menganalisis status sinkronisasi skema database Drizzle ORM (`src/db/schema.ts`) terhadap folder migrasi (`migrations/postgres/`) dan database yang aktif di `.env`.

Input user:
$ARGUMENTS

---

## Langkah Pemeriksaan

1. **Pemeriksaan Skema Drizzle:**
   - Jalankan pengecekan generasi migrasi Drizzle:
     ```sh
     npx drizzle-kit check
     ```
   - Periksa apakah ada perubahan di `src/db/schema.ts` yang belum memiliki berkas migrasi SQL di `migrations/postgres/`.
2. **Pemeriksaan Status Infrastruktur:**
   - Jalankan `npm run preflight` untuk memastikan konektivitas database dan keberadaan tabel `users`.
3. **Sajikan Laporan di Chat:**
   - Status berkas skema vs folder migrasi.
   - Status konektivitas database development.
   - Rekomendasi: Jika ada skema baru yang belum dimigrasi, tawarkan `/db-sinkron` atau `npm run db:generate`.
