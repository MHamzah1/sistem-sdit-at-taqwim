# 9. Skenario Pengujian (TC-01 s/d TC-60)

Matriks pemetaan skenario pengujian komprehensif sesuai instruksi induk:

| ID | Skenario | Target Komponen | Ekspektasi | Status Baseline |
|---|---|---|---|---|
| TC-01 | Tambah siswa lengkap | Backend / Profile API | Data inti, alamat, keluarga dan registrasi tersimpan konsisten | IMPLEMENTED_IN_SOURCE |
| TC-02 | Tambah siswa tanpa NISN | Backend / Zod | Diizinkan, tidak membuat NISN palsu | IMPLEMENTED_IN_SOURCE |
| TC-03 | NIS duplikat | Backend / DB Constraint | Ditolak tanpa data parsial (HTTP 409) | IMPLEMENTED_IN_SOURCE |
| TC-04 | NIK duplikat | Backend / DB Constraint | Ditolak tanpa data parsial jika terisi | IMPLEMENTED_IN_SOURCE |
| TC-05 | NISN duplikat | Backend / Zod | Ditolak bila terisi | IMPLEMENTED_IN_SOURCE |
| TC-06 | NIK/KK/NISN salah panjang | Backend / Zod | Error field spesifik 422; tidak disimpan | IMPLEMENTED_IN_SOURCE |
| TC-07 | Edit biodata siswa existing | Backend / Profile API | Prefill, update benar, tidak duplikat terhadap diri sendiri | IMPLEMENTED_IN_SOURCE |
| TC-08 | Siswa legacy tanpa kolom baru | Backend / State | Tetap bisa dibaca dan diedit tanpa crash | IMPLEMENTED_IN_SOURCE |
| TC-09 | Tanggal lahir invalid/masa depan | Backend / Business | Ditolak; usia kalender dihitung benar | IMPLEMENTED_IN_SOURCE |
| TC-10 | Simpan/resume draft | Backend / Draft API | Data tersimpan; tidak masuk siswa aktif atau invoice | IMPLEMENTED_IN_SOURCE |
| TC-11 | Ayah yang sama untuk beberapa siswa | Backend / Family API | Satu individu, relasi valid per siswa | IMPLEMENTED_IN_SOURCE |
| TC-12 | Ibu yang sama untuk beberapa siswa | Backend / Family API | Satu individu dipakai ulang tanpa duplikasi | IMPLEMENTED_IN_SOURCE |
| TC-13 | Pilih orang tua existing | Backend / Family Search | Data terisi dan relasi tertaut tepat | IMPLEMENTED_IN_SOURCE |
| TC-14 | Wali dari ayah/ibu | Backend / Family API | Mengambil referensi, bukan salinan ganda | IMPLEMENTED_IN_SOURCE |
| TC-15 | Orang tua meninggal/tidak diketahui | Backend / Family API | Field kondisional tidak memblokir simpan | IMPLEMENTED_IN_SOURCE |
| TC-16 | Guardian portal existing | Backend / Guardian Link | Link sah tetap ada; tidak ada eskalasi akses | IMPLEMENTED_IN_SOURCE |
| TC-17 | Gagal simpan relasi/konkurensi | Backend / Transaction | Rollback bersih seluruh mutasi | IMPLEMENTED_IN_SOURCE |
| TC-18 | Tambah pengukuran fisik | Backend / Periodic API | Record baru tersimpan dengan tanggal/semester | IMPLEMENTED_IN_SOURCE |
| TC-19 | Riwayat pengukuran fisik | Backend / Periodic API | Record lama tidak tertimpa histori | IMPLEMENTED_IN_SOURCE |
| TC-20 | Data ukur invalid | Backend / Zod | Validasi angka positif, tinggi/berat masuk akal | IMPLEMENTED_IN_SOURCE |
| TC-21 | Tambah bantuan pendidikan | Backend / Aid API | Invoice SPP dan kelayakan ujian tidak berubah | IMPLEMENTED_IN_SOURCE |
| TC-22 | Upload dokumen valid | Backend / Files API | Metadata dan private storage konsisten | IMPLEMENTED_IN_SOURCE |
| TC-23 | MIME/signature tidak valid | Backend / Files API | Ditolak backend | IMPLEMENTED_IN_SOURCE |
| TC-24 | Ukuran file melebihi 5MB | Backend / Files API | Ditolak backend dengan pesan jelas | IMPLEMENTED_IN_SOURCE |
| TC-25 | Verifikasi dokumen | Backend / Document Review | Status VERIFIED dan reviewer tersimpan | IMPLEMENTED_IN_SOURCE |
| TC-26 | Tolak dokumen dengan alasan | Backend / Document Review | Status REJECTED dan alasan tercatat | IMPLEMENTED_IN_SOURCE |
| TC-27 | Unduh file siswa lain | Backend / Files API | Ditolak walau ID/URL diketahui (IDOR protection) | IMPLEMENTED_IN_SOURCE |
| TC-28 | Endpoint tanpa sesi login | Backend / Security | Ditolak 401 tanpa kebocoran data | IMPLEMENTED_IN_SOURCE |
| TC-29 | Wali akses siswa bukan anaknya | Backend / Guardian Scoping | Ditolak 403/404 oleh guardian scoping | IMPLEMENTED_IN_SOURCE |
| TC-30 | Wali mencoba ubah kelas/SPP | Backend / Security | Ditolak server 403 | IMPLEMENTED_IN_SOURCE |
| TC-31 | Role tanpa izin medis | Backend / Security | Tidak menerima payload kesehatan | IMPLEMENTED_IN_SOURCE |
| TC-32 | Cek endpoint `/api/state` | Backend / State | Kolom sensitif baru tidak bocor | IMPLEMENTED_IN_SOURCE |
| TC-33 | Export dengan kolom terlarang | Backend / Export API | Ditolak/diredaksi sesuai whitelist izin | IMPLEMENTED_IN_SOURCE |
| TC-34 | Audit log tanpa secret | Backend / Audit | Tidak membocorkan password atau NIK penuh | IMPLEMENTED_IN_SOURCE |
| TC-35 | Generate tagihan SPP | Backend / SPP Engine | Tetap idempotent dan aturan enrolledOn terjaga | IMPLEMENTED_IN_SOURCE |
| TC-36 | Pembayaran tunai SPP | Backend / Finance | Alur kasir existing tetap benar | IMPLEMENTED_IN_SOURCE |
| TC-37 | Pembayaran transfer manual | Backend / Finance | Bukti transfer terhubung aman | IMPLEMENTED_IN_SOURCE |
| TC-38 | Verifikasi transfer SPP | Backend / Finance | Status invoice menjadi lunas | IMPLEMENTED_IN_SOURCE |
| TC-39 | Evaluasi kelayakan ujian | Backend / Exams | Deterministik 3 syarat, tidak terpengaruh biodata | IMPLEMENTED_IN_SOURCE |
| TC-40 | Dispensasi ujian kepsek | Backend / Exams | Immutability tagihan tetap terjaga | IMPLEMENTED_IN_SOURCE |
| TC-41 | Kartu ujian dengan pas foto | Frontend / ExamCardView | Foto terotorisasi tampil benar | IMPLEMENTED_IN_SOURCE |
| TC-42 | Cetak kartu ujian massal | Frontend / Bulk Exam Cards | Layout dan QR tetap rapi | IMPLEMENTED_IN_SOURCE |
| TC-43 | Portal wali banyak anak | Frontend / Guardian Portal | Hanya anak terhubung yang tampil | IMPLEMENTED_IN_SOURCE |
| TC-44 | Karakteristik anak | Backend / Karakteristik | Jawaban terbaca dari tabel existing | IMPLEMENTED_IN_SOURCE |
| TC-45 | Edit biodata siswa bertagihan | Backend / Profile API | Histori tagihan SPP tidak rusak | IMPLEMENTED_IN_SOURCE |
| TC-46 | Import XLSX data valid | Backend / Import API | Data tersimpan, leading zero terjaga | IMPLEMENTED_IN_SOURCE |
| TC-47 | Import baris duplikat/invalid | Backend / Import API | Error baris ditampilkan, tidak commit parsial | IMPLEMENTED_IN_SOURCE |
| TC-48 | Import ulang file yang sama | Backend / Import API | Idempotent, tidak membuat siswa ganda | IMPLEMENTED_IN_SOURCE |
| TC-49 | Cetak formulir A4 | Frontend / Print CSS | Halaman cetak A4 rapi dan terbaca | IMPLEMENTED_IN_SOURCE |
| TC-50 | Ubah kelas siswa bertagihan | Backend / Resources Guard | Guard 409 tetap memblokir | IMPLEMENTED_IN_SOURCE |
| TC-51 | Pengajuan biodata wali | Backend / Change Requests | Perubahan menunggu review TU | IMPLEMENTED_IN_SOURCE |
| TC-52 | Skor kelengkapan kondisional | Backend / Completeness | Field NA/opsional tidak mengurangi skor | IMPLEMENTED_IN_SOURCE |
| TC-53 | Navigasi 10 section form | Frontend / Form | State tidak hilang saat pindah section | IMPLEMENTED_IN_SOURCE |
| TC-54 | Responsive mobile 390px | Frontend / UI | Tidak horizontal overflow, tombol mudah ditekan | IMPLEMENTED_IN_SOURCE |
| TC-55 | Loading, empty, & retry state | Frontend / UI | State visual jelas tanpa mock data | IMPLEMENTED_IN_SOURCE |
| TC-56 | Filter & search master siswa | Frontend / Table | Pencarian responsif dan paginasi valid | IMPLEMENTED_IN_SOURCE |
| TC-57 | Edit keluarga bersama (shared) | Backend / Family API | Perubahan berdampak lintas saudara terkonfirmasi | IMPLEMENTED_IN_SOURCE |
| TC-58 | Gagal upload dokumen | Frontend / Upload Modal | Form input tetap utuh, ada feedback error | IMPLEMENTED_IN_SOURCE |
| TC-59 | Konflik review biodata | Backend / Change Requests | Rejection/approval tercatat dengan timestamp | IMPLEMENTED_IN_SOURCE |
| TC-60 | Regresi menyeluruh | Full System | Seluruh fitur SPP, ujian, kuitansi tetap bekerja normal | IMPLEMENTED_IN_SOURCE |
