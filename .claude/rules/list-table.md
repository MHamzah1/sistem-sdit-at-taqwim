# List Table & Data Presentation

> Berlaku untuk: Seluruh tabel penyajian data (`src/components.tsx`, `src/main.tsx`).

Tabel data di sistem SDIT AT-TAQWIM disajikan menggunakan komponen terstandarisasi `DataTable` di dalam kontainer `Panel`.

---

## 1. Komponen Baku Tabel (`DataTable`)

Deklarasikan kolom tabel sebagai array objek `Column<T>[]`:
```tsx
<DataTable
  rows={students}
  columns={[
    { label: "Nama Siswa", render: (s) => <strong>{s.name}</strong> },
    { label: "NIS", render: (s) => s.nis },
    { label: "Kelas", render: (s) => className(s.classId) },
    { label: "Status SPP", render: (s) => <Badge status={studentStatus(s.id)} /> },
    {
      label: "Aksi",
      render: (s) => (
        <div className="row-actions">
          <button className="outline tiny" onClick={() => handleEdit(s)}>Edit</button>
        </div>
      ),
    },
  ]}
/>
```

---

## 2. Status Badge Semantik (`Badge`)

Gunakan komponen `Badge` dari `src/components.tsx` untuk menampilkan status entitas:
- **`green`**: `PAID` (Lunas), `APPROVED` (Disetujui), `ELIGIBLE` (Layak Ujian).
- **`red`**: `REJECTED` (Ditolak), `NOT_ELIGIBLE` (Belum Layak), `OVERDUE` (Lewat Jatuh Tempo).
- **`amber`**: `UNPAID` (Belum Bayar), `PENDING_VERIFICATION` (Menunggu Verifikasi), `SUBMITTED` (Diajukan), `REVIEWED` (Direview TU), `NOT_EVALUATED` (Belum Dievaluasi), `ELIGIBLE_DISPENSATION` (Layak · Dispensasi).

Label teks badge diterjemahkan otomatis melalui kamus `statusLabels` dari `src/data.ts`.

---

## 3. Toolbar & Filter Pencarian

1. **Toolbar Seragam (`.table-toolbar`):**
   - Sediakan input pencarian instan (`.search-field`) untuk memfilter baris berdasarkan nama siswa, NIS, atau nomor referensi.
   - Sediakan dropdown seleksi untuk memfilter kelas atau tahun ajaran.
2. **State Kosong (`.empty`):**
   - Jika hasil filter tidak menghasilkan data, tampilkan pesan informatif yang ramah (misalnya: "Belum ada data siswa untuk kelas ini").

---

## 4. Paginasi Tabel

- Tampilkan footer paginasi di bawah tabel:
  - Jumlah total baris atau posisi batch saat ini.
  - Tombol navigasi "Sebelumnya" dan "Berikutnya" yang dinonaktifkan saat berada di batas awal atau akhir halaman.
