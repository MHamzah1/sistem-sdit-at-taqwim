# Antigravity Agents Constitution — SDIT AT-TAQWIM

Dokumen ini adalah aturan konstitusi dan panduan operasional proyek untuk seluruh agen AI (termasuk Google Antigravity dan Claude Code) yang bekerja pada repositori **Sistem SPP & Kelayakan Ujian — SDIT AT-TAQWIM**.

---

## 1. Identitas & Stack Teknologi

- **Nama Sistem:** Sistem SPP & Kelayakan Ujian — SDIT AT-TAQWIM
- **Framework Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React
- **Arsitektur Backend:** Next.js Route Handlers (`app/api/[[...route]]/route.ts`), Web Fetch API, Controller di `server/app.ts` & `server/business.ts`
- **Database & ORM:** PostgreSQL (Neon Serverless) dengan Drizzle ORM (`src/db/schema.ts`), pengujian terisolasi via PGlite
- **Penyimpanan Berkas:** Private Vercel Blob (`@vercel/blob`) untuk bukti transfer
- **Server Lokal:** Berjalan terpadu di port 3002 (`npm run dev`)

---

## 2. Hard Rules & Batas Keselamatan (Non-Negotiable)

1. **AI Boleh Menulis Kode, Tetapi DILARANG Mengarang Keputusan Bisnis/Finansial:**
   - Setiap perubahan alur SPP, tagihan, atau syarat ujian wajib melalui gerbang persetujuan user (`/fitur-wawancara`, `/revisi-wawancara`).
2. **Proteksi Foreign Key & Integritas Transaksi:**
   - Dilarang menghapus record Siswa, Kelas, atau Tahun Ajaran yang telah terikat histori tagihan (`invoices`), pembayaran, atau evaluasi ujian.
3. **Immutability Tagihan SPP:**
   - Perubahan nominal Master SPP tidak boleh mengubah nominal invoice yang telah terbit.
4. **Guardian Scoping (Anti-IDOR):**
   - User dengan role `WALI_MURID` hanya boleh mengakses data dan siswa yang terhubung melalui tabel `guardian_students`.
5. **Kalkulasi Finansial Server-Side:**
   - Client tidak boleh menentukan nominal total pembayaran; server selalu menghitung dari lembar invoice aktual di database.
6. **Evaluasi Kelayakan Ujian Deterministik:**
   - Kartu ujian ber-QR hanya boleh diterbitkan jika status kelayakan di server berstatus `ELIGIBLE` atau `ELIGIBLE_DISPENSATION`.
7. **Zero Secret Leak:**
   - Dilarang menaruh `AUTH_SECRET`, password mentah, scrypt hash, atau token sesi di log stdout, Git commit, atau respon API publik.

---

## 3. Sumber Aturan Baku (`.agents/rules/`)

Semua agen wajib mematuhi aturan operasional di direktori `.agents/rules/`:
- `alur-kerja.md`: Alur tiket (Fitur, Tugas `TGS`, Isu `ISU`, Revisi `REV`, Data `DAT`, Uji `UJI`).
- `kelayakan-dan-keuangan.md`: Aturan domain SPP bulanan, kelayakan ujian 3-syarat, dispensasi kepsek, kartu QR.
- `backend-serverless.md`: Standar Next.js Route Handlers, Drizzle ORM, Web Fetch `Request`/`Response`.
- `database.md`: Standar Drizzle ORM, migrasi PostgreSQL, transaksi finansial, isolasi PGlite.
- `frontend-react.md`: Standar Next.js App Router, React 19, komponen modular, dan client API helper.
- `form.md`: Standar komponen form (`DataForm`, `Field`, `Modal`), validasi input uang & bukti transfer.
- `list-table.md`: Standar tabel (`DataTable`), filter pencarian, dan badge semantik (`Badge`).
- `display-formatting.md`: Format Rupiah `money()`, status badge, tanggal WIB, dan normalisasi nomor WhatsApp.
- `tests.md`: Standar pengujian `node:test` berbasis PGlite terisolasi (`tests/fixture.ts`).
- `logging.md`: Audit trail ke tabel `audit_logs` via `server/security.ts`.
- `project-context.md`: Konteks arsitektur dan batasan scope.

---

## 4. Validasi Selesai (Definition of Done)

Sebuah tugas dinyatakan selesai **hanya jika** telah melewati gerbang `/verifikasi` dengan hasil angka nyata:
```sh
npm run typecheck      # Lulus tanpa error TypeScript
npm test               # 20 dari 20 unit/integration tests lulus
npm run build          # Kompilasi produksi Next.js berhasil
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
