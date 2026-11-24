# TGS-019 — Import Excel, Export, Cetak Biodata dan Buku Induk

## Identitas Tugas
- **ID:** TGS-019
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Menyediakan modul import XLSX berbasis wizard 5 tahap, export terfilter, dan cetak cetak dokumen standar A4 (Formulir Biodata Siswa dan Ringkasan Buku Induk).
- **Dependensi:** TGS-011 s/d TGS-018
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Wizard Import Excel:
   - 5 Langkah: 1. Template & Panduan -> 2. Upload Berkas -> 3. Validasi Baris -> 4. Konfirmasi -> 5. Hasil Selesai.
   - Validasi menyeluruh tiap baris (NIS unik, NIK/KK 16 digit, kelas valid). Menolak commit jika ada error data.
2. Modal Export Data:
   - Pilihan cakupan (Filter aktif / Seluruh siswa / Siswa terpilih).
   - Pemilihan kelompok kolom (Identitas umum, Akademik, Kontak). Proteksi terhadap formula injection.
3. Cetak Formulir Biodata Siswa A4:
   - Layout resmi A4 dengan kop SDIT AT-TAQWIM, pas foto 3x4, biodata terstruktur, dan kolom tanda tangan ortu/wali & petugas TU.
4. Cetak Ringkasan Buku Induk:
   - Ringkasan nomor induk siswa, biodata kependudukan berizin, riwayat kenaikan/penempatan kelas, dan catatan status siswa.

## Acceptance Criteria
- Preview validasi import menyajikan detail baris yang salah dan alasannya.
- Dokumen cetak A4 memiliki CSS `@media print` yang bersih dan tidak terpotong.
