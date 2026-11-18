# Alur Kerja & Konvensi Tiket

> Berlaku: Setiap sesi kerja Claude Code pada proyek SDIT AT-TAQWIM.
> Langkah rinci tiap skill ada di `.claude/commands/<nama>.md`.

Setiap pekerjaan dikelompokkan ke dalam **satu objek**. Tentukan objeknya terlebih dahulu sebelum memilih skill yang sesuai.

---

## 1. Objek Pekerjaan

| Situasi | Objek | ID | Direktori |
|---|---|---|---|
| Kemampuan yang belum ada di sistem | **Fitur** | slug kebab-case | `docs/fitur/[slug]/` |
| Potongan vertikal dari fitur | **Tugas** | `TGS-NNN` | `docs/fitur/[slug]/tugas/TGS-NNN-[nama].md` |
| Sudah ada, tapi rusak/salah/bug | **Isu** | `ISU-NNN` | `docs/isu/ISU-NNN-[nama]/` |
| Sudah ada & benar, ingin diubah | **Revisi** | `REV-NNN` | `docs/revisi/REV-NNN-[nama].md` |
| Eksekusi perubahan/migrasi skema database | **Data** | `DAT-NNN` | `docs/data/DAT-NNN-[nama].md` |
| Uji live browser (Playwright) | **Uji** | `UJI-NNN` (kasus `TC-NN`) | `docs/uji/UJI-NNN-[menu]/` |

---

## 2. Peta Alur Skill

```text
Fitur   /fitur-riset ──▶ /fitur-wawancara ──▶ /fitur-spesifikasi ──▶ /fitur-pecah-tugas
                                                                             │
Tugas                                                      /tugas-kerjakan TGS-NNN ──┐
Isu     /isu-diagnosa ───────────────────────────────────▶ /isu-perbaiki ISU-NNN ────┼─▶ /verifikasi ──▶ /laporan
Revisi  /revisi-wawancara ───────────────────────────────▶ /revisi-terapkan REV-NNN ─┘
Data    /data-periksa (rencana DAT) ──▶ /data-jalankan DAT-NNN ───────────────────────▶ /laporan
Uji     /uji-browser ──(jika ada TC gagal)──▶ /isu-diagnosa
```

Skill pendukung lainnya:
- `/audit-kode`: Sapuan bug dan inkonsistensi kode (hasil di chat).
- `/audit-progres`: Evaluasi kelengkapan fitur vs spesifikasi (hasil di chat).
- `/logging`: Konvensi logging dan audit trail.

---

## 3. Aturan Baku (Rules)

1. **Nama Skill = `[objek]-[aksi]`:**
   Awalan nama skill mencerminkan objek tiket dan foldernya (`tugas-kerjakan`, `isu-perbaiki`, `revisi-terapkan`).
2. **Kata Kerja Eksekusi Unik per Objek:**
   - Tugas *dikerjakan* (`/tugas-kerjakan`).
   - Isu *diperbaiki* (`/isu-perbaiki`).
   - Revisi *diterapkan* (`/revisi-terapkan`).
   - Data *dijalankan* (`/data-jalankan`).
   - Dilarang memperbaiki bug isu langsung via `/tugas-kerjakan`.
3. **Penomoran ID Global 3 Digit:**
   Nomor baru adalah nomor terbesar yang ada + 1 (mis. `TGS-001`, `ISU-001`). Nomor yang ditolak tidak dipakai ulang.
4. **Siklus Status:**
   `usulan` → `disetujui` → `berjalan` → `selesai` (atau `ditolak` / `terblokir`).
   Perubahan status dicatat pada riwayat status dokumen terkait.
5. **Gerbang Persetujuan Pengguna:**
   Hanya pengguna yang berhak menaikkan status menjadi `disetujui` (misalnya: *"Setujui TGS-001"* atau *"Setujui dan kerjakan semua"*).
   Agent tidak boleh menaikkan status ke `disetujui` atas inisiatif sendiri.
6. **Skill Read-Only Tidak Mengubah Kode:**
   Skill `/isu-diagnosa`, `/data-periksa`, dan `/audit-*` bersifat **read-only mutlak**.
7. **`_ACTIVE-TASK.md`:**
   Mencatat tepat satu objek pekerjaan yang sedang aktif dikerjakan. File ini dihapus otomatis saat objek ditutup melalui `/laporan`.
8. **Lingkungan Kerja:**
   - Aplikasi berjalan di Next.js port 3000 (`npm run dev`).
   - Database development menggunakan Neon PostgreSQL yang dikonfigurasi pada `.env` (`DATABASE_URL`).
   - Database testing menggunakan PostgreSQL terisolasi berbasis PGlite (`npm test`).
