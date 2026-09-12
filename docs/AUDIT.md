# Audit prototype

Audit mencakup seluruh berkas source aplikasi, konfigurasi, migration, dan seed awal.

- `src/main.tsx`: aplikasi monolitik; siswa, pembayaran, audit, form, dan bulan generate disimpan di localStorage. Tidak ada autentikasi. Menu wali menampilkan dua siswa tetap tanpa relasi. Pembayaran mengurangi penghitung bulan di browser; bukti hanya divalidasi dan tidak diunggah. Dispensasi/form/settings tidak persisten. Kartu hanya pratinjau. Statistik, grafik, deadline, nominal, kelas, dan ujian hardcoded.
- `src/data.ts`: 560 siswa sintetis, 12 pembayaran sintetis, nomor WhatsApp sama untuk semua siswa; kelayakan hanya dihitung dari months.
- `src/lib/api.ts`: client tabel items yang tidak digunakan alur bisnis.
- `worker/index.ts`: health check statis; semua endpoint lain 404.
- `src/db`: Drizzle SQLite/D1 dengan satu tabel items.
- `migrations` dan `seeds`: hanya schema items dan contoh data.
- `package.json`, `vite.config.ts`, `wrangler.jsonc`: target Cloudflare, belum ada Vercel SPA routing, session, transaksi finansial, atau Blob.
- Folder ini bukan checkout Git; tidak ada riwayat/status commit untuk diaudit.

Arsitektur pengganti: UI React/Vite mempertahankan stylesheet, branding, sidebar, kartu dashboard dan alur menu; API server menjadi otoritas untuk semua data operasional. Drizzle PostgreSQL dengan Neon Pool untuk transaksi interaktif; session cookie HttpOnly; bukti privat di Vercel Blob.
