# Wawancara Keputusan Fitur: Cetak Kuitansi Pembayaran SPP

- **Slug:** `kuitansi-pembayaran-spp`
- **Objek:** Fitur
- **Dokumen:** 2-wawancara.md (Tahap 2/4)
- **Status:** Pending Wawancara Pemilik Kebutuhan
- **Tanggal:** 18 November 2026
- **Referensi Riset:** `docs/fitur/kuitansi-pembayaran-spp/1-riset.md`

---

## Daftar Pertanyaan Keputusan Bisnis & Teknis

### Q1. Format Nomor Registrasi Kuitansi
- **Konteks:** Setiap kuitansi pembayaran resmi memerlukan nomor bukti transaksi untuk keperluan pelacakan dan pembukuan arsip kasir/wali murid.
- **Pilihan Opsi:**
  - **Opsi A (Deterministik Berbasis Tanggal & Prefix):** Menggunakan pola deterministik `KW-YYYYMMDD-[6 karakter ID]` (contoh: `KW-20261118-A7B2C1`). Bebas *race condition*, tidak memerlukan tabel sequence baru di database, dan 100% unik.
  - **Opsi B (Nomor Urut Sekuensial Berseri):** Menggunakan nomor urut berseri seperti `KW-001/SPP/XI/2026`. Memerlukan tabel counter/skema baru dan penanganan lock konkurensi database.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Lebih aman dari konflik konkurensi multi-kasir, tidak memerlukan migrasi tabel baru, dan tetap rapi serta mudah ditelusuri ke ID transaksi pembayaran aslinya.
- **Status Keputusan:** `[ ] Pending`

---

### Q2. Batasan Status Pembayaran yang Berhak Mendapat Kuitansi
- **Konteks:** Transaksi SPP memiliki dua status pembayaran aktif: `APPROVED` (sah lunas) dan `PENDING_VERIFICATION` (transfer bank menunggu pengecekan berkas oleh TU).
- **Pilihan Opsi:**
  - **Opsi A (Hanya Transaksi Sah Lunas):** Kuitansi resmi hanya diterbitkan dan dapat dicetak untuk transaksi yang berstatus `APPROVED` (baik pembayaran tunai kasir maupun transfer yang telah disetujui TU).
  - **Opsi B (Dapat Dicetak Saat Pending):** Transaksi pending dapat dicetak dengan tanda air (*watermark*) "MENUNGGU VERIFIKASI".
- **💡 Rekomendasi Terbaik:** **Opsi A** — Mencegah penyalahgunaan dokumen tanda terima seolah-olah tagihan sudah lunas sebelum diverifikasi oleh kasir/TU.
- **Status Keputusan:** `[ ] Pending`

---

### Q3. Hak Akses Pencetakan Kuitansi oleh Wali Murid
- **Konteks:** Di samping staf kasir/TU di sekolah, wali murid juga membutuhkan bukti setor tagihan anak-anaknya.
- **Pilihan Opsi:**
  - **Opsi A (Staf Sekolah & Wali Murid Mandiri):** Staf sekolah (Super Admin, TU, Kepsek) dapat mencetak kuitansi seluruh siswa dari menu Pembayaran, dan Wali Murid dapat mengunduh/mencetak mandiri kuitansi pembayaran anak kandungnya dari Portal Wali Murid.
  - **Opsi B (Hanya Staf Sekolah):** Hanya kasir TU yang berhak mencetak kuitansi. Wali murid hanya melihat teks status lunas di layar portal.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Memberikan kenyamanan dan transparansi kepada wali murid tanpa harus datang langsung ke sekolah hanya untuk meminta lembar kuitansi fisik. Hak akses tetap aman terlindungi Anti-IDOR (hanya untuk siswa yang terhubung).
- **Status Keputusan:** `[ ] Pending`

---

### Q4. Format Terbilang Nominal Rupiah
- **Konteks:** Kuitansi konvensional di Indonesia umumnya memuat kalimat terbilang (misal: *"Empat Ratus Lima Puluh Ribu Rupiah"*) untuk memperkuat keabsahan nominal transaksi.
- **Pilihan Opsi:**
  - **Opsi A (Sertakan Terbilang):** Menampilkan nominal angka rupiah (`Rp 450.000`) disertai baris terbilang huruf di bawahnya.
  - **Opsi B (Hanya Format Angka Rupiah):** Hanya menampilkan format angka rupiah standar.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Standar baku tata kelola dokumen kuitansi formal di Indonesia untuk menghindari kesalahan tafsir atau manipulasi penambahan angka.
- **Status Keputusan:** `[ ] Pending`

---

### Q5. Informasi Pengesahan pada Kuitansi
- **Konteks:** Dokumen kuitansi cetak/PDF memerlukan elemen identitas resmi sekolah dan pihak yang bertanggung jawab atas transaksi.
- **Pilihan Opsi:**
  - **Opsi A (Lengkap dengan Petugas & Cap Stempel Digital):** Memuat Kop SDIT AT-TAQWIM, cap stempel digital "LUNAS", tanggal cetak, dan nama kasir pencatat atau petugas TU yang memverifikasi transaksi.
  - **Opsi B (Hanya Cap Tanpa Nama Petugas):** Hanya memuat cap sekolah tanpa mencantumkan nama petugas kasir.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Memenuhi prinsip akuntabilitas keuangan sekolah sehingga setiap lembar kuitansi jelas siapa petugas kasir atau verifikator yang memprosesnya.
- **Status Keputusan:** `[ ] Pending`
