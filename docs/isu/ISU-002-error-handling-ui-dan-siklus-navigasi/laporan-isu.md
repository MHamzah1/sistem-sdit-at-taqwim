# Laporan Isu (`ISU-002`) — Unhandled Rejection, Error API Tidak Tampil di UI, & Loop Request Auth/Navigasi

| Atribut | Nilai |
| :--- | :--- |
| **ID Isu** | `ISU-002` |
| **Sumber Temuan** | `UJI-001` (`TC-05`, `TC-06`, `TC-11`, plus catatan `TC-01` & `TC-04`) |
| **Prioritas / Tingkat** | **P1 — High** |
| **Status** | `usulan` (Menunggu persetujuan user untuk eksekusi `/isu-perbaiki ISU-002`) |
| **Tanggal Diagnosa** | 25 November 2026 |

---

## 1. Gejala yang Dilihat Pengguna

1. **Modal Hapus Siswa & Kelas Diam/Terjebak Saat Ditolak `409` + `unhandledRejection` (`TC-05`, `TC-06`):** Saat user mengklik hapus pada siswa bertagihan (`TC-05`) atau `Kelas 1A` (`TC-06`), server dengan benar mengembalikan HTTP `409`, tetapi pesan error **tidak pernah muncul** di UI/toast maupun di dalam modal, dan browser mencatat **`unhandledRejection=1`** (`task-147.log` L1120).
2. **Overlay Next.js Runtime Error Saat Simpan Siswa Gagal (`TC-11`):** Saat submit form `/master/siswa/tambah` gagal dari server, muncul popup *Next.js Runtime Error (`1 Issue`)* di sudut layar karena promise rejection tidak tertangkap.
3. **Loop Request `401` Sebelum Login & Refetch `/api/state` di Setiap Pergantian Rute (`TC-01`, `TC-04`):**
   - Saat mengakses `/master/siswa` tanpa login dalam kondisi cold-compile (`/masuk` masih dikompilasi), browser mengirim request `/api/student-drafts` (`401`) dan dokumen `/master/siswa` berulang-ulang sebelum redirect ke `/masuk` selesai (`task-147.log` L11–825).
   - Saat berpindah antar menu sidebar yang sudah login, `/api/state` ikut terpanggil ulang terus-menerus pada setiap perubahan URL.

---

## 2. Rantai Penyebab (Penelusuran `file:baris`)

1. **`AppShell.tsx` Tidak Merender State `error` Global:**
   - `src/lib/context/AppContext.tsx:99-101` menyimpan pesan kegagalan via `setError(...)` saat `run()` gagal lalu melempar ulang (`throw e`). Halaman `tambah/page.tsx:241-244`, `ubah/page.tsx:103-106`, `kartu/page.tsx:92-95`, dan `[id]/page.tsx:98-100` juga mengandalkan `setError(...)`.
   - Namun `src/components/AppShell.tsx:59` hanya mendestrukturisasi `{ state, loading, busy, toast, refresh, can, isGuardian, actor }` dan **tidak pernah membaca ataupun menampilkan `error`** di DOM (`Toast.tsx:1-13` hanya menerima `message={toast}`).
2. **Caller `run()` & `onSave()` Tanpa `try/catch`:**
   - `src/app/(app)/master/siswa/page.tsx:167-174` (`handleDelete`) memanggil `await run(...)` lalu `setStudentToDelete(null)` tanpa `try/catch`.
   - `src/app/(app)/master/siswa/[id]/page.tsx:77-83` (`handleDelete`) memanggil `await run(...)` tanpa `try/catch`.
   - `src/app/(app)/master/kelas/page.tsx:139-146` (`handleDelete`) memanggil `await run(...)` tanpa `try/catch`.
   - `src/app/(app)/master/siswa/_components/StudentFormView.tsx:822-842` (`handleFinalSubmit`) memanggil `await onSave(payload)` tanpa `try/catch`, sedangkan `tambah/page.tsx:244` dan `ubah/page.tsx:106` melempar ulang error (`throw e`).
3. **Fetch Tanpa Guard Sesi di `MasterSiswaPage` (`src/app/(app)/master/siswa/page.tsx:109-125`):**
   - `useEffect(..., [])` langsung menjalankan `fetch("/api/student-drafts")`, `fetch("/api/student-profile-change-requests")`, dan `fetch("/api/students/completeness-summary")` pada render pertama bahkan ketika `state` masih `null` / user belum terautentikasi.
4. **Ketergantungan `pathname` pada `useCallback` `refresh` (`src/lib/context/AppContext.tsx:48-70`):**
   - `refresh` mencantumkan `[pathname, router]` di array dependensi dan `useEffect(() => { void refresh(); }, [refresh])` di baris `:68-70`, sehingga setiap navigasi rute di sidebar menciptakan fungsi `refresh` baru dan men-trigger `GET /api/state` penuh berulang kali.

---

## 3. Dampak

- Pengguna tidak mendapat umpan balik visual yang jelas ketika operasi hapus/simpan gagal (silent failure pada modal konfirmasi atau overlay runtime error Next.js yang mengganggu UI produksi/dev).
- Beban server dan latensi navigasi antar menu menjadi lebih lambat karena fetch `/api/state` berulang dan fetch halaman terproteksi sebelum sesi valid.
