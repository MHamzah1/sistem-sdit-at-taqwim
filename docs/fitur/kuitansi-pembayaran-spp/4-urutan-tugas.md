# Urutan Tugas: Cetak Kuitansi Pembayaran SPP

Sumber: [3-spesifikasi.md](3-spesifikasi.md)

| ID | Judul | Bergantung pada | Jenis | Data | Status |
|---|---|---|---|---|---|
| [TGS-001](tugas/TGS-001-state-item-pembayaran-dan-terbilang.md) | State Item Pembayaran & Helper Terbilang Rupiah | — | Mandiri | — | selesai |
| [TGS-002](tugas/TGS-002-modal-kuitansi-dan-cetak-kasir.md) | Modal Kuitansi & Integrasi Cetak Staf Kasir | TGS-001 | Mandiri | — | selesai |
| [TGS-003](tugas/TGS-003-kuitansi-portal-wali-dan-verifikasi.md) | Akses Kuitansi Portal Wali & Verifikasi End-to-End | TGS-002 | Mandiri | — | selesai |

## Fase
- **Fase 1 (Tracer Bullet / Fondasi Data):** `TGS-001` (Menghubungkan item invoice ke state klien + fungsi terbilang dan penomoran kuitansi deterministik).
- **Fase 2 (Antarmuka Staf Sekolah):** `TGS-002` (Modal kuitansi resmi, cap lunas digital, styling cetak `@media print`, dan tombol aksi kasir).
- **Fase 3 (Portal Wali & Verifikasi Akhir):** `TGS-003` (Akses mandiri wali murid, pengujian isolasi anti-IDOR, dan kompilasi produksi).
