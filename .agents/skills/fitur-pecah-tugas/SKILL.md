---
name: fitur-pecah-tugas
description: >-
  Fitur 4/4 — spesifikasi → tugas TGS-NNN (vertical slice) + urutan dependency, status usulan Gunakan setelah spesifikasi fitur selesai untuk memecah fitur menjadi tugas-tugas vertical slice TGS-NNN.
---

# Fitur — Pecah Tugas

Pecah spesifikasi jadi **tugas** (`TGS-NNN`) yang masing-masing bisa dikerjakan satu developer/agent
tanpa menunggu yang lain, kecuali ada dependency eksplisit. Konvensi: `.agents/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

## Langkah

1. Baca `docs/fitur/[slug]/3-spesifikasi.md`. Belum ada → arahkan ke `/fitur-spesifikasi`. Ada
   Pertanyaan Terbuka **[memblokir]** → berhenti, sebutkan, jangan memecah.
2. Telusuri struktur modul yang disebut di spesifikasi.
3. Tentukan nomor: `TGS-NNN` terbesar di `docs/fitur/*/tugas/` + 1, berurutan.
4. Susun draf tugas (aturan vertical slice di bawah). Pemecahannya meragukan → tanya **SATU** pertanyaan.
5. Tulis tiap tugas ke `docs/fitur/[slug]/tugas/TGS-NNN-[nama].md`, status `usulan`.
6. Tulis `docs/fitur/[slug]/4-urutan-tugas.md`.
7. **Balas di chat:** Tampilkan tabel urutan tugas dan **WAJIB memberikan penawaran pengerjaan sekaligus (Batch)** agar tidak bertanya satu per satu di setiap tiket.

### Format Penawaran Pengerjaan di Chat:
```markdown
Berikut daftar tugas yang telah disusun.

| ID | Judul Tugas | Status |
|---|---|---|
| TGS-027 | ... | usulan |
| TGS-028 | ... | usulan |
| TGS-029 | ... | usulan |

---
💡 **Pilihan Pengerjaan Tugas:**
1. **Langsung Kerjakan Seluruh Tugas Sekaligus (Direkomendasikan - Tanpa Tanya Berulang):**
   > Cukup balas: **"Setujui dan kerjakan semua tugas sekaligus"**
   *(Agen akan mengeksekusi TGS-027 -> TGS-028 -> TGS-029 berurutan hingga tuntas tanpa bolak-balik meminta izin).*
2. **Kerjakan Satu per Satu:**
   > Balas: **"Setujui dan kerjakan TGS-027 dulu"**
```

## Vertical Slice

Satu tugas memotong **semua lapisan** untuk satu fungsi yang terlihat user.

✅ Menyentuh skema/data + service + API + UI secukupnya; ujungnya bisa dibuka di browser atau dipanggil
lewat endpoint; bisa dicek manusia tersendiri.
❌ "Semua migrasi dulu", "semua endpoint dulu baru UI", tugas yang tidak menghasilkan apa pun yang
terlihat sampai tugas ketiga.

**Uji:** di akhir tugas, bisakah seseorang membuka browser (atau memanggil endpoint) dan memastikan
sesuatu berjalan ujung ke ujung? Tidak → terlalu horizontal, pecah ulang.

- Ukuran: setengah hari s/d 2 hari kerja fokus. Terlalu besar → pecah; jangan digabung demi sedikit tugas.
- **Tugas pertama selalu tracer bullet** — irisan tipis menembus semua lapisan.
- Tugas yang butuh tabel/kolom/seed/perbaikan data: isi bagian **Migrasi Data** — apa yang dimigrasikan,
  script (`server/scripts/…`, sudah ada atau ditulis tugas ini), kelas operasi. Menyetujui tugas =
  menyetujui migrasi *tambah*/*ubah* yang tertulis di sini; agent menjalankannya saat tugas dikerjakan
  (`/data-periksa` → `DAT-NNN` → `/data-jalankan`). ⚠️ *hapus massal* tetap butuh persetujuan DAT terpisah.

## Template Tugas

```markdown
# TGS-014: [Judul singkat]

**Status:** usulan · **Fitur:** [slug] · **Jenis:** Mandiri | Perlu keputusan
**Bergantung pada:** TGS-013 (alasan) — atau "tidak ada"
**Kesiapan data:** tidak perlu | perlu migrasi — lihat Migrasi Data

## Tujuan
Satu kalimat: apa yang dihasilkan tugas ini.

## Migrasi Data
Tidak ada — atau, per migrasi (dijalankan agent ke DB dev lewat DAT saat tugas dikerjakan):

| # | Yang dimigrasikan | Script / perintah | Kelas | Juga di production |
|---|---|---|---|---|
| 1 | tabel/kolom/seed apa, untuk apa | `server/scripts/….ts` (ada / ditulis tugas ini) | tambah \| ubah \| ⚠️ hapus massal | ya / tidak |

## Cakupan Spesifikasi
US-/KF- dari 3-spesifikasi.md yang dipenuhi.

## File
### Dibuat
- `path` — fungsi
### Diubah
- `path` — perubahan
### Di Luar Cakupan
Yang tidak dikerjakan tugas ini walau terkait.

## Langkah
1. … (ada Migrasi Data → satu langkah "migrasi: /data-periksa → /data-jalankan DAT-NNN" sebelum langkah
   yang membutuhkan datanya)

## Test
Wajib menurut `.agents/rules/tests.md` (evaluasi kelayakan ujian, generate tagihan SPP, idempotensi pembayaran, otorisasi dispensasi) — atau `skip — alasan`.

## Acceptance Criteria
- [ ] bisa dicek manusia < 5 menit

## Riwayat Status
- [YYYY-MM-DD] dibuat — usulan (/fitur-pecah-tugas)
```

## Template `4-urutan-tugas.md`

```markdown
# Urutan Tugas: [Nama Fitur]

Sumber: [3-spesifikasi.md](3-spesifikasi.md)

| ID | Judul | Bergantung pada | Jenis | Data | Status |
|---|---|---|---|---|---|
| [TGS-014](tugas/TGS-014-….md) | … | — | Mandiri | — | usulan |

## Fase
Fase 1 (tanpa dependency): TGS-014 — tracer
Fase 2 (setelah fase 1): TGS-015, TGS-016 ← paralel
```

Kolom **Status** di tabel ini ikut diperbarui setiap kali status file tugas berubah
(`/tugas-kerjakan`, `/laporan`).
