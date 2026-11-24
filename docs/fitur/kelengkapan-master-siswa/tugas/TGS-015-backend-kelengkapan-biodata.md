# TGS-015 — Backend Indikator Kelengkapan dan Karakteristik Anak

## Identitas Tugas
- **ID:** TGS-015
- **Fitur:** Kelengkapan Master Siswa
- **Tujuan:** Menghitung indikator kelengkapan biodata dan verifikasi dokumen di server secara deterministik, serta mengintegrasikan data karakteristik siswa.
- **Dependensi:** TGS-011 s/d TGS-014
- **Status:** Selesai (Diimplementasikan di source)

## Rincian Perubahan
1. Logika Perhitungan di `server/studentMaster.ts`:
   - `GET /api/students/:id/completeness`: Mengembalikan status kelengkapan per-section (COMPLETE / INCOMPLETE / NOT_APPLICABLE), daftar field belum lengkap, pembilang/penyebut, serta persentase total.
   - Field opsional (misal NISN belum terbit, ortu meninggal, bukan pindahan) tidak menurunkan persentase kelengkapan.
   - Persentase kelengkapan biodata dipisahkan dari kelengkapan verifikasi dokumen.
2. Integrasi Karakteristik:
   - Membaca data template (`characteristic_form_templates`), pertanyaan (`characteristic_form_fields`), dan jawaban siswa (`characteristic_submissions` & `characteristic_answers`) yang sudah ada.

## Acceptance Criteria
- Nilai kelengkapan konsisten antara daftar siswa dan detail profil siswa.
- Status kelengkapan biodata tidak mempengaruhi kelayakan ujian atau status aktivasi siswa.
