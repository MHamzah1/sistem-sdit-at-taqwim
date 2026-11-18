---
name: tugas-kerjakan
description: Kerjakan tugas TGS-NNN yang sudah disetujui — ubah source sesuai file tugasnya, verifikasi, dan lanjut otomatis jika mode batch
argument-hint: TGS-NNN atau "semua" / rentang tugas
---

# Tugas — Kerjakan

Kerjakan tugas dari `/fitur-pecah-tugas`. File tugas = sumber kebenaran, bukan chat.
Konvensi: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

---

## 🚀 Dua Mode Eksekusi: Tunggal vs Batch (Anti Tanya Berulang)

1. **Mode Tunggal (Satu Tugas):** Dipanggil dengan ID spesifik, misal `/tugas-kerjakan TGS-001`.
2. **Mode Batch (Kerjakan Semua Sekaligus):**
   - Dipicu jika user meminta: *"kerjakan semua tugas"*, *"lanjut semua"*, *"setujui dan kerjakan semua"*, atau argumen `"semua"` / `"TGS-001 s/d TGS-005"`.
   - **Agen WAJIB mengeksekusi seluruh antrean tugas berurutan secara otomatis:**
     `TGS-A` → `/verifikasi` → `/laporan` → **langsung ambil TGS-B** → `/verifikasi` → `/laporan` → ... hingga seluruh tugas tuntas.
   - **DILARANG** berhenti di antara tugas hanya untuk bertanya *"Apakah bisa dilanjutkan untuk TGS berikutnya?"*.
   - Agen hanya berhenti jika terjadi error/test gagal yang butuh intervensi atau bila seluruh tugas telah `selesai` 100%.

---

## Gerbang (Cek Sebelum Menyentuh Source)

1. **Identifikasi ID / Antrean:**
   - Single: Ambil ID `TGS-NNN`.
   - Batch: Baca file `docs/fitur/[slug]/4-urutan-tugas.md`, cari tugas pertama yang berstatus `disetujui` dan dependensinya sudah `selesai`.
2. Temukan file tugas: Glob `docs/fitur/*/tugas/TGS-NNN-*.md`.
3. **Status harus `disetujui`.** Jika masih `usulan` tapi user sudah menyatakan "setujui semua", perbarui statusnya menjadi `disetujui` dan langsung mulai.
4. Semua tugas di **Bergantung pada** harus sudah `selesai`.
5. Tulis atau perbarui `_ACTIVE-TASK.md` untuk tugas yang sedang aktif dikerjakan.

---

## Langkah Pengerjaan

1. **Baca:** file tugas, `3-spesifikasi.md` fiturnya, dan rules terkait arsitektur Next.js & Drizzle.
2. **Mulai:** status tugas → `berjalan` (+ Riwayat Status), perbarui kolom Status di `4-urutan-tugas.md`, dan tulis `_ACTIVE-TASK.md`.
3. **Kerjakan Implementasi:**
   - **Frontend:** Komponen Next.js App Router (`app/`), UI baku di `src/components.tsx`, helper `api()` di `src/lib/api.ts`.
   - **Backend API:** Route Handler `app/api/[[...route]]/route.ts`, controller `server/app.ts`, business logic `server/business.ts`.
   - **Database:** Type-safe Drizzle ORM di `src/db/schema.ts`.
4. **Pengujian Unit & Integrasi:**
   - Tambahkan skenario pengujian di `tests/business.test.ts` untuk logika finansial atau kelayakan ujian baru.
   - Jalankan `npm test` untuk memastikan seluruh suite hijau.
5. **Migrasi Database (Bila Ada Perubahan Skema):**
   - Jalankan `npm run db:generate` untuk menghasilkan file SQL migrasi di `migrations/postgres/`.
   - Jalankan `npm run db:migrate` untuk menerapkan ke database dev.
6. **Verifikasi:** Jalankan `/verifikasi`.
7. **Tutup Tugas:** Jalankan `/laporan` untuk menutup status tugas menjadi `selesai`.
8. **Rantai Otomatis (Jika Mode Batch):**
   - Ambil tugas berikutnya dari `4-urutan-tugas.md` dan langsung jalankan tanpa berhenti bertanya.
