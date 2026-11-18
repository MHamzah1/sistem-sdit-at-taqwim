---
name: fitur-spesifikasi
description: >-
  Fitur 3/4 — keputusan wawancara → spesifikasi final docs/fitur/[slug]/3-spesifikasi.md Gunakan setelah wawancara fitur untuk menyusun dokumen spesifikasi final 3-spesifikasi.md.
---

# Fitur — Spesifikasi

Ubah hasil wawancara jadi **dokumen tujuan**: ke mana kita pergi, bukan cara sampai ke sana (itu
`/fitur-pecah-tugas`). Konvensi: `.agents/rules/alur-kerja.md`.

Input user:

$ARGUMENTS

## Langkah

1. Baca `docs/fitur/[slug]/2-wawancara.md` — **sumber keputusan yang kanonik**; chat hanya pelengkap.
   Belum ada → arahkan user ke `/fitur-wawancara` dulu. Baca juga `1-riset.md` bila ada.
2. Periksa chat hanya untuk celah yang belum tercatat di doc wawancara.
3. Masih ada yang kritis dan ambigu → tanya **SATU** pertanyaan sebelum lanjut. Jangan berasumsi.
4. Telusuri codebase untuk modul yang akan tersentuh.
5. Tulis `docs/fitur/[slug]/3-spesifikasi.md` dengan struktur di bawah.

## Struktur

```markdown
# Spesifikasi: [Nama Fitur]

**Slug:** [slug] · **Dibuat:** [YYYY-MM-DD] · **Sumber keputusan:** [2-wawancara.md](2-wawancara.md)

## Masalah
Masalah apa, siapa yang mengalaminya — rujuk kondisi nyata.

## Tujuan
1–2 kalimat: sukses itu seperti apa.

## Latar Belakang
Konteks yang dibutuhkan pembaca: perilaku existing, kenapa sekarang.

## Definition of Done
- [ ] checklist; semua tercentang = siap rilis

## Scope
## Di Luar Scope
Minimal 2–3 poin.

## Pengguna & User Story
- Sebagai [role], saya ingin [aksi] supaya [hasil]   ← diberi nomor US-1, US-2, …

## Kebutuhan Fungsional
Bernomor (KF-1, KF-2, …), dikelompokkan (UI, API, Data, Otorisasi).

## Kebutuhan Non-Fungsional
Performa, keamanan, kompatibilitas.

## Keputusan Terkunci
Bernomor, dari Log Keputusan wawancara. Tidak dibuka lagi.

## Kesiapan Data
Tabel/kolom/seed baru yang dibutuhkan, atau "tidak ada". Masing-masing nanti jadi DAT lewat `/data-periksa`.

## Pertanyaan Terbuka
Yang belum terjawab; tandai **[memblokir]** yang menghalangi pemecahan tugas.

## Modul yang Diubah
Path nyata; file baru ditandai `BARU`. Per modul: apa yang berubah.

## Risiko
## Ukuran Keberhasilan
Bagaimana mengukur bahwa ini berhasil di production.
```

## Aturan

- Jangan melewatkan bagian — tulis `N/A` bila benar-benar tidak berlaku.
- Jangan pad — tiap kalimat membawa informasi.
- Modul = path nyata, bukan deskripsi kabur.
- Definition of Done bisa dicek manusia < 5 menit.
- Nomor US-/KF- dipakai `/fitur-pecah-tugas` untuk menautkan tugas — jangan diubah urutannya setelah tugas dibuat.
- Setelah menulis, jangan tanya "mulai implementasi?" — tawarkan `/fitur-pecah-tugas [slug]` satu baris,
  lalu tunggu instruksi.
