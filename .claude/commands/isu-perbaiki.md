---
description: Perbaiki SATU isu ISU-NNN yang rencana perbaikannya sudah disetujui — reproduksi dulu, test regresi (RED), perbaiki (GREEN), lalu /verifikasi
argument-hint: ISU-NNN
---

# Isu — Perbaiki

Eksekusi perbaikan bug berdasarkan `docs/isu/ISU-NNN-*/rencana-perbaikan.md`.
Disiplin: Memperbaiki dimulai dari **membuktikan isunya ada (RED)**, dan diakhiri dengan **bukti isunya hilang (GREEN)**.
Konvensi: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Gerbang (Cek Sebelum Eksekusi)

1. Input harus satu `ISU-NNN`.
2. Folder `docs/isu/ISU-NNN-*/` harus memiliki `laporan-isu.md` dan `rencana-perbaikan.md`.
3. **Status `rencana-perbaikan.md` harus `disetujui`** oleh user.
4. Periksa `_ACTIVE-TASK.md`, pastikan tidak ada konflik tiket aktif lain.

## Langkah

1. **Baca Dokumen:** Pelajari `laporan-isu.md`, `rencana-perbaikan.md`, dan rules terkait file yang akan disentuh.
2. **Mulai Tiket:** Ubah status menjadi `berjalan` (+ Riwayat Status), buat `_ACTIVE-TASK.md` (`# ACTIVE TASK: ISU-NNN — [judul]`).
3. **Reproduksi Masalah:**
   - Buktikan bahwa isu benar-benar terjadi pada kode saat ini.
   - Jangan pernah memperbaiki sesuatu yang tidak terbukti rusak.
4. **Tulis Test Regresi (RED):**
   - Untuk bug pada logika backend (kalkulasi SPP, kelayakan ujian, otorisasi, relasi wali), tulis skenario test baru di `tests/business.test.ts`.
   - Jalankan `npm test` dan pastikan tes tersebut **gagal karena bug ini**. Catat output errornya.
5. **Perbaiki Kode (GREEN):**
   - Ubah kode secara minimal HANYA pada file yang tercantum di **File Terdampak**.
   - Jalankan kembali `npm test` dan pastikan seluruh test kini **lulus (hijau)**.
6. **Verifikasi:**
   - Jalankan `/verifikasi` (typecheck, unit test, Next.js build).
7. **Tutup Isu:**
   - Jalankan `/laporan` untuk menutup isu menjadi `selesai`.
