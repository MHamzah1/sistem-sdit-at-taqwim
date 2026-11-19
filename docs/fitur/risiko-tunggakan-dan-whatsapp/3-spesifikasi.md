# Spesifikasi: Tingkat Risiko Tunggakan (Risk Level) & Template Pesan WhatsApp Dinamis

**Slug:** `risiko-tunggakan-dan-whatsapp` · **Dibuat:** 2026-11-19 · **Sumber keputusan:** [2-wawancara.md](2-wawancara.md)

---

## Masalah

1. **Ketiadaan Indikator Risiko pada Pemantauan Tunggakan:** Di halaman Tunggakan & Reminder (`/keuangan/tunggakan`), siswa yang menunggak 1 bulan dan siswa yang menunggak 4 bulan disajikan setara tanpa klasifikasi urgensi visual. Hal ini menyulitkan staf TU dan Kepala Sekolah untuk memprioritaskan tindakan penagihan intensif menjelang ujian.
2. **Keterbatasan Fleksibilitas Reminder WhatsApp:** Endpoint penagihan saat ini mewajibkan parameter `examId`. Jika tidak ada periode ujian yang aktif, penagihan bulanan rutin ditolak oleh sistem. Selain itu, staf TU tidak dapat memilih template pesan yang sesuai (rutin vs kritis) dan tidak memiliki pratinjau pesan (*modal preview*) sebelum membuka tautan `wa.me`.

---

## Tujuan

1. Menyediakan kalkulator klasifikasi **Tingkat Risiko Tunggakan** (*Risk Level Engine*) otomatis:
   - **Risiko Rendah (1 Bulan):** Hijau / Emerald
   - **Risiko Sedang (2 Bulan):** Kuning / Oranye
   - **Risiko Tinggi / Kritis (≥3 Bulan):** Merah
2. Menampilkan badge indikator tingkat risiko pada kolom Tunggakan di seluruh tabel antarmuka.
3. Menyediakan modal interaktif **`WhatsAppReminderModal`** dengan pratinjau pesan langsung, pemilihan template dinamis (Rutin, Jatuh Tempo, Kritis Ujian, Janji Bayar), perincian daftar nama bulan yang menunggak, editor teks pesan, serta tombol *Salin Pesan* dan *Buka WhatsApp*.
4. Memperbarui endpoint reminder di server agar fleksibel mendukung pengiriman pesan dengan atau tanpa periode ujian.

---

## Latar Belakang

Berdasarkan PRD Bagian 14 (FR-WA-001 s/d FR-WA-004), Bagian 25.3, dan Bagian 38, sistem SDIT AT-TAQWIM dirancang untuk mempercepat penurunan tunggakan SPP melalui transparansi dan penagihan terstruktur. Klasifikasi tingkat risiko dan komunikasi WhatsApp yang fleksibel serta beretika merupakan kunci utama keberhasilan operasional penagihan sekolah.

---

## Definition of Done

- [ ] Fungsi helper `calculateArrearsRisk(debtsCount)` tersedia di `src/data.ts` menghasilkan tingkat risiko (`LOW`, `MEDIUM`, `HIGH`) dan label/warna semantik.
- [ ] Badge tingkat risiko (`RiskBadge`) tampil di tabel tunggakan dan dashboard sekolah.
- [ ] Endpoint `GET /api/students/:id/reminder` di `server/app.ts` dapat dipanggil dengan atau tanpa `examId`, serta menerima opsi parameter `template` dan menghasilkan pesan terstruktur lengkap dengan rincian bulan tunggakan.
- [ ] Tersedia komponen modal `WhatsAppReminderModal` di `src/main.tsx` yang menampilkan profil wali, nomor WhatsApp, badge risiko, pilihan 4 template penagihan, kotak penyunting pesan, tombol salin teks, dan tombol buka WhatsApp.
- [ ] Gaya visual badge risiko dan modal WhatsApp diatur rapi di `src/production.css`.
- [ ] Seluruh unit/integration test suite (`npm test`), typecheck (`npm run typecheck`), dan build produksi Next.js lulus 100%.

---

## Scope

1. **Helper Logika Bisnis & Data (`src/data.ts`):**
   - Fungsi `calculateArrearsRisk(unpaidMonths: number): { level: 'LOW' | 'MEDIUM' | 'HIGH'; label: string; color: string }`.
   - Generator template pesan WhatsApp dinamis `generateReminderMessage(...)` dengan dukungan variabel dinamis: nama wali, nama siswa, kelas, nominal, daftar bulan menunggak, nama ujian, dan tenggat waktu.
2. **Backend Endpoint (`server/app.ts`):**
   - Pembaruan handler `GET /api/students/:id/reminder` agar parameter `examId` bersifat opsional (fallback ke tanggal jatuh tempo SPP bulanan).
   - Pengembalian data terstruktur: `{ message: string, url: string, phone: string, guardianName: string, studentName: string, riskLevel: string, unpaidMonths: number, totalAmount: number }`.
3. **Komponen Antarmuka Pengguna (`src/main.tsx`):**
   - Integrasi badge indikator risiko pada kolom tunggakan di `studentTable`.
   - Komponen `WhatsAppReminderModal` untuk pemilihan template, penyuntingan pesan, dan eksekusi pengiriman.
4. **Styling CSS (`src/production.css`):**
   - Gaya badge risiko `.risk-badge-low`, `.risk-badge-medium`, `.risk-badge-high`.
   - Gaya modal penagihan WhatsApp `.wa-preview-box`.

---

## Di Luar Scope

1. Integrasi otomatis ke WhatsApp Business Cloud API berbayar (tetap menggunakan standar PRD FR-WA-001: Click-to-WhatsApp / WhatsApp Web / Desktop).
2. Bot penjawab WhatsApp otomatis (*chat-bot AI*).

---

## Pengguna & User Story

- **US-1 (Staf Keuangan / TU):** Sebagai staf keuangan sekolah, saya ingin melihat dengan jelas siswa mana yang menunggak kritis (≥ 3 bulan) dan mengirimkan pesan penagihan yang tegas menjelang ujian tanpa harus mengetik manual dari nol.
- **US-2 (Staf TU):** Sebagai staf TU, saya ingin dapat mengirimkan pengingat SPP bulanan rutin yang ramah kepada wali murid yang baru menunggak 1 bulan tanpa harus menunggu ada jadwal ujian.
- **US-3 (Wali Murid):** Sebagai wali murid, saya ingin menerima pesan WhatsApp yang transparan merinci bulan apa saja yang belum saya bayar dan batas waktu pelunasannya.

---

## Kebutuhan Fungsional

### UI (Antarmuka)
- **KF-1:** Kolom tunggakan di tabel siswa menampilkan badge tingkat risiko:
  - 1 Bulan: `Risiko Rendah` (Hijau/Teal)
  - 2 Bulan: `Risiko Sedang` (Kuning/Oranye)
  - ≥ 3 Bulan: `Risiko Tinggi (Kritis)` (Merah)
- **KF-2:** Tombol "WhatsApp" membuka modal `WhatsAppReminderModal`.
- **KF-3:** Modal menyediakan 4 pilihan template:
  1. *Otomatis (Sesuai Tingkat Risiko)*
  2. *Pengingat Rutin SPP (1 Bulan)*
  3. *Peringatan Jatuh Tempo (2 Bulan)*
  4. *Peringatan Kritis Kelayakan Ujian (≥3 Bulan)*
  5. *Pengingat Janji Bayar Dispensasi*
- **KF-4:** Redaksi pesan di modal dapat disunting secara bebas sebelum dikirim.
- **KF-5:** Tersedia tombol *"Salin Teks"* untuk kemudahan paste manual dan tombol *"Buka WhatsApp"* untuk membuka link `https://wa.me/...`.

### API & Logika Bisnis
- **KF-6:** Endpoint `GET /api/students/:id/reminder` mendukung query param `examId` (opsional) dan `templateKey` (opsional).
- **KF-7:** Jika `examId` tidak disertakan, sistem menggunakan batas jatuh tempo bulanan SPP (tanggal 10).
- **KF-8:** Redaksi pesan WhatsApp secara otomatis merinci nama-nama bulan yang belum dibayar.

---

## Kebutuhan Non-Fungsional

- **KNF-1 (Normalisasi Kontak):** Nomor telepon wali dinormalisasi secara otomatis ke standar internasional Indonesia (`628...`) tanpa spasi atau tanda hubung.
- **KNF-2 (Audit Trail):** Setiap pembuatan/pengambilan pesan reminder dicatat ke tabel `audit_logs` dengan aksi `WHATSAPP_REMINDER_GENERATED`.

---

## Keputusan Terkunci

1. **KT-1 (Batas Risiko):** 1 bulan = Rendah, 2 bulan = Sedang, ≥3 bulan = Tinggi.
2. **KT-2 (Reminder Tanpa Ujian):** Diizinkan kapan saja (menggunakan tanggal jatuh tempo SPP bulanan).
3. **KT-3 (Template Dinamis):** 4 template siap pakai dengan seleksi otomatis berbasis risiko.
4. **KT-4 (Detail Bulan):** Pesan mencantumkan nama bulan tunggakan secara rinci.
5. **KT-5 (Modal Interaktif):** Pengiriman melalui modal pratinjau dan editor pesan interaktif.

---

## Kesiapan Data

- Tidak memerlukan migrasi tabel baru di PostgreSQL (`DAT-NNN` tidak diperlukan). Dihitung dari relasi tabel `invoices`, `spp_configs`, `students`, `guardians`, dan `dispensations` yang sudah ada.

---

## Pertanyaan Terbuka

- Tidak ada pertanyaan terbuka yang memblokir.

---

## Modul yang Diubah

1. `src/data.ts`: Penambahan helper `calculateArrearsRisk()` dan template pesan WhatsApp.
2. `server/app.ts`: Peningkatan endpoint `GET /api/students/:id/reminder`.
3. `src/main.tsx`: Integrasi `RiskBadge` pada tabel tunggakan dan komponen `WhatsAppReminderModal`.
4. `src/production.css`: Gaya visual badge tingkat risiko dan modal reminder WhatsApp.
5. `tests/business.test.ts`: Uji kalkulator risiko tunggakan dan endpoint reminder fleksibel.

---

## Risiko & Mitigasi

- **Risiko:** Blokir popup browser saat membuka tab WhatsApp baru.  
  *Mitigasi:* Tombol "Buka WhatsApp" dipicu langsung oleh interaksi klik pengguna (*user click event*), disertai opsi tombol "Salin Pesan" sebagai alternatif cadangan.

---

## Ukuran Keberhasilan

1. Staf TU dapat melihat prioritas penagihan langsung dari badge tingkat risiko di tabel.
2. Staf TU dapat mengirim pengingat penagihan rutin bulanan maupun peringatan ujian dengan satu klik WhatsApp.
3. Seluruh unit/integration test suite (`npm test`) dan build produksi Next.js tetap 100% lulus.
