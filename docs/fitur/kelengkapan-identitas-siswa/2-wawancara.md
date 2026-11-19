# Wawancara Keputusan: Kelengkapan Identitas Master Siswa

**Slug:** `kelengkapan-identitas-siswa` · **Tanggal:** 2026-11-19 · **Status:** `[x] Seluruh Keputusan Terkunci`

---

## Daftar Pertanyaan Keputusan & Rekomendasi Terbaik

### Q1. Validasi & Sifat Kolom NISN
- **Konteks:** NISN adalah Nomor Induk Siswa Nasional dari Kemendikbud. Siswa pindahan atau siswa baru kelas 1 di awal tahun ajaran seringkali masih dalam proses penerbitan NISN di sistem Dapodik.
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** NISN bersifat **opsional (nullable)** saat input data siswa, namun jika diisi **wajib tepat 10 digit angka** dan bersifat unik di database.
  - **Opsi B:** NISN bersifat wajib diisi saat tambah siswa baru (bisa menghambat pendaftaran siswa kelas 1 baru yang belum punya NISN).
- **💡 Rekomendasi Terbaik:** **Opsi A** — Sangat fleksibel untuk kondisi riil sekolah dasar, tidak memblokir registrasi siswa baru, namun tetap menjamin validitas 10 digit angka jika NISN sudah diterbitkan.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

### Q2. Standar Kode & Nilai Jenis Kelamin
- **Konteks:** Standar data pokok pendidikan (Dapodik) Indonesia menggunakan kode `L` untuk Laki-laki dan `P` untuk Perempuan.
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Menggunakan kode standar `L` (Laki-laki) dan `P` (Perempuan) dengan check constraint di database (`CHECK (gender in ('L', 'P'))`). Pada antarmuka pengguna ditampilkan pilihan radio/dropdown yang ramah: *"Laki-laki"* dan *"Perempuan"*.
  - **Opsi B:** Teks bebas tanpa batasan constraint (berisiko inkonsistensi data seperti "Pria", "Wanita", dsb.).
- **💡 Rekomendasi Terbaik:** **Opsi A** — Standar resmi pendidikan nasional, hemat ruang penyimpanan, dan data 100% konsisten.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

### Q3. Mekanisme Input Pas Foto Siswa
- **Konteks:** Pas foto siswa dibutuhkan untuk kartu ujian dan identitas buku induk. Namun tidak semua siswa memiliki file pas foto digital saat pertama kali didaftarkan.
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Field `photoUrl` opsional (bisa berupa tautan foto atau hasil upload bukti) disertai pratinjau instan (*live preview*). Jika foto belum diunggah, antarmuka dan kartu ujian otomatis merender avatar/siluet pas foto 3x4 yang elegan dengan inisial nama siswa.
  - **Opsi B:** Foto wajib diisi dan mewajibkan kamera live saat tambah siswa (terlalu rumit dan memperlambat kerja TU).
- **💡 Rekomendasi Terbaik:** **Opsi A** — Praktis, tidak membebani staf Tata Usaha, dan tampilan kartu tetap rapi serta profesional meski foto belum sempat diunggah.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

### Q4. Tata Letak Pas Foto pada Kartu Ujian (Individual & Cetak Massal A4)
- **Konteks:** Kartu ujian peserta wajib memuat foto siswa dan kode QR verifikasi (FR-CARD-001).
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Pas foto siswa berasio 3x4 (lebar ~75px, tinggi ~100px) diletakkan berdampingan dengan kode QR di sisi kanan kartu (atau di samping blok identitas), lengkap dengan bingkai foto resmi dan label Nomor Peserta serta NISN.
  - **Opsi B:** Foto ditaruh terpisah di halaman belakang (tidak praktis untuk kartu ujian name tag).
- **💡 Rekomendasi Terbaik:** **Opsi A** — Tata letak simetris dan proporsional untuk cetak kertas 2 kartu per lembar A4 maupun dimasukkan ke plastik name tag B2/B3.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

### Q5. Penyajian di Tabel Master Siswa & Pencarian Cepat
- **Konteks:** Staf TU dan Kepala Sekolah perlu melihat sekilas status kelengkapan data siswa dari tabel Master Siswa.
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Tabel Master Siswa menampilkan thumbnail foto mini, nama siswa, NIS, NISN (dengan penanda jika belum diisi), dan badge jenis kelamin (`L` / `P`). Kolom filter pencarian secara cerdas mencocokkan Nama, NIS, maupun NISN.
  - **Opsi B:** Tabel tetap minimalis seperti sekarang dan identitas baru hanya bisa dilihat jika menekan tombol Edit.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Memberikan visibilitas langsung bagi staf TU untuk mengetahui siswa mana yang datanya belum lengkap tanpa perlu membuka form satu per satu.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

## Panduan Fast-Track Approval

Jika setuju dengan seluruh rekomendasi terbaik (Opsi A pada Q1 s/d Q5), cukup balas:
> **"Setuju semua rekomendasi"**
