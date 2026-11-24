# 4. Urutan Tugas (Roadmap TGS-010 – TGS-021 & Mapping Finishing FIN-001 – FIN-012)

Berikut adalah pemetaan satu-ke-satu antara tiket resmi repository (TGS-010 s/d TGS-021) dengan tiket finishing (FIN-001 s/d FIN-012) pasca audit commit `e3b88d4`:

| ID TGS | ID Finishing | Tugas & Cakupan | Prioritas | Status Source |
|---|---|---|---|---|
| TGS-010 | FIN-002 | **Pemulihan 10 Kolom Skema & Integritas Relasi**: Pemulihan 10 kolom `students`, unique index `(student_id, address_type)`, FK `supporting_document_id`, sinkronisasi status akademik. | P0 pertama | SELESAI (Source) / BLOCKED_SCHEMA (DB) |
| TGS-011 | FIN-001 | **Keamanan, RBAC, Masking & Audit**: Proyeksi whitelist data sensitif, masking NIK/KK/HP, sanitizer audit rekursif, proteksi data medis. | P0 | SELESAI |
| TGS-012 | FIN-003 | **Penyimpanan Atomik Profil 10 Section**: Transaksi `createStudentAtomic` & `updateStudentProfile`, pemisahan kontak darurat, guard tagihan 409. | P0 | SELESAI |
| TGS-013 | FIN-004 | **Upload, Review & Unduh Dokumen Nyata**: Private Blob token, validasi server-side 5 MB, MIME signature, byte streaming penuh > 2 MB. | P0 | SELESAI |
| TGS-014 | FIN-005 | **Import XLSX & Export Nyata**: Endpoint `/api/students/import/preview` & `/api/students/import/commit`, validasi leading zero & intra-file duplicate. | P0 | SELESAI |
| TGS-015 | FIN-006 | **Kontrak API & DTO Konsisten**: Penyelarasan URL, DTO typed, payload review `{ approved, rejectionReason }`, error envelope terstruktur. | P1 | SELESAI |
| TGS-016 | FIN-007 | **Manajemen Draft & Resume Aman**: Query param `?draftId=...`, guard HTTP 409 pada draft berstatus `FINALIZED`, kepemilikan draft. | P1 | SELESAI |
| TGS-017 | FIN-008 | **Authoritative Kelengkapan Biodata**: Kalkulasi 10 section terpusat, skor realitas siswa legacy (~20%), status kondisional. | P1 | SELESAI |
| TGS-018 | FIN-009 | **Integrasi Karakteristik Anak Real**: Menghubungkan tabel karakteristik existing, status EMPTY menandai section 09 INCOMPLETE. | P1 | SELESAI |
| TGS-019 | FIN-010 | **Pengajuan Pembaruan Biodata Wali**: Entry point di Dashboard Wali Murid, antrean review TU, guard anti-IDOR. | P1 | SELESAI |
| TGS-020 | FIN-011 | **Integrasi Frontend & MANDATORY UI FREEZE**: Pengkabelan state/handler/validasi tanpa mengubah layout 2-panel, spacing, atau Base Component. | P1 | SELESAI |
| TGS-021 | FIN-012 | **QA, Test Suite & Pelaporan Bukti**: Test suite `tests/student-master.test.ts` (14 unit test), pemetaan TC-01 s/d TC-80, laporan finishing komprehensif. | P1 | SELESAI |
