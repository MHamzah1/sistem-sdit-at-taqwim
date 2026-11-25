# Rencana Perbaikan (`ISU-001`) — Kompatibilitas Skema 30 Tabel / 13 Kolom pada Ujian, Keuangan, & Master Siswa

| Atribut | Nilai |
| :--- | :--- |
| **ID Isu** | `ISU-001` |
| **Status** | `selesai` (Verifikasi `LULUS` pada 2026-11-25) |
| **Opsi Arsitektur** | **Opsi A (Direkomendasikan — Sesuai arahan user tanpa migrasi skema V3)**: Menjaga database tetap pada skema 30 tabel / 13 kolom `students` saat ini dan memulihkan kompatibilitas penuh pada kode & `npm test`. |

### Riwayat Status
- `2026-11-25`: `usulan` → `disetujui` oleh pengguna (*"saya setujui perbaiki semua ya dan kerjakan sampai tuntas"*) → `berjalan`.
- `2026-11-25 11:31 WIB`: Terdeteksi migrasi `migrations/postgres/0002_same_dark_beast.sql` diterapkan pada DB aktif (`40` tabel, skema V3). Implementasi `detectStudentSchemaMode` tetap menjaga kedua jalur kompatibel (`V3` aktif otomatis + fallback `BASE_30` aman untuk uji/lingkungan dasar), dan `tests/business.test.ts` disesuaikan untuk mengharapkan `40` tabel hasil migrasi PostgreSQL terbaru.
- `2026-11-25 11:47 WIB`: `berjalan` → `selesai` setelah verifikasi penuh (`typecheck`, `67/67 npm test`, `next build`, dan uji *live browser* ulang). Laporan: [2026-11-25-11-47-isu-001-kompatibilitas-skema-ujian-dan-master-siswa.md](../../../.development-history/2026-11-25-11-47-isu-001-kompatibilitas-skema-ujian-dan-master-siswa.md).

---

## 1. Solusi Terpilih (Opsi A — Tanpa Migrasi DB V3)

1. **Helper Proyeksi Siswa Kompatibel (`server/state.ts` & `server/business.ts` & `server/app.ts`):**
   - Sediakan helper pemilihan kolom dasar `students` (13 kolom yang ada di `0000` + `0001`) beserta fallback `isSchemaNotReady` (`42703`) untuk pembacaan kolom tambahan (`nickname`, `studentStatus`).
   - Ganti seluruh `.select().from(s.students)` di `server/business.ts` (`lockStudent`, `recalculate`, `generateMonthlyInvoices`) dan `server/app.ts` (`POST /api/exam-cards/bulk`) agar menggunakan proyeksi dasar tersebut. Alur generate invoice, pembayaran, dispensasi, kelayakan ujian, dan **Kartu Ujian ber-QR (`TC-07`)** kembali berjalan 100% di DB aktif `neondb` maupun PGlite.
2. **Perbaikan Handler `getStudentDrafts` & `getProfileChangeRequests` (`server/studentMaster.ts`):**
   - Ubah kondisi catch pada `getStudentDrafts` (`:1620`) dan `getProfileChangeRequests` (`:1959`) agar memanggil `isSchemaNotReady(err)` dan mengembalikan `[]`, menghilangkan HTTP `503` saat mount `/master/siswa` (`TC-04`, `TC-09`).
3. **Mode Fallback Skema Dasar (`BASE_30`) pada `server/studentMaster.ts` & UI Siswa:**
   - **`getStudentsCompletenessSummary` (`TC-09`):** Jika `isSchemaNotReady(err)` terjadi (tabel V3 belum ada), hitung kelengkapan secara ringan menggunakan 13 kolom dasar `students` + `characteristic_submissions` + `guardian_students`, lalu kembalikan HTTP `200` (tanpa error `503`).
   - **`getStudentFullProfile` (`TC-10`, `TC-12`):** Tambahkan fallback `isSchemaNotReady(err)` yang membaca 13 kolom dasar `students`, `guardians`/`guardian_students`, dan `characteristic_submissions`, lalu mengembalikan DTO profil lengkap kompatibel dengan flag `schemaMode: "BASE_30"` -> **Detail Siswa (`10 tab`) & halaman `/ubah` kembali terbuka dengan HTTP `200`**.
   - **`createStudentAtomic` & `updateStudentProfile` (`TC-11`, `TC-12`):** Jika `isSchemaNotReady(err)` terjadi karena skema V3 belum dimigrasi, jalankan jalur simpan/ubah ke 13 kolom dasar `s.students` (`name`, `nis`, `nisn`, `gender`, `birthPlace`, `birthDate`, `photoUrl`, `classId`, `enrolledOn`, `active`) serta penautan `guardian_students` jika dipilih/disediakan, dalam transaksi PostgreSQL + tulis `auditLogs`, dengan respons yang mencantumkan `schemaMode: "BASE_30"` agar **Simpan Siswa baru & Ubah Siswa dasar berhasil tersimpan ke DB**.
   - **Draf Pendaftaran (`POST /api/student-drafts` & `tambah/page.tsx`) pada `BASE_30`:**
     - Karena tabel `student_drafts` tidak ada pada DB 30 tabel tanpa migrasi V3, `tambah/page.tsx` dan `master/siswa/page.tsx` mendukung fallback draf lokal (`localStorage`) ketika server melaporkan mode `BASE_30` (atau `/api/student-drafts` mendeteksi DB non-V3), lengkap dengan banner informasi transparan pada form bahwa pada mode database dasar, hanya identitas inti siswa yang tersimpan permanen di DB (fitur draf server & 10-tab lanjutan V3 disimpan lokal / menunggu skema V3 bila kelak dibutuhkan).
   - **Import XLSX (`previewStudentImport` & `commitStudentImport`):** Fallback query eksisting agar tidak menyeleksi `s.students.nik` saat `42703`, dan `commitStudentImport` menyimpan 13 kolom dasar `students` (+ wali/alamat bila skema V3 tersedia).
4. **Pemulihan `tests/business.test.ts` (`npm test`):**
   - Perbaiki `tests/business.test.ts:121` agar menguji kueri proyeksi kolom migrasi dasar (atau konsisten dengan skema 30 tabel / 13 kolom yang di-assert di line 120) sehingga **seluruh 66 test pada `npm test` kembali LULUS**.

> **Catatan Alternatif (Opsi B — Tidak Dipilih secara Default):** Apabila ternyata seluruh data 10 tab & draf server **wajib tersimpan di tabel V3 PostgreSQL**, maka perbaikan bukan kode fallback saja melainkan memerlukan pembuatan migrasi `0002_*.sql` (`npm run db:generate`) dan persetujuan tiket data (`/data-periksa` -> `/data-jalankan DAT-NNN`). Opsi A dipilih mengikuti arahan sebelumnya agar tidak mengubah skema DB aktif.

---

## 2. File Terdampak

- `server/state.ts` (ekspor helper proyeksi aman `students`)
- `server/business.ts` (`lockStudent`, `recalculate`, `generateMonthlyInvoices`)
- `server/app.ts` (`exam-cards/bulk`, metadata/handler fallback draft/profile bila non-V3)
- `server/studentMaster.ts` (`getStudentDrafts`, `getProfileChangeRequests`, `getStudentsCompletenessSummary`, `getStudentFullProfile`, `createStudentAtomic`, `updateStudentProfile`, `previewStudentImport`, `commitStudentImport`)
- `src/app/(app)/master/siswa/page.tsx`, `tambah/page.tsx`, `[id]/page.tsx`, `[id]/ubah/page.tsx` (tampilan banner mode `BASE_30` & dukungan draf lokal saat DB non-V3)
- `tests/business.test.ts` & `tests/student-master.test.ts`

---

## 3. Skenario Test Regresi

1. **Test `tests/business.test.ts` (PGlite 30 tabel / 13 kolom):** Seluruh flow `generate invoices`, `exam period`, `payments`, `dispensations`, `POST /api/exam-cards`, dan `POST /api/exam-cards/bulk` kembali mengembalikan `200`/`201` (bukan `503`).
2. **Test Regresi `tests/student-master.test.ts`:**
   - Simulasi SQLSTATE `42703`/`42P01` pada `err.cause.code` untuk `getStudentDrafts`, `getProfileChangeRequests`, `getStudentsCompletenessSummary`, dan `getStudentFullProfile` mengembalikan data dasar tanpa melempar `503`.
   - Simulasi create/update profil pada skema `BASE_30` menyimpan data dasar siswa dengan benar.
3. **Verifikasi Live Browser Ulang (`TC-04`, `TC-07`, `TC-09`, `TC-10`, `TC-11`, `TC-12`):** Tidak ada lagi HTTP `503`; kartu QR dapat diterbitkan; daftar, detail, tambah, dan ubah siswa berfungsi di `http://localhost:3002`.
