---
description: Rekam daftar revisi fitur sekolah yang sudah ada + wawancara sampai keputusan terkunci → docs/revisi/REV-NNN-[nama].md (tanpa kode)
argument-hint: daftar revisi bebas (boleh multi-baris)
---

# Revisi — Wawancara

Sebelum mengubah apa pun, samakan pemahaman dan kunci spesifikasi revisi ini.
Konvensi: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Tugas Agen

User memberikan permintaan perubahan untuk alur/layanan yang **sudah ada dan berjalan benar** (misalnya: penyesuaian alur verifikasi transfer, penambahan filter pada data siswa, format tampilan kartu ujian, atau teks template pengingat WA). Rekam daftar itu, lalu lakukan **wawancara terstruktur** sampai scope perubahannya tuntas dan jelas.

- **DILARANG** menulis kode atau memodifikasi file aplikasi — itu tugas `/revisi-terapkan`.
- Jika perilakunya ternyata rusak/bug → arahkan ke `/isu-diagnosa`.
- Jika berupa modul baru yang belum ada → arahkan ke rantai fitur (`/fitur-riset` / `/fitur-wawancara`).

## Output Dokumen (`docs/revisi/REV-NNN-[topik].md`)

1. Path: `docs/revisi/REV-NNN-[topik].md` — nomor = `REV-NNN` terbesar di `docs/revisi/` + 1 (mulai `REV-001`).
2. Struktur Dokumen:
   - Judul & metadata (`Status: usulan`, `Area: Master/Keuangan/Ujian/Lainnya`).
   - Latar belakang & alasan revisi.
   - Perilaku Saat Ini vs Perilaku yang Diinginkan (*Before vs After*).
   - Pertanyaan klarifikasi & rekomendasi terbaik agen.
   - Acceptance criteria / Definition of Done.
3. Sajikan ringkasan di chat beserta rekomendasi dan petunjuk: *"Balas 'Setujui REV-NNN' untuk menerapkan perubahan via /revisi-terapkan"*.
