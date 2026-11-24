# SDIT AT-TAQWIM — Project Context

> Sistem SPP & Kelayakan Ujian — SDIT AT-TAQWIM.
> Stack: Next.js 15 (App Router), React 19, TypeScript, Drizzle ORM, Neon PostgreSQL, Private Vercel Blob.

---

## Prinsip Pengembangan: Jangan Over-Engineer

1. **Jaga Kesederhanaan Arsitektur:**
   - Gunakan pola modular Next.js App Router yang bersih.
   - Hindari abstraksi microservices, event bus rumit, atau dependensi state management eksternal (Redux/Zustand) yang tidak diperlukan; snapshot UI terpusat di `/api/state`.
2. **Kepatuhan Terhadap Aturan Sekolah:**
   - Setiap perubahan alur keuangan atau syarat ujian wajib selaras dengan dokumen [`docs/API.md`](../../docs/API.md), [`docs/AUDIT.md`](../../docs/AUDIT.md), dan [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md).

---

## Hard Rules (Selalu Berlaku & Tidak Boleh Dilanggar)

1. **Proteksi Foreign Key & Integritas Riwayat:**
   - Record siswa, kelas, atau tahun ajaran yang telah memiliki tagihan (`invoices`), histori pembayaran, atau evaluasi ujian **DILARANG DIHAPUS**.
   - Foreign key database wajib menolak operasi cascade delete yang merusak histori keuangan.
2. **Immutability Tagihan SPP:**
   - Perubahan konfigurasi nominal pada Master SPP **TIDAK BOLEH** mengubah invoice lama yang telah terbit.
3. **Pembatasan Hak Akses Wali Murid (Guardian Scoping):**
   - User dengan role `WALI_MURID` hanya boleh mengakses data, tagihan, kartu ujian, dan form milik siswa yang terhubung melalui tabel `guardian_students`.
   - Penolakan IDOR wajib mengembalikan HTTP 403 Forbidden.
4. **Kalkulasi Nominal Finansial Wajib di Server:**
   - Client hanya mengirim daftar ID tagihan (`invoiceIds`); server yang menjumlahkan nominal tagihan aktual dari database.
5. **Evaluasi Kelayakan Ujian Server-Side:**
   - Kartu ujian ber-QR hanya boleh diterbitkan jika status kelayakan di server berstatus `ELIGIBLE` atau `ELIGIBLE_DISPENSATION`.
   - Kode QR memuat UUID verifikasi yang divalidasi ulang secara live oleh endpoint server.
6. **Keamanan Upload Berkas Bukti:**
   - Bukti transfer disimpan di private Vercel Blob melalui token upload bertanda tangan.
   - Server wajib memeriksa magic bytes file (hanya JPG, PNG, PDF; maks 5 MB).
7. **Pengingat WhatsApp (Reminder):**
   - Fitur reminder hanya menghasilkan tautan WhatsApp interaktif (`https://wa.me/...`) yang dibuka user, bukan pengiriman otomatis via gateway pihak ketiga.
8. **Lingkungan Server Lokal:**
   - Next.js berjalan di port 3002 (`npm run dev`).
9. **Kredensial & Rahasia:**
   - Dilarang menaruh token, password, atau `AUTH_SECRET` di dalam kode sumber, commit Git, atau respon API.

---

## Validasi Setelah Mengubah Kode

Setiap perubahan kode wajib memverifikasi:
```sh
npm run typecheck
npm test
npm run build
```
