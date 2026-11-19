# Wawancara Keputusan Fitur: Format Nomor Peserta Ujian & Cetak Massal Kartu Ujian

- **Slug:** `nomor-peserta-dan-cetak-massal-kartu`
- **Objek:** Fitur
- **Dokumen:** 2-wawancara.md (Tahap 2/4)
- **Status:** Keputusan Terkunci — Siap untuk Spesifikasi
- **Tanggal:** 19 November 2026
- **Referensi Riset:** `docs/fitur/nomor-peserta-dan-cetak-massal-kartu/1-riset.md`

---

## Log Keputusan Terkunci

### Q1. Format Standar Nomor Peserta Ujian
- **Pilihan:** **Opsi A (Format Standar PRD)**
- **Keputusan:** Format nomor peserta mengikuti pola `[Singkatan Ujian][2 Digit Tahun]-[Nama Kelas]-[Nomor Urut 3 Digit]` (contoh: `PTS26-1A-001`, `PAS26-3A-012`). Sesuai standar PRD Bagian 18 FR-CARD-003.
- **Status Keputusan:** `[x] Terkunci`

---

### Q2. Dasar Penentuan Urutan Nomor Peserta dalam Kelas
- **Pilihan:** **Opsi A (Urutan Abjad Nama Siswa)**
- **Keputusan:** Urutan nomor peserta 3 digit (001, 002, dst.) didasarkan pada urutan alfabetis (A–Z) nama siswa di kelas terkait agar selaras dengan buku daftar hadir/presensi pengawas ujian.
- **Status Keputusan:** `[x] Terkunci`

---

### Q3. Pendekatan Penyimpanan Nomor Peserta
- **Pilihan:** **Opsi A (Deterministik Runtime Tanpa Migrasi)**
- **Keputusan:** Nomor peserta dihitung secara deterministik oleh fungsi helper sistem tanpa menambah kolom baru di tabel `exam_cards`, menjaga arsitektur tetap ramping (*lean*), stabil, dan zero migrasi database.
- **Status Keputusan:** `[x] Terkunci`

---

### Q4. Tata Letak Lembar Cetak Massal Kartu Ujian
- **Pilihan:** **Opsi A (2 Kartu per Halaman A4)**
- **Keputusan:** Lembar cetak massal memuat 2 kartu ujian per lembar kertas A4 (format landscape/portrait berspasi) dengan garis pembatas potong (*cut lines*), ukuran kartu proporsional untuk plastik name tag B2/B3, serta kode QR yang jelas dipindai kamera.
- **Status Keputusan:** `[x] Terkunci`

---

### Q5. Penanganan Siswa yang Belum Layak saat Cetak Massal
- **Pilihan:** **Opsi A (Hanya Cetak Siswa Layak)**
- **Keputusan:** Sistem secara otomatis memfilter dan hanya mencetak kartu bagi siswa yang berstatus Layak (`ELIGIBLE` atau `ELIGIBLE_DISPENSATION`). Siswa yang belum layak/menunggak tanpa dispensasi dilewati dan sistem menampilkan ringkasan jumlah kartu yang berhasil dicetak vs yang tertahan.
- **Status Keputusan:** `[x] Terkunci`
