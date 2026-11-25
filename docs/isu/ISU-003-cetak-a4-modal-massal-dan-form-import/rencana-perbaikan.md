# Rencana Perbaikan (`ISU-003`) — Cetak A4, Modal Cetak Massal, Form Orang Tua, & Template Import XLSX

| Atribut | Nilai |
| :--- | :--- |
| **ID Isu** | `ISU-003` |
| **Status** | `selesai` (Verifikasi `LULUS` pada 2026-11-25) |

### Riwayat Status
- `2026-11-25`: `usulan` → `disetujui` oleh pengguna (*"saya setujui perbaiki semua ya dan kerjakan sampai tuntas"*) → `berjalan`.
- `2026-11-25 11:47 WIB`: `berjalan` → `selesai` setelah verifikasi penuh (`typecheck`, `67/67 npm test`, `next build`, dan uji *live browser* ulang). Laporan: [2026-11-25-11-47-isu-003-cetak-a4-modal-massal-dan-form-import.md](../../../.development-history/2026-11-25-11-47-isu-003-cetak-a4-modal-massal-dan-form-import.md).

---

## 1. Solusi Terpilih

1. **Perbaikan Data Jenis Kelamin & Agama Cetak A4 (`src/app/(app)/master/siswa/_components/StudentDetailView.tsx:2568`):**
   - Ganti logika rendering menjadi eksplisit:
     `student.gender === "L" ? "Laki-laki" : student.gender === "P" ? "Perempuan" : "—"`
   - Tampilkan `studentExtended.religion || "—"` (hindari menebak agama default pada lembar biodata cetak resmi jika data masih kosong).
2. **Perbaikan Lebar & Layout Modal Cetak Kartu Massal (`src/components/modals/BulkCardsModal.tsx:99-144`):**
   - Berikan prop `className="max-w-4xl"` pada `<Modal ...>` (karena `Modal.tsx:25` sudah mendukung `cn("max-w-xl", className)` dan `bulk-cards-sheet` memuat layout kartu A4).
   - Atur grid filter menjadi `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end` serta pastikan `<Select>` memiliki `w-full min-w-0` agar tidak pernah terpotong horizontal.
3. **Penyesuaian Payload Orang Tua & Spasi Header Form (`src/app/(app)/master/siswa/_components/StudentFormView.tsx`):**
   - Pada `getPayload()` (`:739-770`): jika `fatherMode === "new"` dan `fatherName.trim() === ""` serta field identitas ayah opsional tidak diisi user (`!fatherNik.trim()`), kirim `mode: "none"` sehingga pendaftaran dasar tetap lolos tanpa error `422` palsu (hal yang sama berlaku untuk `motherMode` bila `motherName.trim() === ""` dan `!motherNik.trim()`; jika user mulai mengisi NIK/nama salah satunya, validasi tetap berjalan normal).
   - Perbaiki header badge kelengkapan (`:961`): tambah `gap-3 flex-wrap` agar teks `Terverifikasi` dan `Perlu Dilengkapi` berjarak rapi.
4. **Pembaruan Template Import XLSX (`server/studentMaster.ts:2701-2736`):**
   - Tambahkan kolom `"TANGGAL_MASUK"` dengan nilai contoh `"2026-07-13"` pada `generateStudentImportTemplateXlsx`.
   - Sesuaikan contoh kolom `"KELAS"` dari `"1-A Abu Bakar"` menjadi `"Kelas 1A"` agar cocok dengan konvensi nama rombel SDIT AT-TAQWIM (`DAT-002`).

---

## 2. File Terdampak

- `src/app/(app)/master/siswa/_components/StudentDetailView.tsx`
- `src/components/modals/BulkCardsModal.tsx`
- `src/production.css`
- `src/app/(app)/master/siswa/_components/StudentFormView.tsx`
- `server/studentMaster.ts`
- `tests/student-master.test.ts` (tambah verifikasi regresi kolom `TANGGAL_MASUK` dan contoh `"Kelas 1A"` pada `generateStudentImportTemplateXlsx`)

---

## 3. Skenario Test & Verifikasi

1. Unit test (`npm test`) memverifikasi output header `generateStudentImportTemplateXlsx` memuat `TANGGAL_MASUK` dan sample `"Kelas 1A"`, serta `npm run typecheck` dan `npm run build` lulus.
2. Live browser:
   - Buka cetak A4 `Muhammad Fatih Pratama` (`TC-18`): kolom Jenis Kelamin / Agama menampilkan `— / —` (tidak pernah mencetak `Perempuan`).
   - Buka **Cetak Massal** di `/ujian/kartu` (`TC-18b`): field `Periode Ujian`, `Rombel / Kelas`, dan tombol `Muat Ulang` tampil utuh tanpa terpotong.
   - Buka `/master/siswa/tambah` (`TC-11`): label `Terverifikasi` & `Perlu Dilengkapi` berjarak rapi dan submit form tanpa mengisi Ayah/Ibu tidak terkena `422`.
