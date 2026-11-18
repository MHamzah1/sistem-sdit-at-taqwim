# Rancangan Sistem Penanganan SPP & Kelayakan Ujian Sekolah

## 1. Latar Belakang

Sekolah mengalami permasalahan wali murid yang memiliki tunggakan SPP, terutama menjelang pelaksanaan ujian seperti UTS, UAS, atau jenis ujian lain yang ditetapkan sekolah.

Pada proses yang berjalan saat ini, sebelum ujian siswa memperoleh:

- Kartu ujian.
- Form karakteristik anak untuk diisi terkait aktivitas atau perilaku anak di rumah.

Siswa yang belum memenuhi kewajiban pembayaran SPP tidak mendapatkan kedua dokumen tersebut.

Sistem baru akan mengubah proses tersebut menjadi digital dan terintegrasi dengan data pembayaran SPP, sehingga sekolah dapat mengetahui secara otomatis siapa yang:

- Sudah memenuhi syarat ujian.
- Belum memenuhi syarat.
- Mendapat dispensasi.
- Sudah mendapatkan kartu ujian.
- Sudah mengisi Form Karakteristik.

---

## 2. Tujuan Utama

**Tujuan bisnis utama: mengurangi tunggakan SPP.**

Sistem menggunakan mekanisme kelayakan ujian sebagai salah satu kontrol administrasi pembayaran.

Tujuan tambahannya:

- Mempermudah pemantauan pembayaran.
- Mengurangi pemeriksaan pembayaran secara manual.
- Memberikan transparansi kepada wali murid.
- Mengotomatisasi penagihan.
- Mengontrol penerbitan kartu ujian.
- Mendigitalisasi Form Karakteristik Anak.
- Menyediakan mekanisme dispensasi.
- Memberikan informasi tunggakan kepada manajemen sekolah.

---

## 3. Konsep Utama Sistem

```text
TAGIHAN SPP
     ↓
PEMBAYARAN
     ↓
VALIDASI KEUANGAN
     ↓
CEK SYARAT PERIODE UJIAN
     ↓
┌──────────────────────────────┐
│ Apakah seluruh SPP yang      │
│ diwajibkan sudah lunas?      │
└──────────────────────────────┘
        ↓              ↓
       YA             TIDAK
        ↓              ↓
  LAYAK UJIAN     BELUM LAYAK
        ↓              ↓
 Kartu Ujian      Kartu ditahan
        ↓              ↓
 Form Karakter    Form terkunci
                       ↓
                 Dispensasi?
                    ↓    ↓
                   YA   TIDAK
                    ↓
              Kepala Sekolah
                    ↓
                 Disetujui
                    ↓
          LAYAK UJIAN-DISPENSASI
```

---

## 4. Prinsip Penting Sistem

Status pembayaran dan status ujian adalah **dua hal berbeda**.

Contoh:

```text
Status SPP
BELUM LUNAS

Status Kelayakan
LAYAK UJIAN - DISPENSASI
```

Dengan demikian pemberian dispensasi **tidak menghapus tunggakan SPP**.

Ini penting agar laporan keuangan tetap akurat.

---

## 5. Role Pengguna

Sistem memiliki enam role utama.

| Role | Fungsi Utama |
|---|---|
| Super Admin | Konfigurasi sistem & kontrol keseluruhan |
| Kepala Sekolah | Monitoring, kebijakan ujian, dispensasi |
| Keuangan/TU | SPP, pembayaran, verifikasi, penagihan |
| Wali Kelas | Form Karakteristik & monitoring siswa |
| Guru | Informasi siswa dan kelayakan ujian |
| Wali Murid | Tagihan, pembayaran, ujian, form |

---

## 6. Master Data

### 6.1 Data Siswa

Minimal:

- NIS
- NISN
- Nama siswa
- Jenis kelamin
- Tanggal lahir
- Kelas
- Tahun ajaran
- Status siswa
- Wali murid

### 6.2 Data Wali Murid

Satu wali dapat mempunyai lebih dari satu anak.

```text
Ahmad Fauzi
│
├── Muhammad Rizky
│   Kelas 5A
│
└── Aisyah
    Kelas 2B
```

Satu akun wali murid dapat mengakses seluruh anaknya.

### 6.3 Data Kelas

Karena sekolah hanya satu jenjang, sistem menggunakan struktur:

```text
Sekolah
 ├── Kelas 1
 │    ├── 1A
 │    └── 1B
 │
 ├── Kelas 2
 │
 └── ...
```

---

## 7. Modul SPP

### 7.1 Master SPP

Pada versi awal:

> **Nominal SPP sama untuk seluruh siswa.**

Contoh:

```text
Tahun Ajaran 2026/2027

SPP Bulanan
Rp350.000
```

Tidak terdapat:

- Beasiswa.
- Diskon.
- Potongan SPP.
- Cicilan satu bulan.

---

## 8. Generate Tagihan SPP

Sekolah dapat menentukan tanggal pembuatan tagihan.

```text
Generate Tagihan
Tanggal : 1 setiap bulan

Jatuh Tempo
Tanggal : 10 setiap bulan
```

Admin tetap dapat mengubah konfigurasi tersebut.

Status tagihan:

```text
BELUM BAYAR
MENUNGGU VERIFIKASI
LUNAS
JATUH TEMPO
```

---

## 9. Riwayat SPP Siswa

| Bulan | Tagihan | Status |
|---|---:|---|
| Juli | Rp350.000 | Lunas |
| Agustus | Rp350.000 | Lunas |
| September | Rp350.000 | Belum |
| Oktober | Rp350.000 | Belum |

Total tunggakan: **Rp700.000**

---

## 10. Pembayaran

Versi pertama mendukung dua metode.

### 10.1 Tunai

```text
Wali Murid
     ↓
Keuangan/Kasir
     ↓
Input Pembayaran
     ↓
Lunas
     ↓
Bukti Pembayaran
```

### 10.2 Transfer Bank

```text
Transfer
   ↓
Upload Bukti
   ↓
MENUNGGU VERIFIKASI
   ↓
Keuangan/TU
   ↓
Validasi
   ↓
LUNAS
```

Tidak menggunakan auto-confirm transfer pada versi pertama.

---

## 11. Multi-Bulan Payment

Wali murid diperbolehkan membayar beberapa SPP sekaligus.

```text
September    Rp350.000
Oktober      Rp350.000
November     Rp350.000

Total Bayar
Rp1.050.000
```

Tidak diperbolehkan mencicil satu tagihan SPP.

```text
SPP Rp350.000

Bayar Rp200.000
→ tidak diperbolehkan
```

---

## 12. Bukti Pembayaran

Setiap pembayaran menghasilkan:

- Nomor pembayaran.
- Tanggal.
- Nama siswa.
- Bulan pembayaran.
- Metode pembayaran.
- Nominal.
- Petugas.
- Status.

Bukti pembayaran dapat:

- Download PDF.
- Dicetak.

---

## 13. Periode Ujian

Admin dapat membuat jenis ujian secara dinamis.

Contoh:

```text
UAS Semester Ganjil
Try Out
Ujian Sekolah
UTS
Ujian Kenaikan Kelas
```

Tidak dibatasi hanya UTS/UAS.

---

## 14. Konfigurasi Periode Ujian

Contoh:

### UAS Semester Ganjil 2026

Tanggal:

`7–14 Desember 2026`

Syarat pembayaran:

> SPP wajib lunas sampai November 2026.

Sistem menyediakan template otomatis berdasarkan bulan ujian, tetapi admin dapat mengubah persyaratan.

---

## 15. Aturan Tunggakan Lama

Seluruh SPP sampai batas yang ditentukan harus lunas.

```text
Agustus      BELUM
September    LUNAS
Oktober      LUNAS
November     LUNAS
```

Persyaratan:

```text
Wajib lunas sampai November
```

Hasil:

**BELUM LAYAK UJIAN**

karena Agustus masih memiliki tunggakan.

---

## 16. Mesin Kelayakan Ujian

Status dihitung otomatis.

Status utama:

```text
BELUM DIEVALUASI

BELUM LAYAK

LAYAK UJIAN

LAYAK UJIAN - DISPENSASI
```

Admin biasa tidak dapat sembarangan mengubah hasil perhitungan.

Override berada pada kewenangan **Kepala Sekolah** melalui mekanisme dispensasi.

---

## 17. Status Kelayakan Real-Time

Contoh:

```text
Agustus      LUNAS
September    LUNAS
Oktober      BELUM
November     BELUM
```

Status:

**BELUM LAYAK**

Setelah pembayaran Oktober dan November terverifikasi:

```text
Agustus      LUNAS
September    LUNAS
Oktober      LUNAS
November     LUNAS
```

Sistem otomatis mengubah menjadi:

**LAYAK UJIAN**

Tidak memerlukan approval Kepala Sekolah.

---

## 18. Dispensasi

Dispensasi digunakan untuk siswa yang belum memenuhi kewajiban SPP tetapi mendapatkan izin khusus.

Pengajuan dapat berasal dari:

- Wali murid.
- TU/Keuangan.

---

## 19. Flow Dispensasi

### Opsi 1

```text
Wali Murid
     ↓
Ajukan Dispensasi
     ↓
TU melakukan pemeriksaan
     ↓
Kepala Sekolah
     ↓
Setujui / Tolak
```

### Opsi 2

```text
TU/Keuangan
     ↓
Ajukan Dispensasi
     ↓
Kepala Sekolah
     ↓
Setujui / Tolak
```

---

## 20. Isi Pengajuan Dispensasi

Wajib mempunyai:

- Alasan.
- Nominal kemampuan pembayaran.
- Tanggal janji pembayaran.
- Catatan.

Contoh:

```text
Tunggakan
Rp700.000

Kemampuan pembayaran sekarang
Rp350.000

Janji pembayaran
20 Desember 2026

Alasan
Orang tua mengalami kendala keuangan sementara.
```

---

## 21. Hasil Dispensasi

Jika disetujui:

```text
Status SPP
BELUM LUNAS

Status Ujian
LAYAK UJIAN - DISPENSASI
```

Sehingga siswa tetap dapat memperoleh kartu ujian.

---

## 22. Monitoring Janji Pembayaran

Dispensasi memiliki tanggal berlaku.

Jika janji tidak dipenuhi:

```text
Tanggal Janji Terlewati
       ↓
Sistem mendeteksi
       ↓
Peringatan ke Wali
       +
Peringatan ke TU
       ↓
Riwayat siswa dicatat
```

Riwayat dispensasi tidak dihapus.

---

## 23. Kartu Ujian

Sistem menghasilkan kartu berisi minimal:

- Foto.
- Nama.
- NIS/NISN.
- Kelas.
- Nomor peserta.
- Periode ujian.
- QR Code.

---

## 24. Nomor Peserta

Nomor peserta dihasilkan otomatis.

```text
UAS26-05A-001
UAS26-05A-002
UAS26-05A-003
```

Format dapat dikembangkan menjadi configurable.

---

## 25. Aturan Cetak Kartu

### Layak

```text
LAYAK UJIAN
→ tombol CETAK tersedia
```

### Tidak Layak

```text
BELUM LAYAK
→ tombol CETAK terkunci
```

### Dispensasi

```text
LAYAK UJIAN - DISPENSASI
→ tombol CETAK tersedia
```

---

## 26. Cetak Massal

Sekolah dapat mencetak:

- Per siswa.
- Per kelas.
- Seluruh peserta ujian.

Contoh:

```text
Kelas 6A

Jumlah siswa            30
Layak                    25
Dispensasi                2
Belum Layak               3

Kartu dapat dicetak      27
```

---

## 27. QR Code Kartu Ujian

QR digunakan untuk validasi kartu.

QR **tidak langsung membuka data siswa secara publik**.

Pengguna harus login.

```text
Scan QR
   ↓
Login / Session Validation
   ↓
Validasi Kartu
   ↓
Nama
Kelas
Nomor Peserta
Periode Ujian
Status Kelayakan
Status Keaslian Kartu
```

---

## 28. Form Karakteristik Anak

### Sistem Lama

```text
Sekolah
→ Print Form
→ Dibagikan
→ Dibawa Pulang
→ Diisi
→ Dikembalikan
```

### Sistem Baru

```text
Wali Murid
     ↓
Portal
     ↓
Pilih Anak
     ↓
Form Karakteristik
     ↓
Isi bersama anak
     ↓
Submit
     ↓
Wali Kelas
```

---

## 29. Form Berdasarkan Tingkat Kelas

Form berbeda berdasarkan tingkat.

```text
Kelas 1
→ Form A

Kelas 2
→ Form B

Kelas 3
→ Form C

...

Kelas 6
→ Form F
```

Seluruh siswa pada tingkat yang sama mendapatkan form yang sama.

---

## 30. Pengelola Form

**Wali Kelas** menjadi pengelola utama Form Karakteristik.

Wali kelas dapat:

- Membuat pertanyaan.
- Mengedit pertanyaan.
- Membuka periode pengisian.
- Menutup periode.
- Melihat jawaban.
- Membuka kembali jawaban bila diperlukan.

---

## 31. Jenis Pertanyaan

Form Builder mendukung:

- Ya/Tidak.
- Multiple choice.
- Skala 1–5.
- Jawaban pendek.
- Jawaban panjang.

Contoh:

```text
Apakah anak membantu pekerjaan rumah?

○ Ya
○ Tidak
```

atau:

```text
Seberapa rutin anak belajar di rumah?

1 ○
2 ○
3 ○
4 ○
5 ○
```

---

## 32. Hubungan Form dengan SPP

```text
BELUM LAYAK UJIAN
→ Form TERKUNCI
```

Sedangkan:

```text
LAYAK UJIAN
→ Form TERBUKA
```

dan:

```text
LAYAK UJIAN - DISPENSASI
→ Form TERBUKA
```

---

## 33. Editing Form

Setelah wali mengisi:

```text
SUBMITTED
```

Masih dapat diedit selama deadline belum berakhir.

Setelah deadline:

```text
LOCKED
```

Wali kelas dapat membuka kembali jika diperlukan.

---

## 34. Print Hasil Karakteristik

### Individual

```text
Hasil Karakteristik
Muhammad Rizky
Kelas 5A

Pertanyaan 1
...

Pertanyaan 2
...
```

### Rekap Kelas

```text
Karakteristik Kelas 5A

Total Siswa            30
Sudah Mengisi          27
Belum Mengisi           3
```

---

## 35. Portal Wali Murid

Dashboard menampilkan seluruh anak.

Contoh:

### Muhammad Rizky — 5A

```text
SPP
Rp700.000 tertunggak

Status UAS
BELUM LAYAK

Form Karakteristik
TERKUNCI
```

### Aisyah — 2B

```text
SPP
LUNAS

Status UAS
LAYAK

Kartu Ujian
TERSEDIA

Form Karakteristik
ISI FORM
```

---

## 36. Portal Wali Murid — Modul

Portal terdiri dari:

- Dashboard.
- Anak Saya.
- Tagihan.
- Riwayat pembayaran.
- Upload bukti transfer.
- Status ujian.
- Kartu ujian.
- Form karakteristik.
- Pengajuan dispensasi.
- Notifikasi.
- Profil.

---

## 37. Download Kartu Oleh Wali

Kepala sekolah/admin dapat menentukan untuk setiap periode:

```text
Wali Murid boleh download kartu?

ON / OFF
```

Jika OFF:

> Kartu hanya dapat dicetak sekolah.

Jika ON:

> Wali murid dapat mengunduh kartu setelah status Layak.

---

## 38. WhatsApp

WhatsApp digunakan untuk:

- Tagihan baru.
- Jatuh tempo.
- Tunggakan.
- Peringatan ujian.
- Konfirmasi pembayaran.
- Dispensasi.
- Janji pembayaran.
- Kartu ujian.

---

## 39. Tahapan Integrasi WhatsApp

Versi awal:

```text
Template Pesan
     ↓
Generate Pesan
     ↓
Klik Kirim WhatsApp
     ↓
WhatsApp
```

Versi berikutnya dapat ditingkatkan menjadi:

```text
WhatsApp Business API
→ pengiriman otomatis
```

Sehingga versi MVP tidak mempunyai ketergantungan pada biaya WhatsApp API.

---

## 40. Template WhatsApp

Admin dapat mengubah template.

```text
Yth. Bapak/Ibu {{nama_wali}},

Kami menginformasikan bahwa
{{nama_siswa}} kelas {{kelas}}
masih memiliki tunggakan sebesar:

{{total_tunggakan}}

Persyaratan {{nama_ujian}}
adalah pelunasan SPP sampai
{{periode_spp}}.

Mohon melakukan pembayaran
sebelum {{deadline}}.

Terima kasih.
```

---

## 41. Reminder Engine

Admin menentukan jadwal.

```text
H-30
Pengingat awal

H-14
Pengingat kedua

H-7
Peringatan kelayakan ujian

H-3
Peringatan terakhir

H-1
Final Reminder
```

Dapat dikonfigurasi sesuai kebutuhan sekolah.

---

## 42. Dashboard Kepala Sekolah

```text
UAS SEMESTER GANJIL
────────────────────────

Total Siswa           560

Layak                 481
Dispensasi             21
Belum Layak            58

Total Tunggakan
Rp34.650.000
```

---

## 43. Dashboard Per Kelas

| Kelas | Siswa | Layak | Dispensasi | Belum |
|---|---:|---:|---:|---:|
| 1A | 30 | 27 | 1 | 2 |
| 1B | 29 | 25 | 2 | 2 |
| 2A | 31 | 29 | 0 | 2 |
| 2B | 30 | 26 | 1 | 3 |

Kepala sekolah dapat membuka detail siswa.

---

## 44. Analisis Tunggakan

Dashboard mempunyai grafik:

```text
Juli          Rp42 jt
Agustus       Rp37 jt
September     Rp30 jt
Oktober       Rp23 jt
November      Rp14 jt
```

Tujuannya mengukur apakah mekanisme penagihan efektif.

---

## 45. Risk Indicator

Sistem memberikan indikator.

```text
🟢 AMAN
0 bulan

🟡 PERHATIAN
1 bulan

🟠 MENUNGGAK
2 bulan

🔴 PRIORITAS
3+ bulan
```

Batas dapat dikonfigurasi oleh sekolah.

---

## 46. Daftar Penanganan Prioritas

Keuangan dapat melihat:

```text
SISWA PRIORITAS PENAGIHAN

1. Ahmad
   4 bulan
   Rp1.400.000

2. Budi
   3 bulan
   Rp1.050.000

3. Rizky
   3 bulan
   Rp1.050.000
```

Sehingga petugas tidak perlu mencari siswa satu per satu.

---

## 47. Hak Akses Informasi Keuangan

Berdasarkan keputusan Grill-Me:

- Kepala Sekolah → dapat melihat nominal.
- Keuangan → dapat melihat nominal.
- Wali Kelas → dapat melihat nominal.
- Guru → dapat melihat nominal.
- Wali Murid → hanya keuangan anak sendiri.

Disarankan tetap menggunakan **permission granular**.

Contoh:

```text
Guru:
[x] Lihat status kelayakan
[x] Lihat nominal tunggakan

atau

[x] Lihat status kelayakan
[ ] Lihat nominal tunggakan
```

---

## 48. Audit Log

Semua transaksi penting dicatat.

```text
01 Sep 2026 • 10:32

User:
Siti Rahma

Role:
Keuangan

Action:
Verifikasi Pembayaran

Siswa:
Muhammad Rizky

Nominal:
Rp350.000
```

Termasuk:

- Tambah pembayaran.
- Edit pembayaran.
- Hapus/batal transaksi.
- Verifikasi.
- Dispensasi.
- Perubahan syarat ujian.
- Generate kartu.
- Perubahan master SPP.
- Perubahan role.

---

## 49. Modul Laporan

### 49.1 Laporan SPP

- Bulanan.
- Per kelas.
- Per siswa.
- Lunas.
- Belum lunas.
- Total tunggakan.

### 49.2 Laporan Pembayaran

- Tunai.
- Transfer.
- Harian.
- Bulanan.

### 49.3 Laporan Ujian

- Layak.
- Belum layak.
- Dispensasi.
- Kartu tercetak.

### 49.4 Laporan Dispensasi

- Pending.
- Disetujui.
- Ditolak.
- Janji terlewati.

### 49.5 Laporan Karakteristik

- Per siswa.
- Per kelas.
- Sudah mengisi.
- Belum mengisi.

---

## 50. Scope MVP Final

```text
01. Authentication
02. Role & Permission

03. Data Siswa
04. Data Wali Murid
05. Data Kelas

06. Master SPP
07. Generate Tagihan
08. Pembayaran Tunai
09. Pembayaran Transfer
10. Upload Bukti
11. Verifikasi Pembayaran
12. Bukti Pembayaran PDF

13. Monitoring Tunggakan
14. Risk Indicator
15. Reminder WhatsApp
16. Template WhatsApp

17. Master Jenis Ujian
18. Periode Ujian
19. Syarat SPP Ujian
20. Eligibility Engine

21. Dispensasi
22. Approval Kepala Sekolah
23. Monitoring Janji Bayar

24. Generate Kartu Ujian
25. QR Code
26. Nomor Peserta
27. Cetak Massal

28. Form Builder Karakteristik
29. Form Digital Wali Murid
30. Rekap Form
31. Print Hasil Form

32. Portal Wali Murid

33. Dashboard Keuangan
34. Dashboard Kepala Sekolah

35. Laporan
36. Audit Log
```

---

## 51. Core Business Rule

> **Sistem tidak melarang siswa melakukan aktivitas pendidikan secara otomatis, tetapi mengontrol penerbitan dokumen administrasi ujian berdasarkan kebijakan sekolah. Kepala Sekolah memiliki kewenangan memberikan dispensasi sehingga siswa tetap dapat memperoleh status Layak Ujian – Dispensasi tanpa mengubah status tunggakan SPP.**

Pendekatan ini lebih aman dibanding membuat sistem sekadar:

> `Belum bayar = dilarang ujian.`

Karena keputusan akademik dan pengecualian tetap berada di tangan sekolah.

---

## 52. Arsitektur Proses Utama

```text
                     ┌─────────────┐
                     │ DATA SISWA  │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ TAGIHAN SPP │
                     └──────┬──────┘
                            │
            ┌───────────────┴──────────────┐
            │                              │
            ▼                              ▼
      PEMBAYARAN                       TUNGGAKAN
            │                              │
            ▼                              ▼
       VERIFIKASI                   REMINDER WA
            │                              │
            └───────────────┬──────────────┘
                            ▼
                    PERIODE UJIAN
                            │
                            ▼
                 CEK KELAYAKAN OTOMATIS
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
             LAYAK                 BELUM LAYAK
                │                       │
                │                       ▼
                │                  DISPENSASI
                │                       │
                │              ┌────────┴───────┐
                │              ▼                ▼
                │          DISETUJUI          DITOLAK
                │              │
                └──────┬───────┘
                       ▼
                  AKSES UJIAN
                       │
              ┌────────┴─────────┐
              ▼                  ▼
        KARTU UJIAN       FORM KARAKTERISTIK
              │                  │
              ▼                  ▼
           QR CODE           WALI + SISWA
                                 │
                                 ▼
                              SUBMIT
                                 │
                                 ▼
                          WALI KELAS / PRINT
```

---

## 53. Kesimpulan Rancangan

Konsep sistem yang terbentuk adalah:

**SPP bukan hanya menjadi modul pencatatan keuangan, tetapi menjadi bagian dari workflow administrasi ujian.**

Nilai utama produk berada pada integrasi:

> **SPP → Penagihan → Pembayaran → Kelayakan Ujian → Dispensasi → Kartu Ujian → Form Karakteristik → Monitoring Kepala Sekolah.**

Nama kerja produk yang dapat digunakan:

### School Payment & Exam Control System

atau secara internal:

### Sistem SPP & Kelayakan Ujian

---

## 54. Status Dokumen

Dokumen ini merupakan **Rancangan Awal / Draft Requirement** berdasarkan hasil proses Grill-Me.

Dokumen ini dapat dikembangkan selanjutnya menjadi:

- Product Requirement Document (PRD) final.
- User Story.
- Functional Requirement.
- Business Rules.
- Role Permission Matrix.
- Acceptance Criteria.
- Struktur menu dan halaman.
- Workflow detail.
- Database requirement.
- API requirement.
- Roadmap implementasi.
