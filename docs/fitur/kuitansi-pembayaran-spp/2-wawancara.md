# Wawancara Keputusan Fitur: Cetak Kuitansi Pembayaran SPP

- **Slug:** `kuitansi-pembayaran-spp`
- **Objek:** Fitur
- **Dokumen:** 2-wawancara.md (Tahap 2/4)
- **Status:** Keputusan Terkunci — Siap untuk Spesifikasi
- **Tanggal:** 19 November 2026
- **Referensi Riset:** `docs/fitur/kuitansi-pembayaran-spp/1-riset.md`

---

## Log Keputusan Terkunci

### Q1. Format Nomor Registrasi Kuitansi
- **Pilihan:** **Opsi A (Deterministik Berbasis Tanggal & Prefix)**
- **Keputusan:** Penomoran kuitansi menggunakan format deterministik `KW-YYYYMMDD-[6 karakter unik ID pembayaran]` (contoh: `KW-20261118-A7B2C1`). Bebas dari *race condition*, tidak membutuhkan tabel sequence baru, dan 100% unik serta mudah ditelusuri.
- **Status Keputusan:** `[x] Terkunci`

---

### Q2. Batasan Status Pembayaran yang Berhak Mendapat Kuitansi
- **Pilihan:** **Opsi A (Hanya Transaksi Sah Lunas / APPROVED)**
- **Keputusan:** Kuitansi resmi HANYA dapat diterbitkan dan dicetak untuk transaksi pembayaran yang berstatus `APPROVED` (baik pembayaran tunai kasir maupun transfer yang telah disetujui TU). Transaksi berstatus `PENDING_VERIFICATION` atau `REJECTED` tidak memiliki akses cetak kuitansi.
- **Status Keputusan:** `[x] Terkunci`

---

### Q3. Hak Akses Pencetakan Kuitansi oleh Wali Murid
- **Pilihan:** **Opsi A (Staf Sekolah & Wali Murid Mandiri)**
- **Keputusan:** Kuitansi dapat diakses dan dicetak oleh Staf Sekolah (Super Admin, TU, Kepsek) melalui menu Pembayaran, DAN dapat diakses/diunduh secara mandiri oleh Wali Murid dari Portal Wali Murid (terproteksi Anti-IDOR, hanya untuk anak kandung yang terhubung).
- **Status Keputusan:** `[x] Terkunci`

---

### Q4. Format Terbilang Nominal Rupiah
- **Pilihan:** **Opsi A (Menyertakan Kalimat Terbilang Rupiah)**
- **Keputusan:** Dokumen kuitansi wajib memuat nominal angka Rupiah (`Rp 450.000`) dan disertai kalimat terbilang bahasa Indonesia di bawahnya (contoh: *"Empat Ratus Lima Puluh Ribu Rupiah"*) sesuai standar akuntansi kuitansi resmi.
- **Status Keputusan:** `[x] Terkunci`

---

### Q5. Informasi Pengesahan pada Kuitansi
- **Pilihan:** **Opsi A (Lengkap dengan Petugas & Cap Stempel Digital)**
- **Keputusan:** Kuitansi memuat Kop resmi SDIT AT-TAQWIM, cap stempel digital "LUNAS", tanggal cetak, dan nama kasir pencatat atau petugas TU yang memverifikasi transaksi untuk menjaga akuntabilitas keuangan sekolah.
- **Status Keputusan:** `[x] Terkunci`
