# DAT-001 — Seeder Data Operasional Lengkap SDIT AT-TAQWIM

- **ID Tiket:** DAT-001
- **Objek:** Data Seeder & Inisialisasi Operasional
- **Status:** `selesai`
- **Tanggal Dibuat:** 18 November 2026
- **Penanggung Jawab:** AI Engineering Agent
- **Target Database:** PostgreSQL Neon Development (`DATABASE_URL`)

---

## 1. Latar Belakang & Tujuan

Database operasional saat ini berada dalam kondisi kosong untuk entitas operasional sekolah (hanya terdapat 4 akun pengguna dan role dasar). Tanpa data operasional, dasbor, tabel, alur persetujuan, dan portal wali murid tidak dapat diuji atau didemonstrasikan sebagaimana mestinya pada alur nyata sekolah.

Tujuan dari migrasi data **DAT-001** ini adalah:
1. Menyediakan script seeder mandiri (`scripts/seed.ts` dan perintah `npm run db:seed`) yang **idempotent** dan aman dijalankan berulang kali.
2. Mengisi seluruh domain fungsional sekolah dengan data realistis SDIT AT-TAQWIM yang mencakup seluruh skenario bisnis utama.
3. Menautkan akun contoh wali murid existing (`wali@attaqwim.sch.id`) ke profil wali dan siswa aktual, sehingga portal wali langsung memiliki data nyata untuk dicoba.

---

## 2. Kondisi Database Saat Ini

Berdasarkan audit langsung per 18 November 2026:
- `users`: 4 akun (`admin@attaqwim.sch.id`, `tu@attaqwim.sch.id`, `kepsek@attaqwim.sch.id`, `wali@attaqwim.sch.id`)
- `roles`: 4 role (`SUPER_ADMIN`, `TU_KEUANGAN`, `KEPALA_SEKOLAH`, `WALI_MURID`)
- `academic_years`: 0
- `classes`: 0
- `students`: 0
- `guardians`: 0
- `guardian_students`: 0
- `spp_configs`: 0
- `invoices`: 0
- `payments`: 0
- `payment_invoice_items`: 0
- `exam_types`: 0
- `exam_periods`: 0
- `student_exam_eligibilities`: 0
- `dispensations`: 0
- `exam_cards`: 0
- `characteristic_form_templates`: 0
- `system_settings`: 0

---

## 3. Rencana Komponen Data Operasional yang Dibangun

### A. Pengaturan Profil Sekolah (`system_settings`)
- **Key:** `school`
- **Nama Sekolah:** SDIT AT-TAQWIM
- **Nomor Telepon / WhatsApp Resmi:** `+6281234567890`

### B. Master Tahun Ajaran & Struktur Kelas
- **Tahun Ajaran Aktif:**
  - Nama: `Tahun Ajaran 2026/2027`
  - Periode: `2026-07-01` s/d `2027-06-30` (Status: `active = true`)
- **Struktur Kelas:**
  - `Kelas 1A (Al-Fatihah)`
  - `Kelas 1B (Al-Baqarah)`
  - `Kelas 2A (Ali 'Imran)`
  - `Kelas 3A (An-Nisa)`
  - `Kelas 6A (Al-Kautsar)` — Jenjang akhir calon peserta ujian kelulusan

### C. Master Tarif SPP (`spp_configs`)
- Nominal SPP Bulanan: **Rp 450.000**
- Tanggal Jatuh Tempo: **Tanggal 10** setiap bulan (`dueDay = 10`)

### D. Wali Murid & Penautan Akun Contoh
- **Wali Murid 1 (Terhubung ke Akun Login):**
  - Akun: `wali@attaqwim.sch.id`
  - Nama: Bpk. Hendra Pratama
  - WhatsApp: `+6281211112222`
  - Anak yang terhubung:
    - Siswa 1: Muhammad Fatih Pratama (Kelas 1A, NIS: `202601001`)
    - Siswa 2: Aisyah Ayudia Pratama (Kelas 2A, NIS: `202502015`)
- **Wali Murid Lainnya (4 Wali):**
  - Ibu Rina Kusuma (`+6281233334444`) — Orang tua dari Ahmad Zaki (Kelas 1A)
  - Bpk. Bambang Sutrisno (`+6281255556666`) — Orang tua dari Maryam Khadijah (Kelas 1B)
  - Ibu Siti Rahmawati (`+6281277778888`) — Orang tua dari Bilal Al-Ghifari (Kelas 3A)
  - Bpk. Dian Permana (`+6281299990000`) — Orang tua dari Salman Al-Farisi (Kelas 6A)

### E. Data Siswa (`students`) & Penautan Wali (`guardian_students`)
Total 10 siswa aktif dengan tanggal masuk realistis (Juli 2026 untuk Kelas 1 dan Juli 2025 untuk Kelas 2-6).

### F. Tagihan SPP Bulanan (`invoices`) — 5 Bulan Berjalan
Tagihan di-generate untuk 5 bulan kalender: **Juli 2026, Agustus 2026, September 2026, Oktober 2026, November 2026**.
Skenario status tagihan bervariasi untuk merefleksikan operasional nyata:
1. **Lunas Penuh (Teladan):** Seluruh invoice Juli–November berstatus `PAID` (misal: Muhammad Fatih Pratama).
2. **Lancar (Bulan Berjalan Belum Bayar):** Juli–Oktober `PAID`, November `OVERDUE` (jatuh tempo 10 Nov 2026 lewat).
3. **Menunggu Verifikasi (Pending Review TU):** Invoice November berstatus `PENDING_VERIFICATION` dengan bukti transfer bank.
4. **Menunggak 2 Bulan:** Oktober dan November berstatus `OVERDUE`.
5. **Menunggak Kritis (Butuh Dispensasi):** Agustus s/d November `OVERDUE` (4 bulan tunggakan).

### G. Transaksi Pembayaran (`payments` & `payment_invoice_items`)
1. **Pembayaran Tunai Kasir (`CASH`):**
   - Dicatat langsung oleh TU Keuangan (`tu@attaqwim.sch.id`), status `APPROVED`, lunas seketika.
2. **Pembayaran Transfer Bank (`TRANSFER`):**
   - Bukti transfer diverifikasi TU: status `APPROVED`, `reviewedBy = tuId`.
   - Bukti transfer baru diunggah wali: status `PENDING_VERIFICATION`, belum di-review (untuk demonstrasi verifikasi kasir TU).

### H. Jenis & Periode Ujian Sekolah (`exam_types` & `exam_periods`)
- **Jenis Ujian:**
  - `Penilaian Tengah Semester (PTS)`
  - `Penilaian Akhir Semester (PAS)`
- **Periode Ujian Aktif:**
  - Nama: `PTS Ganjil 2026/2027`
  - Semester: `1`
  - Pelaksanaan: `2026-09-21` s/d `2026-09-26`
  - Batas Administratif: `2026-09-15`
  - Syarat Lunas SPP: Hingga bulan `2026-09-01` (September 2026)
  - Akses Unduh Kartu Wali: `guardianDownload = true`

### I. Evaluasi Kelayakan Ujian & Kartu Ujian Ber-QR (`student_exam_eligibilities` & `exam_cards`)
- Siswa tanpa tunggakan s/d Sept 2026: Status **`ELIGIBLE`**, kartu ujian ber-QR diterbitkan.
- Siswa dengan tunggakan tanpa dispensasi: Status **`NOT_ELIGIBLE`**, kartu ujian tidak terbit.
- Siswa dengan dispensasi disetujui: Status **`ELIGIBLE_DISPENSATION`**, kartu ujian ber-QR diterbitkan dengan tanda dispensasi.

### J. Alur Dispensasi Ujian (`dispensations`, `dispensation_reviews`, `payment_promises`)
- **Kasus 1 (Baru Diajukan):** Status `SUBMITTED`, menunggu telaah awal TU.
- **Kasus 2 (Sedang Ditinjau):** Status `REVIEWED`, sudah direkomendasikan TU, menunggu putusan Kepala Sekolah.
- **Kasus 3 (Disetujui Kepsek):** Status `APPROVED`, disahkan oleh `kepsek@attaqwim.sch.id`, dilengkapi komitmen janji bayar (`payment_promises`) sebelum tanggal ujian berakhir.

### K. Instrumen Karakteristik Siswa (`characteristic_form_templates`, `fields`, `submissions`, `answers`)
- **Nama Formulir:** `Instrumen Karakter & Ibadah Harian Siswa Ganjil 2026/2027`
- **Field:**
  1. *Kedisiplinan Shalat 5 Waktu di Rumah* (Wajib)
  2. *Capaian Hafalan Al-Qur'an (Juz / Surah)* (Wajib)
  3. *Muroja'ah dan Tilawah Al-Qur'an Mandiri* (Wajib)
  4. *Kemandirian dan Budi Pekerti Anak* (Wajib)
- Terdapat contoh submission yang sudah diisi oleh wali dan yang masih belum diisi.

---

## 4. Rencana Implementasi & Eksekusi

1. **Pembuatan Berkas Seeder:**
   - Menulis berkas script: `scripts/seed.ts`
   - Menambahkan perintah di `package.json`: `"db:seed": "tsx scripts/seed.ts"`
2. **Prinsip Script:**
   - Menggunakan transaksi database terisolasi (`db.transaction`).
   - Idempotent: Menggunakan `onConflictDoNothing()` atau pemeriksaan record eksisting sehingga aman dijalankan kapan pun tanpa menduplikasi data.
   - Mengikuti kalkulasi server-side dan foreign key resmi sistem.
3. **Langkah Eksekusi:**
   - Dijalankan via perintah CLI resmi:
     ```sh
     npm run db:seed
     ```

---

## 5. Kriteria Keberhasilan & Verifikasi

- [ ] Seluruh tabel operasional (`academic_years`, `classes`, `students`, `guardians`, `spp_configs`, `invoices`, `payments`, `exam_periods`, `dispensations`, `exam_cards`, `characteristic_form_templates`, `system_settings`) memiliki data.
- [ ] Akun `wali@attaqwim.sch.id` saat login langsung menampilkan dashboard wali dengan 2 anak binaan dan tagihannya.
- [ ] Akun `tu@attaqwim.sch.id` menampilkan antrean verifikasi bukti transfer dan pengajuan dispensasi.
- [ ] Akun `kepsek@attaqwim.sch.id` menampilkan rekapitulasi sekolah dan menu pengesahan dispensasi ujian.
- [ ] Semua verifikasi otomatis (`npm run typecheck`, `npm test`) tetap berstatus 100% Lulus (20/20 tests pass).

---

## 6. Riwayat Status Tiket

| Tanggal | Status | Catatan |
|---|---|---|
| 2026-11-18 | `usulan` | Rencana seeder operasional diajukan untuk persetujuan pengguna |
| 2026-11-18 | `disetujui` | Disetujui oleh pengguna untuk dieksekusi |
| 2026-11-18 | `berjalan` | Memulai implementasi scripts/seed.ts dan eksekusi seeder |
| 2026-11-18 | `selesai` | Seeder berhasil dieksekusi, seluruh tabel operasional terisi dan terverifikasi. Laporan: [.development-history/2026-11-18-14-56-dat-001-seeder-operasional.md](../../.development-history/2026-11-18-14-56-dat-001-seeder-operasional.md) |

---

## 7. Hasil Eksekusi & Bukti Verifikasi

- **Waktu Eksekusi:** 18 November 2026 14:54 WIB
- **Perintah Dijalankan:** `npm run db:seed` (memanggil `tsx scripts/seed.ts`)
- **Hasil Eksekusi:** Berhasil tanpa error (`exit code 0`).
- **Verifikasi Jumlah Data Aktual di Database (Neon PostgreSQL):**
  - `academic_years`: 1 (Tahun Ajaran 2026/2027)
  - `classes`: 5 (1A, 1B, 2A, 3A, 6A)
  - `students`: 10 siswa aktif
  - `guardians`: 5 wali murid (akun `wali@attaqwim.sch.id` terhubung ke Bpk. Hendra Pratama)
  - `guardian_students`: 10 relasi siswa-wali
  - `spp_configs`: 1 konfigurasi (Rp 450.000, jatuh tempo tgl 10)
  - `invoices`: 50 lembar tagihan (Juli–November 2026, status realistis bervariasi)
  - `payments`: 41 transaksi pembayaran (CASH & TRANSFER)
  - `payment_invoice_items`: 41 item
  - `exam_types`: 2 jenis (PTS & PAS)
  - `exam_periods`: 2 periode (PTS Ganjil & PAS Ganjil)
  - `student_exam_eligibilities`: 10 evaluasi kelayakan
  - `dispensations`: 3 dispensasi (1 APPROVED PTS, 1 SUBMITTED PAS, 1 REVIEWED PAS)
  - `exam_cards`: 10 kartu ujian ber-QR diterbitkan
  - `characteristic_form_templates`: 1 template instrumen karakter & ibadah harian
  - `system_settings`: 1 pengaturan profil identitas sekolah SDIT AT-TAQWIM
  - `audit_logs`: 12 log audit (termasuk log seeder)
- **Verifikasi Kualitas Kode & Regresi:**
  - `npm run typecheck`: LULUS (0 error)
  - `npm test`: LULUS 20/20 tests pass (100%)

