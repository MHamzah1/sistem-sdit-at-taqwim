# TGS-014 — Backend Dokumen Persyaratan dan Verifikasi

## Identitas Tugas
- **ID:** TGS-014
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Mengelola berkas persyaratan siswa (KK, Akta, KTP ortu, Pas Foto, dsb.) dengan private storage Vercel Blob dan alur verifikasi berkas oleh staf TU.
- **Dependensi:** TGS-010, TGS-011
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Endpoints di `server/files.ts` dan `server/studentMaster.ts`:
   - `GET /api/students/:id/documents`: Checklist dokumen wajib dan opsional beserta status saat ini.
   - `POST /api/student-documents/upload`: Pembuatan upload token private Vercel Blob dengan validasi ukuran (maks 5MB) dan MIME (JPEG, PNG, WEBP, PDF).
   - `POST /api/students/:id/documents`: Registrasi metadata dokumen yang telah berhasil diunggah.
   - `GET /api/student-documents/:id/content`: Stream/unduh isi dokumen terotorisasi (guardian scoping & TU permission).
   - `POST /api/student-documents/:id/review`: Aksi verifikasi berkas (`VERIFIED`) atau penolakan (`REJECTED`) dengan alasan wajib.
2. Kompatibilitas Foto Legacy:
   - Renderer kartu ujian tetap mendukung `photoUrl` bertipe compressed data URL maupun private storage terotorisasi.

## Acceptance Criteria
- Dokumen tidak dapat diakses secara publik (private storage).
- Akses lintas siswa ditolak oleh sistem otorisasi (anti-IDOR).
- Status verifikasi dokumen tercatat lengkap dengan identitas reviewer dan timestamp.
