---
name: uji-browser
description: >-
  Uji live browser (Playwright, Chromium terlihat) — susun test case P0–P5, jalankan, laporan di docs/uji/UJI-NNN-[menu]/; TC gagal → /isu-diagnosa Gunakan ketika pengguna meminta pengujian live browser antarmuka web SDIT AT-TAQWIM menggunakan Playwright Chromium.
---

# Uji — Browser

Pastikan sistem SPP & Kelayakan Ujian SDIT AT-TAQWIM berjalan sempurna di browser: antarmuka visual, alur transaksi, validasi input form, dan respon API.
Konvensi: `.agents/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Persiapan Lingkungan

- **Target Default: localhost.** Pastikan server Next.js berjalan:
  ```sh
  npm run dev   # Berjalan di http://localhost:3002
  ```
- **Playwright Chromium:** Jika browser binary belum terpasang, jalankan:
  ```sh
  npx playwright install chromium
  ```
- **Kredensial Uji:** Gunakan akun peran yang sesuai (Admin, TU, Kepala Sekolah, Wali Murid).
- **Nomor Uji:** `UJI-NNN` terbesar di `docs/uji/` + 1 (mulai `UJI-001`).

## Tingkat Prioritas Test Case (P0–P5)

| Prioritas | Kategori | Skenario Uji Sekolah |
|---|---|---|
| **P0** Fatal | Login/logout, blank page, error 500, kebocoran data siswa antar-wali, token/secret di network. |
| **P1** Aturan Bisnis | Hak akses per peran (TU vs Kepsek vs Wali), evaluasi kelayakan ujian (3 syarat), proteksi hapus siswa yang punya tagihan. |
| **P2** Fungsi Utama | Alur Master Siswa/Kelas, generate tagihan SPP, pencatatan pembayaran tunai/transfer, unduh kartu ujian ber-QR. |
| **P3** Validasi Form | Field wajib, input angka nominal, batas upload bukti transfer (hanya JPG/PNG/PDF maks 5 MB), submit ganda. |
| **P4** Visual & Format | Format Rupiah `money()`, status badge warna semantik (`Badge`), format tanggal WIB, rendering kartu ujian cetak. |
| **P5** UX & Interaksi | Modal pop-up, loading state, pesan error ramah, responsivitas menu sidebar di layar kecil. |

## Langkah Pengujian

1. **Susun Daftar Test Case:**
   - Tampilkan tabel ringkas skenario uji di chat dan tulis draf ke `docs/uji/UJI-NNN-[menu]/laporan.md`.
2. **Jalankan Skenario:**
   - Buka browser menggunakan Playwright headed mode.
   - Ambil tangkapan layar (screenshot) untuk setiap pengujian.
3. **Catat Hasil:**
   - Tandai status tiap test case: `PASS`, `FAIL`, atau `DILEWATI`.
4. **Tindak Lanjut Kegagalan:**
   - Jika ditemukan kegagalan fungsi atau bug baru, otomatis catat dan tawarkan untuk didiagnosa via `/isu-diagnosa`.
