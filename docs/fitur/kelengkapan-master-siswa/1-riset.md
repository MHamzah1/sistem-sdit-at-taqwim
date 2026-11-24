# 1. Riset Codebase — Kelengkapan Master Siswa SDIT AT-TAQWIM

## 1. Konteks dan Baseline
- **Repository:** `MHamzah1/sistem-sdit-at-taqwim`
- **Branch:** `main`
- **Baseline Snapshot:** `sistem-sdit-at-taqwim-main.zip`
- **Tujuan:** Mengembangkan menu Master Siswa existing menjadi data induk siswa lengkap untuk administrasi sekolah dasar (setara kelengkapan PPDB/SPMB), mencakup 10 domain informasi terstruktur tanpa merusak sistem SPP, kelayakan ujian, dan kartu ujian yang sudah berjalan.

## 2. Audit Komponen Eksisting

| Modul/File | Kondisi Saat Ini | Temuan & Kebutuhan Pengembangan |
|---|---|---|
| `src/db/schema.ts:144-169` (`students`) | Menyimpan kolom dasar: `id`, `nis`, `nisn`, `name`, `gender`, `birthPlace`, `birthDate`, `photoUrl`, `classId`, `enrolledOn`, `active`. | Perlu penambahan additive: `nickname`, `nik`, `familyCardNumber`, `birthCertificateNumber`, `religion`, `citizenship`, `birthOrder`, `siblingCount`, `dailyLanguage`, `studentStatus`. |
| Relasi Keluarga & Wali (`guardians`, `guardian_students`) | Relasi flat 1 wali ke 1 akun user portal, terhubung lewat `guardian_students`. | Tidak ada pemisahan biodata ayah, ibu, dan wali fisik. Satu orang tua belum bisa direlasikan secara modular ke beberapa siswa bersaudara. |
| Alamat & Domisili | Belum ada tabel alamat terstruktur. | Perlu tabel `student_addresses` untuk alamat KK dan domisili, profil tempat tinggal, transportasi, serta jarak tempuh ke sekolah. |
| Riwayat Registrasi & Akademik | Hanya tersimpan `enrolledOn` dan `classId` di tabel `students`. | Perlu tabel `student_enrollments` untuk nomor registrasi, sekolah asal (TK/PAUD), riwayat mutasi/penempatan tanpa merusak FK existing. |
| Profil Medis & Kesehatan | Belum ada penyimpanan data kesehatan anak. | Perlu tabel `student_health_profiles` dan `student_periodic_data` untuk riwayat penyakit, alergi, kebutuhan khusus, serta pengukuran tinggi/berat berkala. |
| Bantuan Pendidikan | Belum tercatat. | Perlu tabel `student_aid_records` untuk KIP, PIP, PKH, KKS, beasiswa internal/eksternal sebagai data administratif murni (tidak mengubah tagihan SPP otomatis). |
| Dokumen Persyaratan | Hanya ada `payment_proofs` di Vercel Blob untuk bukti transfer SPP. | Perlu `student_documents` untuk KK, Akta, KTP orang tua, pas foto, ijazah TK, dsb. dengan private storage dan kontrol verifikasi TU. |
| Karakteristik Siswa | Tabel `characteristic_form_templates` dll. sudah ada di `src/db/schema.ts`. | Integrasikan template dan submission existing ke tab detail siswa dan form pengisian. |
| `server/state.ts` (`/api/state`) | Melakukan `db.select().from(s.students)`. | **Temuan Kritis:** Jika kolom sensitif NIK/KK ditambahkan ke `students`, `select *` akan membocorkannya ke seluruh client. Wajib diubah menjadi projection eksplisit aman. |
| `server/resources.ts` | Guard integritas melarang perubahan `classId`/`enrolledOn` pada siswa yang telah memiliki tagihan (HTTP 409). | Guard wajib dipertahankan; perubahan akademik harus lewat alur terkontrol. |
| Form Input (`StudentFormView.tsx`) | Form satu halaman sederhana dengan input dasar nama, NIS, kelas, foto URL/file data compressed. | Harus didesain ulang menjadi 10-section layout dengan navigasi sidebar kiri (desktop) dan accordion (mobile). |
| Detail Siswa (`StudentDetailView.tsx`) | Menampilkan ringkasan, riwayat SPP, kelayakan ujian, dan kartu QR. | Harus diperluas dengan tab-tab navigasi lengkap tanpa menghilangkan fitur finansial dan ujian existing. |

## 3. Kesimpulan Riset
Seluruh penambahan schema harus bersifat **additive** (nullable/default aman) agar data siswa legacy tetap valid. Semua transaksi penambahan siswa dan entitas terkait harus dirancang atomik di backend.
