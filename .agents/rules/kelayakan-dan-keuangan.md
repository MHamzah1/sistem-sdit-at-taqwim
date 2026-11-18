# Kelayakan Ujian & Keuangan SPP

> Berlaku untuk: Seluruh logika bisnis SPP, Tagihan, Pembayaran, Evaluasi Ujian, dan Dispensasi (`server/business.ts`, `server/app.ts`, `src/db/schema.ts`).

Dokumen ini memuat aturan inti dan invarian bisnis yang **tidak boleh dilanggar** dalam sistem SPP & Kelayakan Ujian SDIT AT-TAQWIM.

---

## 1. Aturan Master SPP & Tagihan (Invoices)

1. **Snapshot Nominal Bersifat Permanen (Immutable Invoices):**
   - Perubahan nominal SPP pada Master SPP (`/keuangan/master-spp`) **TIDAK BOLEH** mengubah nominal tagihan lama yang sudah terbit.
   - Tagihan yang sudah diterbitkan (`invoices`) mengunci nominal pada saat generate (`amount`).
2. **Generate Tagihan Idempoten:**
   - Tagihan digenerate per bulan (`YYYY-MM-01`) per tahun ajaran.
   - Tagihan hanya diterbitkan untuk siswa yang sudah terdaftar aktif pada atau sebelum bulan tagihan tersebut.
   - Upaya generate ulang pada bulan yang sama untuk siswa yang sama tidak boleh membuat tagihan duplikat (terlindungi oleh unique index `(student_id, month)`).
3. **Proteksi Foreign Key Siswa & Kelas:**
   - Siswa atau kelas yang sudah memiliki tagihan atau riwayat transaksi **DILARANG DIHAPUS** dari database. Ditolak oleh foreign key database.
   - Mutasi kelas atau perubahan tanggal masuk siswa yang sudah memiliki invoice tidak boleh dilakukan sembarangan untuk menjaga audit finansial.

---

## 2. Aturan Pembayaran & Verifikasi Transfer

1. **Metode Pembayaran:**
   - Pembayaran **CASH** (Tunai): Dicatat oleh staf keuangan/TU, langsung berstatus `PAID` pada invoice dan `APPROVED` pada pembayaran.
   - Pembayaran **TRANSFER**: Dapat diinput oleh wali murid atau TU, wajib melampirkan berkas bukti transfer (`proofId`). Status pembayaran awal adalah `PENDING_VERIFICATION` dan status invoice menjadi `PENDING_VERIFICATION`.
2. **Kalkulasi Nominal Terpusat di Server:**
   - Client **TIDAK BOLEH** mengirimkan nominal pembayaran total (`amount`). Server menghitung nominal total dari jumlah tagihan yang dipilih (`invoiceIds`).
   - Tagihan dilunasi penuh per invoice (tidak ada cicilan parsial per lembar invoice).
3. **Idempotency Key:**
   - Setiap upaya pencatatan pembayaran wajib menyertakan `idempotencyKey` (UUID unik).
   - Pengiriman ulang dengan key yang sama mengembalikan pembayaran yang sama. Payload berbeda dengan key yang sama wajib ditolak (409 Conflict).
4. **Verifikasi Transfer oleh TU:**
   - Hanya pembayaran berstatus `PENDING_VERIFICATION` yang dapat di-approve atau di-reject oleh TU.
   - **Approve**: Invoice berubah menjadi `PAID`, evaluasi kelayakan ujian siswa langsung diperbarui otomatis.
   - **Reject**: Invoice dikembalikan ke status `UNPAID` (atau `OVERDUE`), bukti transfer ditandai ditolak beserta alasan penolakan.

---

## 3. Logika Evaluasi Kelayakan Ujian (Eligibility)

Kelayakan ujian dievaluasi menggunakan fungsi murni `evaluate(requiredMonths, invoices, hasApprovedDispensation)`:

| Kondisi | Status Kelayakan | Hak Unduh Kartu Ujian |
|---|---|---|
| Seluruh tagihan wajib lunas (`PAID`) dan tidak ada tunggakan masa lalu | `ELIGIBLE` | Ya, dapat diunduh |
| Memiliki tunggakan, namun memiliki dispensasi aktif yang disetujui Kepala Sekolah | `ELIGIBLE_DISPENSATION` | Ya, dapat diunduh |
| Memiliki tagihan belum lunas (`UNPAID` / `PENDING_VERIFICATION` / `OVERDUE`) tanpa dispensasi | `NOT_ELIGIBLE` | Tidak boleh diunduh |
| Periode ujian belum dievaluasi | `NOT_EVALUATED` | Tidak boleh diunduh |

1. **Evaluasi Otomatis Saat Transaksi Finansial:**
   - Setiap pembayaran disetujui, tagihan baru digenerate, atau dispensasi disetujui, server wajib memicu evaluasi ulang kelayakan (`recalculate(db, studentId)`).
2. **Evaluasi Ulang Saat Unduh & Validasi QR:**
   - Server selalu mengevaluasi ulang status kelayakan saat kartu diunduh atau QR divalidasi (`GET /api/exam-cards/:code/validate`). Kode QR bukan jalan pintas untuk melewati verifikasi server.

---

## 4. Alur Dispensasi Ujian

1. **Pengajuan:** Wali murid atau TU mengajukan permohonan dispensasi (`SUBMITTED`) dengan mencantumkan alasan, nominal komitmen, dan tanggal janji bayar (`promisedOn`).
2. **Review TU:** Staf TU memeriksa permohonan dan catatan verifikasi, mengubah status menjadi `REVIEWED`.
3. **Keputusan Kepala Sekolah:** Hanya akun dengan peran `KEPALA_SEKOLAH` (atau `SUPER_ADMIN`) yang berhak menyetujui (`APPROVED`) atau menolak (`REJECTED`) dispensasi.
4. **Dispensasi Tidak Menghapus Hutang:** Dispensasi hanya memberikan izin mengikuti ujian sementara, **BUKAN** melunasi tagihan invoice SPP.

---

## 5. Keamanan & Scoping Wali Murid (Guardian Scoping)

- Akun dengan peran `WALI_MURID` dibatasi secara ketat oleh relasi tabel `guardian_students`.
- Wali murid hanya diizinkan melihat data siswa, invoice, histori pembayaran, form karakteristik, dan kartu ujian yang terhubung ke akunnya.
- Segala upaya akses data siswa lain (IDOR) wajib ditolak dengan HTTP 403 Forbidden.
