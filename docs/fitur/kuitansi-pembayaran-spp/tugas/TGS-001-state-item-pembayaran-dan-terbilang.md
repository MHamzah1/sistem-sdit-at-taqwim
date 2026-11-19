# TGS-001: State Item Pembayaran & Helper Terbilang Rupiah

**Status:** selesai · **Fitur:** kuitansi-pembayaran-spp · **Jenis:** Mandiri
**Bergantung pada:** tidak ada
**Kesiapan data:** tidak perlu migrasi — data sudah ada di `payment_invoice_items`

## Tujuan
Menyediakan data rincian item invoice per transaksi pembayaran (`paymentItems`) pada `AppState` (`server/state.ts`) dengan proteksi anti-IDOR wali murid, serta helper format kalimat terbilang rupiah (`terbilang()`) dan generator nomor registrasi kuitansi deterministik di `src/data.ts`.

## Migrasi Data
Tidak ada.

## Cakupan Spesifikasi
- US-1, US-2
- KF-5 (Pemuatan `paymentItems` di `readState`)
- KF-6 (Pola nomor kuitansi deterministik `KW-YYYYMMDD-[6-char-ID]`)
- KF-7 (Konversi nominal rupiah ke kalimat terbilang)
- KF-8, KF-9 (Proteksi Anti-IDOR guardian scoping)

## File
### Dibuat
Tidak ada.
### Diubah
- `server/state.ts` — Memuat `paymentInvoiceItems` terfilter sesuai cakupan hak akses akun (staf melihat semua, wali hanya melihat pembayaran anak kandungnya).
- `src/data.ts` — Menambahkan fungsi `terbilang(amount: number): string` dan helper `receiptNumber(paidOn, id)`.
- `tests/business.test.ts` — Menambahkan assertion pengujian untuk verifikasi ketersediaan item invoice pembayaran dan fungsi terbilang.
### Di Luar Cakupan
Komponen modal tampilan cetak kuitansi di UI (dikerjakan pada TGS-002).

## Langkah
1. Perbarui `server/state.ts`:
   - Lakukan query ke `s.paymentInvoiceItems` yang difilter oleh `payments.map(p => p.id)`.
   - Kembalikan `paymentItems` dalam objek return `readState`.
2. Perbarui `src/data.ts`:
   - Implementasikan fungsi `terbilang(amount: number): string` (menangani satuan, belasan, puluhan, ratusan, ribuan, jutaan, milyaran, triliunan + akhiran "Rupiah").
   - Implementasikan generator `receiptNumber(paidOn: string, id: string): string` dengan format `KW-${paidOn.replace(/-/g, "")}-${id.slice(0, 6).toUpperCase()}`.
3. Perbarui `tests/business.test.ts`:
   - Uji helper `terbilang` (misal 450000 -> "Empat Ratus Lima Puluh Ribu Rupiah").
   - Uji bahwa `readState` mengembalikan `paymentItems` yang sesuai dan akun wali murid tidak mengalami kebocoran data.

## Test
Unit test `node:test` di `tests/business.test.ts` memastikan helper terbilang dan data scoping bekerja sempurna.

## Acceptance Criteria
- [ ] `npm test` lulus tanpa error.
- [ ] `readState` mengembalikan `paymentItems` berisi `paymentId`, `invoiceId`, dan `amount`.
- [ ] `terbilang(450000)` mengembalikan `"Empat Ratus Lima Puluh Ribu Rupiah"`.
- [ ] `receiptNumber("2026-11-19", "abc12345-...")` mengembalikan format `KW-20261119-ABC123`.

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui (batch approval pengguna)
- 2026-11-19 dikerjakan — berjalan (/tugas-kerjakan)
- 2026-11-19 selesai — selesai (.development-history/2026-11-19-14-30-tgs-001-state-item-pembayaran-dan-terbilang.md)
