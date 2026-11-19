# Spesifikasi: Cetak Kuitansi Pembayaran SPP

**Slug:** `kuitansi-pembayaran-spp` · **Dibuat:** 2026-11-19 · **Sumber keputusan:** [2-wawancara.md](2-wawancara.md)

---

## Masalah

Ketika wali murid membayar iuran SPP—baik secara langsung (tunai) di loket sekolah maupun melalui transfer bank yang telah diverifikasi TU—sistem saat ini telah mengubah status transaksi menjadi `APPROVED` dan tagihan menjadi `PAID`, namun sistem belum menyediakan **dokumen Kuitansi / Bukti Pembayaran resmi yang siap dicetak atau disimpan sebagai PDF**. Staf TU/kasir terpaksa mencatat manual atau tidak memiliki tanda terima resmi ber-kop sekolah, dan wali murid tidak memiliki dokumen bukti setor sah yang dapat diunduh secara mandiri.

---

## Tujuan

Menyediakan fitur penerbitan dan pencetakan kuitansi resmi (*print-ready & PDF*) untuk setiap transaksi pembayaran SPP yang telah sah (`APPROVED`), menampilkan nomor kuitansi unik, rincian bulan tagihan yang dilunasi, nominal terbilang bahasa Indonesia, stempel lunas digital, serta nama kasir/verifikator sekolah yang dapat diakses oleh staf sekolah dan wali murid terkait.

---

## Latar Belakang

Sesuai dokumen PRD Bagian 12 FR-PAY-005 (*Bukti Pembayaran*), setiap pembayaran terverifikasi wajib menghasilkan *receipt* resmi. Struktur data relasional di PostgreSQL (`payments` dan `payment_invoice_items`) sudah mencatat rincian transaksi dengan baik, dan sistem styling web telah memiliki infrastruktur `@media print` bawaan. Penambahan fitur ini akan menyempurnakan aspek transparansi dan akuntabilitas keuangan sekolah menjelang peluncuran penuh.

---

## Definition of Done

- [ ] Relasi item invoice pembayaran (`paymentInvoiceItems`) tersedia di `AppState` (`server/state.ts`) dan terlindungi oleh filter Anti-IDOR peran wali murid.
- [ ] Tersedia fungsi konversi nominal ke kalimat terbilang bahasa Indonesia (`terbilang()`) di `src/data.ts`.
- [ ] Tabel Riwayat Pembayaran staf sekolah menampilkan tombol aksi `Kuitansi` untuk semua transaksi berstatus `APPROVED`.
- [ ] Portal Wali Murid menampilkan tombol akses kuitansi untuk pembayaran anak kandung yang telah berstatus `APPROVED`.
- [ ] Modal kuitansi pembayaran menampilkan:
  - Kop resmi SDIT AT-TAQWIM.
  - Nomor registrasi kuitansi berformat deterministik `KW-YYYYMMDD-[6-char-ID]`.
  - Identitas siswa (Nama, NIS, Kelas, Tahun Ajaran).
  - Rincian invoice bulan yang dibayarkan dan nominal masing-masing.
  - Total nominal pembayaran dalam format mata uang Rupiah dan kalimat terbilang huruf.
  - Metode pembayaran (Tunai / Transfer Bank).
  - Tanggal pembayaran dan nama petugas pencatat/verifikator.
  - Cap stempel digital "LUNAS".
  - Tombol `Cetak / Simpan PDF` (`window.print()`).
- [ ] Transaksi berstatus `PENDING_VERIFICATION` atau `REJECTED` tidak menampilkan tombol kuitansi.
- [ ] Desain cetak kuitansi (`.print-receipt`) rapi, proporsional, dan pas dalam 1 halaman cetak kertas tanpa terpotong elemen navigasi aplikasi.
- [ ] Seluruh unit/integration test suite (`npm test`) dan typecheck (`npm run typecheck`) lulus 100% tanpa regresi.

---

## Scope

1. **Backend / State:**
   - Menambahkan pemuatan data `paymentInvoiceItems` pada fungsi `readState()` di `server/state.ts` dengan scoping anti-IDOR yang ketat.
2. **Frontend Helper:**
   - Fungsi `terbilang(number): string` untuk konversi nominal angka rupiah ke teks bahasa Indonesia baku.
   - Generator nomor kuitansi deterministik berbasis tanggal bayar dan ID pembayaran.
3. **Komponen Antarmuka (UI):**
   - Modal `ReceiptModal` di `src/main.tsx` lengkap dengan tombol cetak `window.print()`.
   - Tombol `Kuitansi` pada tabel pembayaran (`/keuangan/pembayaran`).
   - Tombol `Kuitansi` pada riwayat pembayaran di Portal Wali Murid (`/wali`).
4. **Gaya Cetak CSS:**
   - Pengaturan layout kuitansi formal siap cetak (*print-ready stylesheet*) pada `src/styles.css`.

---

## Di Luar Scope

1. Integrasi mesin printer thermal kasir POS 58mm/80mm (kuitansi dirancang untuk kertas format standar A4 / A5 / Letter dan PDF).
2. Kirim berkas PDF kuitansi otomatis via WhatsApp Business API (akan masuk fase automasi lanjutan).
3. Penomoran kuitansi berbasis tabel sekuensial berseri yang mengubah skema tabel database.

---

## Pengguna & User Story

- **US-1 (Kasir / TU):** Sebagai staf kasir/TU, saya ingin mencetak kuitansi pembayaran tunai segera setelah transaksi disimpan agar saya dapat menyerahkan tanda terima fisik kepada pembayar.
- **US-2 (TU Verifikator):** Sebagai petugas TU, saya ingin mencetak kuitansi pembayaran transfer yang baru saja saya setujui agar bukti pembayaran terarsip dengan rapi.
- **US-3 (Wali Murid):** Sebagai wali murid, saya ingin melihat dan mengunduh kuitansi PDF pembayaran anak saya dari ponsel/laptop agar saya memiliki bukti sah bahwa kewajiban SPP anak saya telah lunas.
- **US-4 (Kepala Sekolah):** Sebagai Kepala Sekolah, saya ingin memastikan setiap kuitansi yang terbit mencantumkan nama petugas yang bertanggung jawab dan stempel resmi sekolah demi integritas keuangan.

---

## Kebutuhan Fungsional

### UI (Antarmuka)
- **KF-1:** Tombol `Kuitansi` muncul di kolom tindakan tabel pembayaran jika `payment.status === "APPROVED"`.
- **KF-2:** Tombol kuitansi tidak muncul untuk transaksi berstatus `PENDING_VERIFICATION` atau `REJECTED`.
- **KF-3:** Modal kuitansi menampilkan Kop SDIT AT-TAQWIM, Nomor Kuitansi, Tanggal, Siswa, Kelas, Tabel Rincian Bulan, Total, Terbilang, Metode, Petugas, dan Cap Lunas.
- **KF-4:** Tombol `Cetak / Simpan PDF` memicu fungsi pencetakan browser native (`window.print()`).

### API & Data
- **KF-5:** Objek state aplikasi (`AppState`) memuat array `paymentItems` (`paymentInvoiceItems`) yang mencocokkan `paymentId` dan `invoiceId`.
- **KF-6:** Nomor kuitansi dibangkitkan dengan pola `KW-YYYYMMDD-[ID.slice(0,6).toUpperCase()]`.
- **KF-7:** Kalimat terbilang menghasilkan representasi rupiah yang tepat (misal `Rp 450.000` -> `"Empat Ratus Lima Puluh Ribu Rupiah"`).

### Otorisasi & Keamanan
- **KF-8:** Pengguna dengan peran `WALI_MURID` hanya dapat mengakses data kuitansi yang `studentId`-nya terikat pada akun wali tersebut (Anti-IDOR).
- **KF-9:** Staf internal berizin `finance` atau `read` dapat mengakses kuitansi seluruh siswa.

---

## Kebutuhan Non-Fungsional

- **KNF-1 (Performa):** Modal pratinjau kuitansi terbuka seketika (< 100ms) menggunakan data yang sudah tersinkronisasi di state klien tanpa perlu request jaringan berulang.
- **KNF-2 (Keamanan):** Proteksi Anti-IDOR pada data item invoice di tingkat server.
- **KNF-3 (Kompatibilitas):** Tampilan cetak responsif pada pratinjau PDF di browser Chromium desktop dan peramban ponsel.

---

## Keputusan Terkunci

1. **KT-1 (Format Nomor Kuitansi):** Menggunakan format deterministik `KW-YYYYMMDD-[6 karakter unik ID pembayaran]`.
2. **KT-2 (Syarat Status):** Hanya transaksi berstatus `APPROVED` yang dapat diterbitkan kuitansinya.
3. **KT-3 (Hak Akses):** Kuitansi dapat diakses oleh Staf Sekolah dan Wali Murid terkait.
4. **KT-4 (Format Terbilang):** Wajib menyertakan kalimat terbilang rupiah.
5. **KT-5 (Elemen Pengesahan):** Memuat kop sekolah, stempel digital LUNAS, tanggal cetak, dan nama kasir/verifikator.

---

## Kesiapan Data

- Tidak memerlukan penambahan tabel atau kolom baru pada skema database (`DAT-NNN` tidak diperlukan). Semua data pendukung sudah tersedia di tabel `payments`, `payment_invoice_items`, `invoices`, `students`, `classes`, `academic_years`, dan `users`.

---

## Pertanyaan Terbuka

- Tidak ada pertanyaan terbuka yang memblokir. Seluruh keputusan telah dikunci di tahap wawancara.

---

## Modul yang Diubah

1. `server/state.ts`: Menambahkan pemuatan data `paymentItems` ter-scope anti-IDOR.
2. `src/data.ts`: Menambahkan helper `terbilang(number)` dan generator nomor kuitansi.
3. `src/main.tsx`: Menambahkan tombol `Kuitansi`, modal `ReceiptModal`, dan integrasi Portal Wali.
4. `src/styles.css` & `src/production.css`: Styling kelas `.print-receipt` dan penguatan `@media print`.
5. `tests/business.test.ts`: Penambahan kasus uji kuitansi dan integritas data invoice item.

---

## Risiko

- **Risiko Pemformatan Kertas Cetak:** Lebar dokumen cetak melebihi margin kertas.  
  *Mitigasi:* Mengunci lebar modal kuitansi maksimum 650px dengan padding proporsional dan `break-inside: avoid` pada stylesheet cetak.

---

## Ukuran Keberhasilan

1. Kasir atau wali murid dapat mencetak kuitansi pembayaran ber-kop resmi SDIT AT-TAQWIM dengan rincian bulan tagihan dan kalimat terbilang yang akurat.
2. Seluruh 20 unit/integration test tetap lulus dan build produksi Next.js berhasil tanpa hambatan.
