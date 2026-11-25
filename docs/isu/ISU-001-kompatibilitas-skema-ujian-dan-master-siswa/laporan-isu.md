# Laporan Isu (`ISU-001`) — Ketidakcocokan Skema V3 vs Database Aktif pada Kartu Ujian & Master Siswa

| Atribut | Nilai |
| :--- | :--- |
| **ID Isu** | `ISU-001` |
| **Sumber Temuan** | `UJI-001` (`TC-04`, `TC-07`, `TC-09`, `TC-10`, `TC-11`, `TC-12`, potensi gagal `TC-13` Import) & baseline `npm test` (`tests/business.test.ts` gagal `15/66`) |
| **Prioritas / Tingkat** | **P0 — Blocker** |
| **Status** | `usulan` (Menunggu persetujuan user untuk eksekusi `/isu-perbaiki ISU-001`) |
| **Tanggal Diagnosa** | 25 November 2026 |

---

## 1. Gejala yang Dilihat Pengguna

1. **Penerbitan Kartu Ujian Ber-QR Gagal (`TC-07`):** Di menu `/ujian/kartu` atau tab kartu siswa, klik tombol **Kartu** (`POST /api/exam-cards`) gagal dengan HTTP **`503 SCHEMA_NOT_READY`** (*"Skema database Master Siswa belum siap. Silakan jalankan migrasi database."*), padahal siswa sudah layak (`ELIGIBLE`) dan tabel `exam_cards`, `exam_periods`, serta `student_exam_eligibilities` sudah ada di database `neondb`.
2. **Mount Daftar Siswa & Dashboard Master Siswa Menghasilkan HTTP `503` (`TC-04`, `TC-09`):** Saat membuka `/master/siswa`, panggilan API latar ke `/api/student-drafts`, `/api/students/completeness-summary`, dan `/api/student-profile-change-requests` seluruhnya gagal HTTP `503`.
3. **Halaman Detail & Ubah Siswa Gagal Memuat Profil (`TC-10`, `TC-12`):** Membuka `/master/siswa/[id]` membuat `GET /api/students/:id/profile` mengembalikan HTTP `503`; membuka `/master/siswa/[id]/ubah` terblokir di layar error **"Gagal Memuat Profil Siswa"**.
4. **Tambah Siswa & Simpan Draf Gagal (`TC-11`):** Klik **Simpan Draf** (`POST /api/student-drafts`) maupun **Simpan Siswa** (`POST /api/students/profile`) gagal HTTP `503`.
5. **Test Integrasi `tests/business.test.ts` Gagal 15 Subtest:** Menjalankan `npm test` (berbasis PGlite + `migrations/postgres/`) menghasilkan **15 fail dari 66 tests** (antara lain: cek skema, generate invoice, evaluasi ujian, pembayaran tunai/transfer, dispensasi, kartu ujian, WhatsApp reminder, laporan/audit, logout) karena kolom `nickname` tidak ada di database.

---

## 2. Rantai Penyebab (Penelusuran `file:baris`)

1. **Ketidakcocokan Antara `src/db/schema.ts` dan Migrasi SQL + DB Aktif:**
   - `migrations/postgres/0000_equal_frog_thor.sql` dan `0001_funny_butterfly.sql` (yang juga terpasang pada DB aktif `neondb`) mendefinisikan **30 tabel** dengan tabel `students` berisi **13 kolom** (`id`, `nis`, `nisn`, `name`, `gender`, `birth_place`, `birth_date`, `photo_url`, `class_id`, `enrolled_on`, `active`, `created_at`, `updated_at`).
   - `src/db/schema.ts` (`:145-182` dan `:500-732`) sudah ditambahkan **10 kolom V3 baru** di `students` (misalnya `nickname`, `nik`, `familyCardNumber`, `religion`, `studentStatus`, dll.) serta **10 tabel V3 baru** (`student_addresses`, `family_members`, `student_family_members`, `student_enrollments`, `student_health_profiles`, `student_periodic_data`, `student_aid_records`, `student_documents`, `student_drafts`, `student_profile_change_requests`), tetapi **tidak ada file migrasi V3** di `migrations/postgres/` dan pengguna secara eksplisit meminta agar **tetap menggunakan database saat ini tanpa skema DB V3**.
2. **Query `select().from(s.students)` Tanpa Proyeksi Kompatibel di Alur Inti (`server/business.ts`, `server/app.ts`, `tests/business.test.ts`):**
   - `server/business.ts:57-67` (`lockStudent`), `:73-75` (`recalculate`), `:398-405` (`generateMonthlyInvoices`), serta `server/app.ts:510-514` (`POST /api/exam-cards/bulk`) memanggil `.select().from(s.students)` yang oleh Drizzle diterjemahkan menjadi `SELECT` seluruh **23 kolom** (termasuk `nickname`, `nik`, dll.).
   - Akibatnya PostgreSQL melempar SQLSTATE `42703` (*`column "nickname" does not exist`*) yang ditangkap `server/app.ts:967-975` (`isSchemaNotReady`) menjadi HTTP `503 SCHEMA_NOT_READY`, meskipun operasi tersebut hanya membutuhkan kolom dasar (`id`, `classId`, `enrolledOn`, `active`, `name`, `nis`, `nisn`, `photoUrl`). Padahal `server/state.ts:24-73` sudah menerapkan proyeksi 13 kolom dasar dengan fallback `42703`.
   - `tests/business.test.ts:120-121` menguji `assert.equal(count.rows[0].count, 30)` lalu segera memanggil `db.select().from(s.students)` (23 kolom) pada PGlite yang hanya punya 13 kolom.
3. **Bug Deteksi Error SQLSTATE pada `getStudentDrafts` & `getProfileChangeRequests` (`server/studentMaster.ts`):**
   - `server/studentMaster.ts:1619-1622` (`getStudentDrafts`) dan `:1958-1961` (`getProfileChangeRequests`) sudah mencoba mengembalikan `[]` jika tabel belum ada, tetapi hanya memeriksa `err?.code === "42P01" || err?.code === "42703"`.
   - Drizzle ORM membungkus error PostgreSQL di `err.cause.code` (lihat `server/security.ts:79-94` `isSchemaNotReady`), sehingga error tidak tertangkap di fungsi tersebut dan bocor menjadi HTTP `503` di `server/app.ts:967`.
4. **Ketidaksiapan Mode Fallback 30-Tabel pada Layanan Profil, Kelengkapan, & Import (`server/studentMaster.ts`):**
   - `getStudentFullProfile` (`:780-945`), `createStudentAtomic` (`:407-504`), `updateStudentProfile` (`:977-1155` — hanya mem-fallback SELECT awal di `:986-1022`, belum `.update(s.students)` atau tabel anak V3), `previewStudentImport` (`:2211-2233` menyeleksi `s.students.nik`), `commitStudentImport` (`:2592-2660` insert kolom & tabel V3), `getStudentsCompletenessSummary` (`:2738-2879` langsung melempar `503`), dan `saveStudentDraft` (`:1570-1609`) semuanya memaksa kolom/tabel V3.

---

## 3. Dampak

- **Kritis (Keuangan & Ujian):** Di DB `neondb` maupun `npm test` (PGlite), generate tagihan bulanan, evaluasi kelayakan ujian, pembayaran, dispensasi, dan **penerbitan kartu ujian ber-QR (`TC-07`)** lumpuh dengan error `503`.
- **Kritis (Master Siswa):** Membuka `/master/siswa`, melihat detail siswa (`TC-10`), menambah siswa baru (`TC-11`), mengubah siswa (`TC-12`), dan import XLSX melempar `503` saat berjalan di atas DB 30 tabel / 13 kolom yang diminta pengguna.
