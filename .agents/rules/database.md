# Database Layer (Drizzle ORM & PostgreSQL)

> Berlaku untuk: `src/db/**`, `server/**`, `scripts/**`

Database sistem menggunakan **PostgreSQL (Neon Serverless)** di production/development dan **PGlite** untuk pengujian terisolasi, dikelola menggunakan **Drizzle ORM**.

---

## 1. Schema & Client

- Schema terpusat di `src/db/schema.ts` menggunakan PostgreSQL data types (`uuid`, `text`, `integer`, `boolean`, `date`, `timestamp`, `jsonb`, `pgEnum`).
- Database client diinisialisasi melalui `src/db/client.ts`:
  ```ts
  import { getDb } from "@/src/db/client";
  const { db, close } = getDb();
  ```

---

## 2. Aturan Query Drizzle

1. **Gunakan Operator Type-Safe Drizzle:**
   - Gunakan `eq`, `and`, `or`, `inArray`, `lte`, `gte`, `desc`, `asc`.
   - Hindari query SQL mentah kecuali untuk agregasi khusus atau advisory lock (`sql` template tag).
2. **Dilarang String Concatenation Query:**
   ```ts
   // ❌ DILARANG KERAS (Rentan SQL Injection)
   await db.execute(`SELECT * FROM students WHERE id = '${id}'`);

   // ✅ BENAR (Parameterized Drizzle Query)
   await db.select().from(s.students).where(eq(s.students.id, id));
   ```
3. **Cegah N+1 Query:**
   - Gunakan `inArray` atau batch select daripada melakukan query di dalam perulangan `for`/`forEach`.

---

## 3. Transaksi & Locking

1. **Wajib Transaksi pada Operasi Finansial:**
   Setiap operasi pembayaran, verifikasi, approval dispensasi, dan generate invoice wajib menggunakan `db.transaction`:
   ```ts
   await db.transaction(async (tx) => {
     // 1. Kunci baris / advisory lock
     // 2. Simpan pembayaran
     // 3. Perbarui status invoice
     // 4. Hitung ulang kelayakan ujian
     // 5. Tulis audit log
   });
   ```
2. **Advisory Lock untuk Mencegah Race Condition:**
   - Pendaftaran user baru mengunci namespace transaksi (`pg_advisory_xact_lock(752901)`).

---

## 4. Migrasi Skema Database

1. **Generate Migrasi Drizzle:**
   Jika mengubah `src/db/schema.ts`, buat migrasi baru dengan perintah:
   ```sh
   npm run db:generate
   ```
   Berkas SQL baru akan dibuat di direktori `migrations/postgres/`.
2. **Jalankan Migrasi:**
   Eksekusi migrasi ke database yang ditargetkan di `.env` (`DATABASE_URL`):
   ```sh
   npm run db:migrate
   ```
3. **Inisialisasi Master & Super Admin:**
   ```sh
   npm run db:init
   ```
   *Catatan:* `db:init` hanya menyisipkan peran dan satu super admin jika tabel users kosong. Tidak membuat data dummy.

---

## 5. Pengujian Database

- Pengujian unit dan integrasi di `tests/` berjalan di atas **PGlite** (in-memory PostgreSQL engine yang menjalankan file migrasi SQL yang sama persis dengan production).
- Data pengujian tidak pernah menyentuh database development atau production.
