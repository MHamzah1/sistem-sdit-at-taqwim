# Riset Fitur: Cetak Kuitansi Pembayaran SPP (Receipt PDF / Print)

- **Slug:** `kuitansi-pembayaran-spp`
- **Objek:** Fitur
- **Dokumen:** 1-riset.md (Tahap 1/4)
- **Status:** Selesai Riset — Menunggu Wawancara Keputusan
- **Tanggal:** 18 November 2026
- **Referensi PRD:** `docs/PRD/PRODUCT REQUIREMENT DOCUMENT (PRD).md` — Bagian 12 FR-PAY-005 (*Bukti Pembayaran*)

---

## 1. Latar Belakang & Kebutuhan

Pada sistem saat ini, modul pembayaran SPP sudah berfungsi dengan baik:
- Pembayaran tunai kasir (*CASH*) langsung berstatus `APPROVED` dan menandai invoice terkait menjadi `PAID`.
- Pembayaran transfer wali (*TRANSFER*) berstatus `PENDING_VERIFICATION` dan jika disetujui TU berubah menjadi `APPROVED`.
- Wali murid dapat mengunggah bukti transfer (gambar/PDF) yang disimpan privat di Vercel Blob.

**Kesenjangan Kritis vs PRD FR-PAY-005:**
Sistem belum memiliki mekanisme untuk **menerbitkan, melihat, dan mencetak Kuitansi Resmi / Bukti Pembayaran (*Receipt*)**. Staf TU dan wali murid tidak memiliki dokumen tanda terima sah yang dapat dicetak atau disimpan sebagai PDF dengan kop resmi SDIT AT-TAQWIM yang merinci:
1. Nomor transaksi / referensi kuitansi resmi.
2. Identitas lengkap siswa (Nama, NIS, Kelas, Tahun Ajaran).
3. Rincian tagihan invoice/bulan apa saja yang dilunasi beserta nominalnya.
4. Total nominal pembayaran (angka dan format rupiah).
5. Metode pembayaran (Tunai / Transfer Bank).
6. Tanggal pembayaran dan tanggal verifikasi.
7. Nama petugas kasir pencatat atau verifikator keuangan.
8. Status validasi pembayaran (*LUNAS*).

---

## 2. Temuan Codebase Saat Ini

### A. Database & Skema Relasional (`src/db/schema.ts`)
1. **Tabel `payments` (`src/db/schema.ts#L219-L244`):**
   - Menyimpan `id` (UUID), `studentId`, `createdBy` (User ID kasir/pencatat), `idempotencyKey`, `amount` (integer total), `method` (`CASH`/`TRANSFER`), `status` (`PENDING_VERIFICATION`/`APPROVED`/`REJECTED`), `paidOn` (date), `notes`, `reviewedBy` (User ID verifikator TU), `reviewReason`.
   - **Catatan:** Belum ada kolom nomor kuitansi sekuensial (misal: `KW-202611-001`). Nomor kuitansi saat ini bisa didasarkan pada turunan tanggal dan UUID atau dibuat kolom baru jika diperlukan.
2. **Tabel `payment_invoice_items` (`src/db/schema.ts#L245-L261`):**
   - Menyimpan relasi many-to-many `paymentId` dan `invoiceId` beserta `amount`.
   - Relasi ini mencatat secara persis invoice bulan mana saja yang dibayar dalam 1 transaksi pembayaran.
3. **Tabel `invoices` (`src/db/schema.ts#L192-L218`):**
   - Menyimpan `month` (format `YYYY-MM-01`), `amount`, `status`, dan `academicYearId`.
4. **Tabel `system_settings` (`src/db/schema.ts#L451-L455`):**
   - Menyimpan konfigurasi identitas sekolah dengan key `school`: `schoolName` ("SDIT AT-TAQWIM") dan `phone`.

### B. Backend Logic & Distribusi Data (`server/`)
1. **Status Pembayaran di `server/business.ts`:**
   - Fungsi `createPayment` (`server/business.ts#L170-L289`) mencatat transaksi dan mengaitkan item invoice ke `payment_invoice_items`.
   - Fungsi `reviewPayment` (`server/business.ts#L290-L366`) memperbarui status pembayaran transfer menjadi `APPROVED` atau `REJECTED`.
2. **State Server ke Klien di `server/state.ts` (`server/state.ts#L6-L184`):**
   - **TEMUAN KRUSIAL:** `readState()` saat ini mengambil data dari tabel `payments`, namun **TIDAK menyertakan data `paymentInvoiceItems`**.
   - Akibatnya, pada frontend, objek `payment` hanya berisi total `amount` dan `studentId`, tanpa tahu rincian bulan apa saja yang dibayar pada transaksi tersebut.
3. **Endpoint API di `server/app.ts`:**
   - Belum ada endpoint khusus `GET /api/payments/:id/receipt` untuk mengambil data cetak kuitansi tunggal secara komprehensif, atau alternatifnya mengekspos relasi `paymentInvoiceItems` ke `AppState`.
4. **Otorisasi & Anti-IDOR (`server/security.ts`):**
   - Staf internal dengan hak `finance` / `read` berhak melihat seluruh pembayaran.
   - Akun peran `WALI_MURID` dibatasi (*guardian scoping*) hanya boleh melihat pembayaran yang terhubung dengan `studentId` anak kandungnya melalui tabel `guardian_students`. Aturan ini wajib dipertahankan pada akses kuitansi.

### C. Antarmuka Pengguna & Cetak (`src/main.tsx` & CSS)
1. **Tabel Riwayat Pembayaran (`src/main.tsx#L1256-L1320`):**
   - Menampilkan kolom: Siswa, Tanggal, Nominal, Metode, Status.
   - Kolom tindakan (*actions*) saat ini hanya memiliki:
     - Tombol `Bukti` (unduh bukti transfer blob).
     - Tombol `Setujui` / `Tolak` (untuk staf TU pada transfer pending).
   - **Belum ada tombol `Kuitansi` atau `Cetak Bukti`.**
2. **Portal Wali Murid (`src/main.tsx#L1470-L1529`):**
   - Menampilkan ringkasan anak dan tagihan, namun belum menyediakan tautan riwayat kuitansi pembayaran yang sudah berstatus `LUNAS`.
3. **Dukungan `@media print` (`src/styles.css#L8-L15`):**
   - Sudah terdapat infrastruktur cetak bawaan yang sangat baik: ketika modal dibuka, komponen `.app-shell .main-shell` disembunyikan dan konten modal diformat khusus untuk cetak browser (`window.print()`). Pola ini sudah sukses dipakai pada modal Kartu Ujian ([main.tsx#L1964-L2012](file:///c:/Users/Admin/Documents/AxoIndo/Client/SDIT-AT-TAQWIM/SourceCode/sistem-sdit-at-taqwim/src/main.tsx#L1964-L2012)).

---

## 3. Identifikasi Titik Sentuh Kode (*Impact Areas*)

| No | Berkas | Perubahan yang Diperlukan |
|---|---|---|
| 1 | `server/state.ts` atau `server/app.ts` | Menyediakan data rincian item invoice per transaksi (`paymentInvoiceItems`) agar klien mengetahui bulan tagihan yang dibayarkan. Menjaga otorisasi anti-IDOR wali murid. |
| 2 | `src/data.ts` | Helper format tanggal WIB resmi dan format nominal / terbilang rupiah jika diperlukan. |
| 3 | `src/main.tsx` | - Menambahkan tombol aksi `Kuitansi` pada daftar pembayaran yang berstatus `APPROVED`.<br/>- Menambahkan modal pratinjau kuitansi (`ReceiptModal`) dengan layout kop SDIT AT-TAQWIM, rincian pembayaran, cap stempel lunas digital, dan tombol `Cetak / Simpan PDF`.<br/>- Menampilkan tombol unduh kuitansi pada Portal Wali Murid untuk tagihan yang sudah lunas. |
| 4 | `src/styles.css` / `src/production.css` | Menambahkan kelas styling `.print-receipt` dengan tipografi dokumen kuitansi formal (border rapi, tabel rincian, tanda tangan kasir/stempel). |
| 5 | `tests/business.test.ts` | Menambahkan pengujian integrasi bahwa item invoice pembayaran terhubung dengan benar dan hak akses wali murid terlindungi. |

---

## 4. Pertanyaan Kunci untuk Wawancara Keputusan (`/fitur-wawancara`)

Sebelum spesifikasi dikunci dan kode ditulis, ada beberapa keputusan proses bisnis sekolah yang perlu dikonfirmasi kepada pemilik kebutuhan:

1. **Format Penomoran Kuitansi:** Apakah penomoran kuitansi cukup menggunakan format turunan deterministik berbasis tanggal dan kode transaksi (misal: `KW-YYYYMMDD-[4-karakter-ID]`) tanpa migrasi skema tabel baru, atau sekolah mewajibkan nomor urut sekuensial manual?
2. **Kondisi Penerbitan Kuitansi:** Apakah tombol kuitansi hanya boleh dicetak untuk pembayaran yang sudah disahkan (`APPROVED`), atau boleh dicetak saat transfer berstatus `PENDING_VERIFICATION` dengan tanda air (*watermark*) "MENUNGGU VERIFIKASI"?
3. **Hak Cetak Wali Murid:** Apakah orang tua/wali murid diizinkan mencetak/mengunduh kuitansi mandiri melalui Portal Wali Murid, atau kuitansi hanya diterbitkan oleh kasir sekolah/TU?
4. **Elemen Tanda Tangan & Informasi Kuitansi:** Apakah kuitansi perlu memuat tanda tangan digital/nama terang kasir pencatat pembayaran, atau cukup stempel resmi kasir tata usaha SDIT AT-TAQWIM?
5. **Format Terbilang:** Apakah kuitansi wajib menyertakan kalimat terbilang rupiah (contoh: *"Empat Ratus Lima Puluh Ribu Rupiah"*) sebagaimana kuitansi fisik konvensional?

---

## 5. Kesimpulan Riset

Fitur **Kuitansi Pembayaran SPP** memiliki kesiapan teknis yang sangat tinggi untuk diimplementasikan karena struktur data pembayaran dan rincian invoice (`payments` dan `payment_invoice_items`) sudah tersimpan rapi di database PostgreSQL. Pekerjaan utama berfokus pada:
1. Menghubungkan relasi item invoice ke klien secara aman.
2. Mendesain komponen kuitansi formal siap cetak (*print-ready*) di antarmuka web.
3. Memastikan wali murid dan staf TU memiliki akses sesuai kewenangannya.

*Langkah berikutnya:* Menjalankan tahap **2/4: `/fitur-wawancara kuitansi-pembayaran-spp`** untuk mengunci 5 pertanyaan keputusan bisnis di atas.
