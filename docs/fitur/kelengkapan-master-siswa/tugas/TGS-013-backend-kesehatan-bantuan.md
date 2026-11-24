# TGS-013 — Backend Kesehatan, Pengukuran Periodik, dan Bantuan Pendidikan

## Identitas Tugas
- **ID:** TGS-013
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Menyediakan API backend untuk profil kesehatan anak, riwayat pengukuran fisik berkala, dan catatan bantuan pendidikan.
- **Dependensi:** TGS-010, TGS-011
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Endpoints di `server/studentMaster.ts`:
   - `GET /api/students/:id/health`: Ambil profil kesehatan (golongan darah, riwayat penyakit, alergi, kebutuhan khusus, obat rutin).
   - `PUT /api/students/:id/health`: Simpan/update profil kesehatan.
   - `GET /api/students/:id/measurements`: Daftar riwayat pengukuran tinggi (cm) dan berat badan (kg).
   - `POST /api/students/:id/measurements`: Tambah catatan pengukuran baru.
   - `GET /api/students/:id/aid`: Daftar riwayat bantuan pendidikan (KIP, PIP, PKH, beasiswa).
   - `POST /api/students/:id/aid`: Tambah catatan bantuan baru.
2. Keamanan & Finansial:
   - Akses data kesehatan dilindungi izin khusus (deny-by-default untuk role non-otoritas).
   - Pencatatan bantuan pendidikan sama sekali tidak mengubah nominal tagihan SPP atau status lunas invoice secara otomatis.

## Acceptance Criteria
- Pengukuran fisik baru menambah riwayat tanpa menimpa data lama.
- Data bantuan pendidikan tercatat secara administratif murni.
