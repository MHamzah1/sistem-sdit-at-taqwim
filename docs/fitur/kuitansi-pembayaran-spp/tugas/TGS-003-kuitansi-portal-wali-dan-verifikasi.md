# TGS-003: Akses Kuitansi Portal Wali & Verifikasi End-to-End

**Status:** selesai · **Fitur:** kuitansi-pembayaran-spp · **Jenis:** Mandiri
**Bergantung pada:** TGS-002 (membutuhkan modal kuitansi yang sudah terpasang)
**Kesiapan data:** tidak perlu migrasi

## Tujuan
Mengintegrasikan akses unduh/cetak kuitansi resmi pembayaran mandiri pada Portal Wali Murid (`/wali`) untuk siswa anak kandung yang terhubung, memastikan perlindungan Anti-IDOR, dan memverifikasi seluruh gerbang uji build dan test suite secara komprehensif.

## Migrasi Data
Tidak ada.

## Cakupan Spesifikasi
- US-3
- KF-8 (Proteksi Anti-IDOR pada kuitansi wali murid)
- KT-3 (Akses cetak mandiri oleh wali murid)
- KNF-1, KNF-2, KNF-3

## File
### Dibuat
Tidak ada.
### Diubah
- `src/main.tsx` — Menambahkan tombol/tautan cetak kuitansi pada daftar transaksi/tagihan lunas di tampilan Portal Wali Murid (`/wali`).
- `tests/business.test.ts` — Menambahkan pengujian integrasi hak akses wali murid terhadap kuitansi (wali murid hanya menerima rincian pembayaran anak kandungnya).
### Di Luar Cakupan
Modul lain di luar kuitansi pembayaran.

## Langkah
1. Perbarui tampilan Portal Wali Murid (`src/main.tsx#L1470-L1529`):
   - Tambahkan riwayat pembayaran yang sudah lunas untuk setiap siswa anak kandung di kartu wali.
   - Sertakan tombol `Kuitansi` pada transaksi yang berstatus `APPROVED` sehingga wali murid dapat langsung mencetak atau menyimpannya sebagai PDF.
2. Tambahkan pengujian otomatis di `tests/business.test.ts`:
   - Simulasikan sesi wali murid dan pastikan data item invoice pembayaran yang dikembalikan server hanya milik siswa yang dihubungkan di tabel `guardian_students`.
   - Pastikan wali murid dapat memicu kuitansi pembayaran anaknya tanpa kesalahan tipe atau error otorisasi.
3. Jalankan verifikasi menyeluruh:
   - `npm run typecheck`
   - `npm test`
   - `npm run build`

## Test
Uji integrasi `node:test` untuk memverifikasi isolasi data wali murid (Anti-IDOR) dan uji kompilasi produksi Next.js.

## Acceptance Criteria
- [ ] Wali murid dapat melihat riwayat pembayaran anak kandungnya yang telah berstatus `APPROVED` di Portal Wali Murid.
- [ ] Wali murid dapat membuka dan mencetak kuitansi resmi ber-kop SDIT AT-TAQWIM secara mandiri.
- [ ] Pengujian Anti-IDOR lulus: wali murid tidak dapat melihat atau mengakses kuitansi siswa lain.
- [ ] Kompilasi `npm run build` berhasil tanpa warning/error.
- [ ] Seluruh 20+ test suite lulus 100%.

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui (batch approval pengguna)
- 2026-11-19 dikerjakan — berjalan (/tugas-kerjakan)
- 2026-11-19 selesai — selesai (.development-history/2026-11-19-14-36-tgs-003-kuitansi-portal-wali-dan-verifikasi.md)
