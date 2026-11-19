# Riset: Kelengkapan Identitas Master Siswa

**Slug:** `kelengkapan-identitas-siswa` · **Tanggal:** 2026-11-19 · **Status:** Selesai Riset

---

## 1. Latar Belakang & Masalah

Pada dokumen PRD Bagian 10 (FR-MD-001) dan Bagian 18 (FR-CARD-001):
1. **Identitas Siswa di Master Data (FR-MD-001):** Minimal menyimpan NIS, NISN, Nama, Foto, Jenis Kelamin, Tanggal Lahir, Kelas, Status, dan Relasi Wali.
2. **Identitas Siswa di Kartu Ujian (FR-CARD-001):** Kartu ujian resmi wajib mencantumkan Foto, Nama, NIS, NISN, Kelas, Nomor Peserta, dan Kode QR Validasi.

### Kondisi Saat Ini di Codebase:
- Tabel `students` pada [src/db/schema.ts](file:///c:/Users/Admin/Documents/AxoIndo/Client/SDIT-AT-TAQWIM/SourceCode/sistem-sdit-at-taqwim/src/db/schema.ts#L144-L158) saat ini hanya memiliki kolom:
  `id`, `nis`, `name`, `classId`, `enrolledOn`, `active`, `createdAt`, `updatedAt`.
- Belum tersedia kolom:
  - `nisn` (Nomor Induk Siswa Nasional, 10 digit angka unik)
  - `gender` (Jenis kelamin: `L` untuk Laki-laki / `P` untuk Perempuan)
  - `birthPlace` & `birthDate` (Tempat dan tanggal lahir siswa)
  - `photoUrl` (URL pas foto siswa)
- Schema Zod di [server/resources.ts](file:///c:/Users/Admin/Documents/AxoIndo/Client/SDIT-AT-TAQWIM/SourceCode/sistem-sdit-at-taqwim/server/resources.ts#L32-L43) dan antarmuka form `studentFields` di [src/main.tsx](file:///c:/Users/Admin/Documents/AxoIndo/Client/SDIT-AT-TAQWIM/SourceCode/sistem-sdit-at-taqwim/src/main.tsx#L376-L395) belum menyediakan kolom input identitas tersebut.
- Kartu ujian (baik modal individual maupun modal cetak massal A4) belum menampilkan NISN dan pas foto/avatar siswa.

---

## 2. Analisis Keterkaitan Komponen Codebase

### A. Lapisan Database (`src/db/schema.ts`)
- Perlu menambahkan kolom pada `students`:
  - `nisn`: `text("nisn")` (nullable, unik jika diisi).
  - `gender`: `text("gender")` dengan check constraint `sql`${t.gender} in ('L', 'P')`` (nullable untuk data lama, bisa diisi).
  - `birthPlace`: `text("birth_place")` (nullable).
  - `birthDate`: `date("birth_date")` (nullable).
  - `photoUrl`: `text("photo_url")` (nullable).
- Membutuhkan penambahan migrasi skema PostgreSQL melalui `drizzle-kit generate` ke direktori `migrations/postgres/`.

### B. Lapisan Validasi Server (`server/resources.ts`)
- Resource schema `students` perlu diperbarui untuk menerima field opsional:
  - `nisn`: `z.string().regex(/^\d{10}$/, "NISN harus 10 digit angka").nullable().optional()`
  - `gender`: `z.enum(["L", "P"]).nullable().optional()`
  - `birthPlace`: `z.string().trim().max(100).nullable().optional()`
  - `birthDate`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()`
  - `photoUrl`: `z.string().url().nullable().optional().or(z.literal(""))`

### C. Lapisan State & Controller (`server/state.ts` & `server/app.ts`)
- `readState()` di `server/state.ts` sudah melakukan `select().from(s.students)`, sehingga penambahan kolom pada schema Drizzle akan otomatis terbaca di `AppState["students"]` tanpa mengubah query dasar.

### D. Lapisan Antarmuka Pengguna (`src/main.tsx` & `src/production.css`)
- **Master Siswa (`/master/siswa`):**
  - Form dialog Tambah/Edit Siswa (`studentFields`) menambahkan input NISN, Jenis Kelamin (Pilihan L / P), Tempat Lahir, Tanggal Lahir, dan Foto.
  - Tabel Siswa menampilkan badge jenis kelamin, NISN, dan avatar/foto siswa.
- **Kartu Peserta Ujian:**
  - Menampilkan baris `NISN: {student.nisn || "—"}`.
  - Menampilkan pas foto siswa jika `photoUrl` tersedia, atau avatar inisial berbingkai rapi jika belum ada foto.
  - Berlaku pada modal kartu individual dan lembar cetak massal 2 kartu per lembar A4 (`.bulk-card-item`).

---

## 3. Pertanyaan Terbuka untuk Wawancara

1. **Format & Sifat Wajib NISN:** Apakah NISN bersifat wajib diisi saat tambah siswa baru atau boleh kosong/opsional (karena ada siswa baru kelas 1 yang NISN-nya masih dalam proses pengajuan di Dapodik)?
2. **Standar Pengisian Jenis Kelamin:** Apakah menggunakan kode singkatan `L` (Laki-laki) dan `P` (Perempuan), dan bagaimana penanganan data siswa eksisting yang sudah ada di database?
3. **Penyimpanan Foto Siswa:** Apakah menggunakan URL gambar langsung (eksternal / Vercel Blob) atau mendukung unggah berkas (upload file) langsung di modal form siswa?
4. **Tampilan Pas Foto pada Kartu Ujian:** Di mana posisi pas foto pada kartu ujian (di samping QR code, atau di pojok atas) dan ukuran idealnya untuk cetak kartu (misal rasio pas foto 3x4 / 90x120px)?
5. **Dampak pada Filter/Pencarian Data Siswa:** Apakah perlu menambahkan filter pencarian berdasarkan NISN dan Jenis Kelamin di tabel Master Siswa?
