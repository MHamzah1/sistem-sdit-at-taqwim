---
name: audit-kode
description: >-
  READ-ONLY, hasil di chat — sapuan bug berisiko, inkonsistensi data, dan penyimpangan dari aturan sistem SDIT AT-TAQWIM Gunakan ketika pengguna meminta audit kualitas kode, sapuan bug, atau pemeriksaan kepatuhan aturan sistem.
---

# Audit — Kode

Audit **masalah pada implementasi yang sudah ada**: bug berisiko, celah otorisasi, inkonsistensi transaksi, dan **penyimpangan dari aturan proyek**.
Konvensi: `.agents/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

**Hasil hanya di chat**, tanpa membuat file baru. Temuan yang disepakati untuk diperbaiki dilanjutkan ke `/isu-diagnosa` (membuat tiket `ISU-NNN`).

---

## Aspek Pemeriksaan Wajib

### 1. Hard Rules & Keamanan Sekolah
- **Guardian Scoping:** Apakah ada endpoint atau query yang mengambil data siswa/tagihan tanpa menyaring `guardianId` saat aktornya adalah wali murid?
- **Otorisasi Role:** Apakah tindakan approval transfer hanya diizinkan untuk TU/Finance? Apakah approval dispensasi dikunci hanya untuk Kepala Sekolah?
- **Kalkulasi Nominal Finansial:** Apakah nominal pembayaran dihitung dari server, atau ada celah client menentukan nominal sendiri?
- **Integritas Foreign Key:** Apakah ada fungsi delete yang dapat menghapus siswa/kelas yang sudah memiliki riwayat tagihan?
- **Penyimpanan Berkas:** Apakah berkas bukti transfer divalidasi magic bytes dan disimpan di private Blob?

### 2. Kualitas Kode & Standar Next.js
- Apakah ada penggunaan `console.log` debug yang tertinggal?
- Apakah ada komponen client yang lupa `'use client'` atau memanggil objek browser (`window`, `document`) saat server render?
- Apakah format uang konsisten menggunakan `money()` dan tanggal menggunakan zona WIB?
- Apakah ada raw SQL concatenation yang rentan injection?

### 3. Format Output di Chat
Sajikan temuan dalam kategori:
- 🔴 **Kritis (Risiko Keamanan / Bug Finansial)**
- 🟡 **Penyimpangan Standar (Inkonsistensi / Code Debt)**
- 🟢 **Rekomendasi Tindak Lanjut (Tawarkan /isu-diagnosa)**
