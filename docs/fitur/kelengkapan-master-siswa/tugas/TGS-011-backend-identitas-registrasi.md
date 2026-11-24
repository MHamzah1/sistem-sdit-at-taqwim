# TGS-011 — Backend Identitas, Alamat, Registrasi, dan Draft

## Identitas Tugas
- **ID:** TGS-011
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Mengimplementasikan endpoint dan logika transaksi atomik untuk penambahan/perubahan siswa, alamat, registrasi, dan draft pendaftaran.
- **Dependensi:** TGS-010
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Membangun modul backend `server/studentMaster.ts` yang menangani Zod validation skema biodata siswa, alamat KK & domisili, data registrasi, dan draft.
2. Endpoint:
   - `POST /api/students/profile`: Transaksi atomik insert siswa, alamat identitas & domisili, registrasi, dan relasi keluarga.
   - `PATCH /api/students/:id/profile`: Update profil siswa dan relasi terikat.
   - `POST /api/student-drafts`: Simpan draft sementara.
   - `GET /api/student-drafts`: Daftar draft milik user aktif.
   - `GET /api/student-drafts/:id`: Ambil detail satu draft.
   - `PATCH /api/student-drafts/:id`: Simpan ulang perubahan draft.
   - `DELETE /api/student-drafts/:id`: Hapus draft.
   - `POST /api/student-drafts/:id/finalize`: Finalisasi draft menjadi data siswa aktif di database.
3. Menyesuaikan `server/state.ts` agar query `/api/state` menggunakan projection eksplisit aman (tidak membocorkan NIK/KK melalui select all).

## Acceptance Criteria
- Transaksi database rollback jika salah satu entitas gagal disimpan.
- Validasi Zod memeriksa format NIK (16 digit), NISN (10 digit), KK (16 digit), dan tanggal lahir nyata.
- Draft tidak memicu pembuatan tagihan SPP atau evaluasi kartu ujian.
