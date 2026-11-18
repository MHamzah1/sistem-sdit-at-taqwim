---
name: logging
description: Panduan dan audit logging serta audit trail sistem SDIT AT-TAQWIM
argument-hint: (opsional) audit / scan
---

# Logging & Audit Trail

Konvensi resmi: `.claude/rules/logging.md`.

## Kategori Pencatatan

1. **Audit Trail Bisnis (Wajib):**
   - Transaksi perubahan status siswa, pembayaran, invoice, dispensasi, dan pengaturan sistem **wajib** menggunakan helper `audit(tx, context, params)` di `server/security.ts`.
   - Data dicatat permanen ke tabel `audit_logs`.
2. **Error HTTP:**
   - Gunakan `throw new HttpError(status, message)`. Pesan error yang dikirim ke client harus aman dan tidak membocorkan credential, connection string, atau stack trace.
3. **Script CLI:**
   - Penggunaan `console.log` hanya diizinkan pada skrip CLI mandiri di folder `scripts/` (misalnya: `scripts/migrate.ts`, `scripts/init.ts`, `scripts/preflight.ts`).
4. **Larangan Keras:**
   - Dilarang meninggalkan pernyataan `console.log` atau `console.debug` sementara di `server/` atau `app/`.
   - Dilarang mencatat `AUTH_SECRET`, password mentah, hash scrypt, atau cookie sesi.

## Audit Pembersihan Log

Sebelum deploy atau verifikasi, jalankan pengecekan keberadaan log debug liar:
```bash
git grep "console.log" -- server/ app/ src/
```
