# Master Prompt — Master Siswa V3: Focused Error Fix & UI FREEZE

**Project:** Sistem SPP & Kelayakan Ujian — SDIT AT-TAQWIM  
**Repository:** `MHamzah1/sistem-sdit-at-taqwim` | **Branch:** `main`  
**Baseline audit:** `301bbccfc5b008afbf41eb4d7c0a9d4e3288d0f9`  
**Waktu push repository:** 24 November 2026, 16:15:36 WIB  
**Baseline visual:** `e3b88d44279894261c4128ba4ee36d848dd4eb4b` dan perubahan visual sah dari pengguna.  
**Mandat:** langsung perbaiki source code; bukan audit-only. Dokumen ini adalah instruksi delta yang mengikat atas V2. Pertahankan pekerjaan yang sudah benar. Tidak ada build, migrasi, dev server, perubahan database live, atau deployment pada tahap ini.

## Role

Bertindak sebagai Senior Full Stack Developer dan QA Engineer yang bertanggung jawab menyelesaikan defect Master Siswa sampai kontrak, persistensi, keamanan, dan integrasi source konsisten. Kuasai Next.js App Router, React/TypeScript, Drizzle ORM, Neon PostgreSQL, Zod, private Vercel Blob, RBAC, transaksi database, pengujian, serta administrasi sekolah dasar. Perlakukan seluruh biodata dan dokumen anak sebagai data pribadi yang harus dilindungi.

Anda adalah pelaksana implementasi. Jangan berhenti setelah membaca, menyusun rencana, mengubah laporan, atau mengganti styling. Kerjakan perbaikan BE terlebih dahulu dan sambungkan FE yang ada. Tidak perlu meminta persetujuan ulang atas scope perbaikan yang telah disetujui. Kebijakan baru, akses data sensitif yang belum disetujui, dan perubahan schema fisik tetap memerlukan gerbang terpisah.

## Task

### 0. Kontrak pekerjaan dan urutan eksekusi

Baca `AGENTS.md`, rules, skills, task dan histori existing. Gunakan dokumen V2 di `docs/instruksi/INSTRUKSI_AGENT_FINISHING_MASTER_SISWA_V2_UI_FREEZE.md` sebagai referensi kebutuhan lengkap; dokumen V3 ini mengoreksi temuan yang masih ada pada commit 301bbcc. Jangan mengulang refactoring form atau menghapus sepuluh kolom identitas yang sudah dipulihkan.

| Task perbaikan | Fokus | FIN terkait | Prioritas |
|---|---|---|---|
| FIX-001 | Dokumen/foto siswa baru dan existing: private upload, staging, registrasi, download, review | FIN-001, 004, 007 | P0 |
| FIX-002 | Persistensi atomik tanpa duplikasi data kesehatan, bantuan dan keluarga | FIN-002, 003 | P0 |
| FIX-003 | Prefill dan round-trip form tambah/ubah; pemetaan draft | FIN-003, 007, 011 | P0 |
| FIX-004 | Schema readiness, integritas status, error handling, kompatibilitas legacy | FIN-002, 006 | P0 |
| FIX-005 | Import dan export XLSX aktual; validasi ulang dan transaksi | FIN-005 | P0 |
| FIX-006 | Satu sumber kelengkapan biodata dari backend | FIN-008 | P1 |
| FIX-007 | Kontrak API/DTO, RBAC, audit dan keamanan menyeluruh | FIN-001, 006 | P0/P1 |
| FIX-008 | Draft, Karakteristik Anak, riwayat akademik, pembaruan wali | FIN-007, 009, 010 | P1 |
| FIX-009 | Regression test, UI FREEZE, pembuktian dan koreksi laporan | FIN-011, 012 | P1 |

Urutan dependensi (ID tetap): kerjakan fondasi FIX-004 dan keamanan/kontrak FIX-007 terlebih dahulu, kemudian BE FIX-001/002, BE FIX-005/006/008, setelah kontrak stabil selesaikan FIX-003 dan seluruh wiring FE dari FIX-001–008, terakhir FIX-009. P0 tidak boleh ditunda untuk mengerjakan tampilan. Jika ada blocker schema, tetap kerjakan seluruh kode, test source, dan kontrak yang tidak terblokir. Tidak perlu memecah ID FIX menjadi TGS baru yang membingungkan; tautkan FIX ke FIN/TGS existing menurut aturan repository dan hindari ID global yang bentrok.

### FIX-001 — Perbaiki persistensi dokumen dan foto siswa

**Bukti audit:** `StudentFormView.tsx` L2431–2468: mode tambah membuat `storagePath: staging/${uploadDocFile.name}` tanpa upload; mode edit mengirim `student.id` sebagai `userId` ke helper upload. `src/lib/api.ts` L78–110 menggunakan `student-documents/${userId}/...`; `server/studentMaster.ts` L304–325, L785–813 menerima `documents: z.array(z.any())` dan memasukkan metadata jika path bukan `blob:`; L1657–1709 hanya memeriksa prefix actor pada registrasi. `server/files.ts` L216–284 membatasi akses berdasarkan `ownStudent()` tetapi belum ada izin dokumen sensitif tersendiri. Foto baru masih dibuat sebagai data URL pada `StudentFormView.tsx` L331–368.

**Backend — kerjakan dahulu:**

1. Buat kontrak staging yang nyata menggunakan private Blob dan token/receipt upload yang dikeluarkan server, dengan actor ID dari sesi, scope purpose (`STUDENT_DOCUMENT`/`STUDENT_PHOTO`), target student ID atau draft ID yang sah, expiry, state dan referensi blob acak. Jangan mempercayai userId, studentId, storage path, ukuran, MIME maupun status verifikasi dari payload browser. Bila metadata staging memerlukan entity tambahan, definisikan schema TypeScript aditif, constraint dan rencana DAT saja; tidak membuat migration.
2. Untuk siswa baru tanpa ID, gunakan draft yang terautentikasi sebagai pemilik staging. Jika belum mempunyai draft, buat/ambil draft sah terlebih dahulu tanpa aktivasi siswa. Upload byte aktual sebelum menampilkan status berhasil diunggah. Setelah finalisasi, kaitkan receipt yang masih valid ke siswa dalam transaksi DB, consume receipt sekali dan tandai dokumen PENDING. Jika upload sebelum siswa baru tidak dapat digunakan karena schema belum siap, tampilkan error `SCHEMA_NOT_READY`; jangan membuat path fiktif. Alternatif dua tahap (create lalu upload) hanya diperbolehkan jika UI menjelaskan status parsial, memungkinkan retry tanpa membuat siswa baru, dan tidak mengklaim seluruh dokumen tersimpan. Utamakan staging draft yang diminta pada V2.
3. Untuk siswa existing, validasi actor dan izin dokumen serta target siswa pada permintaan token, registrasi, penggantian dan download. Namespace harus dibentuk/diverifikasi oleh server dari actor yang login; perbaiki caller agar tidak mengirim student ID sebagai user ID. Gunakan kontrak seragam melalui API client existing, bukan duplikasi upload logic.
4. Validasi registrasi dengan schema Zod strict, ukuran aktual >0 dan <=5 MiB, allowlist JPEG/PNG/PDF dan WebP untuk foto sesuai spesifikasi, cek metadata dari Blob dan signature byte aktual. Tolak referensi ke blob yang tidak ada, prefix/purpose tidak cocok, file milik actor atau draft/siswa lain, receipt expired/consumed, URL publik, path arbitrer, atau ukuran/MIME berbeda. Jangan menjalankan macro atau membaca konten dokumen ke log. Batasi jumlah/ukuran upload. Verifikasi token sebelum baca file. Cegah filename header injection; gunakan nama file bersih untuk Content-Disposition.
5. Pisahkan metadata existing (read-only ID pada profil) dari perintah upload baru. Jangan kirim ulang semua `documents` sebagai insert; create/update hanya menerima receipt ID yang valid dan belum terikat. Gunakan unique constraint/idempotency agar retry tidak menduplikasi dokumen. Review dokumen hanya izin reviewer sah, status sah dan alasan penolakan wajib. Penggantian menjaga histori/metadata lama sesuai aturan, bukan menghapus dokumen diam-diam. Tidak mengubah transaksi bukti pembayaran existing.
6. Handle upload gagal, registrasi gagal setelah blob berhasil, finalize gagal, draft dibatalkan, receipt kedaluwarsa, dan orphan file. DB dan Blob bukan satu transaksi; gunakan lifecycle staging, status eksplisit dan compensating cleanup/retry yang terotorisasi. Jangan menghapus objek yang masih direferensikan oleh siswa lain. Jangan melakukan cleanup nyata pada production saat pengerjaan.
7. `downloadStudentDocument`: validasi sesi, izin jenis dokumen, ownership/scoping setiap request; metadata tidak berarti otomatis boleh download. Cek actual size dan MIME; stream/buffer byte lengkap sampai batas 5 MiB, response 200 tanpa Range dan 206/416 yang benar jika mendukung Range. Jangan mengekspos path/token/url privat pada response umum. Gunakan header no-store dan nosniff. Pertahankan unduh file >2 MiB yang sudah diperbaiki.
8. Foto siswa baru harus menggunakan penyimpanan private yang kompatibel dengan detail, kartu ujian individual/massal dan cetak. Jangan simpan data URL baru sebagai foto persisten. Preview browser temporer boleh untuk preview saja dan harus dibersihkan; jangan menjadi metadata persisten. Pertahankan render foto legacy yang sah, jangan migrasi/hapus foto existing tanpa persetujuan.

**Frontend — UI FREEZE:** gunakan modal, input file dan tabel dokumen yang sudah ada. Status upload berlangsung/berhasil/gagal berasal dari hasil server. Jangan menandai baris PENDING/VERIFIED seolah file tersedia jika baru dipilih. Pada tambah/draft, pertahankan receipt sesudah reload; pada ubah, gunakan actor sah dan target siswa berbeda. Tombol lihat/unduh, review, ganti dan retry memakai endpoint aktual yang terotorisasi. Jangan merombak layout atau komponen modal.

**Acceptance FIX-001:** file baru dan existing benar-benar tersimpan dan dapat dibuka ulang setelah refresh pada tahap UAT; bytes file cocok, izin sesuai, fake staging ditolak, retry tidak duplikat, file salah MIME/size/purpose ditolak, draft gagal tidak meninggalkan dokumen palsu, foto lama dan baru kompatibel dengan kartu ujian. Pada tahap source-only, sediakan bukti alur lengkap dan test yang ditulis, bukan klaim upload live berhasil.

### FIX-002 — Persistensi atomik dan pencegahan duplikasi

**Bukti audit:** `StudentFormView.tsx` L281–289, L584–608 mengisi state dari histori dan mengirim seluruh array tanpa ID. `updateStudentProfile()` pada `server/studentMaster.ts` L1455–1515 memasukkan ulang seluruh pengukuran dan bantuan. L1380–1454 membuat individu baru jika mode new, kemudian menghapus/membuat relasi. Mode edit ayah/ibu default `new`. Kontak darurat independen belum konsisten saat update.

**Backend:**

- Tetapkan kontrak typed create vs patch; bedakan nilai tidak dikirim (pertahankan), clear eksplisit (sesuai izin), record existing, dan record baru. Hindari full replacement seluruh histori dari UI. Pengukuran baru memakai client mutation ID/idempotency key yang valid, histori lama tidak ditulis ulang saat edit nama/alamat. Bantuan existing memakai ID dan operasi update yang sah bila memang diperlukan; append histori program baru tanpa duplikasi. Pertahankan periode, sumber, status, nomor bantuan dan referensi dokumen yang valid. Jangan mengubah SPP dari data bantuan.
- Validasi setiap ID existing milik siswa yang dimaksud; cegah mengubah pengukuran/bantuan siswa lain dengan menyuntik ID. Jangan hanya dedupe berdasarkan tanggal atau isi karena dua pengukuran valid dapat memiliki nilai sama. Pilih mutation key/unique constraint sesuai domain, operasi retry harus deterministik.
- Orang tua existing: gunakan `familyMemberId` sah, pertahankan individu dan relasi ketika tidak berubah. Bedakan `none`, `existing` (link saja), `new`, serta perubahan biodata individu bersama yang eksplisit. Jangan membuat ayah/ibu baru hanya karena membuka form edit. Jangan mengubah biodata orang tua semua saudara melalui submit profil biasa tanpa konfirmasi dampak dan otorisasi. Validasi ID, role relasi, uniqueness; cegah dua ayah/ibu/kontak utama aktif yang bertentangan. Pemilihan kontak utama atau penanggung jawab pembayaran harus mereferensikan individu yang benar-benar terhubung, bukan nama/HP yang kebetulan sama. Jangan memberikan izin portal otomatis; `guardian_students` tetap jalur akses sah terpisah.
- Kontak darurat harus tersimpan sebagai relasi/record independen bila bukan ayah/ibu; pertahankan nama, hubungan, nomor telepon dan flags saat edit/reload. Jangan fallback primary contact sebagai emergency contact yang dianggap sudah terisi. Tangani `none` dan orang tua tidak diketahui/meninggal tanpa data fiktif. Jangan menyimpulkan hidup, pekerjaan, penghasilan, pendidikan berdasarkan default UI.
- Gunakan transaksi atomik untuk identitas, alamat, registrasi, keluarga, kesehatan, pengukuran, bantuan dan consume receipt dokumen sesuai FIX-001. Pertahankan unique NIS/NIK/NISN, normalisasi kosong menjadi null, tanggal kalender valid, validasi class/year, status dan FK. Gunakan conflict handling dan lock/revision pada data yang dapat diubah serentak; race condition tidak boleh menghasilkan duplikasi atau lost update. Jangan menghapus data existing untuk mempermudah update; gunakan upsert/preserve pada alamat sesuai tipe dan perubahan yang eksplisit.
- Pastikan semua jalur write (legacy resource, create profil, patch profil, import, review wali, draft finalize) mematuhi invariant yang sama. Jangan mengubah invoice histori, tanggal masuk atau kelas bertagihan tanpa workflow mutasi yang disetujui. Catat perubahan melalui audit yang telah disanitasi.

**Frontend:** payload edit hanya perubahan sah dan record baru, bukan seluruh histori tanpa identitas. Pertahankan ID existing, state retry, dan pilihan keluarga aktual; tampilkan konflik server di slot feedback existing. Sinkronkan hasil API/reload setelah save.

**Acceptance FIX-002:** satu pengukuran tetap satu setelah tiga kali edit identitas; satu bantuan tetap satu; anggota keluarga dan relasi existing tidak berubah tanpa tindakan eksplisit; penambahan baru menghasilkan satu record; ulang submit tidak menggandakan record; kontak darurat non-orang tua tersimpan dan terbaca lagi; perubahan shared parent tidak otomatis menambah akses wali; gagal satu operasi merollback bagian DB atomik; tagihan lama tidak berubah.

### FIX-003 — Prefill, round-trip dan mapping form tanpa mengubah desain

**Bukti audit:** `StudentFormView.tsx` L119–330: `sameAsIdentity` default true, `fatherMode` dan `motherMode` default new meski ID ada, kontak utama/pembayar default ayah, penghasilan/pendidikan default buatan, emergency diinisialisasi/ditimpa dari ayah/ibu; L469–608 payload belum memuat semua informasi dan membuang ID. Halaman edit sudah mempunyai loading/error/retry yang perlu dipertahankan.

1. Bedakan DTO persisted profile, draft input dan form state. Jangan memakai DTO yang berbeda shape untuk prefill dengan asumsi sama. Buat mapper typed `profileToForm`, `draftToForm`, `formToCreate`, `formToPatch` (nama dapat mengikuti konvensi repo). Uji round-trip, null/undefined, enum dan tanggal (date-only Asia/Jakarta). Jangan memakai `any` untuk menutupi mismatch.
2. Hydrate dari profil penuh yang sah, bukan global state minimal jika field tidak ada di sana. Jangan render form edit yang dapat disimpan sebelum fetch sukses. Pertahankan error/retry existing; pada perubahan student/draft ID tangani response terlambat dan reset state sesuai target. Jika field dimasking/tidak diizinkan, jangan masukkan kembali masking atau default sebagai nilai write.
3. `sameAsIdentity` berdasarkan data alamat aktual/flag yang disimpan; jika domisili berbeda, edit identitas lain tidak boleh menimpa alamat domisili. Mode keluarga existing ketika record ID tersedia; mode none/unknown saat belum ada data. Ambil flags kontak utama, penanggung jawab SPP dan emergency relation dari server. Autofill hanya ketika user secara eksplisit memilih sumber; jangan menjalankan effect yang menimpa kontak darurat tersimpan ketika mount.
4. Tidak mengisi jenis kelamin, pendidikan, pekerjaan, agama, kewarganegaraan, urutan anak, jumlah saudara, penghasilan, status hidup dan informasi lain yang belum diketahui sebagai fakta existing. Tampilkan placeholder/kosong/tidak diketahui sesuai kontrak. Default calon siswa yang telah disetujui sebagai pilihan awal hanya boleh disimpan setelah benar-benar dikonfirmasi/dipilih; jangan backfill otomatis siswa legacy. Validasi field wajib dengan pesan inline. Jangan menghapus field identitas yang sudah ada.
5. Pastikan semua field yang sudah ditampilkan memiliki mapping nyata dan tidak hilang saat create/edit/resume: identitas lengkap, alamat KK/domisili, registrasi, ayah/ibu/wali (termasuk opsi wali lainnya), kontak darurat, profil kesehatan, histori, bantuan, karakteristik dan dokumen. Pertahankan atribut yang tidak tampil/tidak diedit. Jika kebutuhan field belum ada secara visual dan penambahannya akan mengubah desain terkunci, catat `BLOCKED_UI_APPROVAL` dengan lokasi dan alasan, implementasikan kontrak BE yang aman, jangan diam-diam redesign atau klaim fungsi lengkap.
6. Draft resume: gunakan mapper khusus untuk shape `addresses.identity/domicile`, `family.father/mother/guardian`, `registration`, `aid`, `measurements`, receipt dokumen, bukan shape array dari GET profil. Pulihkan section aktif jika kontrak menyimpan state tersebut. Jangan membuat ulang draft pada setiap save. Gunakan revisi/ID aktual dan error jika request gagal.
7. Cegah double click dan request ganda; loading state di tombol existing. Jika save gagal, jangan reset input atau pindah halaman. Jika transaksi save berhasil tetapi refresh gagal, bedakan hasil save dari refresh dan tawarkan reload aman, jangan mengulangi create tanpa idempotency. Jangan simpan data sensitif ke localStorage/sessionStorage.

**Acceptance FIX-003:** buka profil/draft lalu simpan tanpa mengubah field tidak mengubah data bisnis atau menggandakan relasi; edit satu field memengaruhi field tersebut saja; alamat berbeda tetap berbeda, ibu sebagai kontak utama tetap ibu, kontak darurat terpisah tetap terpisah, data belum diketahui tidak dipalsukan; error fetch tidak menghasilkan form kosong yang bisa disimpan. Struktur UI baseline tetap sama.

### FIX-004 — Schema readiness, constraint dan integritas data

**Bukti audit:** sepuluh kolom sudah dipulihkan pada `src/db/schema.ts` L145–181 dan unique index NIK/NISN ditambahkan. `getStudentFullProfile()` L842–915 masih menggunakan `safeQuery()` fallback []/null pada 42P01/42703 dan mengisi religion/citizenship/dailyLanguage/status default saat kolom hilang. Draft dan daftar pengajuan masih punya catch yang mengembalikan array kosong. `server/app.ts` L921–959 hanya generic 503, belum ada machine-readable code `SCHEMA_NOT_READY`. `server/state.ts` memiliki compatibility projection kolom lama. Tidak ada migration baru pada perbandingan e3b88d4–301bbcc.

- Jaga sepuluh definisi kolom `nickname`, `nik`, `familyCardNumber`, `birthCertificateNumber`, `religion`, `citizenship`, `birthOrder`, `siblingCount`, `dailyLanguage`, `studentStatus` dan sepuluh entity tambahan; tidak boleh menghapus, mengganti tipe secara destruktif, atau menyembunyikan field melalui conditional `(schema as any).field`. Pertahankan constraint yang sudah benar. Tambahkan source constraint/invariant yang belum ada jika diperlukan, termasuk format NIK/NISN/KK, unique per tipe relasi yang sesuai, satu kontak utama, satu penempatan aktif menurut kebijakan yang disetujui, dan konsistensi `active` dengan `studentStatus`. Nomor KK tidak unique. Jangan mengubah aturan akademik/keuangan di luar keputusan yang sudah disetujui.
- Tetapkan satu helper klasifikasi error PostgreSQL/Drizzle, termasuk `cause` dan SQLSTATE 42P01/42703. Pada fitur Master Siswa lengkap (profile, write, import, draft, dokumen, kelengkapan, review) kembalikan HTTP 503 dengan envelope konsisten, misalnya `{ error: 'Schema Master Siswa belum siap', code: 'SCHEMA_NOT_READY' }`; jangan mengembalikan HTTP 200 dengan array kosong atau data default ketika tabel tidak ada. Gunakan code pada FE untuk feedback yang jelas dan cegah save jika tidak siap. Bedakan 401/403, 404, 409, 422, 503 dan jaringan; tidak mengekspos SQL, constraint detail berisi data pribadi, stack trace atau secret.
- Pertahankan kompatibilitas fitur lama melalui projection kolom legacy yang memang tersedia. Audit seluruh jalur yang membaca `students` termasuk `server/state.ts`, `server/resources.ts`, `server/business.ts` dan endpoint generic; `select()`/`returning()` schema terbaru pada jalur legacy bisa gagal sebelum migrasi. Sediakan explicit capability/availability bila legacy response membutuhkan status fitur baru; `nickname: null` bukan berarti data sebenarnya kosong jika schema belum tersedia. Jangan membuat status pindah/lulus palsu dari `active`. Jangan mengklaim fitur baru tersedia di legacy mode. Jangan memperkenalkan flag palsu yang selalu true/false tanpa kontrak.
- Atur `studentStatus` vs `active` di semua write path; buat rencana backfill existing berdasarkan status yang benar-benar diketahui. Jangan default ACTIVE untuk siswa lama nonaktif tanpa deteksi. Rencanakan pemeriksaan NISN/NIK duplikat dan relasi sebelum constraint diterapkan. Jangan menjalankan database checker terhadap Neon live pada tahap ini. Jika butuh preflight, tulis spesifikasi query read-only untuk tahap DAT yang akan disetujui terpisah.
- Dokumentasikan schema delta, dependencies, rencana backup/restore, urutan release kompatibel, pemeriksaan data dan rollback. Jangan membuat migration SQL, menjalankan drizzle-kit push, atau mengubah schema fisik. Status runtime `BLOCKED_SCHEMA` tetap sampai gerbang DB benar-benar dibuktikan.

**Acceptance FIX-004:** sepuluh kolom tetap terdefinisi; tidak ada fallback yang memalsukan data profil lengkap; schema hilang memberi 503 terstruktur dan aksi FE tidak membuat data parsial; jalur legacy yang kompatibel tetap aman; invariant status/relasi didefinisikan dan diuji pada source; tidak ada perubahan database fisik.

### FIX-005 — Import/export XLSX yang benar, bukan CSV yang diberi nama Excel

**Bukti audit:** `master/siswa/page.tsx` L258–348, L1160–1196 menerima CSV, `readAsText()` dan `split(',')`; `server/studentMaster.ts` L2021–2264 sudah memiliki API preview/commit tetapi fallback gender L, kelas pertama/fuzzy matching, tanggal masuk hari ini, belum memetakan NIK/KK, `server/app.ts` L253–259 commit casting `as any`. Loop satu transaksi menangkap error per baris tanpa savepoint; hal ini berisiko rollback seluruh transaksi PostgreSQL atau menyimpan sebagian record. Laporan sukses XLSX tidak sesuai implementasi.

**Backend:**

1. Pertahankan endpoint preview dan commit yang sudah ada bila dapat diselaraskan dengan kontrak baru. Implementasikan XLSX asli (format OOXML) melalui library maintained dan kompatibel Node/Next, pin versi lockfile mengikuti aturan dependensi. Verifikasi keamanan parser, jangan menjalankan formula/macro/tautan eksternal; batasi ukuran file, sheet, row count, decompressed content dan kompleksitas. CSV boleh menjadi opsi tambahan menggunakan parser CSV yang benar (quotes, koma dalam alamat, newline), bukan pengganti XLSX. Jangan mengganti ekstensi CSV menjadi XLSX.
2. Buat template XLSX asli dengan semua kolom inti planning V2: identitas, alamat, registrasi/tahun ajaran/kelas/tanggal masuk, ayah/ibu/wali. Identifier NIS/NISN/NIK/KK/no HP/kode pos/RT/RW bertipe text. Tolak angka Excel yang kehilangan digit/leading zero atau melebihi presisi; jangan mengarang ulang digit. Validasi header, sheet, cell types, formula, tanggal kalender dan nilai enum. Jangan menyediakan contoh yang memakai data anak nyata.
3. Server melakukan preview tanpa write siswa: pakai shared schema/validation create, cek duplicate NIS/NIK/NISN di file dan DB, resolve tahun ajaran + kelas secara exact/unik, cek kelas aktif/valid sesuai aturan. Kelas tidak ditemukan atau ambigu -> invalid; gender invalid -> invalid atau kosong hanya jika kontrak resmi memperbolehkan. Tidak boleh otomatis kelas pertama, gender L atau tanggal hari ini untuk data yang sebenarnya hilang. Tahun ajaran harus dipilih eksplisit bila dibutuhkan; tidak mengandalkan nama kelas lintas tahun. Beri error per row/field dan nilai yang perlu diperbaiki tanpa bocor identifier penuh pada log.
4. Preview receipt/token terikat actor, canonical content hash, revision, expiry dan daftar row yang diizinkan. Simpan staging yang sah bila perlu (source schema saja) atau desain token signed yang aman; jangan mempercayai `isValid`/`resolvedClassId` dari client sebagai otoritas. Commit harus membaca kembali data tervalidasi dan memvalidasi ulang FK, duplicates dan izin pada saat write, termasuk perubahan sejak preview. Gunakan idempotency key agar double click/retry tidak menghasilkan siswa ganda.
5. Gunakan service create siswa yang sama dengan input manual, termasuk validasi keluarga, registrasi, status dan transaksi. Untuk mode partial import yang menampilkan hasil per baris, setiap row wajib atomik dengan transaksi terpisah atau savepoint yang benar; jangan menangkap SQL error dalam transaksi aborted lalu lanjut seolah normal. Jika memilih all-or-nothing sesuai kontrak, satu kegagalan merollback batch dan laporkan jelas. Jangan menambah createdCount sebelum row dan semua dependensi committed. Jangan diam-diam overwrite siswa existing. Laporkan jumlah benar-benar committed, gagal, terlewati, ID hasil, error yang aman. Retry dengan token sama mengembalikan hasil sebelumnya/konflik eksplisit.
6. Export XLSX server-side dengan scope/permission, field whitelist, filter kelas/tahun ajaran/status/kelengkapan/selected IDs, audit redacted. Data sensitif tidak otomatis masuk export umum. Semua text diperlakukan sebagai nilai literal, cegah formula injection untuk XLSX dan CSV. Jangan mengklaim kompatibel Dapodik tanpa bukti format. Pertahankan cetak biodata/buku induk, QR, kartu ujian dan kuitansi existing.

**Frontend — pertahankan wizard 5 tahap:** 1 template XLSX + petunjuk, 2 pilih file XLSX, 3 hasil validasi aktual, 4 konfirmasi jumlah valid, 5 hasil commit server. Jangan mengubah layout, warna, ukuran modal atau posisi tombol. Boleh memperbaiki label/accept file yang salah (CSV -> XLSX) dan feedback di slot existing. Tombol commit tidak aktif ketika tidak ada baris valid, preview basi atau sedang loading. Hasil menampilkan actual committed count dan row errors, menyediakan laporan gagal melalui aksi existing/slot yang disetujui, serta refresh daftar. Tidak boleh timer simulasi atau success text statis. Jika tambahan visual diperlukan di luar slot, catat blocker UI approval; jangan menghapus kebutuhan fungsional.

**Acceptance FIX-005:** file template benar-benar dapat dibuka sebagai XLSX, leading zero utuh, kelas/gender invalid tidak tercatat, data baru tersimpan setelah reload (UAT kemudian), retry aman, preview tanpa write, invalid commit/replayed/modified token ditolak, kegagalan insert keluarga merollback row/batch sesuai kontrak, export scope benar dan tidak bocor data sensitif. Tidak ada klaim runtime tanpa eksekusi.

### FIX-006 — Satu sumber perhitungan kelengkapan biodata

**Bukti audit:** `master/siswa/page.tsx` L44–54 masih memakai `estimateCompleteness()` dengan maksimum 2,5/10 = 25%; filter lengkap memakai ambang 80. `StudentFormView.tsx` L419–468 dan sidebar memakai rumus lokal; `server/studentMaster.ts` L326–490 memiliki engine 10 section tetapi KK belum diperhitungkan, bantuan selalu COMPLETE, karakteristik selain EMPTY dianggap COMPLETE, denominator semua section dan hitung dokumen belum konsisten dengan applicability.

- Definisikan satu engine pure backend yang menerima evidence data aktual untuk 10 section (identitas, alamat, registrasi, ayah, ibu, wali/darurat, kesehatan, bantuan, karakteristik, dokumen). Status COMPLETE/INCOMPLETE/NOT_APPLICABLE, missing fields dan reason per section, applicableCount, completedCount, percentage dan isComplete. Bedakan data tidak diketahui, tidak berlaku, tidak memiliki bantuan, belum diisi, dan akses dibatasi. Jangan memaksa golongan darah/penyakit diketahui agar siswa lengkap jika bukan persyaratan yang disetujui. NISN belum diterbitkan bukan kegagalan; NIK/KK yang belum dilengkapi terlihat sebagai administrasi belum lengkap. Orang tua meninggal/tidak diketahui dan dokumen pindahan/bantuan mengikuti applicability. Karakteristik ditentukan template/submission yang berlaku; tidak boleh otomatis lengkap ketika data belum dimuat. Dokumen required ditentukan kebutuhan siswa, hitung tipe unik yang valid dan VERIFIED; bedakan kelengkapan biodata vs status verifikasi dokumen. Aturan wajib mengikuti planning yang telah disetujui; jika keputusan persyaratan belum ada, laporkan policy gap alih-alih mengarang aturan.
- Rumus persentase konsisten (completed applicable / applicable); tangani denominator nol secara eksplisit, jangan mengklaim lengkap tanpa evidence. `isComplete` berdasarkan seluruh persyaratan berlaku terpenuhi, bukan ambang lokal 80% yang dianggap lengkap. Jika ada label hampir lengkap, pisahkan dari COMPLETE. Jangan menghubungkan completeness ke status SPP/ujian.
- Sediakan endpoint list/summary ringan dengan skor authoritative per siswa, stats, filter, search dan pagination sesuai scope. Query agregat/batch; jangan fetch profil lengkap satu per satu atau mengirim data medis untuk menghitung skor di browser. Detail memakai engine sama; untuk unsaved form gunakan endpoint preview validasi atau shared pure rule yang sama (bukan rumus FE mandiri), dengan label estimasi perubahan belum disimpan. Pada schema unavailable, return status unavailable atau 503 yang jelas, bukan 0%/100% palsu.
- Hapus `estimateCompleteness()` dari list dan rumus independen yang menyebabkan beda angka. Hubungkan kartu ringkasan, filter, badge sidebar, progress bar, detail, dan dokumen dengan DTO yang sama. Invalidate/refetch ketika save, upload/review, atau pengisian karakteristik berhasil. Pertahankan posisi dan styling semua komponen.

**Acceptance FIX-006:** siswa dengan data valid lengkap dapat mencapai 100% pada list dan detail; incomplete tampil sesuai field aktual; filter COMPLETE menghasilkan siswa yang benar; status karakteristik dan dokumen memengaruhi skor hanya sesuai aturan; data unknown tidak dianggap terisi; optional/NA tidak menurunkan skor; tidak ada N+1 profile request dan tidak ada kebocoran payload sensitif.

### FIX-007 — Kontrak API/DTO dan keamanan data

**Bukti audit:** `StudentDetailView.tsx` L222–309, L1702, L1769 mengirim/membaca `measuredAt`, `programName`, `year`, `amount`, sementara schema L294–313 menggunakan `measurementDate`, `aidSource`, periode tanggal dan field yang berbeda. URL download `/content` dan payload review `{ approved, rejectionReason }` sudah diselaraskan; jangan merusaknya. `server/security.ts` L121–122 menganggap `master` sebagai seluruh izin sensitif. `getStudentFullProfile()` L1048–1092 memasking beberapa field tetapi mengirim `measurements`, `aidRecords`, `addresses`, metadata dokumen dan objek family spread/portalGuardians. Download pada `server/files.ts` hanya ownStudent. Audit sanitizer sudah tersedia namun perlu cakupan key/nilai sensitif yang benar.

**Backend:**

- Buat DTO request/response typed dan schema strict yang menjadi kontrak eksplisit untuk profile create/patch/get, list/summary/completeness, keluarga search, draft, measurements, aid, documents, import/export dan change request. Gunakan codegen atau shared TS types/Zod sesuai konvensi repo; tidak `as any` atau `z.any` pada payload kritis. Jangan memakai field DB yang tidak tersedia hanya untuk memenuhi UI; kebutuhan baru di luar planning dicatat, bukan ditebak.
- `measurementDate` adalah tanggal pengukuran; `heightCm`, `weightKg`, `semester`, `academicYearId`, `notes` mengikuti schema. Hapus/abaikan hanya melalui keputusan eksplisit atribut yang tidak didukung (mis. head circumference untuk SD); jangan silently strip input yang ditampilkan. Untuk bantuan, gunakan `aidType`, `aidNumber`, `aidSource`, `startDate`, `endDate`, `status`, `notes`, referensi dokumen sesuai model; jangan memetakan `year`/`amount`/`programName` tanpa aturan. Bila label/field existing tidak setara semantik, tandai kebutuhan penyesuaian UI minimal untuk persetujuan, jangan mengarang nominal/periode. Kontrak review dokumen `{ status, rejectionReason }`; pengajuan `{ approved, rejectionReason }`; bentuk response GET requests/drafts typed dengan ID/status konsisten (flatten atau mapping nested `request`, bukan tebakan).
- Laksanakan granular authorization deny-by-default per kategori: identitas sensitif (NIK/KK/dokumen), kesehatan termasuk pengukuran, bantuan/penghasilan, pengelolaan dan review dokumen, download, export sensitif. Jangan menyamakan akses baca/master dengan izin semua kategori. Petakan terhadap role/permission existing setelah baca policy. Definisikan izin di source sesuai konvensi; jangan memberikan grant otomatis ke role yang belum disetujui atau mengubah seed/live user untuk membuka akses. Catat mapping yang perlu persetujuan sebagai `BLOCKED_POLICY`, lanjutkan bagian aman lainnya.
- Ownership/scoping dan permission keduanya wajib: wali hanya siswa terkait via `guardian_students` dan action yang diizinkan; tidak semua data keluarga saudara atau kesehatan boleh diakses walau ID siswa benar. Role read tidak otomatis melihat kesehatan, pengukuran, NIK/KK penuh, penghasilan, dokumen/filename sensitif atau alamat lengkap yang tidak diperlukan. Projection whitelist di server, jangan object spread lalu berharap masking cukup. Field tidak diizinkan diomit atau dinyatakan restricted sesuai DTO; jangan expose melalui `/api/state`, endpoint generic, pencarian keluarga, detail, export, audit list atau error. Untuk search keluarga, berikan hasil minimal dan masked; full detail hanya jika memang boleh. Validasi permission pada setiap route, bukan tombol UI saja.
- Perkuat `sanitizeForAudit` untuk nested object/array, case/alias key, isi dokumen/file path/token, medical/measurement, phone/email/address/NIK/KK, penghasilan, patch guardian dan error. Minimalkan snapshot menjadi ID/action/changed keys bila memungkinkan; jangan log raw patch, isi request, nama file sensitif, query parameters/SQL atau token. Audit create/update/review/import/export dan perubahan hubungan dengan actor, entity ID dan timestamp yang sah. Jangan menghapus audit historis secara sepihak.
- Gunakan `src/lib/api.ts` untuk seluruh mutation agar CSRF/session/error mapping seragam. Semua request body dan response di caller dicek terhadap schema; response error machine-readable tidak ditelan. Perbaiki detail GET profile yang masih mengabaikan error: bedakan loading/unavailable/forbidden dan data kosong yang benar. Pastikan URL, verb, status, CSRF, content-type dan field names cocok. Jangan menulis helper kedua tanpa kebutuhan.

**Acceptance FIX-007:** semua endpoint memiliki kontrak dan test negatif; request pengukuran memakai measurementDate dan kembali dalam bentuk yang sama; aid tidak silently membuang input; review dan unduh berfungsi sesuai izin; user nonprivileged tidak menerima measurement/medical/pendapatan/dokumen yang dibatasi pada raw JSON maupun download; wali tidak dapat akses siswa lain atau self-grant; audit redacted; API error nyata tampil pada UI existing. Jangan klaim izin production terpasang bila belum diterapkan.

### FIX-008 — Selesaikan draft, karakteristik, akademik, dan pengajuan wali

**Bukti audit:** `createStudentAtomic` L815–834 memeriksa draft setelah insert lalu update status tanpa conditional lock/revision. `saveStudentDraft` L1520–1574 menyimpan `data as any`, update berdasarkan ID saja setelah check, dan fallback []. Form resume menggunakan persisted DTO shape yang berbeda. `getStudentFullProfile` L988–1010 mengembalikan summary dari submission, namun section 09 form/detail masih statis. `updateStudentProfile` L1286–1336 memilih satu enrollment tanpa urutan/identitas periode dan tidak menjaga seluruh histori. `reviewProfileChange` L1896–2008 mengecek status sebelum transaksi dan menerapkan patch bebas tipe; approval alamat tidak membuat record jika tidak ada; `domicileStreet` dapat diarahkan ke IDENTITY. Dashboard wali sudah punya entry point, jangan dihapus.

**A. Draft**

- Terapkan draft schema parsial typed, boleh belum lengkap tetapi validasi struktur, ukuran dan izin; simpan data di DB bukan browser storage. Scope actor+draft ID; update revision compare-and-set atau lock; draft yang finalized tidak boleh ditimpa/dihapus. Finalisasi lock draft dalam transaksi yang sama sebelum create, verifikasi ownership, status, revision, payload final, receipts dan idempotency; hanya satu siswa per draft, retry mengembalikan ID yang sama atau 409 eksplisit. Jangan mengandalkan check status di luar transaksi atau NIS unique saja. Draf tidak aktif, tidak menghasilkan invoice/kartu ujian, batal/expiry menangani staging sesuai FIX-001. Pertahankan URL `?draftId=...`, perbaiki mapping dan retry pada FIX-003. Pastikan API list dan delete tidak menampilkan kosong/sukses jika gagal schema atau unauthorized.

**B. Karakteristik Anak**

- Reuse tabel `characteristic_form_templates`, `characteristic_form_fields`, `characteristic_submissions`, `characteristic_answers` dan route existing. Summary berdasarkan template yang berlaku dan status aktual (bukan semua submission lama dianggap FILLED); tampilkan nama template, status, tanggal, jumlah jawaban, ringkasan/riwayat yang memang tersedia, serta aksi melihat atau mengisi/perbarui melalui route existing yang benar sesuai izin. Jangan membuat sistem karakteristik kedua atau mengarang histori jika tabel hanya menyimpan satu submission per template/siswa. Siswa belum tersimpan: jelaskan tersedia setelah save, jangan status lengkap. Hapus label statis yang mengklaim terhubung/terisi tanpa data. Gunakan area section 09/tab existing; jika aksi/field baru menuntut perubahan visual di luar baseline, dokumentasikan persetujuan yang diperlukan. Update completeness saat data karakteristik berubah.

**C. Riwayat akademik**

- Bedakan registrasi awal (metadata administratif) dan placement per periode. Pilih record berdasarkan ID/academic year/effective dates dan status yang tepat; jangan `.limit(1)` sembarang. Pertahankan histori; bila perubahan kelas diperbolehkan untuk siswa belum bertagihan, sinkronkan siswa dan enrollment aktif secara atomik, tutup record lama dan catat record baru sesuai kebijakan; jangan menimpa histori lama atau membuat dua enrollment aktif. Pastikan tanggal masuk, tahun ajaran dan classId konsisten. Pertahankan 409 perubahan kelas/tanggal masuk untuk siswa bertagihan pada semua jalur, termasuk import/legacy/patch; race dengan generate invoice dicegah lewat transaksi/invariant bersama. Mutasi berdampak finansial yang belum disetujui tetap `BLOCKED_POLICY`. Status pindah/lulus/mengundurkan diri tidak menghapus invoice, kuitansi, eligibilities atau kartu ujian historis. Tampilkan riwayat akademik dan audit changes aktual sesuai akses di tab existing, tidak mengarang data legacy. Jika tab baru diperlukan di luar baseline, catat UI approval terlebih dahulu.

**D. Pembaruan biodata wali**

- Pertahankan entry point dashboard dan antrean TU existing. Gunakan schema strict typed untuk patch field yang benar-benar boleh diajukan (nilai, panjang, tanggal, enum, address type, reason), bukan `z.record(..., z.any())` dengan whitelist nama saja. Jangan izinkan `name`, kelas, NIS, status akademik/keuangan/ujian atau key lain di luar policy. Scope pemohon sebagai wali sah terhadap siswa; staf review dengan izin sah, pemohon tidak bisa self-review atau memintas jalur. Verifikasi akses lagi saat review. DTO harus membedakan identity vs domicile, kontak wali vs emergency, data before/after yang boleh ditampilkan, reason terpisah dari patch. Untuk setiap key yang diterima harus ada handler nyata; tolak unsupported keys, jangan mengabaikan silently. Create alamat jika belum ada hanya jika data valid dan policy mengizinkan; jangan menulis alamat domisili ke KK. Jangan mengubah telepon seluruh guardians yang kebetulan share userId tanpa scope/link eksplisit.
- Approval atomic: lock/revision/conditional update WHERE status SUBMITTED; periksa baseline values/revision agar approval tidak menimpa perubahan lebih baru; jika konflik 409 dan review ulang. Apply patch yang tervalidasi + status + audit pada transaksi sama. Penolakan tidak mengubah biodata, alasan wajib. GET queue/riwayat typed; caller menggunakan ID/status dari bentuk response sebenarnya. Refresh dari server, jangan hanya setState status palsu. Jangan mengklaim approval sukses ketika tidak ada perubahan yang diterapkan.

**Acceptance FIX-008:** draft resume seluruh input dan receipt, finalize paralel tidak membuat dua siswa; karakteristik tampil berdasarkan actual template/submission; riwayat placement tidak tertimpa, guard invoice berlaku; wali hanya mengajukan field yang valid, perubahan terjadi setelah review sah, domisili terpisah, konflik/review ganda ditolak, hasil reload sesuai server.

### FIX-009 — QA, UAT plan, koreksi laporan dan gerbang penutupan

**Bukti audit:** `tests/student-master.test.ts` mempunyai 14 definisi unit test, laporan Agent menyatakan 14 lulus dan typecheck 0 error. Audit belum menjalankan tes sendiri. Laporan `LAPORAN_FINISHING_MASTER_SISWA.md` memberi LULUS untuk 80 skenario dan mengganti beberapa ID/skenario, meski runtime DB belum diverifikasi; `_ACTIVE-TASK.md` menyatakan selesai pada source. Perbaiki status berdasarkan bukti, bukan mengubah nama test untuk membuat hasil tampak lulus.

- Pertahankan TC-01–TC-80 dari dokumen instruksi V2 (reproduksi di bawah). Jangan mengganti ID, skenario, expected outcome atau menurunkan acceptance. Tambahkan regression khusus FIX-001–009. Kaitkan setiap test ke path/simbol, FIN/FIX dan acceptance. Unit test pure hanya membuktikan logika yang benar-benar diuji, bukan end-to-end DB atau upload Blob. Tulis integration test/fixture dan UAT steps untuk gerbang selanjutnya; jangan mengeksekusi fixture yang menjalankan migrasi saat ini.
- Periksa script sebelum menjalankan `npm run typecheck` (`tsc --noEmit`) dan unit test murni yang tidak membutuhkan build/dev/migrasi/DB/Blob live. `npx tsx --test tests/student-master.test.ts` hanya jika dependency lokal siap, tidak memicu operasi terlarang, dan test benar-benar pure. Jangan menjalankan suite keseluruhan tanpa audit script/fixture. Jangan menggunakan `next-env.d.ts` atau file generated sebagai jalan pintas untuk menutupi error. Catat command asli, waktu, exit code, pass/fail/skip, output yang relevan dan snapshot/source yang diuji. Jangan mengedit test expected untuk membenarkan bug.
- Cek static diff seluruh perubahan, referensi handler, request/response shape, transaction/locking, authorization, error propagation, lifecycle files, typed schema dan dependensi. Pastikan tidak ada TODO/simulasi yang dianggap selesai. Validasi `git diff --check` bila tersedia. Tidak melakukan git commit/push sendiri tanpa instruksi terpisah.
- Uji regressions SPP (generate invoice, pembayaran tunai/transfer, verifikasi, tunggakan), kelayakan ujian, dispensasi, kartu ujian individual/massal dan foto, kuitansi, master wali, portal dan karakteristik sesuai test plan. Hanya data sintetis di lingkungan isolasi saat UAT diizinkan. Jangan menyentuh DB/file production, jangan gunakan data anak nyata untuk fixture/log.
- UI FREEZE: bandingkan JSX layout, className, CSS, style, komponen, urutan field dan tombol terhadap baseline visual. Audit terakhir sudah membandingkan 472 baris struktur/styling form yang identik. Pertahankan hasil ini; tidak perlu mengubah lagi. Catat diff nonvisual dan perubahan label/feedback yang benar-benar dibutuhkan. Visual test desktop/tablet/mobile direncanakan untuk UAT, bukan dijalankan via dev/build pada tahap ini. Jangan klaim pixel-identical tanpa screenshot/visual test yang sah.
- Perbarui status task melalui konvensi AGENTS, `_ACTIVE-TASK.md` dan histori. Status `IMPLEMENTED_IN_SOURCE`, `VERIFIED_STATIC`, `PASSED`, `FAILED`, `NOT_TESTED`, `BLOCKED_SCHEMA`, `BLOCKED_POLICY`, `BLOCKED_UI_APPROVAL` dipisahkan dari status resmi task. Jangan menandai FIN/FIX selesai jika acceptance belum terpenuhi atau gerbang masih terblokir. Tidak boleh klaim semua 80+ test lulus berdasarkan typecheck dan 14 unit tests. Koreksi laporan V2 dengan catatan superseded, jangan menghilangkan histori bukti sebelumnya.

**Acceptance FIX-009:** semua defect memiliki before/after path dan bukti patch, test matrix asli tidak bergeser, hasil test yang benar-benar dieksekusi terdokumentasi, daftar blocker jelas, UI terkunci, tidak ada claim runtime/production-ready yang tidak didukung.

### Matriks pengujian asli (wajib dipertahankan)

Sumber normatif: `docs/instruksi/INSTRUKSI_AGENT_FINISHING_MASTER_SISWA_V2_UI_FREEZE.md`. Pertahankan tabel berikut, bukan tabel TC yang diubah dalam laporan Agent. Tambahkan kolom actual, bukti, jenis test dan status pada laporan tanpa mengubah skenario/expected outcome.

| ID | Skenario asli | Expected outcome asli |
|---|---|---|
| TC-01 | Tambah siswa lengkap | Data inti, alamat, keluarga dan registrasi tersimpan konsisten |
| TC-02 | Tambah siswa tanpa NISN | Diizinkan, tidak membuat NISN palsu |
| TC-03 | NIS duplikat | Ditolak tanpa data parsial |
| TC-04 | NIK duplikat | Ditolak tanpa data parsial |
| TC-05 | NISN duplikat | Ditolak bila terisi |
| TC-06 | NIK/KK/NISN salah panjang | Error field yang tepat; tidak disimpan |
| TC-07 | Edit biodata siswa existing | Prefill, update benar, tidak duplikat terhadap diri sendiri |
| TC-08 | Siswa legacy tanpa kolom baru | Tetap bisa dibaca dan diedit sesuai izin |
| TC-09 | Tanggal lahir invalid/masa depan | Ditolak; usia kalender benar |
| TC-10 | Simpan/resume draft | Data tetap ada; tidak masuk siswa aktif, invoice atau ujian |
| TC-11 | Ayah yang sama untuk beberapa siswa | Satu individu, relasi valid per siswa |
| TC-12 | Ibu yang sama untuk beberapa siswa | Tidak menduplikasi individu |
| TC-13 | Pilih orang tua existing | Data terisi dan link tepat |
| TC-14 | Wali dari ayah/ibu | Referensi, bukan salinan ganda |
| TC-15 | Orang tua meninggal/tidak diketahui | Field kondisional tidak memblokir |
| TC-16 | Guardian portal existing | Semua link yang sah tetap ada; tidak ada eskalasi akses |
| TC-17 | Gagal simpan relasi/konkurensi/retry | Rollback, idempotent, konflik ditangani |
| TC-18 | Tambah pengukuran | Record baru tersimpan dengan tanggal/semester |
| TC-19 | Lihat histori pengukuran | Record lama tidak tertimpa |
| TC-20 | Data ukur invalid/kesehatan sensitif | Validasi dan izin server benar |
| TC-21 | Tambah bantuan | Invoice dan kelayakan tidak berubah otomatis |
| TC-22 | Upload dokumen valid | Metadata dan private storage konsisten |
| TC-23 | MIME/signature tidak valid | Ditolak backend |
| TC-24 | Ukuran file melebihi batas | Ditolak backend dan UI menjelaskan |
| TC-25 | Verifikasi dokumen | Status, reviewer dan waktu aktual tersimpan |
| TC-26 | Tolak/ganti dokumen | Alasan dan histori tersedia; status kembali menunggu |
| TC-27 | Unduh file siswa lain | Ditolak walau URL/ID diketahui |
| TC-28 | Endpoint tanpa sesi | Ditolak; tidak ada data sensitif |
| TC-29 | Wali mengakses siswa lain | Ditolak oleh guardian scoping |
| TC-30 | Wali mencoba edit kelas/keuangan | Ditolak server |
| TC-31 | Role tanpa izin kesehatan | Tidak menerima payload medis |
| TC-32 | Cek `/api/state` | Kolom sensitif baru tidak bocor melalui select-all |
| TC-33 | Export dengan field tak diizinkan | Ditolak/diredaksi sesuai kontrak |
| TC-34 | Audit/log/error | Tidak membocorkan password, token atau isi data sensitif |
| TC-35 | Generate tagihan SPP | Existing tetap idempotent dan aturan enrolledOn berlaku |
| TC-36 | Pembayaran tunai | Alur existing tetap benar |
| TC-37 | Pembayaran transfer | Bukti dan pending verification tetap benar |
| TC-38 | Verifikasi/penolakan pembayaran | Status invoice mengikuti aturan existing |
| TC-39 | Evaluasi kelayakan ujian | Tidak terpengaruh kelengkapan biodata |
| TC-40 | Dispensasi | Workflow existing dan invoice immutability terjaga |
| TC-41 | Kartu ujian dengan foto | Foto legacy/baru terotorisasi tampil dengan benar |
| TC-42 | Cetak kartu ujian massal | Foto/layout/QR existing tetap benar |
| TC-43 | Portal wali dengan beberapa anak | Hanya anak yang terhubung muncul |
| TC-44 | Karakteristik anak | Template/jawaban existing terbaca, tanpa duplikasi |
| TC-45 | Edit biodata siswa bertagihan | Histori invoice tidak berubah |
| TC-46 | Import XLSX valid | Data valid tersimpan, leading zero terjaga |
| TC-47 | Import invalid/duplikat/formula | Error per baris, tidak ada commit diam-diam |
| TC-48 | Import ulang | Tidak menduplikasi siswa atau update diam-diam |
| TC-49 | Export dan cetak | Data sesuai izin/filter, A4 terbaca, formula injection dicegah |
| TC-50 | Ubah kelas siswa bertagihan | Guard 409 tetap bekerja; tidak bypass via endpoint baru |
| TC-51 | Pengajuan biodata wali | Perubahan hanya setelah review sah |
| TC-52 | Kelengkapan kondisional | Opsional/NA tidak menurunkan skor; dokumen terpisah |
| TC-53 | Navigasi sepuluh section | State input tidak hilang; error lompat ke field tepat |
| TC-54 | Mobile 390 px dan tablet | Tidak overflow; navigasi dan aksi dapat digunakan |
| TC-55 | Loading/empty/error/retry | Tidak ada data dummy atau tombol sukses palsu |
| TC-56 | Search/filter/pagination | Hasil dan summary sesuai scope, race request ditangani |
| TC-57 | Ubah keluarga shared | Dampak ditampilkan; perubahan tidak menambah akses portal |
| TC-58 | Gagal upload/finalisasi draft | Orphan ditangani; retry aman |
| TC-59 | Conflict review biodata | Tidak menimpa perubahan terbaru secara diam-diam |
| TC-60 | Regression role dan UI existing | SPP, ujian, kuitansi, portal dan menu lain tetap kompatibel |

**Tambahan regression khusus temuan audit:**

| ID | Skenario | Expected outcome |
|---|---|---|
| TC-61 | Aksi import commit benar-benar memanggil API | Jumlah sukses berasal dari record committed, bukan timer; reload sesuai hasil |
| TC-62 | Ubah keluarga, wali, kontak darurat, registrasi dan bantuan dalam satu form | Field sah tersimpan; field terkunci ditolak dengan error jelas, tidak silently ignored |
| TC-63 | Role read membuka profil lengkap | Field sensitif tidak terdapat dalam respons tanpa izin khusus |
| TC-64 | Registrasi dokumen dengan referensi/metadata yang tidak sah | Server menolak sebelum mencatat metadata |
| TC-65 | Unduh file >2 MB hingga 5 MB | Byte lengkap dan sama dengan file asli, sesuai izin |
| TC-66 | Resume draft lewat URL dan simpan berulang | Draft ID tetap, revision benar, tidak duplikat |
| TC-67 | Finalisasi draft berulang/konkuren atau bukan milik actor | Hanya satu siswa sah, unauthorized/konflik ditolak |
| TC-68 | Kontrak pengukuran, dokumen dan change request | FE URL/payload/response sesuai API, invalid key ditolak |
| TC-69 | Siswa lama hanya memiliki identitas dasar | List/detail tidak menyatakan lengkap secara palsu |
| TC-70 | Karakteristik tanpa submission dan setelah submission | Status berubah berdasarkan data nyata |
| TC-71 | Review ulang/konkuren pengajuan yang sudah diputuskan | Tidak menerapkan dua kali atau menimpa revision baru |
| TC-72 | Keluarga mode none/existing, nama tidak diketahui | Validasi kondisional benar, tidak memaksa data fiktif |
| TC-73 | Status aktif/nonaktif dan penempatan pada semua jalur write | Invariant sama; route legacy tidak bypass |
| TC-74 | File staging gagal atau draft dibatalkan | Tidak ada status VERIFIED palsu; retry/cleanup sesuai ownership |
| TC-75 | Perubahan NIK/KK dan patch sensitif | Audit/log/error teredaksi, tidak membawa nilai mentah |

**Regression tambahan akibat audit ulang e3b88d4 (jangan menggeser TC-01–75):**

| ID | Skenario | Expected outcome |
|---|---|---|
| TC-76 | Sepuluh kolom identitas dipulihkan | Schema typed tetap lengkap; insert/update/read terotorisasi round-trip seluruh nilai sah; tidak ada conditional omission berdasarkan property schema |
| TC-77 | Schema fisik belum siap | Fitur baru menyatakan SCHEMA_NOT_READY/BLOCKED_SCHEMA secara eksplisit; tidak mengembalikan empty success, tidak menghapus schema, tidak memalsukan status; jalur existing yang kompatibel tetap aman |
| TC-78 | UI freeze desktop dan mobile | Layout/komponen/style baseline pengguna tidak berubah; hanya wiring, status/error dalam slot yang ada; bukti diff dan visual UAT bila diizinkan |
| TC-79 | Fetch profil gagal saat edit | Form tidak menimpa data existing dengan default atau nilai kosong; error dan retry benar; tidak ada notifikasi sukses palsu |
| TC-80 | Daftar draft dan antrean review setelah alias/wrapper diperbaiki | Shape typed konsisten, ID/status item benar, review payload benar, kegagalan bukan daftar kosong palsu |

### Regression tambahan V3 (TC-81–TC-100)

| ID | FIX | Skenario | Expected outcome |
|---|---|---|---|
| TC-81 | 001 | Upload dokumen saat tambah siswa belum punya studentId | Receipt sah terikat draft dan file nyata; finalisasi mengaitkan file sekali; unduh kembali valid |
| TC-82 | 001,007 | Upload edit dengan actor ID berbeda dari student ID | Actor diambil dari sesi; file sah berhasil sesuai izin; substitusi ID/path oleh client ditolak |
| TC-83 | 001 | Fake staging path, blob hilang, MIME/signature dan ukuran aktual tidak cocok | Registrasi ditolak, tidak ada metadata yang dianggap berhasil |
| TC-84 | 001,008 | Gagal setelah upload blob, draft batal, token expired, retry | Lifecycle staging dan cleanup aman; tidak ada dokumen palsu atau penghapusan file siswa lain |
| TC-85 | 001,007 | Unduh file sensitif oleh role tanpa izin khusus walaupun memiliki izin read | Ditolak server tanpa byte atau metadata sensitif |
| TC-86 | 002 | Edit nama/alamat siswa tiga kali dengan histori kesehatan dan bantuan existing | Jumlah serta ID histori tidak berubah; tidak ada insert duplikat |
| TC-87 | 002 | Tambah pengukuran/bantuan baru, double submit dan retry | Satu record baru per perintah sah; nilai dan histori existing dipertahankan |
| TC-88 | 002,003 | Buka edit siswa dengan ayah/ibu existing, ibu kontak utama, emergency contact terpisah | Prefill sesuai DB, save tanpa perubahan tidak mengganti individu atau flags |
| TC-89 | 003 | Edit identitas ketika domisili berbeda dari KK | Alamat domisili tetap berbeda dan tidak tertimpa |
| TC-90 | 003 | Edit siswa legacy dengan pendidikan/penghasilan/agama/status hidup tidak diketahui | Tidak tercipta nilai fiktif; field unknown tetap unknown/null sesuai kontrak |
| TC-91 | 003,008 | Resume draft yang menyimpan alamat, keluarga, pengukuran, bantuan dan dokumen staged | Seluruh state dipulihkan berdasarkan mapper draft, receipt masih sah, draft ID tetap |
| TC-92 | 004 | Database table/column missing termasuk error Drizzle berlapis | Master Siswa lengkap memberi HTTP 503 dengan code SCHEMA_NOT_READY; daftar tidak menyamar kosong; jalur legacy kompatibel |
| TC-93 | 004,002 | Create/update/import dengan status aktif dan studentStatus bertentangan | Ditolak atau dinormalisasi sesuai aturan eksplisit; tidak ada status bisnis kontradiktif |
| TC-94 | 005 | Import XLSX dengan kelas tidak dikenal/ambigu, gender invalid, tanggal invalid | Preview invalid dengan error per field; tidak memilih kelas pertama/gender L/tanggal hari ini |
| TC-95 | 005 | Import preview token dimodifikasi, stale, cross-actor, atau commit ulang | Ditolak/hasil idempotent; validasi ulang terhadap DB dan FK; tidak ada perubahan tanpa otorisasi |
| TC-96 | 005,002 | Import gagal setelah insert siswa sebelum relasi keluarga selesai | Row atomik atau batch rollback sesuai kontrak; counter hanya record committed; error dapat ditelusuri |
| TC-97 | 006 | Siswa lengkap dengan 10 section applicable, siswa incomplete dan kasus NA | List/detail/filter mengikuti satu engine; siswa lengkap bisa mencapai 100%; NA tidak menurunkan skor |
| TC-98 | 007 | POST pengukuran dan bantuan dari detail, lalu reload | Request/response sama dengan DTO; tanggal, periode dan histori benar; unsupported keys tidak silently ignored |
| TC-99 | 008 | Dua finalisasi/review paralel dan review patch setelah profil berubah | Hanya satu transaksi sah; konflik 409, tidak ada lost update atau duplikasi |
| TC-100 | 008,009 | Approval perubahan domisili dengan alamat KK berbeda dan profil lama tanpa record alamat yang relevan | Hanya target alamat yang benar berubah/terbuat bila diizinkan; KK tidak tertimpa; audit sah; UI existing tetap |

100 skenario adalah target matriks verifikasi, bukan jumlah unit test yang wajib dianggap lulus. Pisahkan pure unit, static check, integration, manual UAT dan visual regression. Tulis expected sebelum pengujian; actual dan status hanya dari bukti eksekusi. Semua test yang memerlukan database/Blob/runtime/migration diberi NOT_TESTED atau BLOCKED_SCHEMA pada tahap source-only jika belum dapat dilaksanakan secara sah.

## Context

### Sumber dan fakta yang telah diverifikasi

- Repository: `https://github.com/MHamzah1/sistem-sdit-at-taqwim`, branch `main`.
- Snapshot audit: [`301bbccfc5b008afbf41eb4d7c0a9d4e3288d0f9`](https://github.com/MHamzah1/sistem-sdit-at-taqwim/commit/301bbccfc5b008afbf41eb4d7c0a9d4e3288d0f9); commit 24 November 2026 16:15:31 WIB; metadata `pushed_at` repository 16:15:36 WIB. Dibandingkan baseline `e3b88d44279894261c4128ba4ee36d848dd4eb4b`: 2 commit baru, 21 file berubah.
- [Perbandingan commit audit](https://github.com/MHamzah1/sistem-sdit-at-taqwim/compare/e3b88d44279894261c4128ba4ee36d848dd4eb4b...301bbccfc5b008afbf41eb4d7c0a9d4e3288d0f9).
- Referensi scope asli: `docs/instruksi/INSTRUKSI_AGENT_FINISHING_MASTER_SISWA_V2_UI_FREEZE.md`; `docs/fitur/kelengkapan-master-siswa/` termasuk spesifikasi, skema tampilan, skenario pengujian dan laporan finishing. V3 mempersempit fokus ke defect tersisa; scope Master Siswa 10 section, keamanan, integrasi dan acceptance asli tetap berlaku. Tidak membuat modul PPDB tersendiri.
- Teknologi project: Next.js App Router, React, TypeScript, Tailwind, PostgreSQL Neon, Drizzle ORM, Zod, Vercel Blob private. Baca `package.json` dan lockfile aktual untuk versi/dependensi; jangan upgrade stack di luar kebutuhan.
- Recovery yang sudah benar: 10 kolom identitas `students` dipulihkan, unique index NIK/NISN, constraint alamat dan relasi ditambahkan; create/update typed diperluas, guard invoice 409, import API mengganti timer, URL unduh `/content`, review `{ approved, rejectionReason }`, error retry edit, redaksi audit, dan entry point wali tersedia. Pertahankan seluruh perubahan sah tersebut; tidak melakukan revert besar.
- Laporan Agent menyatakan typecheck 0 error dan 14 unit tests lulus. Source berisi 14 definisi test, tetapi audit tidak menjalankan test secara independen. Status runtime/schema Neon, Blob, deploy dan live UAT belum dibuktikan. Temuan dalam dokumen ini adalah bukti static source atau risiko yang diturunkan dari source, bukan insiden runtime/data loss yang telah diamati.
- Informasi yang belum diberikan: `[log error runtime aktual yang tersedia secara sah]`, `[schema fisik dan status database Neon]`, `[mapping permission kategori sensitif yang disetujui]`, `[izin pelaksanaan tahap DAT dan UAT]`. Jangan mengarangnya; lakukan perbaikan source yang tidak terblokir dan laporkan keputusan yang masih diperlukan.

### Peta bukti audit untuk reproduksi Agent

Seluruh nomor baris berikut merujuk commit audit 301bbcc, dapat berubah pada working tree. Cari simbol jika baris bergeser. Gunakan link repo yang dipin sebagai referensi, lalu baca source lokal aktual dan bandingkan sebelum mengedit.

| File / simbol | Bukti dan implikasi |
|---|---|
| `src/db/schema.ts` L145–181, L500–731 | Pemulihan 10 field, constraint tambahan; schema fisik belum terverifikasi |
| `server/studentMaster.ts` L304–325 | Schema full profile: documents z.any dan array histori belum membedakan ID existing |
| `server/studentMaster.ts` L508–840 | Create typed, upload metadata staging tak tervalidasi, finalisasi draft tanpa lock sebelum create |
| `server/studentMaster.ts` L842–915, L1561–1574, L1811–1891 | Fallback schema/empty masih ada |
| `server/studentMaster.ts` L988–1092 | Summary karakteristik; projection sensitif parsial, measurements tetap dikirim |
| `server/studentMaster.ts` L1124–1518 | Update identitas, alamat, enrollment, keluarga; insert histori ulang |
| `server/studentMaster.ts` L1657–1709 | Registrasi dokumen memvalidasi path prefix saja, belum validasi blob aktual |
| `server/studentMaster.ts` L1745–1811, L1896–2008 | Whitelist patch tanpa validasi tipe lengkap; apply/review tanpa guard konkurensi penuh |
| `server/studentMaster.ts` L2021–2264 | Import preview/commit CSV rows, default kelas/gender, validasi/atomicity belum aman |
| `server/app.ts` L253–259, L921–959 | Commit as any; error envelope generic 503 |
| `server/files.ts` L216–284 | Download byte penuh sudah ada, izin sensitif dan metadata aktual perlu diperbaiki |
| `server/security.ts` L78–142 | Sanitizer audit tersedia; permission master terlalu luas untuk semua kategori sensitif |
| `server/state.ts` L22–69 | Projection legacy fallback; harus jujur mengenai capability schema |
| `src/lib/api.ts` L78–123 | Helper upload memakai userId, caller memasukkan studentId; download helper tersedia |
| `src/app/(app)/master/siswa/_components/StudentFormView.tsx` L119–330, L331–368 | Defaults/prefill dan foto data URL |
| `StudentFormView.tsx` L419–638 | Rumus kelengkapan lokal, payload histori tanpa ID, mapping draft/profile berbeda |
| `StudentFormView.tsx` L2431–2468 | Upload siswa baru masih staging path palsu; mode edit ID salah |
| `StudentDetailView.tsx` L222–309, L1702, L1769, L1815–1820 | Kontrak ukur/bantuan salah; karakteristik detail statis |
| `master/siswa/page.tsx` L44–54, L258–348, L1160–1196, L1345 dst. | Skor maksimal 25%, CSV parser naif, API commit sudah ada |
| `master/siswa/tambah/page.tsx` | Resume `draftId` dan save PATCH tersedia, mapping form perlu diperbaiki |
| `master/siswa/[id]/ubah/page.tsx` | Loading/error/retry profil telah tersedia, pertahankan |
| `master/siswa/[id]/page.tsx` | Detail sebelumnya mengabaikan fetch error; cek aktual dan perbaiki tanpa redesign |
| `src/app/(app)/dashboard/page.tsx` | Entry point pengajuan biodata wali tersedia; cek kontrak dan scoping |
| `tests/student-master.test.ts` | 14 unit tests pada snapshot |
| `_ACTIVE-TASK.md`, `docs/fitur/kelengkapan-master-siswa/LAPORAN_FINISHING_MASTER_SISWA.md` | Status dan TC perlu dikoreksi berdasarkan bukti |

### MANDATORY UI FREEZE — skema tampilan wajib dipertahankan

Pengguna telah memperbaiki visual Master Siswa dengan Base Component. Baseline adalah commit e3b88d4 dan perubahan visual sah pengguna setelahnya; commit 301bbcc mempertahankan 472 baris terkait komponen dan styling form dalam urutan identik pada audit static. Jangan mengganti desain untuk menyelesaikan defect. Skema berikut adalah kontrak layout existing, BUKAN rancangan visual baru.

```text
+-------------------------------------------------------------+
| Header dan ringkasan kelengkapan existing                   |
+--------------------+----------------------------------------+
| Bagian Formulir    | Section aktif                          |
| 01 Identitas       | Judul dan deskripsi existing            |
| 02 Alamat          |                                        |
| 03 Registrasi      | Field dalam grid existing              |
| 04 Data Ayah       | Posisi upload/foto/tabel tetap         |
| 05 Data Ibu        |                                        |
| 06 Wali/Darurat    | Slot feedback existing                  |
| 07 Kesehatan       |                                        |
| 08 Bantuan         |                                        |
| 09 Karakteristik   |                                        |
| 10 Dokumen         |                                        |
| Simpan sementara  | [Batal]   tombol navigasi/simpan tetap  |
+--------------------+----------------------------------------+
```

Ikuti JSX, breakpoint, width, grid, sticky sidebar, spacing dan posisi tombol aktual baseline, bukan ukuran ilustrasi ASCII. Jangan membuat semua section terlihat sekaligus.

| Area existing | Perbaikan fungsional wajib | Batas visual |
|---|---|---|
| Section identitas/alamat/registrasi | Prefill typed, validasi, simpan aktual | Urutan dan ukuran field tetap |
| Section ayah/ibu/wali | ID/relasi/flags aktual, pilih data existing, kontak darurat | Komponen dan layout sama |
| Section kesehatan/bantuan | Histori existing dan perintah tambah terpisah, kontrak benar | Tabel/modal existing, tanpa redesign |
| Section 09 karakteristik | Data template/submission nyata, state sesuai hasil | Isi slot yang sudah ada, tidak mengubah struktur halaman |
| Section 10 dokumen dan foto | Upload aktual, status server, download/review/retry | Input file, foto, tabel, modal dan tombol tetap |
| Footer form | Loading/disabled/error sesuai hasil backend | Posisi dan styling tombol tetap |
| Daftar Master Siswa | Ringkasan/filter/pagination/kelengkapan server | Struktur tabel, card dan filter yang sudah ada |
| Wizard import existing | Template XLSX, validasi, konfirmasi, hasil commit aktual | Lima tahap dan posisi tombol tetap; label format dapat dikoreksi |
| Detail profil | Tab existing, data aktual dan feedback sesuai izin | Jangan menambah/mengubah desain tab tanpa persetujuan |
| Draft dan antrean review | Mapping ID/status dan feedback benar | Modal/entry point existing |
| Portal wali | Patch typed, histori/review aktual | Pertahankan card dan modal yang tersedia |
| Responsive | Pastikan fungsi dapat dipakai dengan layout existing | Tidak mengubah breakpoint/CSS tanpa persetujuan |

DILARANG menulis ulang `StudentFormView.tsx`, merombak className/spacing/warna/typography, memindah input/sidebar/header/tombol, mengganti base component atau mengubah desain modal. Gunakan `Card`, `Button`, `Input`, `Select`, `Textarea`, `Badge`, `Modal`, dan komponen existing lain. Boleh memperbaiki handler, state, typed mapper, API, validasi, akses, loading/error, isi data dan label yang salah secara fungsional dalam slot existing. Jika kebutuhan baru benar-benar memerlukan perubahan visual, selesaikan backend dan laporkan `BLOCKED_UI_APPROVAL` dengan wireframe delta minimal untuk persetujuan; jangan mengubah desain tanpa izin. Jangan menghilangkan fitur untuk menghindari perubahan yang diperlukan.

### Aturan teknis dan batas eksekusi

- Baca dan patuhi `AGENTS.md`, `.agents/rules/`, `.agents/skills/`, `.claude/commands/` dan `.development-history/`. Gunakan workflow task/verification/report yang berlaku, bukan membuat sistem dokumentasi paralel. Periksa nomor task existing dan catat FIX sebagai delta dari FIN/TGS. Jangan mengarang approval/policy baru.
- DILARANG menjalankan build frontend/backend (`npm run build`, `next build`, `dotnet build` atau setara), server development (`npm run dev`, `next dev` atau setara), membuat maupun menjalankan migrasi (`npm run db:generate`, `npm run db:migrate`, `drizzle-kit generate`, `drizzle-kit push`, `dotnet ef migrations add`, `dotnet ef database update`, migration SQL atau setara), seed/init, ALTER/DROP/DDL/data correction database, query terhadap Neon/production, akses Blob production, deployment, mengubah secret/connection string/.env aktual, serta commit/push/merge tanpa instruksi terpisah. Jangan menjalankan fixture yang menerapkan migration, bahkan untuk menyatakan test lulus pada tahap ini.
- Boleh memperbaiki source schema TypeScript, service, route, validation, DTO, frontend logic, dependency yang benar-benar diperlukan sesuai kebijakan, pure tests dan dokumen. No-emit typecheck dan test murni hanya setelah script diperiksa aman. Jangan menyiasati larangan dengan command lain. Jangan mengubah data live. Semua tindakan DAT dan UAT yang memerlukan runtime merupakan tahap terpisah.
- Lindungi data siswa existing, histori SPP, pembayaran, dispensasi, kelayakan ujian, kartu ujian, kuitansi, wali dan karakteristik. Jangan menghapus record, memalsukan status, mengubah histori invoice, atau memberikan akses akun otomatis. Tidak ada dummy data, fake success, conditional omission, fallback data palsu, ataupun bypass keamanan untuk menutupi error.

## Reasoning

Gunakan pendekatan berikut dan sertakan ringkasan alasan keputusan teknis di laporan (bukan chain-of-thought).

1. **Reproduksi dari bukti:** baca audit dan source aktual, pin HEAD lokal dan `git status`; lindungi perubahan pengguna. Untuk setiap FIX, buat daftar defect dengan actual vs expected, path/simbol, severity dan dependency. Jika sudah diperbaiki di commit lebih baru, tunjukkan bukti dan jangan mengulang perubahan. Jangan berhenti pada daftar analisis.
2. **Fondasi backend:** kerjakan FIX-004 dan permission/DTO FIX-007. Pertahankan schema target, definisikan error contract dan invariants, siapkan strategi release terpisah. Jangan mendeteksi kolom fisik melalui properti schema Drizzle. Uji pure validation/mapper/error helper bila aman.
3. **Persistensi dan file:** implementasikan BE FIX-001/002, dengan idempotency, lifecycle upload/receipt, transaksi DB, selective patch dan validation ownership. Verifikasi seluruh write path; frontend tidak boleh menjadi source of truth. Jangan mencampur transaksi DB dengan asumsi blob rollback otomatis.
4. **Import dan completeness:** implementasikan BE FIX-005/006 dengan kontrak actual preview/commit, shared validation dan hasil server, serta summary agregat. Hapus fallback kelas/gender/tanggal dan skor estimasi. Pastikan aturan finansial tidak berubah.
5. **Workflow:** selesaikan BE FIX-008 (draft lock/revision, template actual, enrollment history dan guardian review). Untuk approval/concurrency gunakan conditional updates dan transaction boundaries yang tepat. Jika aturan baru belum disetujui, blokir hanya operasi terkait dan kerjakan bagian lainnya.
6. **Integrasi FE:** selesaikan FIX-003 dan caller semua task sesuai kontrak typed. Gunakan Base Component, API client, state dan layout existing; jangan melakukan refactor visual. Loading/error/sukses hanya dari keadaan nyata. Pastikan read/write round-trip dan field tidak disimpan diam-diam sebagai default.
7. **Verifikasi delta:** FIX-009, static review, typecheck/pure tests yang diizinkan, matriks TC-01–100, pengecekan diff UI. Catat ketidaksesuaian yang tersisa, blocker dan rencana tahap DAT/UAT. Tidak menutup task sampai gerbang resmi terpenuhi.

Prioritas keputusan: keamanan dan integritas data > persistensi dan transaksi > kontrak konsisten > kelengkapan fungsional > performa. UI FREEZE mengikat seluruh tahap. Jangan menyelesaikan bug dengan menghilangkan kolom, mengganti field dengan dummy, atau memperlonggar izin. Jika error berasal dari schema fisik, laporkan root cause dan `BLOCKED_SCHEMA`; perbaiki kode dengan schema yang benar, bukan menyatakan database sudah siap.

## Stop conditions

Jangan berhenti setelah audit-only, planning ulang, refactoring visual, update laporan, penambahan endpoint tanpa caller, atau perbaikan satu defect saja. Langsung kerjakan seluruh FIX-001–009 yang tidak terblokir secara teknis/kebijakan. Jangan menunggu persetujuan ulang atas kebutuhan yang telah disetujui pengguna.

### Gerbang acceptance source (wajib sebelum meminta tahap DAT)

- 10 kolom identitas dan seluruh entity target dipertahankan; constraint yang diperlukan tersedia di source dan rencana backfill tidak memalsukan data.
- Tidak ada fake upload path, metadata arbitrer, upload actor salah, atau foto baru persisten sebagai data URL. Receipt dan ownership valid di semua jalur registrasi.
- Edit tanpa perubahan tidak menimpa alamat domisili, menggandakan histori, atau membuat keluarga baru. Field yang belum diketahui tidak diisi sebagai fakta. Shared family, wali dan emergency contact benar.
- Schema belum siap tidak disembunyikan; API error machine-readable dan jalur legacy aman. Tidak ada `safeQuery` yang menyamarkan tabel hilang sebagai sukses fitur baru.
- Import/export XLSX nyata; preview/commit tervalidasi, tidak memilih default kelas/gender untuk data invalid; atomicity dan counter benar. Tidak ada `setTimeout` sukses palsu.
- List, detail, form, filter dan ringkasan memakai aturan completeness yang sama; data lengkap dapat mencapai 100% dan kondisi NA tepat.
- DTO typed untuk pengukuran, bantuan, dokumen, import, draft dan review; tidak ada field sah yang silently ignored; izin sensitif diterapkan di server, audit redacted.
- Draft finalize dan review tidak rentan double submit/konkurensi; karakteristik dan riwayat akademik berdasarkan record aktual; proteksi tagihan dipertahankan.
- Semua kode yang tidak terblokir sudah diintegrasikan dengan FE, tanpa redesign; perubahan UI yang memerlukan approval dicatat secara eksplisit.
- Test asli TC-01–80 tidak bergeser; TC-81–100 dicatat; status hanya berdasarkan bukti. Laporan menyebut semua blocker dan test yang belum dilakukan.

### Gerbang teknis yang tidak boleh dilewati

Tetap DILARANG membuat/menjalankan migration database, schema push, seed/init, perubahan DB live/Neon/Blob, build backend/frontend, dev server, deployment maupun commit/push tanpa instruksi terpisah. Jangan menjalankan integration/browser test yang memerlukan operasi terlarang. Jangan mengklaim runtime sukses dari typecheck/unit test murni. Jangan menutup tiket sebagai selesai penuh atau production-ready bila masih BLOCKED_SCHEMA, BLOCKED_POLICY, BLOCKED_UI_APPROVAL atau belum menjalankan DoD repository.

Jika log/runtime/izin/schema fisik belum tersedia, selesaikan kode, static verification dan test source yang dapat dibuat, lalu jelaskan keterbatasan. Jika policy baru dibutuhkan, hentikan hanya operasi yang melanggar policy; buat blocker yang jelas. Jika suatu penambahan visual bertentangan dengan UI FREEZE, jangan melakukannya sebelum persetujuan. Tidak boleh menyembunyikan blocker dengan data palsu atau perubahan destruktif. Tahap ini berakhir saat seluruh FIX yang diizinkan telah diperbaiki dan dilaporkan dengan bukti, bukan saat laporan menyatakan 100%.

## Output

Hasil utama Agent harus berupa perubahan source backend dan frontend yang benar-benar dikerjakan, bukan hanya dokumen rencana. Pertahankan format task dan histori repository existing; gunakan FIX-001–009 sebagai pengenal delta dari FIN-001–012 dan TGS-010–021.

Buat/update satu laporan utama:

`docs/fitur/kelengkapan-master-siswa/LAPORAN_FIX_MASTER_SISWA_V3_UI_FREEZE.md`

Isi wajib:

1. Baseline SHA dan working tree yang diuji; daftar perubahan pengguna yang dijaga.
2. Ringkasan status nyata setiap FIX dan mapping FIN/TGS.
3. Daftar defect (ID, severity, root cause, before/after path/simbol, patch, acceptance, status dan blocker).
4. Daftar file ditambah/diubah, alasan, kontrak DTO/API dan schema delta.
5. Bukti lifecycle upload baru/existing, idempotency dan transaction boundaries; rencana recovery orphan yang aman.
6. Bukti pemetaan prefill/patch, pencegahan duplikasi, import XLSX, scope izin, completeness, draft dan workflow.
7. Peta UI FREEZE: komponen/struktur yang dipertahankan, diff nonvisual, label/status minimal yang dikoreksi, kebutuhan UI approval bila ada. Jangan menyertakan desain ulang sebagai hasil.
8. Matriks TC-01–TC-100 dengan ID/judul/expected asli, actual, jenis test, path/simbol, bukti/command, status, blocker. Status eksekusi dibedakan dari hasil static review. Cantumkan output typecheck/test aktual dan exit code jika dijalankan secara sah.
9. Regression impact pada SPP, invoice, pembayaran, kuitansi, kartu ujian, portal wali dan karakteristik.
10. Status schema fisik yang diketahui (atau belum terverifikasi), rencana DAT terpisah, risiko deployment sebelum schema siap, duplicate/preflight plan, backup/restore, rollback, urutan migrasi/release yang diusulkan. Tidak membuat/menjalankan migration.
11. Panduan UAT P0 yang dapat dilakukan setelah gerbang database/runtime disetujui, termasuk create/edit/reload, file, XLSX, concurrency, akses role, visual desktop/tablet/mobile.
12. Kesimpulan: apa yang benar-benar selesai di source, apa yang telah diverifikasi, apa yang gagal, dan keputusan/gerbang yang masih diperlukan. Tidak menggunakan persentase palsu.

Update `_ACTIVE-TASK.md`, dokumen skenario pengujian dan histori sesuai aturan repository. Koreksi status laporan sebelumnya tanpa menghapus bukti histori. Jangan menyalin klaim 80 LULUS dari laporan lama. Gunakan status bukti yang jelas: IMPLEMENTED_IN_SOURCE, VERIFIED_STATIC, PASSED, FAILED, NOT_TESTED, BLOCKED_SCHEMA, BLOCKED_POLICY, BLOCKED_UI_APPROVAL. Gunakan status tiket resmi sesuai aturan AGENTS.

**Mulai implementasi sekarang. Backend dahulu, integrasi frontend sesudah kontrak stabil, UI FREEZE wajib. Jangan berhenti pada analisis. Jangan melakukan migrasi, build, dev, atau deployment.**
