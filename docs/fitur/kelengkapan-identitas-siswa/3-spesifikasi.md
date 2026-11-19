# Spesifikasi: Kelengkapan Identitas Master Siswa

**Slug:** `kelengkapan-identitas-siswa` · **Dibuat:** 2026-11-19 · **Sumber keputusan:** [2-wawancara.md](2-wawancara.md)

---

## Masalah

1. **Integritas & Kelengkapan Data Siswa (FR-MD-001):** Data master siswa saat ini hanya mencatat NIS, Nama, Kelas, dan Tanggal Masuk. Data krusial seperti NISN (Nomor Induk Siswa Nasional), Jenis Kelamin (L/P), Tempat & Tanggal Lahir, serta Foto Siswa belum tersedia di skema database dan antarmuka Tata Usaha.
2. **Ketiadaan Foto & NISN pada Kartu Ujian (FR-CARD-001):** Sesuai standar dokumen PRD Bagian 18, kartu peserta ujian wajib memuat NISN dan pas foto resmi siswa (atau placeholder avatar 3x4 jika foto belum diunggah) agar pengawas ruang ujian dapat memverifikasi fisik peserta secara akurat di samping pemindaian kode QR.

---

## Tujuan

1. Melengkapi skema database tabel `students` dengan kolom `nisn`, `gender`, `birth_place`, `birth_date`, dan `photo_url` dengan constraint yang konsisten.
2. Memperbarui form dialog Tambah/Edit Siswa dan tabel Master Siswa di menu Tata Usaha (`/master/siswa`) dengan input lengkap dan pratinjau foto/avatar.
3. Mengintegrasikan tampilan NISN dan pas foto siswa (3x4) pada Kartu Ujian Individual dan Lembar Cetak Massal A4 (`.bulk-cards-sheet`).

---

## Latar Belakang

Sistem SPP dan Kelayakan Ujian SDIT AT-TAQWIM telah berhasil menerapkan kuitansi resmi (Paket 1) dan cetak massal kartu ber-nomor peserta (Paket 2). Namun, kartu ujian dan master siswa masih memiliki kesenjangan terhadap spesifikasi resmi PRD FR-MD-001 dan FR-CARD-001 mengenai identitas siswa nasional (NISN) dan identitas visual (foto siswa). Penambahan ini menyempurnakan kesiapan data sekolah menuju standar Dapodik Kemendikbud.

---

## Definition of Done

- [ ] Kolom `nisn`, `gender`, `birth_place`, `birth_date`, dan `photo_url` ditambahkan ke tabel `students` di `src/db/schema.ts` beserta check constraint `gender in ('L', 'P')`.
- [ ] File migrasi SQL baru dihasilkan di `migrations/postgres/` dan skema database dev berhasil disinkronisasi.
- [ ] Resource validator di `server/resources.ts` memvalidasi input field identitas siswa (format 10 digit angka untuk NISN jika diisi).
- [ ] Form Tambah/Edit Siswa di `/master/siswa` menyediakan input untuk NISN, Jenis Kelamin (L/P), Tempat & Tanggal Lahir, dan URL Foto.
- [ ] Tabel Master Siswa menampilkan thumbnail avatar/foto, NIS, NISN, dan badge gender `L` / `P`.
- [ ] Filter pencarian di tabel Master Siswa dapat mencari berdasarkan Nama, NIS, maupun NISN.
- [ ] Kartu Ujian (baik modal individual maupun lembar cetak massal A4) menampilkan NISN dan pas foto/avatar berasio 3x4 berdampingan dengan kode QR.
- [ ] Seluruh unit test suite (`npm test`), typecheck (`npm run typecheck`), dan build produksi Next.js lulus 100%.

---

## Scope

1. **Skema Database & Migrasi:**
   - Menambahkan kolom `nisn`, `gender`, `birthPlace`, `birthDate`, dan `photoUrl` pada tabel `students` di `src/db/schema.ts`.
   - Mengenerate file migrasi PostgreSQL (`0001_....sql`) dan menerapkannya.
2. **Validasi Server:**
   - Memperbarui skema Zod `students` di `server/resources.ts` dengan aturan validasi regex NISN 10 digit, enum gender, dan tanggal ISO.
3. **Antarmuka Master Siswa (`src/main.tsx`):**
   - Menambahkan field input baru pada `studentFields`.
   - Menampilkan kolom identitas baru pada tabel siswa dengan thumbnail foto/avatar.
   - Peningkatan pencarian cepat (search query) yang mendukung NISN.
4. **Antarmuka Kartu Ujian:**
   - Menampilkan baris `NISN: [nomor]` di kartu ujian individual dan massal.
   - Menampilkan bingkai pas foto siswa 3x4 (atau placeholder avatar inisial rapi).
5. **Styling Kartu & Foto (`src/production.css`):**
   - CSS `.student-photo-card`, `.student-photo-placeholder`, dan penyesuaian `@media print`.

---

## Di Luar Scope

1. Integrasi sinkronisasi otomatis dua arah langsung dengan server Dapodik Kemendikbud (cukup ekspor/impor lokal).
2. Sistem pengenalan wajah otomatis (*face recognition*) dari foto siswa.
3. Pemotongan foto otomatis (*auto-crop AI*) di browser (menggunakan standard object-fit cover pada bingkai 3x4).

---

## Pengguna & User Story

- **US-1 (Tata Usaha):** Sebagai staf TU, saya ingin mencatat NISN, tempat tanggal lahir, jenis kelamin, dan foto siswa di Master Siswa agar buku induk sekolah lengkap sesuai format standar Dapodik.
- **US-2 (Pengawas Ujian):** Sebagai pengawas ujian, saya ingin melihat pas foto siswa dan NISN pada kartu ujian agar saya dapat memastikan anak yang mengikuti ujian adalah siswa yang bersangkutan.
- **US-3 (Wali Murid):** Sebagai wali murid, saya ingin melihat data identitas anak saya (NISN dan pas foto) tampil benar pada kartu ujian yang diunduh dari portal.

---

## Kebutuhan Fungsional

### UI (Antarmuka)
- **KF-1:** Form Tambah/Edit Siswa menyediakan field NISN (10 digit), Jenis Kelamin (L/P), Tempat Lahir, Tanggal Lahir, dan URL Foto dengan preview thumbnail.
- **KF-2:** Tabel Master Siswa menampilkan thumbnail foto, NIS, NISN, dan badge gender.
- **KF-3:** Filter pencarian di tabel Master Siswa dapat mencari berdasarkan Nama, NIS, maupun NISN secara instan.
- **KF-4:** Kartu Ujian (modal individual dan cetak massal 2 per lembar A4) menampilkan label NISN dan pas foto siswa berasio 3x4 (lebar ~75px, tinggi ~100px) berdampingan dengan kode QR.

### API & Data
- **KF-5:** Server memvalidasi bahwa jika NISN diisi, panjangnya wajib tepat 10 digit angka (`/^\d{10}$/`).
- **KF-6:** Kolom `gender` hanya menerima nilai `'L'` atau `'P'` (atau `null` jika belum diisi).
- **KF-7:** Kolom `birthDate` bertipe tanggal (`YYYY-MM-DD`).

### Otorisasi & Keamanan
- **KF-8:** Operasi tambah/edit/hapus identitas siswa dibatasi khusus untuk pengguna berwenang (`SUPER_ADMIN`, `ADMIN`, `TU` yang memiliki izin `master`).

---

## Kebutuhan Non-Fungsional

- **KNF-1 (Kompatibilitas Cetak):** Pas foto pada kartu ujian tercetak tajam dengan orientasi proporsional (tidak gepeng/terdistorsi) menggunakan `object-fit: cover`.
- **KNF-2 (Performa):** Menggunakan placeholder avatar fallback instan tanpa membebani rendering jika foto eksternal belum diunggah.

---

## Keputusan Terkunci

1. **KT-1 (NISN Fleksibel):** NISN opsional/nullable, namun wajib 10 digit angka unik jika diisi.
2. **KT-2 (Standar Gender):** Menggunakan kode `L` (Laki-laki) dan `P` (Perempuan) dengan constraint DB.
3. **KT-3 (Pas Foto & Fallback):** Field `photoUrl` opsional; otomatis menampilkan placeholder pas foto 3x4 dengan inisial nama jika belum ada foto.
4. **KT-4 (Tata Letak Kartu Ujian):** Pas foto 3x4 diletakkan berdampingan dengan kode QR di sisi kanan kartu.
5. **KT-5 (Penyajian Tabel):** Master Siswa menampilkan foto thumbnail, NISN, gender, dan mendukung pencarian NISN.

---

## Kesiapan Data

- Membutuhkan migrasi skema PostgreSQL:
  - Alter tabel `students` menambah kolom `nisn`, `gender`, `birth_place`, `birth_date`, `photo_url`.
  - Check constraint `student_gender_check` untuk `gender in ('L', 'P')`.
  - Unique index opsional pada `nisn` (`where nisn is not null`).
  - Dihasilkan via `npm run db:generate` dan diterapkan ke database dev.

---

## Pertanyaan Terbuka

- Tidak ada pertanyaan terbuka yang memblokir.

---

## Modul yang Diubah

1. `src/db/schema.ts`: Penambahan kolom identitas dan constraint pada tabel `students`.
2. `migrations/postgres/0001_....sql` (BARU): File migrasi PostgreSQL.
3. `server/resources.ts`: Penambahan validasi skema Zod `students`.
4. `src/main.tsx`: Penambahan field form siswa, kolom tabel siswa, dan integrasi pas foto serta NISN pada kartu ujian individual dan massal.
5. `src/production.css`: Gaya visual pas foto 3x4, placeholder avatar, dan tata letak kartu.
6. `tests/business.test.ts`: Uji validasi NISN 10 digit, enum gender, dan persistensi identitas siswa.

---

## Risiko & Mitigasi

- **Risiko:** URL foto eksternal yang rusak atau gagal dimuat (*broken image link*).  
  *Mitigasi:* Menggunakan fallback `onError` pada elemen `<img>` yang otomatis beralih menampilkan placeholder avatar 3x4 berlatar belakang rapi.

---

## Ukuran Keberhasilan

1. Staf TU dapat menginput dan mengedit NISN, jenis kelamin, tanggal lahir, dan pas foto siswa.
2. Kartu peserta ujian resmi memuat NIS, NISN, nomor peserta, pas foto 3x4, dan kode QR validasi yang tajam saat dicetak 2 kartu per lembar A4.
3. Seluruh unit/integration test suite (`npm test`), typecheck (`npm run typecheck`), dan build Next.js lulus 100%.
