# Riset: Tingkat Risiko Tunggakan & Template Pesan WhatsApp Dinamis

**Slug:** `risiko-tunggakan-dan-whatsapp` · **Tanggal:** 2026-11-19 · **Status:** Selesai Riset

---

## 1. Latar Belakang & Masalah

Pada dokumen PRD:
1. **Bagian 14 (FR-WA-001 s/d FR-WA-004):** Sistem mendukung Click-to-WhatsApp dengan template dinamis untuk tagihan baru, jatuh tempo, tunggakan bertingkat, dan menjelang ujian (*H-ujian*), dengan variabel dinamis seperti `{{nama_wali}}`, `{{nama_siswa}}`, `{{kelas}}`, `{{total_tunggakan}}`, `{{nama_ujian}}`, `{{deadline}}`.
2. **Bagian 25.3, 38, dan 39:** Laporan dan monitoring tunggakan mensyaratkan klasifikasi **Risk Level (Tingkat Risiko)** berdasarkan durasi dan jumlah bulan tunggakan SPP.

### Kondisi Saat Ini di Codebase:
- Di [server/app.ts](file:///c:/Users/Admin/Documents/AxoIndo/Client/SDIT-AT-TAQWIM/SourceCode/sistem-sdit-at-taqwim/server/app.ts#L631-L661), endpoint reminder `GET /api/students/:id/reminder?examId=...` hanya menghasilkan satu template statis kaku dan mewajibkan parameter `examId`. Jika tidak ada ujian aktif atau staf ingin mengirim penagihan bulanan rutin, endpoint menolak.
- Di [src/main.tsx](file:///c:/Users/Admin/Documents/AxoIndo/Client/SDIT-AT-TAQWIM/SourceCode/sistem-sdit-at-taqwim/src/main.tsx#L550-L565), tombol "WhatsApp" langsung membuka jendela baru tanpa pratinjau pesan atau opsi memilih template pesan.
- Di tabel Tunggakan ([/keuangan/tunggakan](file:///c:/Users/Admin/Documents/AxoIndo/Client/SDIT-AT-TAQWIM/SourceCode/sistem-sdit-at-taqwim/src/main.tsx#L630-L645)), siswa yang menunggak 1 bulan dan siswa yang menunggak >3 bulan ditampilkan serupa tanpa indikator visual urgensi/risiko (*Risk Indicator*).

---

## 2. Analisis Komponen Terkait

### A. Klasifikasi Tingkat Risiko (*Risk Level Engine*)
Dihitung secara deterministik berdasarkan jumlah invoice yang belum lunas (`unpaidMonths = debts.length`):
1. **Lancar / Normal (0 bulan):** Tidak ada tunggakan.
2. **Risiko Rendah (1 bulan):** Tunggakan baru berjalan bulan ini (indikator Hijau / Emerald).
3. **Risiko Sedang (2 bulan):** Menunggak 2 bulan berturut-turut (indikator Kuning / Oranye).
4. **Risiko Tinggi / Kritis (≥ 3 bulan):** Menunggak 3 bulan atau lebih; berisiko tinggi terhambat administrasi ujian (indikator Merah).

### B. Template WhatsApp Dinamis
Menyediakan pilihan template pesan penagihan yang kontekstual:
1. **Template Otomatis (Sesuai Tingkat Risiko):** Nada pesan otomatis menyesuaikan jumlah bulan tunggakan.
2. **Template Rutin / Ramah (1 Bulan):** Pengingat santun SPP bulan berjalan.
3. **Template Jatuh Tempo (2 Bulan):** Penegasan tunggakan 2 bulan dan permohonan penyelesaian.
4. **Template Kritis Kelayakan Ujian (≥3 Bulan):** Pemberitahuan batas waktu pelunasan sebelum ujian atau pengajuan dispensasi.
5. **Template Janji Bayar / Dispensasi:** Pengingat tanggal jatuh tempo komitmen pembayaran dispensasi.

### C. Antarmuka Interaktif (`WhatsAppReminderModal`)
- Modal pratinjau pesan WhatsApp sebelum dikirim ke nomor wali murid.
- Menampilkan profil wali, nomor telepon terformat (`628...`), tingkat risiko siswa, dan textarea pesan yang dapat diedit secara fleksibel oleh staf TU.
- Tombol aksi:
  - **"Buka WhatsApp"** (`https://wa.me/...`)
  - **"Salin Pesan"** (menyalin teks ke clipboard)

---

## 3. Pertanyaan Terbuka untuk Wawancara

1. **Aturan Klasifikasi Kategori Risiko:** Apakah batas 1 bulan = Rendah, 2 bulan = Sedang, dan ≥3 bulan = Tinggi sudah sesuai dengan kebijakan keuangan sekolah?
2. **Fleksibilitas Pengiriman Reminder Tanpa Ujian:** Apakah pengiriman reminder WhatsApp diizinkan berjalan saat periode ujian belum dipilih/dibuat (menggunakan batas tanggal jatuh tempo SPP tanggal 10)?
3. **Tampilan Indikator Risiko di Tabel:** Di mana letak badge indikator risiko ditampilkan (di samping nominal tunggakan atau kolom tersendiri di tabel Tunggakan)?
4. **Daftar Rincian Bulan Tunggakan pada Pesan WhatsApp:** Apakah pesan penagihan perlu menyebutkan daftar bulan yang belum dibayar (contoh: *Bulan: Juli 2026, Agustus 2026*)?
5. **Kemampuan Menyunting Pesan di Modal:** Apakah staf TU diberikan kebebasan untuk mengedit redaksi pesan di modal sebelum membuka WhatsApp?
