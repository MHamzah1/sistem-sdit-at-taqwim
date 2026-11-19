# TGS-002: Modal Kuitansi & Integrasi Cetak Staf Kasir

**Status:** selesai · **Fitur:** kuitansi-pembayaran-spp · **Jenis:** Mandiri
**Bergantung pada:** TGS-001 (membutuhkan data item invoice dan helper terbilang)
**Kesiapan data:** tidak perlu migrasi

## Tujuan
Membangun antarmuka modal pratinjau kuitansi pembayaran resmi ber-kop SDIT AT-TAQWIM yang siap dicetak/disimpan ke PDF (`window.print()`), dan menyematkan tombol aksi `Kuitansi` pada tabel riwayat pembayaran staf sekolah untuk seluruh transaksi yang berstatus `APPROVED`.

## Migrasi Data
Tidak ada.

## Cakupan Spesifikasi
- US-1, US-2, US-4
- KF-1 (Tombol `Kuitansi` pada tabel pembayaran untuk status `APPROVED`)
- KF-2 (Pencegahan tombol pada status `PENDING_VERIFICATION` dan `REJECTED`)
- KF-3 (Modal kuitansi lengkap dengan kop, nomor, rincian bulan, terbilang, cap lunas, nama kasir)
- KF-4 (Tombol pemicu cetak `window.print()`)
- KT-1, KT-2, KT-4, KT-5

## File
### Dibuat
Tidak ada.
### Diubah
- `src/main.tsx` — Menambahkan state kuitansi aktif (`receipt`), tombol aksi `Kuitansi` pada baris tabel pembayaran `APPROVED`, dan komponen modal `ReceiptModal`.
- `src/styles.css` / `src/production.css` — Menambahkan kelas styling `.print-receipt` dengan border rapi, badge stempel lunas digital, dan tata letak print-ready 1 halaman.
### Di Luar Cakupan
Akses kuitansi dari sisi Portal Wali Murid (dikerjakan pada TGS-003).

## Langkah
1. Buat komponen modal kuitansi di `src/main.tsx`:
   - Header: Kop resmi sekolah dengan logo Brand, nama "SDIT AT-TAQWIM", teks "BUKTI PEMBAYARAN SPP / KUITANSI".
   - Meta Dokumen: Nomor kuitansi (via `receiptNumber`), tanggal pembayaran, metode bayar (Tunai / Transfer).
   - Identitas Siswa: Nama Siswa, NIS, Kelas, Tahun Ajaran.
   - Tabel Rincian Tagihan: Daftar invoice bulan yang dibayarkan dan nominal per bulan.
   - Total & Terbilang: Nominal total pembayaran (format mata uang `money()`) dan baris teks terbilang bahasa Indonesia.
   - Pengesahan: Nama kasir pencatat / verifikator keuangan (`users`), cap stempel lunas digital.
   - Tombol Aksi: Tombol `Cetak / Simpan PDF` (`window.print()`) dan tombol Tutup.
2. Tambahkan tombol `Kuitansi` pada tabel pembayaran (`src/main.tsx#L1289-L1317`):
   - Hanya muncul jika `p.status === "APPROVED"`.
   - Mengklik tombol membuka modal kuitansi untuk transaksi tersebut.
3. Tambahkan styling dokumen cetak `.print-receipt` pada `src/styles.css` dan `src/production.css`.

## Test
Uji antarmuka visual kuitansi kasir, pemformatan rupiah, dan memastikan tombol cetak memicu dialog print.

## Acceptance Criteria
- [ ] Tombol `Kuitansi` muncul pada transaksi berstatus `APPROVED` di menu Pembayaran.
- [ ] Transaksi `PENDING_VERIFICATION` tidak menampilkan tombol `Kuitansi`.
- [ ] Mengklik tombol membuka modal kuitansi dengan kop sekolah, rincian bulan tagihan, dan kalimat terbilang yang tepat.
- [ ] Tombol `Cetak / Simpan PDF` siap mencetak kuitansi tanpa terpotong elemen sidebar/topbar.
- [ ] `npm run typecheck` dan `npm test` lulus tanpa error.

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui (batch approval pengguna)
- 2026-11-19 dikerjakan — berjalan (/tugas-kerjakan)
- 2026-11-19 selesai — selesai (.development-history/2026-11-19-14-34-tgs-002-modal-kuitansi-dan-cetak-kasir.md)
