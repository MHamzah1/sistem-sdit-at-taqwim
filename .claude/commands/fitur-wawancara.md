---
name: fitur-wawancara
description: Fitur 2/4 — wawancara langsung semua pertanyaan + rekomendasi terbaik sekaligus → docs/fitur/[slug]/2-wawancara.md
argument-hint: [slug fitur] atau topik fitur baru
---

# Fitur — Wawancara

Sebelum membangun apa pun, samakan pemahaman dan kunci seluruh keputusan teknis/bisnis.
Konvensi objek, ID, dan status: `.claude/rules/alur-kerja.md`.

Input user:
$ARGUMENTS

---

## Prinsip Utama: Batch Questions & Best-Practice Recommendation

**DILARANG bertanya satu per satu per giliran** yang membuang waktu dan melelahkan prompter.
Agen **WAJIB langsung menyajikan seluruh pertanyaan relevan sekaligus (batch 4–8 pertanyaan terstruktur)** dengan menyertakan **Rekomendasi Jawaban Terbaik & Bagus** untuk setiap pertanyaan.

Prompter dapat menyetujui seluruh rekomendasi secara instan cukup dengan membalas:
> *"Saya setujui semua rekomendasi yang Anda berikan"* atau *"Setuju semua rekomendasi"*

---

## Langkah Kerja Agen

### 1. Eksplorasi Awal
1. Baca `docs/fitur/[slug]/1-riset.md` jika sudah ada:
   - Ambil daftar **Pertanyaan Terbuka** sebagai materi pertanyaan.
   - Hal yang sudah terjawab di riset atau sudah ada di repo **JANGAN ditanyakan lagi**.
2. Periksa skema DB (`src/db/schema.ts`), logika bisnis (`server/business.ts`), dan aturan domain (`.claude/rules/kelayakan-dan-keuangan.md`).
3. Buat file `docs/fitur/[slug]/2-wawancara.md`.

### 2. Rumuskan Seluruh Pertanyaan & Rekomendasi Sekaligus
Ajukan pertanyaan yang mencakup aspek-aspek krusial:
- **Scope & Batasan Fitur**: apa yang masuk dan apa yang non-goal.
- **Data & Database**: apakah butuh tabel/kolom/enum baru di `src/db/schema.ts` (rencana `DAT-NNN`).
- **Alur Bisnis & UX**: interaksi form, validasi nominal rupiah, feedback status, upload berkas bukti.
- **Edge Cases & Error Handling**: skenario tagihan ganda, keterlambatan bayar, penolakan dispensasi.
- **Hak Akses / Peran**: siapa yang berhak akses (`SUPER_ADMIN`, `ADMIN`, `TU`, `KEPALA_SEKOLAH`, `WALI_MURID`).

### 3. Format Setiap Item Pertanyaan
```markdown
### Q[N]. [Topik Pertanyaan Spesifik]
- **Konteks:** [Penjelasan singkat kenapa keputusan ini penting]
- **Pilihan Opsi:**
  - Opsi A: [Penjelasan opsi A]
  - Opsi B: [Penjelasan opsi B]
- **💡 Rekomendasi Terbaik:** **Opsi [A/B]** — [Alasan teknis/bisnis mendalam mengapa opsi ini paling optimal, aman, dan minim bug].
- **Status Keputusan:** `[ ] Pending`
```

### 4. Tampilkan Panduan Fast-Track di Akhir Chat
Sertakan petunjuk persetujuan cepat:
```markdown
---
💡 **Persetujuan Cepat (Fast-Track Approval):**
Jika setuju dengan seluruh rekomendasi di atas, cukup balas:
> **"Setujui semua rekomendasi"**
*(Agen akan langsung mengunci seluruh keputusan dan melanjutkan ke tahap spesifikasi).*
```
