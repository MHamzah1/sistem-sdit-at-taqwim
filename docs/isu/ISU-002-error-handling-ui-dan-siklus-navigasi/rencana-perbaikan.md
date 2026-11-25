# Rencana Perbaikan (`ISU-002`) — Penanganan Error UI Global/Lokal & Optimasi Siklus Auth/State

| Atribut | Nilai |
| :--- | :--- |
| **ID Isu** | `ISU-002` |
| **Status** | `selesai` (Verifikasi `LULUS` pada 2026-11-25) |

### Riwayat Status
- `2026-11-25`: `usulan` → `disetujui` oleh pengguna (*"saya setujui perbaiki semua ya dan kerjakan sampai tuntas"*) → `berjalan`.
- `2026-11-25 11:47 WIB`: `berjalan` → `selesai` setelah verifikasi penuh (`typecheck`, `67/67 npm test`, `next build`, dan uji *live browser* ulang). Laporan: [2026-11-25-11-47-isu-002-error-handling-ui-dan-siklus-navigasi.md](../../../.development-history/2026-11-25-11-47-isu-002-error-handling-ui-dan-siklus-navigasi.md).

---

## 1. Solusi Terpilih

1. **Tampilkan Notifikasi Error Global di `src/components/AppShell.tsx`:**
   - Ambil `error` dan `setError` dari `useApp()`.
   - Render banner / toast error yang terlihat jelas (dengan tombol tutup `onClick={() => setError("")}` serta auto-dismiss opsional atau banner di atas konten `<main>`) sehingga setiap pemanggilan `setError(...)` dari modul mana pun (Kartu Ujian, Tambah/Ubah Siswa, Detail Siswa, Hapus Data) langsung terbaca oleh pengguna.
2. **Tangkap Error & Kelola State Modal dengan Aman (`try/catch`):**
   - **`src/app/(app)/master/siswa/page.tsx:167-174` & `[id]/page.tsx:77-83` & `master/kelas/page.tsx:139-146`:** Bungkus `await run(...)` di dalam `try/catch`; saat gagal (misalnya HTTP `409`), tampilkan pesan error di dalam modal konfirmasi hapus atau biarkan `AppShell` menampilkan error lalu pastikan tidak ada `unhandledRejection`.
   - **`src/app/(app)/master/siswa/_components/StudentFormView.tsx:822-848`:** Tambahkan state error submit lokal (`submitError`) + banner error jelas di atas/bawah form, serta bungkus `await onSave(payload)` dan `await onSaveDraft(payload)` dengan `try/catch` agar penolakan API (mis. `422`, `409`, `503`) tampil sebagai pesan form yang ramah tanpa *Next.js Runtime Error overlay*.
3. **Guard Sesi & Optimasi `AppContext.tsx`:**
   - **`src/app/(app)/master/siswa/page.tsx:109-125`:** Jalankan `fetch(...)` `/api/student-drafts`, `/api/student-profile-change-requests`, dan `/api/students/completeness-summary` hanya jika `state?.actor` sudah terisi (hindari burst `401` saat unauth redirect).
   - **`src/lib/context/AppContext.tsx:48-70`:** Gunakan `pathnameRef = useRef(pathname)` di dalam `refresh` agar `refresh` tetap stabil (`[router]`) saat pindah antar rute terautentikasi, dan cukup muat `/api/state` saat awal mount / login masuk dari `/masuk` (ketika `!state` dan `pathname !== "/masuk"`) atau saat mutasi `run`/`save` dan tombol Muat ulang.

---

## 2. File Terdampak

- `src/components/AppShell.tsx`
- `src/lib/context/AppContext.tsx`
- `src/app/(app)/master/siswa/page.tsx`
- `src/app/(app)/master/siswa/[id]/page.tsx`
- `src/app/(app)/master/kelas/page.tsx`
- `src/app/(app)/master/siswa/_components/StudentFormView.tsx`

---

## 3. Skenario Test & Verifikasi

1. `npm run typecheck` dan `npm run build` lulus tanpa error.
2. Uji live browser:
   - Klik hapus siswa bertagihan (`TC-05`) & `Kelas 1A` (`TC-06`): muncul pesan error `409` yang jelas di UI dan **0 `unhandledRejection`**.
   - Submit form `/master/siswa/tambah` yang ditolak API: tampil alert error form yang jelas dan **0 overlay Runtime Error**.
   - Akses `/master/siswa` tanpa login (`TC-01`): langsung redirect `/masuk` tanpa loop `/api/student-drafts 401`.
   - Navigasi antar menu (`TC-04`): tidak memicu refetch penuh `/api/state` berulang di setiap perpindahan menu.
