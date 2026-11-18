# Frontend React & Next.js

> Berlaku untuk: `app/**`, `src/components/**`, `src/lib/**`, `src/main.tsx`

Frontend dibangun menggunakan **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS v4**, dan **Lucide React**.

---

## 1. Arsitektur Komponen & Halaman

1. **Root Layout (`app/layout.tsx`):**
   - Mengatur metadata aplikasi, font Manrope & DM Sans, serta memuat `src/styles.css` dan `src/production.css`.
2. **Client Components (`'use client'`):**
   - Semua komponen yang berinteraksi dengan state browser (`useState`, `useEffect`), form interaktif, atau event handler wajib menyertakan direktif `'use client'` di baris paling atas.
   - Hindari akses langsung ke variabel browser global (`window`, `location`, `document`) saat inisialisasi render tanpa pengecekan `typeof window !== "undefined"`.

---

## 2. Pemanggilan API & Integrasi Backend

1. **Gunakan API Client Resmi (`src/lib/api.ts`):**
   - Panggil seluruh endpoint internal melalui helper `api<T>()`:
     ```ts
     import { api } from "@/src/lib/api";

     // GET request
     const state = await api<AppState>("state");

     // POST request dengan body
     await api("payments", "POST", { studentId, invoiceIds, method: "CASH" });
     ```
   - Semua request otomatis menyertakan `credentials: "same-origin"` untuk autentikasi cookie HttpOnly.
2. **Penanganan Error API:**
   - Gunakan blok `try/catch` untuk menangkap `ApiError`. Tampilkan pesan error ramah pengguna (mis. di baris alert atau toast), jangan biarkan komponen crash.
3. **Upload Bukti Pembayaran ke Vercel Blob:**
   - Gunakan fungsi `uploadProof(file, userId)` dari `src/lib/api.ts`.
   - File dibatasi: tipe `image/jpeg`, `image/png`, atau `application/pdf` dengan ukuran maksimal 5 MB.

---

## 3. Komponen UI Baku (`src/components.tsx`)

Jangan membuat markup dasar dari nol jika sudah tersedia komponen baku:
- **`Brand`**: Logo dan identitas resmi SDIT AT-TAQWIM.
- **`Badge`**: Indikator status tagihan/ujian dengan warna semantik (`green`, `amber`, `red`, `blue`, `neutral`).
- **`Panel`**: Kontainer kartu berbingkai dengan header dan aksi.
- **`Modal`**: Dialog modal pop-up dengan backdrop blur.
- **`DataTable`**: Tabel data berhalaman dengan header dan render sel fleksibel.
- **`DataForm`**: Form dinamis berbasis spesifikasi field (`Field[]`).

---

## 4. Pola State & Filter Data

1. **Snapshot Aplikasi (`/api/state`):**
   - Data utama sekolah (siswa, kelas, tagihan, periode ujian, permohonan dispensasi) dimuat terpusat melalui snapshot `/api/state`.
   - Server otomatis menyaring data jika aktor yang login adalah wali murid (`WALI_MURID`).
2. **Filter & Paging di Sisi Tampilan:**
   - Tabel tampilan memfilter data berdasarkan tahun ajaran yang dipilih (`yearId`), periode ujian (`examId`), dan kata kunci pencarian.
   - Paginasi tabel menggunakan batas 15 hingga 50 baris per halaman.
