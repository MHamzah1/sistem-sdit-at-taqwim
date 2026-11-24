# TGS-018 — Frontend Daftar Master Siswa

## Identitas Tugas
- **ID:** TGS-018
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Merancang ulang halaman daftar siswa (`src/app/(app)/master/siswa/page.tsx`) dengan metrik indikator kelengkapan, filter multi-dimensi, paginasi, dan manajemen draft.
- **Dependensi:** TGS-015 s/d TGS-017
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Metrik Ringkasan:
   - Total Siswa, Siswa Aktif, Biodata Lengkap, Belum Lengkap, Dokumen Menunggu Verifikasi.
2. Filter & Pencarian:
   - Pencarian real-time nama/NIS/NISN.
   - Filter dropdown Tahun Ajaran, Kelas, Status Siswa, dan Status Kelengkapan.
   - Tombol Reset Filter.
   - Tombol "Draft Pendaftaran (N)" yang membuka modal daftar draft tersimpan dengan opsi melanjutkan pengisian.
3. Tabel Master Siswa:
   - Kolom: No, Siswa (Foto & Nama), NIS/NISN, Kelas/Tahun, Wali Utama, Indikator Kelengkapan (Badge % & progress), Status Siswa, Aksi (Lihat Detail, Ubah Data, Cetak Biodata, Nonaktifkan/Hapus).
   - Server-side / client-aware pagination yang responsif.
4. Tombol Aksi Header:
   - "Import Excel", "Export Data", "+ Tambah Siswa".

## Acceptance Criteria
- Metrik jumlah siswa akurat sesuai filter atau scope.
- Draft pendaftaran terpisah dan tidak tercampur dengan siswa resmi aktif.
