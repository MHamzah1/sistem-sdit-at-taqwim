# 3. Spesifikasi Teknis — Master Siswa SDIT AT-TAQWIM

## 1. Arsitektur Komponen
- **Frontend:** Next.js 15 App Router, React 19, Tailwind CSS v4, Lucide React icons.
- **Routing:**
  - `/master/siswa`: Halaman utama daftar master siswa, metrik indikator, search, filter, pagination, tombol import/export, modal draft.
  - `/master/siswa/tambah`: Form 10 section dengan sidebar navigasi kiri, integrasi draft atomik.
  - `/master/siswa/[id]`: Detail profil siswa dengan navigasi tab lengkap (Ringkasan, Biodata, Akademik, Orang Tua & Wali, Kesehatan, Bantuan, Karakteristik, Dokumen, Keuangan, Ujian, Riwayat Perubahan) + modal Cetak Biodata A4 & Ringkasan Buku Induk.
  - `/master/siswa/[id]/ubah`: Form ubah biodata 10 section dengan prefill data aktual.
- **Backend Route Handlers:** Terpusat di `server/app.ts` dengan modular helper di `server/studentMaster.ts` dan `server/resources.ts`.
- **Database:** PostgreSQL via Drizzle ORM (`src/db/schema.ts`).
- **File Storage:** Private Vercel Blob dengan namespace terisolasi `student-documents/${studentId}/`.

## 2. Definisi Indikator Kelengkapan (Server-side)
Dihitung berdasarkan 10 domain:
1. **Identitas:** Nama, NIS, NIK (16 digit), Tempat/Tanggal Lahir, Jenis Kelamin. (NISN opsional, jika belum terbit tidak mengurangi skor).
2. **Alamat:** Alamat jalan, RT, RW, Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos, Jenis tinggal, Transportasi.
3. **Registrasi:** Tanggal masuk, Tahun ajaran masuk, Tingkat masuk, Kelas saat ini.
4. **Data Ayah:** Nama, Status hidup, Pendidikan, Pekerjaan (Jika hidup/tersedia).
5. **Data Ibu:** Nama, Status hidup, Pendidikan, Pekerjaan (Jika hidup/tersedia).
6. **Wali & Kontak Darurat:** Penanggung jawab siswa terpilih, Kontak darurat terisi nama & nomor HP valid.
7. **Kesehatan:** Golongan darah terisi atau ditandai tidak diketahui secara eksplisit; catatan alergi/kebutuhan khusus dikonfirmasi.
8. **Bantuan Pendidikan:** Status bantuan terkonfirmasi (Menerima / Tidak menerima).
9. **Karakteristik:** Status kuesioner terisi jika ada template aktif.
10. **Dokumen:** Minimal dokumen utama (KK, Akta Kelahiran, Pas Foto) telah diunggah dan terverifikasi.

## 3. Matriks Hak Akses (RBAC)

| Aksi | SUPER_ADMIN | TU_KEUANGAN | KEPALA_SEKOLAH | WALI_MURID |
|---|---|---|---|---|
| Baca Daftar Siswa Umum | Ya | Ya | Ya | Hanya anak sendiri |
| Baca Detail Biodata Lengkap | Ya | Ya | Ya | Hanya anak sendiri |
| Baca Data Medis/Kesehatan | Ya | Terbatas | Terbatas | Hanya anak sendiri |
| Tambah/Ubah Biodata Siswa | Ya | Ya | Baca saja | Ajukan via request |
| Verifikasi/Tolak Dokumen | Ya | Ya | Baca saja | Tidak |
| Import / Export Excel | Ya | Ya | Export saja | Tidak |
| Review Perubahan Wali | Ya | Ya | Baca saja | Tidak |
| Mutasi Kelas (Siswa Baru) | Ya | Ya | Baca saja | Tidak |
