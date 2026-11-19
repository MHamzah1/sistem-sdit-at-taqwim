# Development Report: TGS-009 - Badge Risiko Tabel & Modal WhatsApp Interaktif

**Tanggal:** 2026-11-19 16:16 WIB  
**Tiket:** TGS-009  
**Fitur:** `risiko-tunggakan-dan-whatsapp`  
**Status:** Selesai  

---

## 1. Ringkasan Perubahan

1. **Badge Risiko Visual pada Kolom Tunggakan (`src/main.tsx` & `src/production.css`):**
   - Mengintegrasikan `calculateArrearsRisk(debts(s.id).length)` ke kolom "Tunggakan" di `studentTable`.
   - Menampilkan badge semantik:
     - `Lancar` (`.risk-none`): 0 bulan menunggak.
     - `Risiko Rendah` (`.risk-low`): 1 bulan menunggak (Emerald/Teal).
     - `Risiko Sedang` (`.risk-medium`): 2 bulan menunggak (Kuning/Oranye).
     - `Risiko Tinggi` (`.risk-high`): ≥3 bulan menunggak (Merah/Kritis).
   - Muncul otomatis di halaman Master Siswa, Tunggakan & Reminder (`/keuangan/tunggakan`), dan Dashboard Utama.

2. **Komponen Interaktif `WhatsAppReminderModal` (`src/main.tsx`):**
   - Membuka modal pratinjau penagihan secara interaktif saat tombol "WhatsApp" diklik (menggantikan `window.open` mendadak yang rawan popup blocker).
   - Menampilkan ringkasan data siswa, kelas, nama wali, nomor WhatsApp, total tunggakan, badge tingkat risiko, dan rincian nama bulan tertunggak (misal: "Juli 2026, Agustus 2026").
   - Dropdown selektor template pesan dengan 5 opsi:
     - Otomatis (sesuai tingkat risiko)
     - Pengingat Rutin SPP (1 Bulan)
     - Peringatan Jatuh Tempo (2 Bulan)
     - Peringatan Kritis Kelayakan Ujian (≥3 Bulan)
     - Pengingat Janji Bayar Dispensasi
   - Live editor textarea memungkinkan staf TU memodifikasi redaksi pesan secara bebas sebelum dikirim.
   - Tombol "Salin Pesan" memanfaatkan Clipboard API dengan indikator visual `Tersalin ke Clipboard!`.
   - Tombol "Buka WhatsApp" mengarahkan langsung ke `https://wa.me/{phone}?text={encodedMessage}` pada tab baru.

3. **Styling CSS Terstruktur (`src/production.css`):**
   - Menambahkan gaya visual untuk `.arrears-cell`, `.arrears-amount`, `.risk-badge`, `.risk-none`, `.risk-low`, `.risk-medium`, `.risk-high`.
   - Menambahkan gaya modal penagihan WhatsApp: `.wa-modal-body`, `.wa-meta-box`, `.wa-meta-item`, `.wa-meta-label`, `.wa-meta-val`, `.wa-form-group`, `.wa-template-select`, `.wa-message-textarea`, `.wa-actions-row`, `.btn-wa-copy`, `.btn-wa-send`.

---

## 2. Hasil Verifikasi Resmi

- **TypeScript Typecheck (`npm run typecheck`):** LULUS (0 error).
- **Test Suite (`npm test`):** 23 dari 23 test lulus (100%).
- **Next.js Production Build (`npm run build`):** LULUS tanpa kendala menggunakan Turbopack compiler.
