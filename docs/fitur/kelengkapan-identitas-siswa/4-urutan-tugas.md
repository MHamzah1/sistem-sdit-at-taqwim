# Urutan Tugas: Kelengkapan Identitas Master Siswa

Sumber: [3-spesifikasi.md](3-spesifikasi.md)

| ID | Judul | Bergantung pada | Jenis | Data | Status |
|---|---|---|---|---|---|
| [TGS-006](tugas/TGS-006-migrasi-skema-dan-validasi-identitas-siswa.md) | Migrasi Skema & Validasi Identitas Lengkap Siswa | — | Mandiri | Migrasi DB | selesai |
| [TGS-007](tugas/TGS-007-antarmuka-master-siswa-dan-kartu-ujian-foto.md) | Antarmuka Master Siswa & Integrasi Pas Foto pada Kartu Ujian | TGS-006 | Mandiri | — | selesai |

## Fase
- **Fase 1 (Tracer & Skema):** TGS-006 — Migrasi skema database PostgreSQL (NISN, gender, TTL, foto) & validasi Zod server.
- **Fase 2 (Setelah Fase 1):** TGS-007 — Form & tabel master siswa, pencarian NISN, dan pas foto 3x4 pada kartu ujian individual & cetak massal A4.
