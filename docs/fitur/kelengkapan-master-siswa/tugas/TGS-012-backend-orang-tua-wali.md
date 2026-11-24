# TGS-012 — Backend Orang Tua, Wali, dan Kontak Darurat

## Identitas Tugas
- **ID:** TGS-012
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Menyediakan API backend untuk pencarian individu keluarga, relasi reusable lintas saudara, dan pemisahan kontak darurat dengan akun portal.
- **Dependensi:** TGS-010, TGS-011
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Logika di `server/studentMaster.ts`:
   - `GET /api/family-members/search`: Pencarian individu keluarga berdasarkan nama/NIK/nomor HP dengan masking identifier sensitif.
   - `PUT /api/students/:id/family`: Pengaturan relasi ayah, ibu, wali, dan kontak darurat.
2. Membedakan peran administratif:
   - Kontak Utama Sekolah
   - Penanggung Jawab SPP
   - Kontak Darurat (boleh individu keluarga atau pihak lain)
   - Akun Portal Wali (tabel `guardians` & `guardian_students`).

## Acceptance Criteria
- Satu data ayah/ibu dapat direferensikan oleh beberapa siswa bersaudara.
- Pembuatan/pengaitan anggota keluarga tidak otomatis membuat akun portal atau mereset password.
- Status orang tua meninggal atau tidak diketahui tidak memaksakan field wajib yang tidak relevan.
