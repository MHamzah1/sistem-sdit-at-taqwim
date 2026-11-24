# TGS-017 — Frontend Detail Profil Siswa

## Identitas Tugas
- **ID:** TGS-017
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Merancang ulang antarmuka detail profil siswa (`StudentDetailView.tsx`) dengan navigasi tab lengkap.
- **Dependensi:** TGS-015, TGS-016
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Header Profil:
   - Pas foto 3x4, Nama Siswa, NIS, NISN, Kelas, Tahun Ajaran, Badge Status.
   - Progress bar kelengkapan biodata (%) dan dokumen terverifikasi.
   - Tombol "Ubah Data" dan "Cetak Biodata / Buku Induk".
2. Navigasi Tab Komprehensif:
   - **Ringkasan:** Kartu identitas ringkas, status SPP, kelayakan ujian, status administrasi.
   - **Biodata:** Label-value dua kolom (Identitas, Alamat KK, Domisili, Akses sekolah).
   - **Akademik:** Data penerimaan, asal sekolah, kelas aktif, tabel riwayat penempatan.
   - **Orang Tua & Wali:** Kartu Ayah, Ibu, Wali lainnya, Kontak utama, Penanggung jawab SPP, Kontak darurat, Status akses portal wali.
   - **Kesehatan:** Profil medis, kebutuhan khusus, tabel riwayat pengukuran fisik (+ tombol tambah ukur).
   - **Bantuan Pendidikan:** Status KIP/PIP/PKH/beasiswa, tabel riwayat bantuan (+ tombol tambah bantuan).
   - **Karakteristik Anak:** Template kuesioner, ringkasan jawaban, riwayat pengisian.
   - **Dokumen:** Tabel dokumen persyaratan, status verifikasi, tombol lihat/unduh, modal review berkas bagi TU.
   - **Keuangan:** Histori invoice SPP, pembayaran tunai/transfer, modal bayar (fitur existing dipertahankan).
   - **Ujian:** Periode ujian, kelayakan 3 syarat, dispensasi kepsek, cetak kartu QR (fitur existing dipertahankan).
   - **Riwayat Perubahan:** Log audit aktivitas pada profil siswa.

## Acceptance Criteria
- Seluruh fitur finansial dan kartu ujian existing tetap berfungsi normal.
- Data yang belum diisi menampilkan teks "Belum diisi" disertai tautan cepat menuju form ubah section terkait.
