# Wawancara Keputusan: Tingkat Risiko Tunggakan & Template Pesan WhatsApp Dinamis

**Slug:** `risiko-tunggakan-dan-whatsapp` · **Tanggal:** 2026-11-19 · **Status:** `[x] Seluruh Keputusan Terkunci`

---

## Daftar Pertanyaan Keputusan & Rekomendasi Terbaik

### Q1. Batas Kategori Tingkat Risiko Tunggakan (*Risk Level*)
- **Konteks:** Sekolah membutuhkan indikator visual yang jelas untuk memprioritaskan penagihan siswa menunggak.
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Berdasarkan jumlah bulan tagihan yang belum lunas:
    - **Risiko Rendah (Hijau/Teal):** 1 bulan tunggakan (tunggakan baru berjalan).
    - **Risiko Sedang (Kuning/Oranye):** 2 bulan tunggakan.
    - **Risiko Tinggi / Kritis (Merah):** ≥ 3 bulan tunggakan (prioritas penanganan intensif sebelum ujian).
  - **Opsi B:** Berdasarkan total nominal uang tunggakan (kurang relevan karena SPP antartingkat bisa berbeda).
- **💡 Rekomendasi Terbaik:** **Opsi A** — Standar administrasi sekolah yang paling adil, objektif, dan langsung berkorelasi dengan syarat kelayakan ujian 3-syarat.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

### Q2. Fleksibilitas Pengiriman Reminder WhatsApp di Luar Masa Ujian
- **Konteks:** Saat ini endpoint reminder menolak jika `examId` tidak disertakan, padahal penagihan SPP berjalan setiap bulan (tanggal 10).
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Reminder WhatsApp dapat dikirim kapan saja. Jika periode ujian dipilih, pesan memuat batas deadline ujian; jika tidak ada ujian yang dipilih, pesan otomatis menggunakan batas jatuh tempo bulanan SPP (tanggal 10 bulan berjalan).
  - **Opsi B:** Hanya mengizinkan pengiriman pesan saat ada periode ujian aktif.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Memungkinkan staf TU melakukan follow-up rutin setiap bulan tanpa harus menunggu jadwal ujian dibuat.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

### Q3. Variasi Template Pesan WhatsApp Penagihan
- **Konteks:** Nada penagihan untuk wali yang baru telat 1 bulan harus bernada santun dan bersahabat, sedangkan untuk yang sudah menunggak 3 bulan harus menegaskan konsekuensi administrasi ujian.
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Menyediakan 4 template siap pakai:
    1. *Pengingat Rutin SPP* (1 Bulan, nada persuasif santun)
    2. *Peringatan Jatuh Tempo* (2 Bulan, penegasan kewajiban)
    3. *Peringatan Kritis Kelayakan Ujian* (≥3 Bulan, penegasan syarat ujian & opsi dispensasi)
    4. *Pengingat Janji Bayar Dispensasi* (untuk siswa yang memiliki dispensasi aktif)  
    Sistem secara otomatis memilih template default sesuai tingkat risiko siswa, namun staf TU tetap bisa mengganti pilihan template di modal.
  - **Opsi B:** Hanya satu template statis seragam untuk semua kondisi.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Meningkatkan etika komunikasi sekolah dengan wali murid dan meningkatkan tingkat respons pembayaran.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

### Q4. Pencantuman Rincian Bulan Tunggakan di Redaksi Pesan
- **Konteks:** Wali murid sering bertanya balik: *"Ini tunggakan bulan apa saja ya pak/bu?"*.
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Redaksi pesan WhatsApp secara otomatis merinci daftar bulan yang belum dibayar (contoh: *"tunggakan 2 bulan (Juli 2026, Agustus 2026) sebesar Rp700.000"*).
  - **Opsi B:** Hanya mencantumkan total nominal tanpa menyebutkan nama-nama bulannya.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Memberikan transparansi penuh sehingga wali murid langsung paham tanpa perlu konfirmasi manual berulang kali ke TU.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

### Q5. Alur Antarmuka Pengiriman: Modal Interaktif vs Langsung Redirect
- **Konteks:** Staf TU terkadang ingin menambahkan catatan personal sebelum membuka WhatsApp (misal: nama panggilan wali atau instruksi transfer khusus).
- **Pilihan Opsi:**
  - **Opsi A (Direkomendasikan):** Tombol "WhatsApp" membuka modal `WhatsAppReminderModal` yang menyajikan ringkasan profil wali, nomor WA, badge tingkat risiko, pemilih template, textarea pesan yang bisa disunting, tombol *"Salin Pesan"*, dan tombol *"Buka WhatsApp"* (`https://wa.me/...`).
  - **Opsi B:** Langsung redirect ke tab WhatsApp baru tanpa pratinjau pesan.
- **💡 Rekomendasi Terbaik:** **Opsi A** — Sangat user-friendly, menghindari salah kirim, dan memberi kendali penuh kepada staf sekolah.
- **Status Keputusan:** `[x] Disetujui (Opsi A)`

---

## Panduan Fast-Track Approval

Jika setuju dengan seluruh rekomendasi terbaik (Opsi A pada Q1 s/d Q5), cukup balas:
> **"Setuju semua rekomendasi"**
