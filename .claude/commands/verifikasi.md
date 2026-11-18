---
description: Gerbang verifikasi resmi untuk TGS/ISU/REV — typecheck, unit test, Next.js build, audit diff; vonis LULUS / GAGAL / SEBAGIAN berbukti
argument-hint: (kosong = objek di _ACTIVE-TASK.md) atau TGS-NNN / ISU-NNN / REV-NNN
---

# Verifikasi

Tidak ada klaim "selesai", "beres", atau "berhasil" tanpa skill ini dan outputnya yang **dibaca secara nyata**.
Konvensi: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Langkah

1. **Identifikasi Objek:**
   Ambil ID dari `_ACTIVE-TASK.md` (atau argumen input). Baca dokumen tiket terkait — *Acceptance Criteria* / *Definition of Done* adalah checklist yang diverifikasi.

2. **Jalankan Seluruh Perintah Pengujian (Wajib Lolos):**
   ```bash
   npm run typecheck      # TypeScript check (tsc --noEmit)
   npm test               # Node test runner (node:test via PGlite terisolasi)
   npm run build          # Kompilasi produksi Next.js (App Router)
   ```
   Catat hasil angka nyata (misalnya: `typecheck: 0 error`, `test: 20 pass, 0 fail`, `build: compiled successfully`).

3. **Audit Diff (`git status` & `git diff`):**
   Periksa seluruh berkas yang dimodifikasi terhadap aturan baku:

   | Hal yang Diperiksa | Pola / Ketentuan |
   |---|---|
   | **Guardian Scoping** | Route/query tidak membocorkan data siswa ke wali murid yang tidak memiliki relasi di `guardian_students`. |
   | **Transaksi Finansial** | Setiap perubahan status pembayaran, generate invoice, atau approval dispensasi wajib di dalam `db.transaction()`. |
   | **Query Parameterized** | Dilarang raw SQL string concat; wajib menggunakan operator Drizzle (`eq`, `and`, `sql` template). |
   | **Zero Secret Leak** | Tidak ada `AUTH_SECRET`, password mentah, scrypt hash, atau token rahasia yang ter-stage di Git atau bocor di respon API. |
   | **Pembersihan Log** | Tidak ada `console.log`/`console.debug` debug yang tertinggal di `server/` atau `app/`. |
   | **Format UI** | Nominal uang menggunakan helper `money()`, status menggunakan kamus `statusLabels`, tanggal WIB. |

4. **Verifikasi Khusus per Objek:**
   - **ISU:** Test regresi atau bukti reproduksi menunjukkan gejala awal sudah 100% hilang.
   - **TGS/REV:** Setiap butir kriteria penerimaan diperiksa satu per satu dengan bukti konkrit.
   - Perubahan tampilan menu → tawarkan `/uji-browser`.

5. **Vonis Akhir (Dicatat di `_ACTIVE-TASK.md`):**
   - **LULUS**: Seluruh perintah lolos (hijau), audit diff bersih, semua kriteria terpenuhi.
   - **SEBAGIAN**: Sebagian kriteria belum terpenuhi atau belum tuntas diverifikasi.
   - **GAGAL**: Terdapat error kompilasi, test gagal, atau pelanggaran aturan keamanan.

6. **Laporkan Hasil di Chat:**
   Sajikan vonis beserta angka nyata. Jika LULUS, tawarkan untuk menutup tiket via `/laporan`.
