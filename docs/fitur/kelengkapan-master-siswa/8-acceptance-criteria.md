# 8. Acceptance Criteria — Kelengkapan Master Siswa

1. **Schema & Model Additive:**
   - Perubahan skema di `src/db/schema.ts` tidak menghapus tabel/kolom lama dan tidak memutus foreign key yang digunakan invoice dan ujian.
   - Identifier string (NIS, NISN, NIK, KK, RT, RW, Kode Pos) mempertahankan format nol di depan (leading zero).

2. **Backend & Validasi Atomik:**
   - Tambah/ubah siswa dan data alamat, registrasi, keluarga tersimpan dalam satu transaksi database atomik yang aman dari kegagalan parsial.
   - Endpoint draft pendaftaran (`/api/student-drafts`) berfungsi menyimpan dan memulihkan isian form tanpa menerbitkan invoice SPP atau kartu ujian.
   - Pencarian keluarga existing (`/api/family-members/search`) mengizinkan pemakaian ulang ayah/ibu yang sama untuk beberapa siswa bersaudara.
   - Pendaftaran bantuan pendidikan tidak mengubah nominal tagihan SPP secara otomatis.
   - Pengunggahan dokumen menggunakan private Blob dengan token terotorisasi dan status verifikasi terpisah (`PENDING`, `VERIFIED`, `REJECTED`).
   - Guard mutasi kelas pada siswa bertagihan (HTTP 409) tetap aktif dan tidak bisa di-bypass.

3. **Frontend & UX:**
   - Form Tambah dan Ubah Siswa menggunakan layout navigasi 10 section terpadu (sidebar kiri pada desktop, accordion/dropdown pada mobile).
   - Form tidak kehilangan data input saat pengguna berpindah-pindah antar section.
   - Detail siswa menampilkan seluruh tab informasi baru di samping tab Keuangan dan Ujian yang sudah ada.
   - Daftar Master Siswa menyediakan metrik ringkasan kelengkapan, filter kombinasi (Tahun, Kelas, Status, Kelengkapan), pencarian, dan paginasi.
   - Fitur Import Excel menyediakan wizard 5 tahap dengan validasi baris sebelum commit.
   - Cetak Formulir Biodata A4 dan Ringkasan Buku Induk rapi dan siap dicetak/disimpan PDF.

4. **Keamanan & Otorisasi:**
   - Guardian scoping (anti-IDOR) ketat: wali murid hanya dapat mengakses data siswa yang sah terhubung lewat `guardian_students`.
   - Data sensitif (NIK, KK, data medis, penghasilan orang tua) tidak bocor melalui query `/api/state` atau daftar umum.
