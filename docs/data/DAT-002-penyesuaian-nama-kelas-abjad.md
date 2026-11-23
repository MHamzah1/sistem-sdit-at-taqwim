# DAT-002 — Penyesuaian Format Nama Rombel/Kelas Abjad (Tanpa Nama Surat)

- **ID Tiket:** DAT-002
- **Objek:** Migrasi Data Master Kelas
- **Status:** `selesai`
- **Tanggal Dibuat:** 23 November 2026
- **Penanggung Jawab:** AI Engineering Agent
- **Target Database:** PostgreSQL Neon Development (`DATABASE_URL`)

---

## 1. Latar Belakang & Tujuan

Berdasarkan masukan dari pihak sekolah SDIT AT-TAQWIM:
- Data rombel (kelas) saat ini menggunakan penamaan yang menyertakan nama surat Al-Qur'an dalam tanda kurung, seperti `Kelas 1A (Al-Fatihah)`, `Kelas 1B (Al-Baqarah)`, `Kelas 2A (Ali 'Imran)`, `Kelas 3A (An-Nisa)`, dan `Kelas 6A (Al-Kautsar)`.
- Pihak sekolah menginginkan penamaan kelas yang ringkas berbasis tingkatan dan abjad saja (contoh: `1A`, `1B`, `2A`, `2B`, `3A`, `6A` atau `Kelas 1A`, `Kelas 1B`, dst.), tanpa mencantumkan nama surat.
- Penamaan abjad murni ini juga membuat nomor peserta ujian (`examParticipantNumber`) menjadi lebih rapi dan konsisten (misalnya: `PTS26-1A-001` bukan `PTS26-1AALFATTIHAH-001`).

Tujuan migrasi data **DAT-002** ini adalah:
1. Memperbarui (*in-place update*) nama 5 rombel kelas yang sudah ada di database Neon development agar menggunakan format abjad tanpa nama surat.
2. Mempertahankan ID unik (`uuid`) setiap record kelas agar integritas relasi foreign key ke tabel `students`, `invoices`, kelayakan ujian, dan kartu ujian **tetap 100% utuh tanpa ada data yang terhapus** (mematuhi Hard Rule Konstitusi SDIT AT-TAQWIM).
3. Memperbarui script seeder `scripts/seed.ts` agar saat inisialisasi atau re-seeding di masa mendatang, nama rombel tetap konsisten menggunakan format abjad baru.

---

## 2. Kondisi Database Saat Ini

Berdasarkan pemeriksaan langsung pada database PostgreSQL Neon development:
- **Tahun Ajaran Aktif:** `Tahun Ajaran 2026/2027` (ID: `9e5fbbeb-2058-472a-bc27-aee77568619d`)
- **Daftar Kelas Eksisting (5 Rombel):**
  1. ID: `b8b301a4-e99b-4bee-87c6-fdfaec46e999`
     - Nama Saat Ini: `Kelas 1A (Al-Fatihah)`
     - Siswa Terkait: 2 siswa (Muhammad Fatih Pratama, Ahmad Zaki Al-Faruq)
  2. ID: `e38dd387-244a-49a6-9837-00458e189201`
     - Nama Saat Ini: `Kelas 1B (Al-Baqarah)`
     - Siswa Terkait: 2 siswa (Maryam Khadijah, Umar Abdul Aziz)
  3. ID: `b154024b-684d-4691-acc6-9e937efac701`
     - Nama Saat Ini: `Kelas 2A (Ali 'Imran)`
     - Siswa Terkait: 2 siswa (Aisyah Ayudia Pratama, Ali bin Abi Thalib)
  4. ID: `3b012820-f98b-498b-9649-cbda5aedf6aa`
     - Nama Saat Ini: `Kelas 3A (An-Nisa)`
     - Siswa Terkait: 2 siswa (Bilal Al-Ghifari, Fatimah Az-Zahra)
  5. ID: `7ba869d5-82d7-4fec-8e2a-50fc412c5b75`
     - Nama Saat Ini: `Kelas 6A (Al-Kautsar)`
     - Siswa Terkait: 2 siswa (Salman Al-Farisi, Khalid bin Walid)

---

## 3. Rencana Perubahan Data

### A. Pemetaan Nama Kelas (Sebelum vs Sesudah)

Kami menyajikan 2 varian format abjad untuk dipilih:

| ID Kelas | Nama Eksisting | Opsi A (Rekomendasi: Format Rombel Baku) | Opsi B (Format Abjad Singkat) |
|---|---|---|---|
| `b8b301a4-...` | `Kelas 1A (Al-Fatihah)` | `Kelas 1A` | `1A` |
| `e38dd387-...` | `Kelas 1B (Al-Baqarah)` | `Kelas 1B` | `1B` |
| `b154024b-...` | `Kelas 2A (Ali 'Imran)` | `Kelas 2A` | `2A` |
| `3b012820-...` | `Kelas 3A (An-Nisa)` | `Kelas 3A` | `3A` |
| `7ba869d5-...` | `Kelas 6A (Al-Kautsar)` | `Kelas 6A` | `6A` |

> *Catatan Tambahan:* Jika sekolah juga membutuhkan rombel `Kelas 2B` (atau `2B`) yang saat ini belum ada, rombel baru tersebut dapat ditambahkan sekalian ke dalam Tahun Ajaran 2026/2027.

### B. Proteksi Integritas Data & Relasi
Operasi yang dilakukan murni adalah `UPDATE` nilai kolom `name` pada tabel `classes`:
- **Tidak ada penghapusan data (`DELETE`)** sama sekali.
- Seluruh 10 siswa, relasi wali murid, tagihan invoice SPP, status pembayaran, dan riwayat kelayakan ujian tetap terhubung ke ID kelas yang sama.

---

## 4. Script & Perintah Eksekusi

Perintah eksekusi yang akan dijalankan melalui `/data-jalankan DAT-002`:
- **Opsi A (Default: Format Awalan Kelas, misal `Kelas 1A` & tambah `Kelas 2B`):**
  ```bash
  npx tsx scripts/dat-002-update-classes.ts with-2b
  ```
- **Opsi B (Format Abjad Singkat, misal `1A` & tambah `2B`):**
  ```bash
  npx tsx scripts/dat-002-update-classes.ts short with-2b
  ```

Script migrasi `scripts/dat-002-update-classes.ts` dirancang dengan transaksi database (`db.transaction`):
1. Mengubah nama 5 kelas eksisting secara presisi berdasarkan ID unik tanpa merusak relasi foreign key.
2. Menambahkan rombel `Kelas 2B` (atau `2B`) pada tahun ajaran aktif 2026/2027 jika diminta.
3. Memperbarui timestamp `updated_at`.
4. Memastikan tidak ada duplikasi nama kelas dalam tahun ajaran yang sama (`uniqueIndex: class_year_name`).

Pembaruan berkas kode:
- Memperbarui `scripts/seed.ts` pada array `classNames` dan mapping data siswa agar sejalan dengan format nama kelas yang baru.

---

## 5. Hasil Eksekusi & Bukti Verifikasi

Eksekusi berhasil diselesaikan pada **23 November 2026** via script `scripts/dat-002-update-classes.ts with-2b`:

### A. Output Log Eksekusi
```text
=== DAT-002: Memulai Pembaruan Format Nama Kelas ===
-> Format: Awalan Kelas (Kelas 1A, Kelas 2B, ...)
-> Sertakan Rombel 2B: Ya
-> Berhasil perbarui kelas [b8b301a4-e99b-4bee-87c6-fdfaec46e999]: "Kelas 1A"
-> Berhasil perbarui kelas [e38dd387-244a-49a6-9837-00458e189201]: "Kelas 1B"
-> Berhasil perbarui kelas [b154024b-684d-4691-acc6-9e937efac701]: "Kelas 2A"
-> Berhasil perbarui kelas [3b012820-f98b-498b-9649-cbda5aedf6aa]: "Kelas 3A"
-> Berhasil perbarui kelas [7ba869d5-82d7-4fec-8e2a-50fc412c5b75]: "Kelas 6A"
-> Berhasil menambahkan rombel baru [f24aac34-27f1-4e9b-8b43-0ba8c53d9067]: "Kelas 2B"
=== DAT-002: Pembaruan Nama Kelas Selesai dengan Sukses ===
```

### B. Hasil Query Verifikasi Database Neon Dev
```text
┌─────────┬────────────────────────────────────────┬────────────┬──────────────┐
│ (index) │ id                                     │ name       │ studentCount │
├─────────┼────────────────────────────────────────┼────────────┼──────────────┤
│ 0       │ 'b8b301a4-e99b-4bee-87c6-fdfaec46e999' │ 'Kelas 1A' │ 2            │
│ 1       │ 'e38dd387-244a-49a6-9837-00458e189201' │ 'Kelas 1B' │ 2            │
│ 2       │ 'b154024b-684d-4691-acc6-9e937efac701' │ 'Kelas 2A' │ 2            │
│ 3       │ 'f24aac34-27f1-4e9b-8b43-0ba8c53d9067' │ 'Kelas 2B' │ 0            │
│ 4       │ '3b012820-f98b-498b-9649-cbda5aedf6aa' │ 'Kelas 3A' │ 2            │
│ 5       │ '7ba869d5-82d7-4fec-8e2a-50fc412c5b75' │ 'Kelas 6A' │ 2            │
└─────────┴────────────────────────────────────────┴────────────┴──────────────┘
```
- Konfirmasi: Nama kelas bersih dari nama surat, kelas baru `Kelas 2B` tersedia, seluruh 10 siswa tetap terhubung utuh.

### C. Verifikasi Pengujian Sistem
- `npm test`: **23/23 tests passed** (0 failed).
- `npm run typecheck`: **Lulus tanpa error** (TypeScript valid).

---

## 6. Riwayat Status

- `2026-11-23`: Status diusulkan (`usulan`) oleh AI Engineering Agent melalui `/data-periksa`.
- `2026-11-23`: Disetujui oleh pengguna dan status diubah menjadi `berjalan` untuk dieksekusi via `/data-jalankan`.
- `2026-11-23`: Eksekusi selesai dan diverifikasi, status menjadi `selesai`.
