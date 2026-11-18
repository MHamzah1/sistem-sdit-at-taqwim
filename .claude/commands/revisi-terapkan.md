---
name: revisi-terapkan
description: Terapkan SATU revisi REV-NNN yang sudah disetujui — hanya Keputusan Terkunci, lalu /verifikasi
argument-hint: REV-NNN
---

# Revisi — Terapkan

Eksekusi dokumen revisi dari `/revisi-wawancara`. Dokumen itu sumber kebenaran, bukan chat.
Konvensi: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Gerbang (Cek Sebelum Eksekusi)

1. Input harus satu `REV-NNN`. (`TGS-` → `/tugas-kerjakan`; `ISU-` → `/isu-perbaiki`).
2. Berkas: `docs/revisi/REV-NNN-*.md`. Belum ada → arahkan ke `/revisi-wawancara`.
3. **Status dokumen harus `disetujui`** oleh user.
4. Periksa `_ACTIVE-TASK.md`, pastikan tidak ada tiket aktif lain.

## Langkah Pengerjaan

1. **Baca Dokumen Revisi:**
   - Fokus pada bagian **Keputusan Terkunci**, **File Terdampak**, dan **Checklist Definition of Done**.
   - Q&A yang masih pending (`[ ]`) bukan keputusan — jangan diasumsikan sendiri.
2. **Mulai Tiket:**
   - Status → `berjalan` (+ Riwayat Status).
   - Tulis `_ACTIVE-TASK.md` (`# ACTIVE TASK: REV-NNN — [topik]`).
3. **Terapkan Perubahan Kode:**
   - **Frontend:** Next.js App Router (`app/`), komponen baku `src/components.tsx`, helper `src/lib/api.ts`.
   - **Backend:** `server/app.ts`, `server/business.ts`, `server/resources.ts`.
   - **Database:** `src/db/schema.ts` (jika ada penambahan kolom/enum).
4. **Pengujian:**
   - Tulis/perbarui pengujian di `tests/business.test.ts` jika revisi menyentuh kalkulasi bisnis.
   - Jalankan `npm test` untuk memastikan regression-free.
5. **Verifikasi:**
   - Jalankan `/verifikasi`.
6. **Tutup Tiket:**
   - Jalankan `/laporan` untuk menutup status revisi menjadi `selesai`.
