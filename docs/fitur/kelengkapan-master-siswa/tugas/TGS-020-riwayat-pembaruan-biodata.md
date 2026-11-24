# TGS-020 — Riwayat Akademik dan Pengajuan Pembaruan Biodata Wali

## Identitas Tugas
- **ID:** TGS-020
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Menyediakan pencatatan mutasi/penempatan akademik siswa dengan perlindungan guard tagihan 409, serta alur pengajuan perubahan biodata dari portal wali murid.
- **Dependensi:** TGS-011 s/d TGS-018
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Riwayat Akademik Siswa:
   - Pencatatan penempatan awal, mutasi kelas, kenaikan kelas, atau kelulusan di `student_enrollments`.
   - Tetap mematuhi aturan integritas `server/resources.ts`: Siswa yang telah memiliki histori invoice SPP tidak dapat diubah kelasnya secara sembarangan tanpa proses mutasi terkontrol.
2. Pengajuan Pembaruan Biodata Wali:
   - Wali murid melalui portal dapat melihat biodata anak dan mengajukan usulan pembaruan (`student_profile_change_requests`).
   - Usulan berstatus `SUBMITTED` masuk ke antrean verifikasi staf TU.
   - Staf TU dapat mereview usulan (melihat nilai lama vs nilai usulan), lalu menyetujui (`APPROVED`) atau menolak (`REJECTED`) dengan catatan.

## Acceptance Criteria
- Wali murid tidak dapat mengubah data secara langsung tanpa proses review.
- Proteksi invoice SPP tetap aktif dan tidak dapat dilewati via endpoint mutasi.
