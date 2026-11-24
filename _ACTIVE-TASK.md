# Active Task: FIX-001 s/d FIX-016 — Master Siswa SDIT AT-TAQWIM (V3 UI FREEZE)

- **Fitur:** Kelengkapan Master Siswa SDIT AT-TAQWIM (V3 Focused Error Fix & Mandatory UI Freeze)
- **Status:** SELESAI PADA SOURCE (Typecheck 0 error, Unit Tests 25/25 Lulus; Runtime DB Pending Gerbang DAT-001)
- **Baseline Audit:** Commit `4fec37e67b2982b4ae64577022a82861f9ee56fa` (24 November 2026, 20:36 WIB)
- **Baseline Visual Disetujui:** `e3b88d44279894261c4128ba4ee36d848dd4eb4b` (MANDATORY UI FREEZE ditaati 100%)

---

### Cakupan Perbaikan Terbaru (FIX-010 s/d FIX-016):
- **FIX-010 (CRITICAL):** Perbaiki Draft & Finalisasi:
  - Transisi status atomik `DRAFT -> FINALIZED` pada `createStudentAtomic` (`where id = draftId and status = 'DRAFT'`).
  - Pencegahan pembaruan dan penghapusan draft yang sudah `FINALIZED` (HTTP 409).
  - Mapper normalisasi khusus `normalizeDraftData` memetakan objek `addresses` & `family` ke array DTO form yang sah, mengeliminasi error `.find is not a function`.
- **FIX-011 (CRITICAL):** Perbaiki Pas Foto & Dokumen:
  - Tampilan upload dan crop 3x4 dipertahankan; integrasi `canvas.toBlob()` untuk upload ke storage private `@vercel/blob` via `/api/files/upload`.
  - Kompatibilitas foto Data URL legacy (`data:image/...`) tetap diizinkan di schema untuk mencegah gagal edit siswa lama. Local in-memory `blob:...` ditolak.
  - Sedia endpoint authorized foto `/api/students/:id/photo` untuk melayani pas foto di profil, kartu ujian, dan cetak.
  - Schema dokumen `studentDocumentItemSchema` strict dan typed; tolak path fiktif `staging/...`.
- **FIX-012 (CRITICAL):** Keamanan & Integritas Import XLSX:
  - Preview token ditandatangani HMAC SHA-256 menggunakan secret server (`process.env.AUTH_SECRET`), memvalidasi hash konten, actor, baris, dan kedaluwarsa 15 menit dengan proteksi replay.
  - Eliminasi SQL mentah dari input client pada PostgreSQL `SAVEPOINT`; menggunakan penamaan identifier yang digenerate server `sp_imp_${i}`.
  - Skema commit import tervalidasi Zod strict `commitImportSchema` (menghapus `as any`).
  - NIK dan nomor KK dipersistensikan utuh ke tabel database saat import.
  - Resolusi kelas exact match tanpa fuzzy `includes`; tanggal masuk tervalidasi.
  - Refresh daftar siswa otomatis setelah import berhasil (`await refresh()`).
- **FIX-013 (CRITICAL):** Authoritative Kelengkapan Biodata:
  - `getStudentsCompletenessSummary` mengambil seluruh 10 section secara bulk query (tanpa N+1 query) dan menghitung skor otoritatif dari backend.
  - Eliminasi fungsi fallback lokal frontend `calculateCompletenessScore` yang sebelumnya menghasilkan skor 100% palsu saat data belum lengkap.
  - Sinkronisasi skor 10 section antara daftar siswa, kartu ringkasan, dan detail siswa.
- **FIX-014 (CRITICAL):** Histori, Pencegahan Duplikasi & Prefill:
  - Sertakan `id` database record pada payload pengukuran fisik dan bantuan pendidikan dari frontend.
  - Update berbasis ID database dengan validasi kepemilikan siswa (HTTP 404 jika ID bukan milik siswa terkait).
  - Idempotensi bantuan tanpa nomor bantuan (`aidNumber === null`) tidak menduplikasi record.
  - Field nominal bantuan (`amount`) dan lingkar kepala (`headCircumferenceCm`) tidak dibuang diam-diam.
  - Guard perubahan kelas dan tanggal masuk jika sudah terdapat invoice aktif tetap ditegakkan (HTTP 409 `CLASS_MUTATION_RESTRICTED`).
- **FIX-015 (HIGH):** Integrasi API & Security:
  - Penyelarasan kontrak DTO frontend-backend secara menyeluruh.
  - Granular RBAC whitelist projection di backend (identitas sensitif, rekam medis, penghasilan orang tua, dokumen fisik).
  - Sanitizer audit log rekursif mendalam.
- **FIX-016 (HIGH):** Regression Test Suite & Pelaporan:
  - Test suite `tests/student-master.test.ts` diperluas dari 19 menjadi 25 unit test (100% LULUS).
  - Pengujian mencakup TC-01 s/d TC-100 logic coverage serta TC-101 s/d TC-106 regression tests.
  - Pelaporan transparan dan jujur: status runtime Neon DB dicatat sebagai `BLOCKED_SCHEMA` menunggu gerbang `DAT-001`.

---

### Bukti Verifikasi Aktual:
- `npm run typecheck` (`tsc --noEmit`): **LULUS (Exit code 0, 0 error)**
- `npx tsx --test tests/student-master.test.ts`: **LULUS (25 of 25 tests passed, 0 failed, 1.4s)**

---

### Kepatuhan Larangan Operasional:
- `drizzle-kit push` / `db:migrate` live: **TIDAK DIJALANKAN (Aman, menunggu tiket DAT-001)**
- `npm run build` / `npm run dev`: **TIDAK DIJALANKAN (Aman, sesuai instruksi)**
- Perombakan visual UI: **0 PERUBAHAN VISUAL (MANDATORY UI FREEZE ditaati 100%)**

---

### Laporan Resmi:
- [LAPORAN_FIX_MASTER_SISWA_V3_UI_FREEZE.md](file:///c:/Users/Admin/Documents/AxoIndo/Client/SDIT-AT-TAQWIM/SourceCode/sistem-sdit-at-taqwim/LAPORAN_FIX_MASTER_SISWA_V3_UI_FREEZE.md)
