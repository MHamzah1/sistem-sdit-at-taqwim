# Form & Input

> Berlaku untuk: Seluruh dialog input, form master, dan form transaksi (`src/components.tsx`, `src/main.tsx`).

Form pada sistem SDIT AT-TAQWIM disusun secara terstruktur menggunakan spesifikasi `FormSpec` dan komponen `DataForm`.

---

## 1. Standar Komponen Form (`DataForm`)

Jangan membangun form dengan markup HTML mentah berulang. Gunakan tipe `FormSpec` yang mendefinisikan:
- `title`: Judul formulir.
- `fields`: Daftar field input (`Field[]`).
- `initial`: Nilai awal (untuk mode edit).
- `submit`: Fungsi async pemroses data yang dipanggil saat submit.
- `note`: Catatan/keterangan pembantu (opsional).

```tsx
setForm({
  title: "Tambah Siswa",
  fields: [
    { key: "name", label: "Nama Siswa", required: true },
    { key: "nis", label: "NIS", required: true },
    { key: "classId", label: "Kelas", options: classOptions, required: true },
    { key: "enrolledOn", label: "Tanggal Masuk", type: "date", required: true },
  ],
  submit: async (values) => {
    await api("students", "POST", values);
  },
});
```

---

## 2. Input Nominal Uang (Rupiah)

1. **Format Input Finansial:**
   - Field nominal (seperti master nominal SPP atau jumlah dispensasi) harus jelas mencantumkan satuan Rupiah.
   - Nilai yang dikirim ke API backend adalah **angka murni (number/integer)**, bukan teks berformat (`150000`, bukan `"Rp150.000"`).
2. **Validasi Batas Nominal:**
   - Nominal SPP wajib bernilai positif dan bulat (tanpa desimal/sen).
   - Backend membatasi nilai nominal maksimal Rp100.000.000 via Zod validator.

---

## 3. Upload Berkas Bukti Transfer

1. **Format & Batasan File:**
   - Hanya menerima file gambar JPEG/PNG atau dokumen PDF.
   - Ukuran berkas maksimal 5 MB.
2. **Penanganan Status Upload:**
   - Nonaktifkan tombol submit selama proses upload ke Vercel Blob berlangsung (`busy: true`).
   - Tampilkan indikator progres atau pesan "Mengunggah bukti transfer...".
   - Jika gagal, tampilkan pesan error yang jelas tanpa menutup form agar user tidak perlu mengisi ulang form dari awal.

---

## 4. Konfirmasi Operasi Destruktif

- Tindakan penghapusan master data (Siswa, Kelas, Tahun Ajaran, Template) wajib menampilkan dialog konfirmasi eksplisit yang mengingatkan bahwa data yang terikat histori transaksi tidak dapat dihapus.
