# Laporan Isu (`ISU-003`) — Bug Data Cetak A4 (`Perempuan / Islam`), Modal Cetak Massal Terpotong, Form Orang Tua & Template XLSX

| Atribut | Nilai |
| :--- | :--- |
| **ID Isu** | `ISU-003` |
| **Sumber Temuan** | `UJI-001` (`TC-18`, `TC-11`, `TC-13`) |
| **Prioritas / Tingkat** | **P1 — High (Integritas Data Cetak) / P2–P3 (Visual & UX)** |
| **Status** | `usulan` (Menunggu persetujuan user untuk eksekusi `/isu-perbaiki ISU-003`) |
| **Tanggal Diagnosa** | 25 November 2026 |

---

## 1. Gejala yang Dilihat Pengguna

1. **Cetak Formulir A4 Salah Menampilkan Gender (`TC-18`):** Pada halaman pratinjau cetak A4 formulir biodata resmi siswa `Muhammad Fatih Pratama` (`gender = null` di database), kolom **"Jenis Kelamin / Agama"** mencetak **`Perempuan / Islam`**, padahal siswa tersebut laki-laki dengan nilai jenis kelamin di DB kosong (`null`).
2. **Dialog `Cetak Massal Kartu Ujian` Terpotong Horizontal (`TC-18` / `TC-18b`):** Saat membuka modal Cetak Massal di `/ujian/kartu` pada layar desktop `1440x900`, kontrol **`Rombel / Kelas`** dan tombol di dalam baris filter terpotong di tepi kanan modal (`Rombel / ... Semu...`).
3. **Default Mode Orang Tua `"new"` & Spasi Header Form (`TC-11`):** Pada form `/master/siswa/tambah`, jika staf hanya mengisi data inti siswa tanpa menyentuh tab Ayah/Ibu, submit ditolak HTTP `422` karena `fatherMode`/`motherMode` mengirim `mode: "new"` dengan `fullName: ""`. Selain itu, di kartu progress header form, kata `Terverifikasi` dan `Perlu Dilengkapi` menempel berdekatan tanpa jarak yang memadai saat container sempit.
4. **Template Import XLSX Tidak Selaras dengan Kelas DB & Kurang Kolom `TANGGAL_MASUK` (`TC-13`):** File `Template_Import_Siswa_SDIT_At_Taqwim.xlsx` masih berisi contoh kelas `"1-A Abu Bakar"` (yang tidak ada di DB aktif `Kelas 1A`, `1B`, dst.) dan tidak mencantumkan kolom `TANGGAL_MASUK` padahal backend parser sudah mendukungnya.

---

## 2. Rantai Penyebab (Penelusuran `file:baris`)

1. **`StudentDetailView.tsx:2568`:**
   ```tsx
   <td>{student.gender === "L" ? "Laki-laki" : "Perempuan"} / {studentExtended.religion || "Islam"}</td>
   ```
   Cabang ternary tidak mengecek `student.gender === "P"`, sehingga `null`/`undefined` otomatis jatuh ke `"Perempuan"`, dan agama kosong otomatis diasumsikan `"Islam"`.
2. **`BulkCardsModal.tsx:99-144` & `Modal.tsx:25`:**
   `BulkCardsModal` merender `<Modal title="Cetak Massal Kartu Ujian" close={close}>` tanpa memperlebar `className` (`Modal.tsx:25` memakai `max-w-xl`), lalu di dalamnya terdapat `grid grid-cols-1 sm:grid-cols-5` untuk 2 select + tombol `Muat Ulang` yang menyebabkan select `Rombel / Kelas` melampaui/terpotong pada area modal.
3. **`StudentFormView.tsx:312-341, 739-770, 961-967`:**
   - Baris `:312-341` menginisialisasi `fatherMode` dan `motherMode` ke `"new"` saat `fatherData?.id` / `motherData?.id` tidak ada, dan `getPayload()` (`:739-770`) tetap mengirim `mode: "new"` meski `fatherName` / `motherName` kosong.
   - Baris `:961` memakai `flex items-center justify-between text-[11px] ...` pada container `min-w-[220px]` tanpa `gap-3`.
4. **`server/studentMaster.ts:2701-2736`:**
   `generateStudentImportTemplateXlsx` menulis header 13 kolom tanpa `TANGGAL_MASUK` dan hardcoded sample kelas `"1-A Abu Bakar"`, sedangkan `previewStudentImport` (`:2316-2322`) sudah membaca kolom `TANGGAL_MASUK`.

---

## 3. Dampak

- **Kesalahan Informasi Dokumen Resmi (`P1`):** Formulir biodata cetak A4 bisa memuat data jenis kelamin yang keliru (`Perempuan` padahal `null` / bukan `P`).
- **Kendala Penggunaan & Import (`P2–P3`):** Pengguna kesulitan memilih rombel di Cetak Kartu Massal karena UI terpotong, gagal mendaftar siswa baru jika tidak membuka tab Ayah/Ibu, dan rawan gagal validasi kelas saat memakai contoh dari template import XLSX.
