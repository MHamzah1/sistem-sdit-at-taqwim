# Sistem SPP & Kelayakan Ujian — SDIT AT-TAQWIM

Next.js 15 (App Router) + React 19 + TypeScript, Drizzle ORM, Neon PostgreSQL, private Vercel Blob. Tampilan menggunakan branding dan stylesheet proyek sekolah.

## Menjalankan lokal

Node.js 24 diperlukan. Salin `.env.example` menjadi `.env` dan isi kredensial development melalui editor lokal, tanpa menaruh secret di chat atau Git. Gunakan database Neon development yang berbeda dari production. `AUTH_SECRET` harus acak minimal 32 karakter; password admin minimal 12 karakter. `APP_ORIGIN=http://localhost:3002`.

```sh
npm install
npm run db:migrate
npm run db:init
npm run dev
```

`db:init` memasukkan roles/permissions dan satu admin melalui `INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD` hanya jika tabel users kosong. Tidak membuat siswa, invoice, pembayaran, atau data contoh. Hapus variable password inisialisasi sesudah berhasil. Inisialisasi ulang tidak mengganti password yang sudah ada.

Upload langsung ke Blob memerlukan private store dan akses endpoint token dari browser; metadata disimpan sesudah validasi ulang oleh API. Bukti tidak menjadi bagian dari payload pembayaran sampai server menerima file yang valid.

## Urutan konfigurasi sekolah

1. Masuk sebagai admin awal; atur identitas sekolah dan buat akun TU, Kepala Sekolah, serta wali melalui Pengaturan.
2. Buat tahun ajaran dengan tanggal aktual, kelas, siswa dan tanggal masuk.
3. Buat data wali; tautkan akun dengan role WALI_MURID, lalu hubungkan wali ke siswa.
4. Atur Master SPP per tahun ajaran. Generate setiap bulan wajib sejak siswa masuk.
5. Buat jenis/periode ujian, semester, jadwal, deadline, bulan wajib, dan izin unduh kartu wali.
6. Catat tunai atau unggah transfer. TU memverifikasi transfer. Evaluasi memeriksa invoice wajib yang belum terbit dan seluruh tunggakan lama.
7. Dispensasi diajukan wali/TU, direview TU, lalu diputuskan Kepala Sekolah. Kartu hanya diterbitkan setelah server mengevaluasi ulang kelayakan.

Perubahan nominal master tidak mengubah invoice lama. Penghapusan record yang dirujuk transaksi ditolak oleh foreign key. Perpindahan kelas/tanggal masuk siswa yang sudah mempunyai invoice sengaja diblokir agar riwayat finansial tidak berubah tanpa proses mutasi tersendiri.

## Validasi

```sh
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm run preflight
```

Tes integrasi menggunakan PostgreSQL PGlite terisolasi dan migration production yang sama, bukan SQLite. Data tes hanya hidup dalam fixture terpisah. `test:browser` memakai build `dist` dan server tes pada port 3002. `preflight` memakai environment yang dipilih, memeriksa schema database serta write/read/delete file health sementara di private Blob. Tidak boleh dianggap pengganti smoke test produksi.

## Dokumentasi

- [Audit prototype](docs/AUDIT.md)
- [Deployment Vercel + Neon](docs/DEPLOYMENT.md)
- [Kontrak API](docs/API.md)
- [Laporan akhir dan batas verifikasi](docs/FINAL-REPORT.md)
