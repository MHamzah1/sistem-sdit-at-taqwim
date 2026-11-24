# Active Task: FIX-001 s/d FIX-016 — Master Siswa SDIT AT-TAQWIM (V3 UI FREEZE)

- **Fitur:** Kelengkapan Master Siswa SDIT AT-TAQWIM (V3 Focused Error Fix & Mandatory UI Freeze)
- **Status:** SELESAI PADA SOURCE (Typecheck 0 error, Unit Tests 43/43 Lulus; Runtime DB Pending Gerbang DAT-001)
- **Baseline Audit:** Commit `4fec37e67b2982b4ae64577022a82861f9ee56fa` (24 November 2026, 20:36 WIB)
- **Baseline Visual Disetujui:** `e3b88d44279894261c4128ba4ee36d848dd4eb4b` (MANDATORY UI FREEZE ditaati 100%)

---

### Cakupan Perbaikan Terbaru (8 Temuan Audit FIX-010 s/d FIX-016):
1. **Temuan 01 (FIX-014) — ID Sementara Pengukuran & Bantuan:**
   - Memisahkan properti `clientKey: string` untuk rendering React dari `id: string` UUID database.
   - Record pengukuran dan bantuan baru tidak mengirim `id` sementara (`temp-...`) ke backend; `getPayload()` menyaring properti tersebut.
   - Backend membedakan `INSERT` vs `UPDATE` berbasis keberadaan `id` sah, memvalidasi kepemilikan siswa, dan mencegah duplikasi via idempotency.
2. **Temuan 02 (FIX-011) — Integrasi Pas Foto:**
   - Memisahkan `photoPreviewUrl` (URL blob lokal browser), `photoStoragePath` (pathname storage privat), dan `photoBlob` (berkas biner hasil crop).
   - Menghapus fallback `"actor"`; actor diambil dari identitas sesi aktif `session?.user?.id`.
   - Membuat helper `getStudentPhotoUrl(student)` di `src/lib/api.ts` yang menangani storage path via endpoint `/api/students/:id/photo`.
   - Mengonfigurasi header `Cache-Control: private, no-store, max-age=0, must-revalidate` dan `X-Content-Type-Options: nosniff`.
3. **Temuan 03 (FIX-010) — Normalisasi Resume Draft:**
   - Memperbaiki mapper `normalizeDraftData` untuk mengekstrak data ayah, ibu, dan wali dari struktur bersarang `family.*.data`.
   - Memulihkan referensi `familyMemberId`, field pendaftaran/registrasi (`classId`, `enrolledOn`), dan tahun ajaran ke state form.
   - Round-trip save draft -> load -> normalize menghasilkan state identik 100%.
4. **Temuan 04 (FIX-012, FIX-013) — Integrasi & Keamanan Import XLSX:**
   - Menegakkan `process.env.AUTH_SECRET` (melempar HTTP 500 `CONFIG_ERROR` jika tidak diset, menghapus fallback secret hardcoded).
   - Menambahkan persistent replay protection pada `commitStudentImport` via `s.auditLogs` (`entity: "student_import_token"`).
   - Resolusi kelas memprioritaskan tahun ajaran aktif dan menandai error ambiguitas lintas tahun ajaran.
   - Parser tanggal masuk mendukung ISO (`YYYY-MM-DD`), format Indonesia (`DD/MM/YYYY`, `DD-MM-YYYY`), dan serial number Excel.
5. **Temuan 05 (FIX-011) — Validasi Berkas Fisik:**
   - Mengimplementasikan `verifyStudentFile(pathname, mimeTypes, maxBytes)` pada `server/files.ts`.
   - Memvalidasi keberadaan fisik via `head()`, batas ukuran 5 MB, dan magic bytes biner (JPEG `FF D8 FF`, PNG `89 50 4E 47`, PDF `%PDF-`, WEBP `RIFF...WEBP`).
6. **Temuan 06 (FIX-014) — Persistensi Skema Siswa:**
   - Menambahkan kolom `headCircumferenceCm` pada tabel `studentPeriodicData` dan kolom `amount` pada `studentAidRecords` di `src/db/schema.ts` (additive nullable, 0 migrasi live).
   - Backend memproyeksikan dan menyimpan kedua field tersebut pada DTO mutasi profil siswa.
7. **Temuan 07 (FIX-013, FIX-015) — Konsistensi Kalkulasi Kelengkapan Biodata:**
   - Membuat mesin kalkulasi tunggal `src/lib/completeness.ts` yang bebas dependensi server/browser.
   - Menyelaraskan status indikator checklist 10 section pada sidebar form `StudentFormView.tsx` dengan evaluasi backend.
8. **Temuan 08 (FIX-016) — Test Suite & Pelaporan Resmi:**
   - Memperluas unit test suite `tests/student-master.test.ts` menjadi 43 pengujian (seluruhnya LULUS).
   - Memulihkan matriks asli TC-01 s/d TC-100 dan mendokumentasikan TC-101 s/d TC-124 pada `LAPORAN_FIX_MASTER_SISWA_V3_UI_FREEZE.md`.

---

### Bukti Verifikasi Aktual:
- `npm run typecheck` (`tsc --noEmit`): **LULUS (Exit code 0, 0 error)**
- `npx tsx --test tests/student-master.test.ts`: **LULUS (43 of 43 tests passed, 0 failed, ~1.4s)**

---

### Kepatuhan Larangan Operasional:
- `drizzle-kit push` / `db:migrate` live: **TIDAK DIJALANKAN (Aman, menunggu tiket DAT-001)**
- `npm run build` / `npm run dev`: **TIDAK DIJALANKAN (Aman, sesuai instruksi)**
- Perombakan visual UI: **0 PERUBAHAN VISUAL (MANDATORY UI FREEZE ditaati 100%)**

---

### Laporan Resmi:
- [LAPORAN_FIX_MASTER_SISWA_V3_UI_FREEZE.md](file:///c:/Users/Admin/Documents/AxoIndo\Client\SDIT-AT-TAQWIM\SourceCode\sistem-sdit-at-taqwim\LAPORAN_FIX_MASTER_SISWA_V3_UI_FREEZE.md)
