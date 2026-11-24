# 4. Urutan Tugas (Roadmap TGS-010 – TGS-021)

| ID | Tugas | Deskripsi Singkat | Status Rencana |
|---|---|---|---|
| TGS-010 | Schema Master Siswa, Relasi dan Kontrak Data | Penambahan entitas additive di `src/db/schema.ts` (students extended, addresses, family members, enrollments, health, periodic, aid, documents, drafts, change requests). | Direncanakan |
| TGS-011 | Backend Identitas, Alamat, Registrasi, Draft | Endpoint `/api/students/profile`, atomic transactions, draft CRUD, finalisasi siswa. | Direncanakan |
| TGS-012 | Backend Keluarga, Wali, Kontak Darurat | Endpoint pencarian keluarga reusable `/api/family-members/search`, relasi multi-siswa, link portal aman. | Direncanakan |
| TGS-013 | Backend Kesehatan, Pengukuran Periodik, Bantuan | Endpoint profil kesehatan, riwayat pengukuran tinggi/berat, data penerima bantuan tanpa efek samping tagihan. | Direncanakan |
| TGS-014 | Backend Dokumen, Storage dan Verifikasi | Endpoint upload token private blob, registrasi metadata, download terotorisasi, verifikasi & tolak berkas. | Direncanakan |
| TGS-015 | Backend Indikator Kelengkapan & Integrasi Karakteristik | Perhitungan kelengkapan 10 section server-side, integrasi template & jawaban karakteristik. | Direncanakan |
| TGS-016 | Frontend Form Siswa: 10 Section Form & Layout | Redesain `StudentFormView.tsx` dengan navigasi section kiri, progress kelengkapan, resume draft. | Direncanakan |
| TGS-017 | Frontend Detail Profil Siswa | Redesain `StudentDetailView.tsx` dengan tab-tab navigasi lengkap, integrasi cetak A4 dan buku induk. | Direncanakan |
| TGS-018 | Frontend Daftar Master Siswa | Redesain `src/app/(app)/master/siswa/page.tsx` dengan metrik summary, search/filter, server pagination, modal draft. | Direncanakan |
| TGS-019 | Import Excel, Export, Cetak Biodata & Buku Induk | Wizard 5 langkah import XLSX, modal export filterable, cetak formulir A4 & buku induk. | Direncanakan |
| TGS-020 | Riwayat Akademik & Pengajuan Perubahan Wali | Pencatatan mutasi kelas dengan guard 409 invoice, form pengajuan perubahan wali & antrean review TU. | Direncanakan |
| TGS-021 | Integrasi, Keamanan, Regresi, Verifikasi Statis | Test suite `tests/student-master.test.ts`, audit typecheck, pemetaan TC-01 s/d TC-60, laporan akhir. | Direncanakan |
