# 7. Skema Tampilan Wajib & UI FREEZE — Master Siswa SDIT AT-TAQWIM

> [!IMPORTANT]
> **MANDATORY UI FREEZE:** Baseline visual Master Siswa telah diperbaiki dan disetujui pengguna pada commit `e3b88d4` menggunakan Base Component.
> Seluruh layout desktop 2-panel, sidebar navigasi 10 section, warna palet emerald/zinc, spacing, tipografi, dan penataan field berstatus **DIKUNCI (FROZEN)**.
> Segala perubahan pada frontend hanya diizinkan untuk:
> 1. Wiring event handler dan state management.
> 2. Validasi input dan mapping DTO server-side.
> 3. Integrasi pemanggilan API backend aktual (menghapus simulasi/mock).
> 4. Penanganan pesan error/retry di slot visual yang sudah ada.

## 1. Aturan Desain Visual & UI Freeze
1. Mengikuti brand token SDIT AT-TAQWIM: palet hijau islami `#10b981`/`#059669`, tipografi sans-serif modern, radius sudut konsisten, focus visible ring, dan ikon Lucide React.
2. Layout Desktop 1440px: Form menggunakan layout 2 panel (Sidebar Navigasi 10 Section di sebelah kiri selebar ~260px, panel konten aktif di kanan selebar ~75%).
3. Layout Mobile 390px: Navigasi section berupa dropdown selector/accordion di bagian atas form, konten 1 kolom, footer action bar sticky di bawah dengan tombol responsif.
4. Jangan membuat 10 card bertumpuk ke bawah secara vertikal; user harus dapat melompat langsung antar section tanpa kehilangan state form yang sedang diisi.

## 2. Wireframe Desktop Form Siswa (10 Section)
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Master Data / Siswa / Tambah Siswa                                           │
│ Tambah Siswa Baru                    Lengkapi biodata dan administrasi siswa │
├─────────────────────────────────────────────────────────────────────────────┤
│ Kelengkapan biodata [██████░░░░] 60%    Dokumen: 3/5 terverifikasi             │
│ Draft: perubahan tersimpan otomatis 10:45 WIB                               │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ BAGIAN PENGISIAN          │ 01. Identitas Siswa                              │
│ 01 Identitas Siswa      ● │ Isi identitas sesuai dokumen kependudukan.       │
│ 02 Alamat & Domisili    ! │                                                  │
│ 03 Registrasi Akademik  ✓ │ [ FOTO 3×4 ]  [Pilih/Ganti Foto] [Hapus Foto]      │
│ 04 Data Ayah            ! │               Format JPG/PNG/WEBP maks 5 MB      │
│ 05 Data Ibu             ! │                                                  │
│ 06 Wali & Darurat       ! │ Nama lengkap *           Nama panggilan          │
│ 07 Kesehatan            – │ [___________________]   [____________________]  │
│ 08 Bantuan Pendidikan   – │ NIS *                    NISN                    │
│ 09 Karakteristik Anak   – │ [___________________]   [____________________]  │
│ 10 Dokumen              ! │ NIK (16 digit)           Nomor KK (16 digit)    │
│                          │ [___________________]   [____________________]  │
│ ✓ Lengkap  ! Belum       │ Jenis Kelamin            Tempat Lahir            │
│ – Tidak berlaku          │ ( ) Laki-laki ( ) P      [____________________]  │
│                          │ Tanggal Lahir            Usia (Otomatis)         │
│                          │ [ 12/05/2016  📅 ]        9 tahun 2 bulan         │
├──────────────────────────┴──────────────────────────────────────────────────┤
│ [Batal] [Simpan Draft]                         [Kembali] [Selanjutnya →]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. Wireframe Detail Profil Siswa
```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Master Data / Siswa / Detail Siswa                          [Kembali]     │
├───────────────────────────────────────────────────────────────────────────┤
│ [FOTO 3×4]  Ahmad Fauzi                                   [Ubah Data]     │
│             NIS: 2026001 • NISN: 0123456789               [Cetak Biodata] │
│             Kelas 1A • TA 2025/2026 • Status: Aktif                       │
├───────────────────────────────────────────────────────────────────────────┤
│ Kelengkapan Biodata       Dokumen Terverifikasi     Administrasi          │
│ [████████░░] 80%          4/5 Dokumen Valid         Lengkap & Aktif       │
├───────────────────────────────────────────────────────────────────────────┤
│ Ringkasan | Biodata | Akademik | Orang Tua | Kesehatan | Bantuan | ...    │
├───────────────────────────────────────────────────────────────────────────┤
│ KONTEN TAB AKTIF:                                                         │
│ Informasi label - value 2 kolom terstruktur.                              │
│ Jika data belum tersedia: "Belum diisi" + tautan langsung ke tab edit.    │
└───────────────────────────────────────────────────────────────────────────┘
```

## 4. Wireframe Wizard Import Excel (5 Langkah)
```text
┌───────────────────────────────────────────────────────────────────────┐
│ Import Data Siswa                                                     │
│ 1. Template ── 2. Upload ── 3. Validasi ── 4. Konfirmasi ── 5. Selesai│
├───────────────────────────────────────────────────────────────────────┤
│ [Unduh Format Excel XLSX] [Lihat Petunjuk Pengisian]                  │
│                                                                       │
│ [ Drag & drop file XLSX di sini atau klik untuk browse ]              │
│ File: Data_Siswa_Kelas1.xlsx (42.5 KB)                                │
│                                                                       │
│ Hasil Validasi: 30 baris total | 28 Valid | 2 Perlu Perbaikan         │
│ [Tabel Hasil Validasi Baris demi Baris]                               │
├───────────────────────────────────────────────────────────────────────┤
│ [Batal]                                        [Lanjutkan Import]     │
└───────────────────────────────────────────────────────────────────────┘
```
