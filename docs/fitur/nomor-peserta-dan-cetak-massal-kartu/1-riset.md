# Riset Fitur: Format Nomor Peserta Ujian & Cetak Massal Kartu Ujian

- **Slug:** `nomor-peserta-dan-cetak-massal-kartu`
- **Objek:** Fitur
- **Dokumen:** 1-riset.md (Tahap 1/4)
- **Status:** Selesai Riset — Menunggu Wawancara Keputusan
- **Tanggal:** 19 November 2026
- **Referensi PRD:** `docs/PRD/PRODUCT REQUIREMENT DOCUMENT (PRD).md` — Bagian 18 FR-CARD-001, FR-CARD-003 (*Nomor Peserta*), dan FR-CARD-004 (*Print Massal*)

---

## 1. Latar Belakang & Kebutuhan

Pada modul Ujian SDIT AT-TAQWIM yang berjalan saat ini:
- Mesin kelayakan (*Eligibility Engine*) telah berhasil mengevaluasi status siswa secara deterministik (`ELIGIBLE`, `ELIGIBLE_DISPENSATION`, `NOT_ELIGIBLE`).
- Kartu ujian ber-QR individual sudah dapat dibuat melalui `POST /api/exam-cards` dan divalidasi langsung via server di `/api/exam-cards/:code/validate`.
- Wali murid dapat mengunduh kartu ujian anak jika diizinkan sekolah melalui toggle `guardianDownload`.

**Kesenjangan Kritis vs PRD Bagian 18:**
1. **Belum Ada Nomor Peserta Ujian Resmi (FR-CARD-003):**  
   PRD menspesifikasikan bahwa setiap peserta ujian memiliki nomor peserta resmi yang terformat otomatis, contoh: `UAS26-05A-001`. Saat ini kartu ujian hanya menampilkan NIS dan UUID verifikasi acak (`verificationCode: 3fa85f64-...`), sehingga pengawas ujian tidak memiliki nomor meja/kursi peserta ujian yang ringkas dan teratur.
2. **Belum Ada Fitur Cetak Massal Kartu Ujian (FR-CARD-004):**  
   PRD mensyaratkan pencetakan kartu ujian mendukung 3 skenario: *individual*, *per kelas*, dan *seluruh siswa layak*. Saat ini, staf TU harus menekan tombol "Kartu" satu per satu untuk setiap siswa di tabel, membuka modal, lalu mencetaknya satu per satu. Jika sekolah memiliki 200–500 siswa, proses ini sangat memakan waktu dan tidak praktis.

---

## 2. Temuan Codebase Saat Ini

### A. Skema Database (`src/db/schema.ts#L376-L396`)
- **Tabel `exam_cards`:**
  - Kolom: `id` (UUID), `studentId`, `examPeriodId`, `createdBy`, `verificationCode` (UUID), `createdAt`, `updatedAt`.
  - Constraint: `uniqueIndex("card_student_exam").on(t.studentId, t.examPeriodId)`.
  - **Temuan:** Belum ada kolom khusus `participantNumber` atau nomor peserta. Nomor peserta dapat dihitung secara deterministik (rumus format berbasis kode ujian, tahun ajaran, kelas, dan urutan NIS) atau disimpan ke dalam kolom baru jika diinginkan.
- **Tabel `exam_types` (`src/db/schema.ts#L282-L286`):**
  - Menyimpan nama jenis ujian (misal: "PTS Ganjil", "PAS Ganjil", "Ujian Akhir Semester").
- **Tabel `classes` & `academic_years`:**
  - Menyimpan nama rombel (misal "1A", "1B", "6A") dan tahun ajaran (misal "2026/2027").

### B. Backend Controller & State (`server/app.ts` & `server/state.ts`)
1. **Endpoint `POST /api/exam-cards` (`server/app.ts#L289-L342`):**
   - Hanya menerima 1 siswa (`studentId`) dan 1 periode ujian (`examPeriodId`).
   - Melakukan pengecekan kepemilikan (`ownStudent`), penguncian transaksi (`lockStudent`), dan validasi kelayakan (`ELIGIBLE` atau `ELIGIBLE_DISPENSATION`).
   - Belum ada endpoint *bulk generate / batch cards* untuk langsung membuat kartu semua siswa yang memenuhi syarat dalam 1 kelas atau seluruh angkatan.
2. **State Server (`server/state.ts`):**
   - `readState()` saat ini belum menyertakan daftar `examCards` yang sudah terbit, sehingga klien tidak mengetahui secara instan siswa mana yang kartunya sudah di-generate tanpa memanggil endpoint individual.

### C. Antarmuka Pengguna & Cetak (`src/main.tsx` & `src/production.css`)
1. **Halaman Kartu & Validasi QR (`src/main.tsx#L910-L960`):**
   - Hanya menampilkan tombol "Validasi kode QR" dan tabel siswa dengan tombol aksi individual `Kartu`.
   - Belum ada tombol aksi massal: `"Cetak Kartu 1 Kelas"` atau `"Cetak Semua Siswa Layak"`.
2. **Modal Pratinjau Kartu Ujian (`src/main.tsx#L2033-L2076`):**
   - Menampilkan satu kartu individual dalam kelas `.print-card`.
   - Untuk cetak massal, diperlukan layout lembar cetak khusus (`.print-cards-grid` atau `.print-sheet`) yang memuat beberapa kartu per lembar kertas A4 (misal 2 atau 4 kartu per lembar dengan garis putus-putus pembatas untuk dipotong panitia ujian).

---

## 3. Identifikasi Titik Sentuh Kode (*Impact Areas*)

| No | Berkas | Perubahan yang Diperlukan |
|---|---|---|
| 1 | `src/data.ts` | Helper generator format nomor peserta: `participantNumber(examName, yearName, className, indexOrNis)` (misal `UAS26-1A-001`). |
| 2 | `server/app.ts` | Endpoint `POST /api/exam-cards/bulk`: Memvalidasi dan membuat record `exam_cards` untuk seluruh siswa yang layak dalam 1 kelas atau 1 periode ujian secara sekaligus (*idempotent batch*). |
| 3 | `server/state.ts` | Menyertakan `examCards` pada `AppState` agar klien dapat mendeteksi kartu yang sudah terbit dan membaca nomor verifikasi tanpa round-trip berulang. |
| 4 | `src/main.tsx` | - Menambahkan tombol "Cetak Massal Kartu" dengan pilihan: *Berdasarkan Kelas* atau *Seluruh Siswa Layak*.<br/>- Menampilkan Nomor Peserta resmi pada kartu individual dan kartu massal.<br/>- Menambahkan modal/halaman pratinjau cetak massal multi-kartu siap cetak. |
| 5 | `src/production.css` | Styling lembar cetak massal (`.bulk-cards-sheet`) dengan grid 2/4 kartu per halaman A4 dan penanganan *page break* (`break-inside: avoid`). |
| 6 | `tests/business.test.ts` | Pengujian pembuatan kartu massal, aturan hak kelayakan, dan generator nomor peserta. |

---

## 4. Pertanyaan Kunci untuk Wawancara Keputusan (`/fitur-wawancara`)

Sebelum spesifikasi dikunci, ada beberapa keputusan proses operasional sekolah yang perlu dikonfirmasi kepada pemilik kebutuhan:

1. **Format Standar Nomor Peserta Ujian:** Apakah nomor peserta mengikuti format PRD `[KODE_UJIAN][2_DIGIT_TAHUN]-[KELAS]-[3_DIGIT_URUT]` (contoh: `PTS26-1A-001` untuk siswa urutan ke-1 di kelas 1A pada PTS 2026/2027)?
2. **Urutan Nomor Peserta dalam Kelas:** Apakah urutan nomor peserta (001, 002, dst.) diurutkan berdasarkan **NIS siswa** (seperti urutan buku induk) atau berdasarkan **Abjad Nama Siswa**?
3. **Penyimpanan Nomor Peserta:** Apakah nomor peserta dihitung secara deterministik saat kartu ditampilkan/dicetak (tanpa migrasi skema database), atau wajib disimpan permanen dalam kolom database `participant_number`?
4. **Tata Letak Lembar Cetak Massal:** Berapa kartu yang ideal ditempatkan dalam 1 lembar kertas A4 saat cetak massal agar efisien dan mudah dipotong (misalnya: **2 kartu per lembar A4** atau **4 kartu per lembar A4**)?
5. **Penanganan Siswa Belum Layak saat Cetak Massal:** Ketika tombol "Cetak Kartu 1 Kelas" ditekan, apakah sistem secara otomatis **hanya mencetak siswa yang berstatus Layak (`ELIGIBLE` / `ELIGIBLE_DISPENSATION`)** dan melewati siswa yang belum lunas/tanpa dispensasi, disertai ringkasan berapa siswa yang berhasil dicetak dan berapa yang tertahan?

---

## 5. Kesimpulan Riset

Fitur **Format Nomor Peserta & Cetak Massal Kartu Ujian** merupakan kelanjutan logis untuk mengotomatisasi pekerjaan panitia ujian sekolah SDIT AT-TAQWIM. Kode sistem kelayakan yang ada sudah deterministik dan aman. Penambahan endpoint batch dan lembar cetak multi-kartu akan menghemat waktu panitia ujian secara signifikan.

*Langkah berikutnya:* Menjalankan tahap **2/4: `/fitur-wawancara nomor-peserta-dan-cetak-massal-kartu`** untuk mengunci 5 pertanyaan keputusan bisnis di atas.
