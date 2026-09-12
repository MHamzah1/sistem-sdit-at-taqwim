# Deployment production

Team: `asoiiis-projects`. Project: `sistem-spp-kelayakan-ujian`. Domain production aktif di <https://sistem-spp-kelayakan-ujian.vercel.app>.

## Status saat ini

Provisioning dan deployment pertama sudah dijalankan pada 12 September 2026.

| Komponen | Status |
| --- | --- |
| Project Vercel | Dibuat dan di-link ke team `asoiiis-projects` |
| Neon PostgreSQL | Project `sparkling-bonus-21804414`, region `us-east-1`, 30 tabel termigrasi |
| Vercel Blob | Store `sdit-at-taqwim-bukti`, access private, region `sin1` |
| Environment production | DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN, APP_ORIGIN terisi |
| Init | 4 role, 8 permission, 1 akun SUPER_ADMIN, tanpa data dummy |
| Preflight | Lulus, termasuk tulis dan baca Blob private nyata |
| Deployment production | Aktif dan lulus smoke test API serta browser |

Dua penyesuaian yang masih terbuka. Neon memasang satu connection string yang sama untuk Production, Preview, dan Development, sehingga branch Neon terpisah perlu dibuat sebelum Preview dipakai untuk tes. `APP_ORIGIN` untuk Preview juga belum diisi.

Langkah di bawah ini adalah runbook untuk provisioning ulang atau untuk environment baru.

## Provision

1. Login Vercel CLI pada akun yang memiliki akses team: `npx vercel login`.
2. Link/buat project di team: `npx vercel link --scope asoiiis-projects --project sistem-spp-kelayakan-ujian`.
3. Vercel dashboard → Storage/Marketplace → Neon PostgreSQL. Hubungkan production branch/database khusus ke **Production**. Buat branch/database terpisah untuk **Development** dan **Preview**, jangan memakai production connection string untuk tes.
4. Buat Vercel Blob store dengan access **Private** dan hubungkan ke project. Gunakan token sesuai environment.
5. Atur environment di Vercel dashboard tanpa prefix `VITE_`:

| Variable | Kegunaan |
| --- | --- |
| DATABASE_URL | Neon PostgreSQL pooled connection string untuk environment bersangkutan |
| AUTH_SECRET | Random secret minimal 32 karakter; terpisah per environment |
| BLOB_READ_WRITE_TOKEN | Token private Blob store |
| APP_ORIGIN | `https://sistem-spp-kelayakan-ujian.vercel.app` untuk production; sesuaikan domain aktual |
| INITIAL_ADMIN_EMAIL | Hanya diperlukan ketika menjalankan init pertama |
| INITIAL_ADMIN_PASSWORD | Password kuat minimal 12 karakter; hanya proses init pertama |

Untuk preview, gunakan origin deployment preview yang benar; jangan memakai origin production. Aplikasi sengaja menolak mutasi cross-origin.

## Migration dan publish

Pull variable production ke file lokal yang diabaikan Git (`npx vercel env pull .env.production.local --environment production`). Set `DOTENV_CONFIG_PATH=.env.production.local` untuk migration, init dan preflight; input kredensial admin secara lokal, jangan melalui argument command yang terekam log. Periksa target Neon sebelum menjalankan migration.

```sh
npm install
npm run typecheck
npm test
npm run build
npm run test:browser
npm run db:migrate
npm run db:init
npm run preflight
npx vercel deploy --prod --scope asoiiis-projects
```

Migration berada di `migrations/postgres/0000_equal_frog_thor.sql`. Drizzle mencatat migration yang sudah dijalankan; rerun aman. Migration SQLite lama di root migrations adalah artefak audit dan tidak dijalankan command production.

`vercel.json` memisahkan rewrite API dari SPA fallback. Node Function `api/index.ts` menjadi adapter API yang mempertahankan path dan query. Root build mengeluarkan asset frontend ke `dist`. Node runtime 24.x.

## Smoke test wajib di production

Gunakan akun/data uji yang jelas, lalu hapus master data uji yang belum dirujuk transaksi. Untuk smoke finansial gunakan database staging terpisah lebih dahulu; transaksi audit production tidak boleh dihapus hanya untuk membersihkan demo.

- `/api/health` menghasilkan 200 dengan `status: ok`, `database: connected`.
- Login admin, TU, principal, dan wali; verify HttpOnly/Secure cookie, logout/revocation, endpoint unauthorized.
- CRUD siswa/wali; master SPP; generate invoice duplicate-safe.
- Tunai; transfer JPG/PNG/PDF (termasuk batas 5 MB); private Blob benar-benar menyimpan file; unduh bukti; approve/reject; replay ditolak.
- Tunggakan dan link WhatsApp; periode ujian; invoice wajib hilang/tunggakan lama tetap NOT_ELIGIBLE.
- Wali mengajukan dispensasi; TU review; principal approval; invoice tetap unpaid; kartu/QR validasi hanya role yang sesuai.
- Form, laporan, audit; periksa console dan semua response.
- Refresh langsung `/dashboard`, `/master/siswa`, `/keuangan/pembayaran`, `/ujian/kelayakan`; API unknown menghasilkan JSON 404.
- Logout/tutup browser; login browser/device kedua; data yang sama tetap tersedia.

Jangan mengubah status READY sampai migration Neon, private Blob, deployment dan smoke test production terbukti lulus. Tes PGlite dan browser lokal bukan bukti koneksi Neon/Vercel production.

Dari daftar di atas, yang sudah lulus di production adalah health check, login admin beserta cookie dan revocation, endpoint unauthorized, CRUD master, refresh langsung keempat rute, JSON 404 untuk API tak dikenal, laporan, audit, serta login dari browser kedua. Yang belum dijalankan adalah seluruh alur finansial, dispensasi, kartu ujian, dan login untuk role TU, kepala sekolah, dan wali. Alur finansial sebaiknya dijalankan sebagai UAT bersama sekolah atau di branch Neon staging, karena transaksi dan jejak auditnya permanen.

Catatan runtime: import relatif pada `api/`, `server/`, dan `src/db/` wajib memakai ekstensi `.js`. Tanpa ekstensi, Vite dan tsx tetap jalan tetapi Node ESM di Vercel gagal dengan `ERR_MODULE_NOT_FOUND` dan seluruh endpoint mengembalikan 500.

Referensi: [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver), [Vercel client uploads](https://vercel.com/docs/vercel-blob/client-upload), [Vercel private storage](https://vercel.com/docs/vercel-blob/private-storage), [batas server uploads](https://vercel.com/docs/vercel-blob/server-upload).
