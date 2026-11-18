---
name: fitur-riset
description: Fitur 1/4 — riset codebase SDIT AT-TAQWIM → docs/fitur/[slug]/1-riset.md, lalu berhenti
argument-hint: [Nama Fitur] lalu penjelasan bebas (boleh multi-baris)
---

# Fitur — Riset

Ubah ide fitur mentah menjadi **dokumen riset yang berpijak pada kode nyata**.
Konvensi objek, ID, dan status: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Tugas Agen

Baris pertama `$ARGUMENTS` = **nama fitur**. Sisanya = penjelasan kebutuhan.

1. **Riset Codebase:** Baca kode existing + dokumentasi terkait sampai tahu apa yang **sudah ada** dan apa yang **belum**.
2. **Tulis Dokumen:** Simpan di `docs/fitur/[slug]/1-riset.md` secara detail, dengan file path nyata.
3. **Berhenti:** Jangan membuat keputusan final atau menulis kode di sini. Keputusan dikunci di `/fitur-wawancara`.

Jika bukan fitur baru:
- Sistem rusak/menyimpang → `/isu-diagnosa`.
- Sudah benar tapi ingin diubah → `/revisi-wawancara`.

## Konvensi Slug

Huruf kecil, kebab-case, maks ~5 kata (contoh: `rekap-presensi-ujian`, `notifikasi-tagihan-wali`).
Slug ini menjadi nama folder yang digunakan konsisten di seluruh rantai fitur:
`docs/fitur/[slug]/`

## Sumber Rujukan Riset Wajib

1. **Aturan & Konteks:** `.claude/rules/project-context.md`, `kelayakan-dan-keuangan.md`, `backend-serverless.md`.
2. **Dokumentasi Sistem:** `docs/API.md`, `docs/AUDIT.md`, `docs/DEPLOYMENT.md`, `docs/FINAL-REPORT.md`.
3. **Database Schema:** `src/db/schema.ts` (relasi siswa, wali, kelas, invoice, pembayaran, ujian, dispensasi).
4. **Logika Bisnis:** `server/business.ts`, `server/security.ts`, `server/files.ts`, `server/resources.ts`.
5. **Antarmuka & Komponen:** `app/**`, `src/components.tsx`, `src/data.ts`, `src/lib/api.ts`.
