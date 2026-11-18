# Tests — Targeted Only

> Berlaku untuk: `tests/**`

Pengujian dijalankan menggunakan Node.js test runner bawaan (`node:test`) dan assertion strict (`node:assert/strict`), dijalankan melalui:
```sh
npm test
```

---

## 1. Lingkungan Database Pengujian (`PGlite`)

- Seluruh pengujian yang membutuhkan database menggunakan PostgreSQL terisolasi berbasis **PGlite** (`tests/fixture.ts`).
- Skema database diinisialisasi menggunakan berkas migrasi produksi yang sama (`./migrations/postgres`).
- Dilarang menghubungkan pengujian unit/integrasi ke database development atau production Neon.

---

## 2. Area Wajib Diuji (High-Risk Domain Logic)

Bukan TDD seremonial untuk setiap tombol atau styling. Tulis tes untuk logika yang jika salah akan merusak data finansial atau status siswa:

1. **Evaluasi Kelayakan Ujian (`evaluate`):**
   - Siswa lunas seluruh tagihan wajib s.d. bulan ujian.
   - Siswa memiliki invoice tertunggak di tahun ajaran berjalan.
   - Siswa memiliki invoice tahun ajaran sebelumnya yang belum lunas.
   - Siswa dengan status dispensasi disetujui Kepala Sekolah.
2. **Generate Tagihan SPP (`generateInvoices`):**
   - Tagihan terbit idempoten (tidak duplikat saat dijalankan dua kali).
   - Siswa baru hanya menerima tagihan mulai dari bulan terdaftar (`enrolledOn`).
3. **Pencatatan & Idempotensi Pembayaran (`createPayment`):**
   - Transaksi tunai langsung berstatus `PAID`.
   - Transaksi transfer berstatus `PENDING_VERIFICATION` dan mewajibkan `proofId`.
   - Replay request dengan `idempotencyKey` yang sama mengembalikan respon lama tanpa menduplikasi data.
4. **Verifikasi Transfer & Pembatalan:**
   - Approval transfer TU mengubah status invoice menjadi `PAID` dan memicu evaluasi ulang ujian.
   - Penolakan transfer melepaskan invoice kembali ke `UNPAID` tanpa menghapus record tagihan.
5. **Alur Otorisasi Dispensasi:**
   - Wali murid/TU mengajukan (`SUBMITTED`).
   - TU mereview (`REVIEWED`).
   - Kepala Sekolah menyetujui (`APPROVED`) atau menolak (`REJECTED`).
   - Dispensasi tidak pernah mengubah status invoice menjadi `PAID`.
6. **Enforcement Peran & Guardian Scoping:**
   - Wali murid dilarang mengakses siswa milik wali lain (HTTP 403).
   - Endpoint non-publik menolak request tanpa cookie sesi valid.

---

## 3. Gaya Penulisan Test

- Tulis tes dengan perilaku yang jelas (*behavior-driven*).
- Gunakan assertion strict: `assert.equal`, `assert.deepEqual`, `assert.rejects`.
- Pastikan setiap tes membersihkan state-nya atau berjalan di fixture terisolasi.
