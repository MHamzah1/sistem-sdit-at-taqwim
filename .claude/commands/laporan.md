---
name: laporan
description: Tutup objek aktif — laporan .development-history/YYYY-MM-DD-HH-mm-[id]-[judul].md, status selesai, hapus _ACTIVE-TASK.md, dan tawarkan pengerjaan sisa tugas sekaligus
argument-hint: (kosong = objek di _ACTIVE-TASK.md) atau TGS-NNN / ISU-NNN / REV-NNN / DAT-NNN
---

# Laporan

Langkah terakhir setiap objek untuk mendokumentasikan hasil kerja dan menutup tiket.
Konvensi: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Gerbang

- TGS/ISU/REV: vonis `/verifikasi` di `_ACTIVE-TASK.md` harus ada. **LULUS** → objek ditutup `selesai`.
  **SEBAGIAN/GAGAL** → laporan tetap boleh ditulis, judulnya diberi `(sebagian)`, status objek tetap
  `berjalan` atau `terblokir` — tidak pernah `selesai`.
- DAT: bagian Hasil di file DAT terisi lewat `/data-jalankan DAT-NNN` dan semuanya cocok.

## Langkah

1. **Kumpulkan:** `_ACTIVE-TASK.md`, file objek, `git status` + `git diff --stat`.
2. **Waktu WIB:** Tanggal dan jam saat ini.
3. **Tulis** `.development-history/YYYY-MM-DD-HH-mm-[id]-[judul].md` dalam bahasa Inggris:
   - Task summary
   - Relevant previous context
   - Changes made
   - Files affected
   - Technical decisions
   - Verification performed (bukti npm test, typecheck, dan build riil)
   - Final result & Known limitations
4. **Tutup status:** file objek → `selesai` (+ Riwayat Status dengan link ke laporan).
   Perbarui kolom Status di `4-urutan-tugas.md` menjadi `selesai`.
5. **Hapus `_ACTIVE-TASK.md`** (hanya bila objeknya `selesai`).
6. **Penanganan Tugas Berikutnya (Rantai Batch vs Penawaran Semua Sekaligus):**
   - Buka `4-urutan-tugas.md` fitur terkait.
   - Hitung tugas tersisa yang siap dikerjakan.
   - **Jika dalam Mode Batch (user sebelumnya meminta 'kerjakan semua'):**
     - DILARANG berhenti dan DILARANG bertanya di chat!
     - **LANGSUNG PANGGIL `/tugas-kerjakan [TGS-BERIKUTNYA]`** secara berantai hingga seluruh tugas tuntas.
   - **Jika dalam Mode Manual:**
     - Tampilkan link laporan dan status selesai.
     - **WAJIB memberikan penawaran pengerjaan seluruh sisa tugas sekaligus** agar tidak bertanya lagi:
       ```markdown
       ✅ [TGS-001] Selesai diverifikasi dan dilaporkan.
       Tersisa [N] tugas berikutnya: TGS-002, TGS-003.

       👉 **Pilihan Lanjutan:**
       1. **Langsung Kerjakan Seluruh Sisa Tugas Sekaligus (Direkomendasikan - Tanpa Tanya Berulang):**
          > Cukup balas: **"Lanjut kerjakan semua tugas"**
          *(Agen akan menyelesaikan TGS-002 -> TGS-003 berurutan sampai tuntas tanpa berhenti bertanya).*
       2. **Kerjakan Satu per Satu:**
          > Balas: **"Lanjut TGS-002 dulu"**
       ```

## Batas

- Tidak commit kecuali user minta.
