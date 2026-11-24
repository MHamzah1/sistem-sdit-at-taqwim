# 2. Keputusan Wawancara — Master Siswa SDIT AT-TAQWIM

Berdasarkan dokumen instruksi induk yang telah disetujui pengguna (`INSTRUKSI_AGENT_MASTER_SISWA_SDIT_AT_TAQWIM.md`), berikut adalah keputusan bisnis dan teknis yang terkunci:

## 1. Keputusan Ruang Lingkup & Alur Bisnis
1. **Master Siswa sebagai Sumber Induk Tunggal:** Tidak dibuat modul PPDB terpisah. Seluruh data identitas, pendaftaran, dan administrasi siswa dikelola langsung melalui menu Master Data Siswa.
2. **Sepuluh (10) Section Informasi Wajib:**
   - Section 01: Identitas Siswa (Pas Foto 3x4, Nama Lengkap, Panggilan, NIS, NISN, NIK, KK, Akta, Gender, TTL, Usia otomatis, Agama, Kewarganegaraan, Anak ke-, Saudara, Bahasa).
   - Section 02: Alamat & Tempat Tinggal (Alamat KK, RT/RW, Dusun, Wilayah bertingkat, Kode Pos, Checkbox Domisili sama, Jenis tinggal, Transportasi, Jarak & Waktu tempuh).
   - Section 03: Registrasi & Akademik (No Pendaftaran, Jenis baru/pindahan, Tanggal masuk, Tahun ajaran masuk, Tingkat masuk, Kelas aktif, Riwayat PAUD/TK, Sekolah asal).
   - Section 04: Data Ayah Kandung (Pilihan ayah existing / baru, Biodata lengkap, Pendidikan, Pekerjaan, Penghasilan, Kontak WA, Email, Alamat).
   - Section 05: Data Ibu Kandung (Pilihan ibu existing / baru, Biodata lengkap, Pendidikan, Pekerjaan, Penghasilan, Kontak WA, Email, Alamat).
   - Section 06: Wali & Kontak Darurat (Penanggung jawab siswa dari Ayah/Ibu/Wali lainnya, Kontak utama, Penanggung jawab SPP, Kontak darurat terpisah, Tautan akun portal wali).
   - Section 07: Kesehatan & Kebutuhan Khusus (Gol darah, Penyakit, Alergi, Kebutuhan khusus, Obat rutin, Catatan darurat, Riwayat pengukuran tinggi/berat berkala).
   - Section 08: Bantuan Pendidikan (KIP, PIP, PKH, KKS/KPS, Beasiswa internal/eksternal; informasi administrasi murni tanpa mengubah tagihan SPP otomatis).
   - Section 09: Karakteristik & Perkembangan Anak (Integrasi template kuesioner karakteristik dan submission yang sudah ada di database).
   - Section 10: Dokumen Persyaratan (Tabel dokumen wajib/kondisional: KK, Akta, KTP Ayah, KTP Ibu, Foto, Ijazah TK, Rapor asal, dll. dengan kontrol upload private Blob dan verifikasi TU).
3. **Pemisahan Identitas Keluarga (Family Members) dari Akun Portal (Guardians):**
   - Entitas `family_members` menyimpan biodata fisik ayah, ibu, wali.
   - Satu record ayah/ibu dapat direlasikan ke beberapa siswa yang bersaudara (`student_family_members`).
   - Akun portal wali (`guardians` + `guardian_students`) tetap menjadi basis otorisasi login portal dan tidak dibuat otomatis tanpa persetujuan eksplisit.
4. **Draft Pendaftaran:**
   - Pengguna dapat menyimpan draft pendaftaran sementara tanpa memicu pembuatan invoice SPP atau kartu ujian.
5. **Proteksi Finansial & Ujian:**
   - Tidak boleh ada perubahan nominal invoice atau syarat kelayakan ujian yang terpicu secara otomatis dari status kelengkapan biodata atau bantuan pendidikan.
   - Guard HTTP 409 pada mutasi kelas siswa bertagihan tetap berlaku ketat.
