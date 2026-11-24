# TGS-016 — Frontend Tambah dan Ubah Siswa (Form 10 Section)

## Identitas Tugas
- **ID:** TGS-016
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Merancang ulang antarmuka input siswa (`StudentFormView.tsx`) dengan arsitektur navigasi 10 section terpadu.
- **Dependensi:** TGS-011 s/d TGS-015
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Form 10 Section Reusable:
   - Layout 2 panel: Sidebar navigasi section di kiri (desktop) dan accordion/select di atas (mobile).
   - Section 01: Identitas Siswa (Pas foto 3x4 preview & crop/upload, NIK, KK, NIS, NISN, TTL, kalkulasi usia otomatis).
   - Section 02: Alamat & Domisili (Alamat KK, RT/RW, Dusun, Provinsi/Kota/Kec/Kel, Kode pos, Checkbox domisili sama, moda transportasi, jarak & waktu).
   - Section 03: Registrasi & Akademik (No registrasi, jenis siswa baru/pindahan, sekolah asal, riwayat PAUD/TK, kelas aktif).
   - Section 04: Data Ayah Kandung (Pilihan cari existing / baru, biodata lengkap, status hidup, pendidikan, pekerjaan, penghasilan, kontak).
   - Section 05: Data Ibu Kandung (Pilihan cari existing / baru, biodata lengkap, status hidup, pendidikan, pekerjaan, penghasilan, kontak).
   - Section 06: Wali & Kontak Darurat (Penanggung jawab siswa, kontak utama, penanggung jawab SPP, kontak darurat, tautan portal wali).
   - Section 07: Kesehatan & Kebutuhan Khusus (Golongan darah, riwayat penyakit, alergi, kebutuhan khusus, riwayat pengukuran berkala + modal tambah ukur).
   - Section 08: Bantuan Pendidikan (KIP, PIP, PKH, beasiswa + modal tambah bantuan).
   - Section 09: Karakteristik & Perkembangan Anak (Template kuesioner & ringkasan jawaban).
   - Section 10: Dokumen Persyaratan (Tabel dokumen wajib & kondisional, modal upload, modal review dokumen).
2. UX & State:
   - State form tersimpan utuh saat pengguna berpindah antar section tanpa reload.
   - Indikator kelengkapan biodata dan verifikasi dokumen real-time di header form.
   - Tombol "Simpan Draft" untuk menyimpan sementara ke server.
   - Tombol "Batal", "Kembali", "Selanjutnya" / "Simpan Siswa".

## Acceptance Criteria
- Seluruh 10 wireframe section terpenuhi secara visual dan fungsional.
- Tidak ada form panjang bertumpuk secara vertikal.
- Responsive di desktop (1440px), tablet (1024px), dan mobile (390px).
