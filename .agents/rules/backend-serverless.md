# Backend Serverless (Next.js & Web Fetch API)

> Berlaku untuk: `app/api/**`, `server/**`

Arsitektur backend menggunakan Route Handlers Next.js 15 berbasis standar **Web Fetch API** (`Request` dan `Response`), Drizzle ORM, dan PostgreSQL Neon.

---

## 1. Lapisan Arsitektur

```text
HTTP Request (Client)
   │
   ▼
app/api/[[...route]]/route.ts       (Next.js Route Handler Catch-All)
   │
   ▼
server/app.ts                       (Dispatcher & Request Sanitizer)
   │
   ├──▶ server/security.ts          (Auth, HMAC Session Cookie, CSRF, Scrypt, Permissions)
   ├──▶ server/business.ts          (Pure Domain Logic: Kelayakan, SPP, Invoices, Pembayaran)
   ├──▶ server/resources.ts         (Resource CRUD & Master Data Constraints)
   ├──▶ server/files.ts             (Private Vercel Blob Signed Token & Signature Validation)
   └──▶ server/state.ts             (Application Snapshot /api/state Scoped)
   │
   ▼
src/db/schema.ts + client.ts        (Drizzle ORM & Neon PostgreSQL)
```

---

## 2. Pola Penanganan Request & Response

1. **Gunakan `Response.json()` Standar Web:**
   ```ts
   const json = (value: unknown, status = 200, headers?: HeadersInit) =>
     Response.json(value, {
       status,
       headers: { "Cache-Control": "no-store", ...headers },
     });
   ```
2. **Validasi Input dengan Zod:**
   - Semua body JSON wajib divalidasi dengan Zod schema sebelum masuk ke logika bisnis:
     ```ts
     const data = z.object({
       email: z.string().email(),
       password: z.string().min(12),
     }).strict().parse(await payload(request));
     ```
3. **Penyaringan Error Terpusat (`HttpError`):**
   - Lempar error domain menggunakan `new HttpError(statusCode, message)`.
   - Error yang dikirim ke client tidak boleh membocorkan detail query internal, connection string database, atau stack trace.

---

## 3. Transaksi Finansial & Idempotensi

1. **Wajib Memakai Transaksi Database:**
   - Seluruh mutasi yang melibatkan status pembayaran, pembatalan, generate invoice, dan review dispensasi **wajib dibungkus dalam `db.transaction()`**.
   - Gunakan advisory lock (`pg_advisory_xact_lock`) bila diperlukan untuk mencegah race condition pada pendaftaran user atau pembentukan tagihan berulang.
2. **Idempotensi Pembayaran:**
   - Pencatatan pembayaran wajib memeriksa `idempotencyKey`.
   - Jika key sudah pernah diproses, kembalikan data transaksi yang sama tanpa mengeksekusi ulang pembayaran.

---

## 4. Keamanan, Autentikasi & Otorisasi

1. **Cookie Sesi (HttpOnly & SameSite):**
   - Token sesi acak 32-byte disimpan dalam bentuk HMAC SHA-256 di tabel `user_sessions`.
   - Cookie diset dengan atribut: `HttpOnly`, `SameSite=Lax`, `Secure` di production, masa berlaku 8 jam.
2. **Proteksi CSRF:**
   - Seluruh request mutasi (`POST`, `PATCH`, `DELETE`) divalidasi origin-nya terhadap konfigurasi `APP_ORIGIN`.
3. **Scrypt Password Hashing:**
   - Password di-hash menggunakan `crypto.scrypt` dengan salt acak unik per user.
   - Pengecekan password dummy dijalankan bahkan ketika email tidak ditemukan untuk mencegah *timing attack / username enumeration*.
4. **Pemeriksaan Hak Akses (RBAC):**
   - Permission dibaca dari relasi `roles` dan `role_permissions` di database pada setiap request via `actorFor(db, userId)`.
   - Validasi menggunakan `allow(context, "permission_name")`.

---

## 5. Integrasi Penyimpanan Bukti (Private Vercel Blob)

1. **Token Upload Bertanda Tangan:**
   - Client meminta token melalui `POST /api/files/upload`.
   - Server membatasi path upload berdasarkan user ID, ukuran maksimal 5 MB, batas 20 token per user per jam, dan masa berlaku token 5 menit.
2. **Pendaftaran & Validasi Magic Bytes:**
   - Setelah file terunggah, client memanggil `POST /api/files`.
   - Server membaca byte awal file untuk memvalidasi *magic bytes* (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, PDF: `%PDF-`), lalu menyimpan metadata ke tabel `files`.
3. **Download File Privat Ber-Range:**
   - Berkas diakses via `GET /api/files/:id` dengan verifikasi kepemilikan.
   - File disajikan dengan dukungan HTTP Range maksimal 2 MB per response chunk untuk efisiensi memori.
