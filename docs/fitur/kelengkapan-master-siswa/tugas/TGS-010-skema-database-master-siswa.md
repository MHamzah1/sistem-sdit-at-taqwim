# TGS-010 — Schema dan Relasi Master Siswa

## Identitas Tugas
- **ID:** TGS-010
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Mendefinisikan penambahan schema database Drizzle ORM di `src/db/schema.ts` secara additive tanpa mengubah PK/FK eksisting.
- **Dependensi:** Tidak ada
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Memperluas tabel `students` dengan field tambahan:
   - `nickname`, `nik`, `familyCardNumber`, `birthCertificateNumber`, `religion`, `citizenship`, `birthOrder`, `siblingCount`, `dailyLanguage`, `studentStatus`.
2. Membuat tabel baru:
   - `student_addresses`: Alamat KK dan domisili, profil tempat tinggal dan akses sekolah.
   - `family_members`: Master data individu ayah, ibu, dan wali.
   - `student_family_members`: Relasi banyak siswa ke keluarga (reusable lintas saudara).
   - `student_enrollments`: Riwayat registrasi dan mutasi kelas.
   - `student_health_profiles`: Profil kesehatan dan kebutuhan khusus.
   - `student_periodic_data`: Riwayat pengukuran fisik berkala.
   - `student_aid_records`: Catatan bantuan pendidikan (KIP, PIP, PKH, dll).
   - `student_documents`: Metadata dokumen persyaratan siswa.
   - `student_drafts`: Penyimpanan draft formulir siswa yang belum difinalisasi.
   - `student_profile_change_requests`: Pengajuan perubahan biodata oleh wali murid.

## Acceptance Criteria
- Seluruh kolom baru bersifat nullable atau memiliki default value aman.
- Skema terdefinisi secara type-safe di `src/db/schema.ts`.
- Tidak ada file migrasi SQL baru atau modifikasi database langsung pada tahap ini sesuai batasan teknis.
