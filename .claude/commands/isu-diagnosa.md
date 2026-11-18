---
description: READ-ONLY — telusuri akar masalah sistem yang sudah ada sampai file:baris → docs/isu/ISU-NNN-[nama]/ (laporan isu + rencana perbaikan)
argument-hint: keluhan bebas / screenshot / UJI-NNN TC-NN / ISU-NNN yang belum didiagnosa
---

# Isu — Diagnosa

Analisis masalah pada sistem yang **sudah berjalan** — bug, error kalkulasi SPP, kelayakan ujian tidak sesuai, data tampil salah, atau perilaku yang menyimpang dari aturan — sampai akar penyebabnya, lalu tulis rencana perbaikan.
Konvensi: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Read-Only (Mutlak)

- **Tidak mengubah source aplikasi**, konfigurasi, maupun database.
- Boleh: membaca kode/docs, menjalankan `npm test`, atau memeriksa schema database.
- Yang ditulis hanya folder `docs/isu/ISU-NNN-[nama]/`.
- Sistem sudah benar tetapi user ingin alur yang berbeda → itu **revisi** (`/revisi-wawancara`), bukan isu.

## Langkah

1. **Tentukan ISU:**
   - Input `ISU-NNN` → lanjutkan folder itu.
   - Keluhan baru → cek `docs/isu/`. Jika belum ada, nomor baru = `ISU-NNN` terbesar + 1.
2. **Pahami Gejala:**
   - Apa yang dilihat user, di menu mana (Siswa, Tagihan, Pembayaran, Ujian, Kartu QR), role akun apa, dan kapan terjadi.
3. **Reproduksi Masalah:**
   - Coba simulasikan alur logika melalui unit test atau telusuri parameter request.
4. **Telusuri Rantai Penyebab:**
   - Rantai penelusuran: Komponen Layar (`app/**`, `src/main.tsx`) → API Helper (`src/lib/api.ts`) → Route Handler (`app/api/[[...route]]/route.ts`) → Dispatcher (`server/app.ts`) → Logic (`server/business.ts` / `resources.ts` / `files.ts`) → Schema DB (`src/db/schema.ts`).
   - Bandingkan dengan aturan baku di `.claude/rules/kelayakan-dan-keuangan.md` dan `project-context.md`.
5. **Tulis Dokumen:**
   - Buat `docs/isu/ISU-NNN-[nama]/laporan-isu.md` (gejala, bukti penelusuran, dampak).
   - Buat `docs/isu/ISU-NNN-[nama]/rencana-perbaikan.md` (solusi terpilih, file terdampak, skenario test regresi), status `usulan`.
6. **Balas di Chat:**
   - Sajikan ringkasan akar masalah (1–3 kalimat), solusi terpilih, link dokumen rencana, dan kalimat penutup: *"Silakan balas 'Setujui ISU-NNN' untuk mengeksekusi perbaikan melalui /isu-perbaiki"*.
