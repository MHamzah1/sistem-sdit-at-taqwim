# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Sistem Penanganan SPP & Kelayakan Ujian Sekolah

**Status Dokumen:** Final  
**Versi:** 1.0  
**Tanggal:** 1 September 2026  
**Jenis Produk:** Web-Based School Management System  
**Target Implementasi:** Satu sekolah / satu jenjang  
**Fokus Utama:** Penanganan tunggakan SPP melalui integrasi administrasi ujian

---

# 1. Executive Summary

Sistem Penanganan SPP & Kelayakan Ujian adalah aplikasi sekolah berbasis web yang dirancang untuk membantu sekolah mengurangi tunggakan SPP melalui mekanisme penagihan, monitoring pembayaran, dan kontrol administratif menjelang ujian.

Pada proses sekolah yang berjalan saat ini, siswa memperoleh:

1. Kartu ujian.
2. Form karakteristik anak untuk diisi oleh wali murid terkait aktivitas dan perilaku anak di rumah.

Siswa yang belum memenuhi kewajiban pembayaran SPP tidak memperoleh kedua dokumen tersebut.

Sistem baru akan mendigitalisasi seluruh proses mulai dari:

> Data Siswa → Tagihan SPP → Penagihan → Pembayaran → Verifikasi → Kelayakan Ujian → Dispensasi → Kartu Ujian → Form Karakteristik → Monitoring & Laporan

Tujuan utama sistem adalah **mengurangi jumlah dan nominal tunggakan SPP**, sekaligus meningkatkan transparansi kepada wali murid dan mengurangi pekerjaan administratif manual sekolah.

---

# 2. Problem Statement

Sekolah menghadapi beberapa permasalahan utama:

1. Wali murid sering terlambat atau menunggak pembayaran SPP.
2. Petugas harus mengecek pembayaran siswa secara manual menjelang ujian.
3. Penentuan siswa yang berhak memperoleh kartu ujian belum terotomatisasi.
4. Riwayat tunggakan sulit dipantau secara cepat.
5. Wali murid tidak selalu mengetahui kondisi tagihan secara transparan.
6. Penagihan melalui WhatsApp dilakukan secara manual dan tidak terstruktur.
7. Pengajuan dispensasi belum memiliki pencatatan dan histori yang terorganisir.
8. Form karakteristik anak masih menggunakan lembar kertas.
9. Kepala sekolah belum mempunyai dashboard tunggakan dan kelayakan ujian secara real-time.
10. Riwayat perubahan pembayaran dan dispensasi belum mempunyai audit trail yang baik.

---

# 3. Product Vision

Membangun sistem administrasi sekolah yang mengintegrasikan pembayaran SPP dengan administrasi ujian sehingga sekolah dapat:

- Mengidentifikasi tunggakan lebih cepat.
- Melakukan penagihan lebih terstruktur.
- Mengotomatisasi status kelayakan ujian.
- Mengurangi kesalahan administrasi.
- Memberikan transparansi kepada wali murid.
- Memberikan mekanisme dispensasi yang terdokumentasi.
- Mendigitalisasi proses kartu ujian dan Form Karakteristik Anak.

---

# 4. Product Goals

## 4.1 Primary Goal

**Mengurangi jumlah siswa dan nominal tunggakan SPP.**

---

## 4.2 Secondary Goals

Sistem diharapkan dapat:

1. Mengurangi proses pengecekan pembayaran secara manual.
2. Mempercepat proses administrasi menjelang ujian.
3. Memudahkan wali murid melihat tagihan.
4. Memberikan reminder pembayaran.
5. Mengurangi kesalahan dalam penerbitan kartu ujian.
6. Memberikan data tunggakan secara real-time kepada kepala sekolah.
7. Menyediakan histori dispensasi.
8. Mendigitalisasi Form Karakteristik Anak.
9. Menyediakan laporan keuangan dan ujian.
10. Memberikan audit log terhadap transaksi penting.

---

# 5. Success Metrics / KPI

KPI utama yang dapat digunakan setelah implementasi:

| KPI | Target Awal |
|---|---:|
| Penurunan total nominal tunggakan | ≥ 20% |
| Penurunan siswa menunggak menjelang ujian | ≥ 25% |
| Pembayaran terverifikasi melalui sistem | ≥ 95% |
| Kartu ujian dibuat melalui sistem | 100% |
| Form karakteristik menggunakan sistem | ≥ 90% |
| Tagihan SPP tercatat melalui sistem | 100% |
| Dispensasi tercatat melalui sistem | 100% |
| Waktu pengecekan kelayakan siswa | < 5 detik/siswa |
| Kesalahan penerbitan kartu ujian | < 1% |

Target dapat dievaluasi kembali setelah 3–6 bulan penggunaan.

---

# 6. Product Scope

## 6.1 In Scope

Versi pertama mencakup:

1. Authentication.
2. Role & Permission.
3. Master siswa.
4. Master wali murid.
5. Master kelas.
6. Master tahun ajaran.
7. Master SPP.
8. Generate tagihan SPP.
9. Pembayaran tunai.
10. Pembayaran transfer.
11. Upload bukti pembayaran.
12. Verifikasi pembayaran.
13. Bukti pembayaran PDF.
14. Monitoring tunggakan.
15. Risk indicator.
16. Reminder WhatsApp.
17. Template WhatsApp.
18. Master jenis ujian.
19. Periode ujian.
20. Persyaratan SPP ujian.
21. Eligibility Engine.
22. Pengajuan dispensasi.
23. Approval dispensasi Kepala Sekolah.
24. Monitoring janji pembayaran.
25. Generate kartu ujian.
26. QR Code.
27. Nomor peserta.
28. Cetak massal kartu.
29. Form Builder Karakteristik.
30. Form karakteristik digital.
31. Rekap hasil karakteristik.
32. Print hasil karakteristik.
33. Portal wali murid.
34. Dashboard Keuangan.
35. Dashboard Kepala Sekolah.
36. Laporan.
37. Audit Log.

---

# 7. Out of Scope

Versi pertama tidak mencakup:

- Payment Gateway.
- Cicilan satu tagihan SPP.
- Beasiswa.
- Diskon SPP.
- Potongan SPP.
- Sistem akademik lengkap.
- E-learning.
- Presensi siswa.
- Pengelolaan nilai akademik.
- Payroll guru.
- Sistem perpustakaan.
- Multi sekolah.
- Multi yayasan.
- WhatsApp Business API otomatis pada fase awal.
- Mobile application native.

Integrasi tersebut dapat dikembangkan pada fase berikutnya.

---

# 8. User Roles

Sistem mempunyai enam role utama.

## 8.1 Super Admin

Memiliki akses tertinggi terhadap:

- User management.
- Role & permission.
- Master data.
- Master SPP.
- Tahun ajaran.
- Pengaturan sistem.
- Ujian.
- Pembayaran.
- Laporan.
- Audit Log.

---

## 8.2 Kepala Sekolah

Dapat:

- Melihat dashboard.
- Melihat kondisi tunggakan.
- Melihat nominal tunggakan.
- Melihat siswa belum layak ujian.
- Memberikan dispensasi.
- Menolak dispensasi.
- Mengatur kebijakan tertentu pada periode ujian.
- Melihat laporan.

---

## 8.3 Keuangan / TU

Dapat:

- Mengelola tagihan.
- Menginput pembayaran tunai.
- Memverifikasi transfer.
- Melihat tunggakan.
- Melakukan penagihan.
- Mengirim reminder WhatsApp.
- Mengajukan dispensasi.
- Mencetak bukti pembayaran.
- Melihat laporan pembayaran.

---

## 8.4 Wali Kelas

Dapat:

- Melihat siswa kelasnya.
- Melihat tagihan dan nominal tunggakan.
- Melihat status kelayakan ujian.
- Membuat Form Karakteristik.
- Melihat hasil Form Karakteristik.
- Membuka kembali form jika diperlukan.
- Mencetak hasil.

---

## 8.5 Guru

Dapat:

- Melihat data siswa sesuai permission.
- Melihat nominal tunggakan.
- Melihat status kelayakan ujian.
- Melakukan validasi QR kartu jika diberi permission.

Akses keuangan tetap menggunakan permission granular agar dapat dinonaktifkan jika kebijakan sekolah berubah.

---

## 8.6 Wali Murid

Dapat:

- Melihat seluruh anak yang terhubung dengan akunnya.
- Melihat tagihan.
- Melihat tunggakan.
- Melihat riwayat pembayaran.
- Upload bukti transfer.
- Melihat status ujian.
- Mengajukan dispensasi.
- Download kartu ujian jika diperbolehkan.
- Mengisi Form Karakteristik.
- Melihat notifikasi.

---

# 9. Core Business Rules

## BR-001 — Nominal SPP

Nominal SPP pada versi pertama sama untuk seluruh siswa.

---

## BR-002 — SPP Tidak Dapat Dicicil

Satu tagihan bulanan harus dibayar penuh.

Contoh:

SPP = Rp350.000.

Pembayaran Rp200.000 terhadap satu tagihan tidak diperbolehkan.

---

## BR-003 — Multi-Month Payment

Wali murid diperbolehkan membayar beberapa bulan sekaligus.

---

## BR-004 — Eligibility Berdasarkan Periode

Setiap periode ujian memiliki persyaratan bulan SPP yang harus dilunasi.

Contoh:

> UAS Desember mensyaratkan seluruh SPP sampai November lunas.

---

## BR-005 — Tunggakan Lama Tetap Dihitung

Jika terdapat satu bulan lama yang belum lunas, siswa tetap:

**BELUM LAYAK UJIAN**

meskipun bulan setelahnya sudah dibayar.

---

## BR-006 — Status Ujian Otomatis

Eligibility Engine menghitung kelayakan siswa secara otomatis.

---

## BR-007 — Pembayaran dan Eligibility Berbeda

Status:

**LAYAK UJIAN - DISPENSASI**

tidak mengubah status:

**BELUM LUNAS**

---

## BR-008 — Override Hanya Melalui Dispensasi

Status kelayakan hasil sistem tidak boleh diubah manual secara langsung.

Override dilakukan melalui proses dispensasi oleh Kepala Sekolah.

---

## BR-009 — Kartu Ditahan

Status:

**BELUM LAYAK**

menyebabkan kartu ujian tidak dapat diterbitkan.

---

## BR-010 — Form Karakteristik Ditahan

Status:

**BELUM LAYAK**

menyebabkan Form Karakteristik terkunci.

---

## BR-011 — Dispensasi Membuka Akses

Jika dispensasi disetujui:

- Kartu ujian dapat diterbitkan.
- Form Karakteristik terbuka.

---

## BR-012 — Hak Pendidikan

Sistem tidak secara otomatis menentukan bahwa siswa dilarang mengikuti kegiatan pendidikan.

Sistem hanya mengontrol **status administrasi dan penerbitan dokumen ujian**.

Keputusan khusus berada di bawah kewenangan sekolah.

---

# 10. Master Data

## FR-MD-001 — Data Siswa

Minimal menyimpan:

- ID siswa.
- NIS.
- NISN.
- Nama.
- Foto.
- Jenis kelamin.
- Tanggal lahir.
- Kelas.
- Tahun ajaran.
- Status siswa.
- Wali murid.
- Nomor WhatsApp wali.

---

## FR-MD-002 — Data Wali Murid

Minimal:

- Nama.
- Hubungan.
- Nomor WhatsApp.
- Email.
- Username.
- Password.
- Status akun.

Satu wali murid dapat mempunyai lebih dari satu siswa.

---

## FR-MD-003 — Data Kelas

Data:

- Tingkat.
- Nama kelas/rombel.
- Wali kelas.
- Tahun ajaran.
- Status.

---

# 11. Modul SPP

## FR-SPP-001 — Master SPP

Admin dapat menentukan:

- Tahun ajaran.
- Nominal bulanan.
- Tanggal generate.
- Tanggal jatuh tempo.
- Status master.

---

## FR-SPP-002 — Generate Tagihan

Tagihan dapat dibuat otomatis sesuai tanggal konfigurasi.

Admin juga dapat menjalankan generate secara manual.

Sistem harus mencegah duplikasi tagihan bulan yang sama.

---

## FR-SPP-003 — Status Tagihan

Status:

- BELUM BAYAR.
- MENUNGGU VERIFIKASI.
- LUNAS.
- JATUH TEMPO.

---

# 12. Modul Pembayaran

## FR-PAY-001 — Pembayaran Tunai

Petugas memilih:

- Siswa.
- Tagihan.
- Bulan yang dibayar.
- Nominal.
- Metode = Tunai.

Setelah disimpan:

**LUNAS**

---

## FR-PAY-002 — Transfer Bank

Wali murid:

1. Melakukan transfer.
2. Memilih tagihan.
3. Upload bukti.
4. Submit.

Status:

**MENUNGGU VERIFIKASI**

---

## FR-PAY-003 — Verifikasi Transfer

Keuangan dapat:

- Terima.
- Tolak.

Jika diterima:

**LUNAS**

Jika ditolak:

**BELUM BAYAR**

dengan alasan penolakan.

---

## FR-PAY-004 — Pembayaran Multi-Bulan

Satu transaksi dapat mencakup beberapa invoice.

---

## FR-PAY-005 — Bukti Pembayaran

Sistem menghasilkan receipt berisi:

- Nomor transaksi.
- Nama siswa.
- NIS.
- Kelas.
- Bulan.
- Nominal.
- Total.
- Metode.
- Tanggal.
- Petugas.
- Status.

Output:

- PDF.
- Print.

---

# 13. Monitoring Tunggakan

## FR-ARR-001 — Daftar Tunggakan

Keuangan dapat melihat:

- Nama siswa.
- Kelas.
- Bulan tunggakan.
- Jumlah bulan.
- Total nominal.
- Nomor WhatsApp.
- Risk indicator.

---

## FR-ARR-002 — Risk Indicator

Default:

| Status | Aturan |
|---|---|
| Aman | 0 bulan |
| Perhatian | 1 bulan |
| Menunggak | 2 bulan |
| Prioritas | ≥ 3 bulan |

Batas dapat dikonfigurasi.

---

## FR-ARR-003 — Prioritas Penagihan

Sistem dapat mengurutkan:

1. Jumlah bulan terbanyak.
2. Nominal terbesar.
3. Jatuh tempo terlama.

---

# 14. WhatsApp Reminder

## FR-WA-001

Versi MVP menggunakan:

**Click-to-WhatsApp / WhatsApp manual.**

---

## FR-WA-002

Template dapat dibuat untuk:

- Tagihan baru.
- Jatuh tempo.
- Tunggakan.
- H-ujian.
- Pembayaran.
- Dispensasi.
- Janji pembayaran.

---

## FR-WA-003 — Dynamic Variable

Contoh:

- `{{nama_wali}}`
- `{{nama_siswa}}`
- `{{kelas}}`
- `{{total_tunggakan}}`
- `{{nama_ujian}}`
- `{{deadline}}`

---

## FR-WA-004 — Reminder Schedule

Admin dapat menentukan:

- H-30.
- H-14.
- H-7.
- H-3.
- H-1.

atau konfigurasi sendiri.

---

# 15. Modul Periode Ujian

## FR-EXAM-001 — Master Jenis Ujian

Admin dapat membuat:

- UTS.
- UAS.
- Try Out.
- Ujian Sekolah.
- Ujian Kenaikan Kelas.
- Jenis lain.

---

## FR-EXAM-002 — Periode Ujian

Data:

- Nama ujian.
- Tahun ajaran.
- Semester.
- Tanggal mulai.
- Tanggal selesai.
- Deadline.
- Status.
- SPP wajib lunas sampai bulan tertentu.

---

## FR-EXAM-003 — Template Persyaratan

Sistem dapat memberikan rekomendasi otomatis berdasarkan bulan ujian.

Admin dapat mengubahnya.

---

# 16. Eligibility Engine

## FR-ELG-001

Sistem membaca:

- Seluruh invoice siswa.
- Batas bulan SPP.
- Status masing-masing invoice.
- Dispensasi.

---

## FR-ELG-002 — Status

Status:

1. BELUM DIEVALUASI.
2. BELUM LAYAK.
3. LAYAK UJIAN.
4. LAYAK UJIAN - DISPENSASI.

---

## FR-ELG-003

Jika seluruh tagihan sebelum atau sama dengan batas periode lunas:

**LAYAK UJIAN**

---

## FR-ELG-004

Jika minimal satu tagihan masih belum lunas:

**BELUM LAYAK**

---

## FR-ELG-005

Status dihitung ulang setelah:

- Pembayaran diverifikasi.
- Pembayaran dibatalkan.
- Persyaratan ujian berubah.
- Dispensasi diberikan/dicabut.

---

# 17. Modul Dispensasi

## FR-DSP-001 — Pengajuan

Pengajuan dapat dilakukan oleh:

- Wali murid.
- Keuangan/TU.

---

## FR-DSP-002 — Data Dispensasi

Minimal:

- Siswa.
- Periode ujian.
- Total tunggakan.
- Kemampuan bayar.
- Alasan.
- Tanggal janji pembayaran.
- Catatan.
- Pengaju.
- Tanggal pengajuan.

---

## FR-DSP-003 — Workflow

### Jalur Wali Murid

Wali Murid  
→ TU/Keuangan  
→ Kepala Sekolah  
→ Approve / Reject

### Jalur Internal

TU/Keuangan  
→ Kepala Sekolah  
→ Approve / Reject

---

## FR-DSP-004 — Approval

Hanya Kepala Sekolah yang dapat memberikan persetujuan final.

---

## FR-DSP-005 — Status

- DRAFT.
- DIAJUKAN.
- DIPERIKSA TU.
- MENUNGGU KEPALA SEKOLAH.
- DISETUJUI.
- DITOLAK.
- KADALUARSA.

---

## FR-DSP-006

Setelah disetujui:

**LAYAK UJIAN - DISPENSASI**

---

## FR-DSP-007 — Janji Bayar

Jika tanggal janji terlewati dan tunggakan belum selesai:

- Berikan indikator overdue.
- Notifikasi wali.
- Notifikasi keuangan.
- Simpan ke riwayat siswa.

---

# 18. Kartu Ujian

## FR-CARD-001

Kartu berisi:

- Logo sekolah.
- Foto.
- Nama.
- NIS.
- NISN.
- Kelas.
- Nomor peserta.
- Periode ujian.
- QR Code.

---

## FR-CARD-002 — Eligibility

Kartu hanya dapat dibuat jika:

- LAYAK UJIAN.

atau

- LAYAK UJIAN - DISPENSASI.

---

## FR-CARD-003 — Nomor Peserta

Dibuat otomatis.

Contoh:

`UAS26-05A-001`

---

## FR-CARD-004 — Print

Mendukung:

- Individual.
- Per kelas.
- Seluruh siswa layak.

---

## FR-CARD-005 — Parent Download

Per periode ujian tersedia konfigurasi:

**Parent Download Card = ON/OFF**

---

# 19. QR Code

## FR-QR-001

QR menyimpan token unik kartu.

---

## FR-QR-002

QR tidak menyimpan langsung:

- Nominal tunggakan.
- Nomor WhatsApp.
- Data pribadi sensitif.

---

## FR-QR-003

Pengguna harus login untuk validasi.

---

## FR-QR-004

Hasil scan:

- Nama.
- Kelas.
- Nomor peserta.
- Ujian.
- Status kartu.
- Status eligibility.
- Valid / invalid.

---

# 20. Form Karakteristik Anak

## FR-FORM-001

Form sepenuhnya digital.

---

## FR-FORM-002

Form dibuat berdasarkan **tingkat kelas**.

Contoh:

- Kelas 1 → Template A.
- Kelas 2 → Template B.
- Kelas 3 → Template C.

Siswa dalam tingkat yang sama menggunakan template yang sama.

---

## FR-FORM-003 — Form Builder

Tipe pertanyaan:

- Yes / No.
- Multiple choice.
- Skala 1–5.
- Short text.
- Long text.

---

## FR-FORM-004

Wali kelas mempunyai kewenangan membuat dan mengubah form.

---

## FR-FORM-005

Form hanya dapat diakses jika:

- LAYAK UJIAN.

atau

- LAYAK UJIAN - DISPENSASI.

---

## FR-FORM-006

Form diisi oleh:

**Wali murid bersama siswa.**

---

## FR-FORM-007

Selama sebelum deadline:

- Jawaban dapat diedit.

Sesudah deadline:

- LOCKED.

---

## FR-FORM-008

Wali kelas dapat melakukan reopen.

---

## FR-FORM-009

Output:

- Print satu siswa.
- Rekap satu kelas.
- Status sudah/belum mengisi.

---

# 21. Portal Wali Murid

## Halaman

1. Dashboard.
2. Anak Saya.
3. Tagihan.
4. Pembayaran.
5. Upload Transfer.
6. Riwayat Pembayaran.
7. Status Ujian.
8. Kartu Ujian.
9. Form Karakteristik.
10. Dispensasi.
11. Notifikasi.
12. Profil.

---

# 22. Parent Dashboard

Jika memiliki dua anak:

```text
Bapak Ahmad

Muhammad Rizky — 5A
Tunggakan        Rp700.000
Status UAS       BELUM LAYAK
Form             TERKUNCI

Aisyah — 2B
Tunggakan        Rp0
Status UAS       LAYAK
Kartu            TERSEDIA
Form             ISI SEKARANG
```

---

# 23. Dashboard Keuangan

Minimal menampilkan:

- Total tagihan bulan berjalan.
- Pendapatan bulan berjalan.
- Total tunggakan.
- Jumlah siswa menunggak.
- Pembayaran menunggu verifikasi.
- Siswa prioritas.
- Reminder belum dikirim.
- Grafik pembayaran.

---

# 24. Dashboard Kepala Sekolah

Minimal:

```text
Total Siswa            560
Layak Ujian            481
Dispensasi              21
Belum Layak             58

Total Tunggakan
Rp34.650.000
```

Tersedia:

- Grafik tunggakan.
- Grafik pembayaran.
- Tren tunggakan bulanan.
- Per kelas.
- Daftar risiko tinggi.
- Dispensasi pending.

---

# 25. Reporting

## 25.1 Laporan SPP

Filter:

- Periode.
- Kelas.
- Siswa.
- Status.

Output:

- Screen.
- PDF.
- Excel/CSV.

---

## 25.2 Laporan Pembayaran

- Harian.
- Bulanan.
- Tunai.
- Transfer.

---

## 25.3 Laporan Tunggakan

- Per siswa.
- Per kelas.
- Jumlah bulan.
- Nominal.
- Risk level.

---

## 25.4 Laporan Ujian

- Layak.
- Belum layak.
- Dispensasi.
- Kartu tercetak.
- Kartu belum tercetak.

---

## 25.5 Laporan Dispensasi

- Pending.
- Approved.
- Rejected.
- Overdue Promise.

---

## 25.6 Laporan Karakteristik

- Per siswa.
- Per kelas.
- Sudah mengisi.
- Belum mengisi.

---

# 26. Audit Log

Aktivitas wajib dicatat:

- Login.
- Tambah pembayaran.
- Edit pembayaran.
- Pembatalan.
- Verifikasi transfer.
- Perubahan SPP.
- Perubahan persyaratan ujian.
- Pengajuan dispensasi.
- Approval/reject dispensasi.
- Generate kartu.
- Perubahan permission.

Audit minimal menyimpan:

- User.
- Role.
- Action.
- Module.
- Reference ID.
- Old value.
- New value.
- Timestamp.
- IP address bila tersedia.

Audit log tidak dapat diedit user biasa.

---

# 27. Role Permission Matrix

| Modul | Super Admin | Kepala Sekolah | Keuangan | Wali Kelas | Guru | Wali |
|---|---|---|---|---|---|---|
| Siswa | CRUD | R | R | R | R | Anak sendiri |
| SPP | CRUD | R | CRUD | R | R* | R sendiri |
| Pembayaran | CRUD | R | CRUD | R | R* | Create/R |
| Verifikasi | Y | R | Y | N | N | N |
| Tunggakan | Y | Y | Y | Y | Y* | Anak sendiri |
| Ujian | CRUD | CRUD | R | R | R | R |
| Eligibility | R | R | R | R | R | R |
| Dispensasi | Y | Approve | Create | R | N | Create |
| Kartu | Y | Y | Y | Y | R | Download* |
| Form | Y | R | R | CRUD | R | Fill |
| Laporan | Y | Y | Y | Limited | N | N |
| Audit | Y | R | Limited | N | N | N |

`*` mengikuti permission granular.

---

# 28. Main User Flow

## Flow A — Pembayaran Normal

```text
Tagihan
  ↓
Wali Membayar
  ↓
Verifikasi
  ↓
LUNAS
  ↓
Eligibility Recalculate
  ↓
LAYAK UJIAN
  ↓
Kartu + Form Terbuka
```

---

## Flow B — Belum Bayar

```text
Tagihan
  ↓
Belum Bayar
  ↓
Reminder
  ↓
Periode Ujian
  ↓
BELUM LAYAK
  ↓
Kartu Terkunci
Form Terkunci
```

---

## Flow C — Dispensasi

```text
BELUM LAYAK
     ↓
Ajukan Dispensasi
     ↓
TU
     ↓
Kepala Sekolah
     ↓
DISETUJUI
     ↓
LAYAK UJIAN - DISPENSASI
     ↓
Kartu + Form Terbuka
```

---

# 29. Struktur Menu Backoffice

```text
Dashboard

Master Data
├── Siswa
├── Wali Murid
├── Kelas
└── Tahun Ajaran

Keuangan
├── Master SPP
├── Tagihan
├── Pembayaran
├── Verifikasi Transfer
├── Tunggakan
└── Reminder

Ujian
├── Jenis Ujian
├── Periode Ujian
├── Kelayakan
├── Dispensasi
├── Kartu Ujian
└── QR Validation

Karakteristik
├── Template Form
├── Periode Form
├── Hasil
└── Rekap

Laporan
├── SPP
├── Pembayaran
├── Tunggakan
├── Ujian
├── Dispensasi
└── Karakteristik

System
├── User
├── Role & Permission
├── WhatsApp Template
├── Configuration
└── Audit Log
```

---

# 30. Non-Functional Requirements

## NFR-001 — Security

- Password wajib hashed.
- HTTPS pada production.
- Role-based authorization.
- Permission validation di backend.
- CSRF protection.
- Secure session.
- File upload validation.
- QR menggunakan secure token.
- Sensitive financial data tidak ditampilkan publik.

---

## NFR-002 — Performance

Target:

- Page load < 3 detik.
- Search < 2 detik.
- Eligibility calculation individual < 1 detik.
- Bulk eligibility satu kelas < 5 detik.
- Generate laporan standar < 10 detik.

---

## NFR-003 — Availability

Target awal:

**99% uptime**

pada jam operasional sekolah.

---

## NFR-004 — Backup

Database minimal:

- Daily backup.
- Retention minimum 7 hari.

Untuk production direkomendasikan:

- 30-day backup retention.

---

## NFR-005 — Responsive

Sistem harus nyaman digunakan pada:

- Desktop.
- Laptop.
- Tablet.
- Smartphone.

Portal wali murid diprioritaskan untuk mobile.

---

# 31. Data Entities

Entitas utama:

```text
User
Role
Permission

Student
Guardian
StudentGuardian

Class
AcademicYear

SPPMaster
Invoice
Payment
PaymentItem
PaymentProof

ExamType
ExamPeriod
ExamEligibility

Dispensation

ExamCard
ExamQRCode

CharacteristicTemplate
CharacteristicQuestion
CharacteristicForm
CharacteristicAnswer

Notification
WhatsAppTemplate

AuditLog
```

---

# 32. Important Relationships

```text
Guardian
  └── StudentGuardian
          └── Student

Student
  ├── Invoice
  │     └── Payment
  │
  ├── ExamEligibility
  │     ├── Dispensation
  │     └── ExamCard
  │
  └── CharacteristicForm
```

---

# 33. Acceptance Criteria Utama

## AC-001

Given siswa mempunyai seluruh SPP yang disyaratkan dalam status LUNAS,  
When sistem menghitung kelayakan,  
Then status harus menjadi:

**LAYAK UJIAN**

---

## AC-002

Given terdapat minimal satu tunggakan sebelum batas ujian,  
When sistem melakukan evaluasi,  
Then:

**BELUM LAYAK**

---

## AC-003

Given siswa BELUM LAYAK,  
When user mencoba generate kartu,  
Then sistem harus menolak.

---

## AC-004

Given Kepala Sekolah menyetujui dispensasi,  
Then:

- Status menjadi LAYAK UJIAN - DISPENSASI.
- Status SPP tetap BELUM LUNAS.
- Kartu dapat diterbitkan.
- Form dapat diakses.

---

## AC-005

Given pembayaran transfer belum diverifikasi,  
Then invoice tidak boleh dianggap lunas.

---

## AC-006

Given transfer diverifikasi,  
Then sistem harus:

1. Ubah invoice menjadi LUNAS.
2. Simpan transaksi.
3. Generate receipt.
4. Recalculate eligibility.

---

## AC-007

Given wali mempunyai dua anak,  
Then satu login harus dapat menampilkan keduanya.

---

## AC-008

Given form belum melewati deadline,  
Then wali dapat mengubah jawaban.

---

## AC-009

Given deadline form sudah lewat,  
Then form tidak dapat diedit kecuali dibuka kembali wali kelas.

---

## AC-010

Given kartu mempunyai QR valid,  
When user berwenang melakukan scan,  
Then sistem menampilkan informasi validasi kartu.

---

# 34. Notification Events

Sistem mempunyai trigger:

| Event | Recipient |
|---|---|
| Tagihan baru | Wali |
| Mendekati jatuh tempo | Wali |
| Jatuh tempo | Wali |
| Menjelang ujian | Wali |
| Transfer diterima | Wali |
| Transfer ditolak | Wali |
| Dispensasi diajukan | TU |
| Dispensasi menunggu approval | Kepala Sekolah |
| Dispensasi diterima | Wali + TU |
| Dispensasi ditolak | Wali + TU |
| Janji bayar terlewati | Wali + TU |
| Kartu tersedia | Wali |
| Form tersedia | Wali |

---

# 35. Error & Edge Cases

Sistem harus menangani:

1. Tagihan sudah lunas tetapi pembayaran dibatalkan.
2. Siswa pindah kelas.
3. Siswa keluar sekolah.
4. Tahun ajaran berubah.
5. Dua user memverifikasi transaksi sama.
6. Duplicate transfer.
7. File bukti pembayaran tidak valid.
8. Dispensasi ganda pada ujian yang sama.
9. Persyaratan SPP ujian diubah setelah kartu dibuat.
10. QR kartu lama digunakan setelah kartu dibatalkan.

Untuk perubahan penting, sistem harus melakukan recalculation dan audit.

---

# 36. UI/UX Principles

Antarmuka harus:

- Sederhana.
- Mudah digunakan staf sekolah.
- Mobile-friendly.
- Tidak menggunakan istilah teknis berlebihan.
- Warna status konsisten.

Rekomendasi:

- Hijau → Lunas / Layak.
- Kuning → Perhatian.
- Oranye → Menunggak.
- Merah → Belum Layak / Prioritas.
- Biru → Informasi.
- Ungu → Dispensasi.

---

# 37. Search & Filter Requirement

Semua tabel utama harus mempunyai:

- Search.
- Filter.
- Sort.
- Pagination.

Filter penting:

- Tahun ajaran.
- Kelas.
- Bulan.
- Status pembayaran.
- Status ujian.
- Risk level.

---

# 38. Export Requirement

Laporan utama mendukung:

- PDF.
- Excel/CSV.
- Print.

---

# 39. MVP Release Definition

Sistem dianggap siap digunakan apabila minimal workflow berikut berfungsi end-to-end:

```text
Input Siswa
   ↓
Generate SPP
   ↓
Pembayaran
   ↓
Verifikasi
   ↓
Tunggakan
   ↓
Reminder
   ↓
Buat Periode Ujian
   ↓
Eligibility
   ↓
Dispensasi
   ↓
Kartu Ujian
   ↓
Form Karakteristik
   ↓
Dashboard
   ↓
Laporan
```

---

# 40. Suggested Development Priority

## Phase 1 — Foundation

- Authentication.
- Role & Permission.
- Siswa.
- Wali.
- Kelas.
- Tahun ajaran.

## Phase 2 — Finance

- Master SPP.
- Tagihan.
- Pembayaran.
- Transfer.
- Verification.
- Receipt.
- Tunggakan.

## Phase 3 — Exam Control

- Exam Period.
- Eligibility Engine.
- Dispensasi.
- Kartu Ujian.
- QR.

## Phase 4 — Parent Experience

- Portal wali.
- WhatsApp reminder.
- Notification.

## Phase 5 — Characteristic Form

- Form Builder.
- Parent Form.
- Rekap.
- Print.

## Phase 6 — Management

- Dashboard.
- Reporting.
- Risk indicator.
- Audit Log.

---

# 41. Future Development

Pengembangan berikutnya dapat mencakup:

- WhatsApp Business API.
- Payment Gateway.
- Virtual Account.
- QRIS.
- Mobile application.
- Sistem akademik.
- Presensi.
- Nilai.
- Beasiswa.
- Potongan SPP.
- Multi sekolah.
- Multi yayasan.
- Automated collection scoring.
- Parent behavioral analytics.

---

# 42. Final Product Flow

```text
                         SEKOLAH
                            │
                            ▼
                      DATA SISWA
                            │
                            ▼
                       TAGIHAN SPP
                            │
               ┌────────────┴─────────────┐
               ▼                          ▼
          PEMBAYARAN                  TUNGGAKAN
               │                          │
               ▼                          ▼
          VERIFIKASI                  REMINDER
               │                          │
               └────────────┬─────────────┘
                            ▼
                       PERIODE UJIAN
                            │
                            ▼
                     ELIGIBILITY ENGINE
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
          LAYAK UJIAN              BELUM LAYAK
                │                       │
                │                       ▼
                │                  DISPENSASI
                │                       │
                │                  KEPALA SEKOLAH
                │                       │
                │                APPROVE / REJECT
                │                       │
                └───────────┬───────────┘
                            ▼
                    ADMINISTRASI UJIAN
                            │
                ┌───────────┴──────────┐
                ▼                      ▼
            KARTU UJIAN        FORM KARAKTERISTIK
                │                      │
                ▼                      ▼
             QR CODE            WALI + SISWA
                                       │
                                       ▼
                                    SUBMIT
                                       │
                                       ▼
                                  WALI KELAS
```

---

# 43. Final Product Definition

**Sistem SPP & Kelayakan Ujian** merupakan sistem administrasi sekolah yang menggunakan data pembayaran SPP sebagai salah satu parameter untuk mengontrol penerbitan administrasi ujian.

Sistem tidak hanya berfungsi sebagai pencatat pembayaran, tetapi menjadi platform terintegrasi untuk:

> **Tagihan → Penagihan → Pembayaran → Tunggakan → Kelayakan → Dispensasi → Kartu Ujian → Form Karakteristik → Monitoring → Laporan**

Nilai utama produk berada pada kemampuan sekolah untuk mengetahui kondisi tunggakan secara cepat, melakukan tindakan penagihan lebih awal, serta mengelola administrasi ujian secara terstruktur tanpa menghilangkan kewenangan Kepala Sekolah dalam memberikan kebijakan khusus kepada siswa.

---

# 44. Approval Status

**PRD Status: FINAL**

Requirement pada dokumen ini merupakan hasil final dari proses penggalian kebutuhan / Grill-Me dan menjadi baseline pengembangan produk.

Perubahan requirement setelah tahap ini direkomendasikan menggunakan:

- Change Request.
- Revision PRD.
- Versioning requirement.

Contoh:

`PRD v1.1`, `PRD v1.2`, dan seterusnya.