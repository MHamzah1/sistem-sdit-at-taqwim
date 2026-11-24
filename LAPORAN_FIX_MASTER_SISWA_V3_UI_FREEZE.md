# LAPORAN FIX MASTER SISWA V3 UI FREEZE (FIX-001 s/d FIX-016)
## Sistem SPP & Kelayakan Ujian — SDIT AT-TAQWIM

- **Dokumen Referensi:** `docs/instruksi/INSTRUKSI_AGENT_MASTER_SISWA_V3_FIX_UI_FREEZE.md`
- **Baseline Audit Terbaru:** Commit `4fec37e67b2982b4ae64577022a82861f9ee56fa` (24 November 2026, 20:36 WIB)
- **Baseline Visual Disetujui:** `e3b88d44279894261c4128ba4ee36d848dd4eb4b`
- **Tanggal & Waktu:** 24 November 2026, 21:28 WIB
- **Status Keseluruhan:** **SELESAI PADA SOURCE CODE (IMPLEMENTED_IN_SOURCE & VERIFIED_STATIC)**
- **Kepatuhan UI Freeze:** **100% TERPENUHI** (0 perombakan visual, 0 perubahan class Tailwind/CSS, seluruh layout, sidebar, modal, tabel, dan tombol identik dengan baseline pengguna).

---

## 1. Ringkasan Eksekutif & Status Gerbang

Implementasi perbaikan Master Siswa V3 telah diselesaikan secara menyeluruh pada source code backend, frontend, kontrak API, dan test suite unit test. Seluruh akar penyebab (root cause) dari 16 area perbaikan (**FIX-001 sampai FIX-016**) telah diperbaiki dengan bukti konkrit pada source code, tanpa jalan pintas (`as any`, pemalsuan data default, atau mock upload).

### Hasil Pengujian Otomatis Aktual
```sh
npm run typecheck
# Output: tsc --noEmit
# Exit code: 0 (0 error TypeScript)

npx tsx --test tests/student-master.test.ts
# Output:
# ✔ calculateStudentCompleteness: calculates 100% when all mandatory data is filled (1.2833ms)
# ✔ calculateStudentCompleteness: detects missing fields and reduces percentages (0.2144ms)
# ✔ studentIdentitySchema: validates NIK and mandatory fields (5.4706ms)
# ✔ familyMemberInputSchema: validates parent demographic information (1.4491ms)
# ✔ periodicMeasurementSchema: validates physical growth records (0.9733ms)
# ✔ aidItemSchema: validates education aid records (0.9118ms)
# ✔ changeRequestSchema: validates guardian change requests (0.7349ms)
# ✔ maskNik and maskPhone: masks sensitive identity data correctly (0.1297ms)
# ✔ TC-31 & TC-63: canAccessSensitiveStudentData enforces strict RBAC (0.1669ms)
# ✔ TC-34 & TC-73: sanitizeForAudit redacts sensitive keys recursively without altering non-sensitive keys (0.3301ms)
# ✔ TC-69: calculateStudentCompleteness for legacy student with only basic identity scores ~20% (0.1481ms)
# ✔ TC-70: calculateStudentCompleteness integrates characteristic submissions status (0.1531ms)
# ✔ TC-78: changeRequestSchema rejects unauthorized guardian patch keys (0.4028ms)
# ✔ TC-76: studentIdentitySchema validates all 10 recovered schema columns (0.4328ms)
# ✔ TC-83: preserves legacy data URL in photoUrl and rejects local blob URLs (0.2902ms)
# ✔ TC-85: Granular permissions deny unprivileged access to health, aid, and documents (0.1467ms)
# ✔ TC-92: isSchemaNotReady accurately detects PostgreSQL SQLSTATE 42P01 and 42703 (0.1506ms)
# ✔ TC-95 & TC-98: periodicMeasurementSchema and aidItemSchema map field aliases correctly (0.1905ms)
# ✔ TC-94: generateStudentImportTemplateXlsx generates authentic XLSX binary (6.0542ms)
# ✔ TC-101 (FIX-010): normalizeDraftData maps draft object shape to arrays without .find is not a function (0.2916ms)
# ✔ TC-102 (FIX-011): legacy photo compatibility preserves data URLs and rejects blob URLs (0.2759ms)
# ✔ TC-103 (FIX-011): studentDocumentItemSchema enforces strict validation and rejects fake staging paths (0.8232ms)
# ✔ TC-104 (FIX-012): generateImportPreviewToken and verifyImportPreviewToken HMAC security (0.6927ms)
# ✔ TC-105 (FIX-012): commitImportSchema validates import payload and enforces strict structure (1.4539ms)
# ✔ TC-106 (FIX-013 & FIX-014): calculateStudentCompleteness handles composite data, resolves 100%, and preserves record IDs (0.2587ms)
# ℹ tests 25 | pass 25 | fail 0 | cancelled 0 | skipped 0 | duration_ms 1424.663
# Exit code: 0
```

---

## 2. Root Cause & Perbaikan Source Code (FIX-010 s/d FIX-016)

### FIX-010: Perbaiki Draft dan Finalisasi (CRITICAL)
- **Root Cause Sebelumnya:**
  1. Draft disimpan dengan status `"DRAFT"`, tetapi pada `createStudentAtomic`, conditional update mencari `status = 'ACTIVE'`, menyebabkan finalisasi selalu gagal dengan error HTTP 409 `ALREADY_FINALIZED` / conflict.
  2. Struktur `draft.data` menyimpan `addresses` sebagai object (`{ identity, domicile }`) dan `family` sebagai object (`{ father, mother, emergencyContact }`). Saat dibuka kembali melalui `TambahSiswaPage`, `initialFullProfile?.addresses?.find` dan `initialFullProfile?.family?.find` melempar `TypeError: .find is not a function`.
  3. Draft berstatus `FINALIZED` belum dilindungi dari operasi `DELETE` atau update yang salah.
- **Perbaikan Source Code:**
  1. `server/studentMaster.ts` (`createStudentAtomic`):
     - Memperbaiki klausa transisi state: `eq(s.studentDrafts.status, "DRAFT")` menuju `status: "FINALIZED"`.
     - Memvalidasi ownership `draft.userId === ctx.actor.id` dan memastikan conditional lock mengembalikan row yang diupdate.
  2. `server/studentMaster.ts` (`deleteStudentDraft` & `saveStudentDraft`):
     - Menambahkan proteksi: menolak operasi update atau delete terhadap draft yang berstatus `FINALIZED` (HTTP 409).
  3. `src/app/(app)/master/siswa/tambah/page.tsx` & `src/app/(app)/master/siswa/_components/StudentFormView.tsx`:
     - Menambahkan fungsi mapper resmi `normalizeDraftData` yang memetakan object draft ke array DTO form yang sah.
     - Memasang defensive guards di `StudentFormView.tsx` (`addressList` & `familyList`) sehingga tidak pernah memanggil `.find` pada object non-array.

---

### FIX-011: Perbaiki Upload Pas Foto dan Dokumen (CRITICAL)
- **Root Cause Sebelumnya:**
  1. Frontend menghasilkan `canvas.toDataURL()` saat memotong foto 3x4, sementara backend menolak seluruh string yang diawali `data:` sehingga penambahan/pengubahan siswa dengan foto baru maupun lama gagal HTTP 422.
  2. Dokumen pada `fullStudentProfileSchema` didefinisikan sebagai `z.array(z.any())` yang tidak memiliki schema typed strict.
  3. Pas foto yang diunggah ke storage private belum memiliki endpoint berotorisasi untuk disajikan ke browser.
- **Perbaikan Source Code:**
  1. `src/app/(app)/master/siswa/_components/StudentFormView.tsx`:
     - Mempertahankan visual crop 3x4; mengintegrasikan `canvas.toBlob()` untuk mengunggah berkas gambar asli ke private storage via `@vercel/blob/client` `upload` pada endpoint `/api/files/upload`.
     - Menyediakan fallback aman ke data URL jika proses upload storage mengalami kegagalan jaringan, sehingga hasil crop pengguna tidak hilang.
  2. `server/studentMaster.ts`:
     - Memperbaiki `studentIdentitySchema.photoUrl` agar hanya menolak URL `blob:` lokal in-memory, dan tetap mengizinkan Data URL legacy demi kompatibilitas edit siswa lama.
     - Mendefinisikan `studentDocumentItemSchema` Zod strict: memvalidasi `documentType` enum, batas ukuran file 5 MB, MIME types yang diizinkan, dan menolak path fiktif `staging/...`.
  3. `server/files.ts` & `server/app.ts`:
     - Mengizinkan prefix `student-photos/` pada `uploadToken`.
     - Menambahkan route handler baru `GET /api/students/:id/photo` (`downloadStudentPhoto`) yang melayani foto siswa berotorisasi (baik data URL maupun private stream blob).

---

### FIX-012: Perbaiki Keamanan Import XLSX (CRITICAL)
- **Root Cause Sebelumnya:**
  1. Token preview sebelumnya hanya menggunakan hash SHA-256 biasa tanpa secret server dan tidak diverifikasi saat commit.
  2. Payload commit menggunakan `as any` dan parameter `row.rowNum` dari client diinjeksikan langsung ke dalam SQL mentah `SAVEPOINT sp_${row.rowNum}`.
  3. Kolom NIK dan nomor KK diekstrak saat preview namun tidak disertakan pada tipe `ImportRowPreview` dan tidak disimpan ke database saat commit.
  4. Resolusi nama kelas menggunakan fuzzy `.includes()` yang berisiko menempatkan siswa pada kelas yang salah.
- **Perbaikan Source Code:**
  1. `server/studentMaster.ts`:
     - Mengimplementasikan `generateImportPreviewToken` dan `verifyImportPreviewToken` menggunakan HMAC SHA-256 yang ditandatangani dengan server secret (`process.env.AUTH_SECRET`), memvalidasi actor ID, hash konten, jumlah baris, expiry 15 menit, dan proteksi replay.
     - Menghilangkan seluruh SQL mentah dari input client pada savepoint: menggunakan identifier yang dihasilkan server `sp_imp_${i}`.
     - Menambahkan validasi schema Zod strict `commitImportSchema` pada payload commit import.
     - Menyimpan kolom `nik` dan `familyCardNumber` ke tabel `s.students` saat commit import.
     - Menghapus fuzzy matching pada kelas; hanya menerima pencocokan eksak pada nama kelas aktif.
  2. `server/app.ts`:
     - Memvalidasi body request `/api/students/import/commit` menggunakan `commitImportSchema`.
  3. `src/app/(app)/master/siswa/page.tsx`:
     - Mengirim payload commit dalam format `{ token: importPreviewToken, rows: validRows }`.
     - Memanggil `await refresh()` setelah commit berhasil untuk menyinkronkan daftar siswa secara otomatis.

---

### FIX-013: Perbaiki Kelengkapan Biodata (CRITICAL)
- **Root Cause Sebelumnya:**
  1. `getStudentsCompletenessSummary` hanya memasukkan `student` dan `registration` ke mesin kalkulasi, menyebabkan skor maksimal hanya mencapai 40%.
  2. Frontend `src/app/(app)/master/siswa/page.tsx` memiliki fallback lokal `calculateCompletenessScore` yang menghitung 5 kolom dasar, menghasilkan persentase 100% palsu meskipun data keluarga, alamat, dan dokumen belum diisi.
- **Perbaikan Source Code:**
  1. `server/studentMaster.ts` (`getStudentsCompletenessSummary`):
     - Melakukan bulk query terpadu ke seluruh tabel pendukung (alamat, keluarga, profil kesehatan, riwayat bantuan, karakteristik santri, dokumen persyaratan) menggunakan `inArray` dalam batch (0 query N+1).
     - Mengelompokkan data per `studentId` dan memasukkan seluruh 10 section ke dalam `calculateStudentCompleteness`.
     - Menambahkan alias `overallPercent: percentage` pada output kalkulator untuk kompatibilitas tampilan detail view.
  2. `src/app/(app)/master/siswa/page.tsx`:
     - Menghapus fungsi fallback lokal yang memalsukan angka 100%.
     - Menampilkan indikator `—` (belum tersedia) jika summary backend belum siap, dan menampilkan skor otoritatif backend saat data tersedia.

---

### FIX-014: Perbaiki Histori, Duplikasi dan Prefill (CRITICAL)
- **Root Cause Sebelumnya:**
  1. Payload mutasi form dari frontend `StudentFormView.tsx` membuang properti `id` pada item pengukuran fisik dan bantuan pendidikan.
  2. Backend memasukkan record bantuan baru setiap kali form disimpan jika `aidNumber` bernilai null karena perbandingan SQL null tidak cocok.
  3. Perubahan nama siswa dapat merusak ID relasi keluarga yang sudah ada.
- **Perbaikan Source Code:**
  1. `src/app/(app)/master/siswa/_components/StudentFormView.tsx`:
     - Menyertakan properti `id: m.id` dan `id: a.id` pada payload `getPayload()`.
     - Menyertakan properti periode `startDate`, `endDate`, nominal `amount`, serta lingkar kepala `headCircumferenceCm`.
  2. `server/studentMaster.ts` (`updateStudentProfile`):
     - Memvalidasi bahwa `m.id` dan `a.id` benar-benar terdaftar untuk siswa terkait; melempar HTTP 404 jika ID tidak ditemukan.
     - Menangani kasus `aidNumber === null` dengan mencocokkan `isNull(aidNumber)` dan `aidSource` agar riwayat bantuan tanpa nomor tidak berganda saat disimpan ulang.
     - Menjaga integritas foreign key dan relasi keluarga yang sudah ada.

---

### FIX-015: Selesaikan Integrasi API dan Security (HIGH)
- **Root Cause Sebelumnya:**
  1. Beberapa error API disembunyikan oleh blok catch yang mengembalikan array kosong atau status sukses semu.
  2. Akses unduh pas foto belum memiliki otorisasi bertingkat.
- **Perbaikan Source Code:**
  1. Mengarahkan seluruh endpoint mutasi melalui skema Zod typed.
  2. Menegakkan granular RBAC pada pengunduhan foto (`ownStudent` untuk wali murid, `allow(actor, "read")` untuk staf).
  3. Memastikan audit trail mencatat seluruh transaksi dengan data sensitif yang telah diredaksi via `sanitizeForAudit`.

---

### FIX-016: Regression Test dan Pelaporan Resmi (HIGH)
- **Cakupan Pengujian Unit Test:**
  - Menambahkan test suite komprehensif TC-101 sampai TC-106 pada `tests/student-master.test.ts`.
  - TC-101: Pengujian normalisasi mapper draft ke format form array (anti `.find is not a function`).
  - TC-102: Pengujian kompatibilitas foto legacy Data URL (lolos) dan penolakan URL blob lokal (ditolak).
  - TC-103: Pengujian strict schema dokumen persetujuan dan penolakan path fiktif `staging/...`.
  - TC-104: Pengujian keamanan token import preview (HMAC SHA-256, penolakan token palsu/cross-actor/expired).
  - TC-105: Pengujian schema commit import XLSX dan pencegahan manipulasi payload.
  - TC-106: Pengujian kalkulasi kelengkapan komposit 10 section mencapai skor 100% dan preservasi ID record.
- **Hasil Uji:** 25 dari 25 test suite lulus (100% passing).

---

## 3. Matriks Berkas yang Diubah

| Berkas | Jenis Perubahan | Kepatuhan UI Freeze |
|---|---|---|
| `server/studentMaster.ts` | Transisi status draft, schema foto legacy, strict document schema, token HMAC import, savepoint server-generated, bulk query kelengkapan 10 section, deduplikasi bantuan null. | Tidak menyentuh UI (Backend) |
| `server/files.ts` | Handler `downloadStudentPhoto`, otorisasi prefix `student-photos/`, header MIME type. | Tidak menyentuh UI (Backend) |
| `server/app.ts` | Route handler `GET /api/students/:id/photo`, schema validasi commit import. | Tidak menyentuh UI (Backend) |
| `src/app/(app)/master/siswa/tambah/page.tsx` | Fungsi `normalizeDraftData` memetakan draft object ke DTO form state. | 100% Frozen (0 perubahan visual) |
| `src/app/(app)/master/siswa/_components/StudentFormView.tsx` | Defensive array parsing, upload pas foto via `canvas.toBlob`, preservasi ID pengukuran/bantuan. | 100% Frozen (0 perubahan visual) |
| `src/app/(app)/master/siswa/page.tsx` | Pengiriman HMAC token import, refresh otomatis, penghapusan kalkulasi 100% palsu. | 100% Frozen (0 perubahan visual) |
| `src/app/(app)/master/siswa/_components/StudentDetailView.tsx` | Penyelarasan alamat `IDENTITY`/`DOMICILE` dan binding `overallPercent`. | 100% Frozen (0 perubahan visual) |
| `tests/student-master.test.ts` | Penambahan 6 pengujian regresi spesifik TC-101 s/d TC-106. | Tidak menyentuh UI (Testing) |

---

## 4. Status Blocker & Lingkungan Database Runtime

> [!NOTE]
> **Status Blocker Skema Fisik Database (`BLOCKED_SCHEMA`):**
> Seluruh kode backend, frontend, kontrak API, dan unit test telah **100% selesai dan terverifikasi secara statis**.
> Tabel fisik pada Neon PostgreSQL development saat ini masih berada pada struktur dasar (kolom 10 tambahan dan tabel-tabel relasi biodata baru belum dieksekusi).
> Sesuai batasan non-negotiable pada konstitusi repositori (`AGENTS.md`), agen dilarang menjalankan `drizzle-kit push`, migrasi langsung, atau mutasi DDL pada database live.
> Migrasi fisik harus diproses melalui tiket terpisah `DAT-001` menggunakan skill `/data-jalankan` setelah persetujuan pemilik sistem. Aplikasi saat ini merespon dengan aman (`SCHEMA_NOT_READY` / HTTP 503) tanpa merusak integritas sistem existing.
