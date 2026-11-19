# TGS-006: Migrasi Skema & Validasi Identitas Lengkap Siswa

**Status:** selesai · **Fitur:** `kelengkapan-identitas-siswa` · **Jenis:** Mandiri
**Bergantung pada:** tidak ada
**Kesiapan data:** perlu migrasi — lihat Migrasi Data

## Tujuan
Menambahkan kolom `nisn`, `gender`, `birthPlace`, `birthDate`, dan `photoUrl` pada tabel `students` di database PostgreSQL, menjalankan migrasi skema Drizzle ORM, dan menerapkan validasi Zod ketat pada server.

## Migrasi Data
Penambahan kolom pada tabel `students`:

| # | Yang dimigrasikan | Script / perintah | Kelas | Juga di production |
|---|---|---|---|---|
| 1 | Tambah kolom `nisn`, `gender`, `birth_place`, `birth_date`, `photo_url` di tabel `students` | `npm run db:generate` & `npm run db:migrate` | tambah | ya |

## Cakupan Spesifikasi
- US-1
- KF-5, KF-6, KF-7, KF-8
- KT-1, KT-2, KT-3

## File
### Dibuat
- `migrations/postgres/0001_funny_butterfly.sql` — Berkas migrasi Drizzle untuk penambahan kolom `students`.

### Diubah
- `src/db/schema.ts` — Definisi kolom `nisn`, `gender`, `birthPlace`, `birthDate`, `photoUrl` dan check constraint `gender in ('L', 'P')`.
- `server/resources.ts` — Skema validasi Zod untuk resource `students` (NISN 10 digit jika diisi, enum gender 'L'/'P', format tanggal lahir).
- `tests/business.test.ts` — Unit & integration test untuk validasi NISN 10 digit, constraint gender, dan operasi CRUD siswa dengan data identitas lengkap.

### Di Luar Cakupan
- Tampilan form antarmuka dan kartu ujian (dikerjakan pada TGS-007).

## Langkah
1. Tambahkan kolom dan constraint pada tabel `students` di `src/db/schema.ts`.
2. Generate file migrasi baru: `npm run db:generate`.
3. Terapkan migrasi ke database dev: `npm run db:migrate`.
4. Perbarui skema Zod `students` di `server/resources.ts`.
5. Tambahkan test di `tests/business.test.ts`.
6. Jalankan `npm test` dan `npm run typecheck`.

## Test
Unit & integration test di `tests/business.test.ts`:
- Server menolak pembuatan/pembaruan siswa dengan NISN tidak valid (bukan 10 digit angka).
- Server menolak gender selain 'L' atau 'P'.
- Server berhasil menyimpan siswa dengan identitas lengkap dan mengembalikannya pada query state.

## Acceptance Criteria
- [x] Kolom `nisn`, `gender`, `birthPlace`, `birthDate`, `photoUrl` tersimpan di database dan lolos validasi server.
- [x] `npm test` dan `npm run typecheck` lulus 100%.

## Riwayat Status
- 2026-11-19 dibuat — usulan (/fitur-pecah-tugas)
- 2026-11-19 disetujui — disetujui oleh pengguna
- 2026-11-19 berjalan — skema Drizzle & migrasi DB
- 2026-11-19 selesai — validasi lulus dan 22/22 unit tests berhasil

