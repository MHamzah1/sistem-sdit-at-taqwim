# Master Prompt — Finishing Master Siswa V2 (Recovery, Error Fix & UI FREEZE) — SDIT AT-TAQWIM

**Baseline audit terbaru:** 24 November 2026 | Repository `MHamzah1/sistem-sdit-at-taqwim` | Branch `main` | Commit `e3b88d44279894261c4128ba4ee36d848dd4eb4b` | Commit 14:53:34 WIB | Push repository 14:53:39 WIB  
**Status awal:** PARTIALLY IMPLEMENTED — WITH REGRESSION. Sepuluh kolom schema dihapus pada source, fungsi penyimpanan mengabaikan field, sejumlah simulasi/mismatch masih ada. Runtime/DB belum terverifikasi.
**Prioritas mengikat:** UI FREEZE pada tampilan Base Component yang disetujui pengguna; instruksi ini menggantikan ketentuan visual yang bertentangan dalam versi sebelumnya. Seluruh cakupan fungsional dan 75 test case tetap berlaku.  
**Instruksi induk:** dokumen ini melengkapi `docs/instruksi/INSTRUKSI_AGENT_MASTER_SISWA_SDIT_AT_TAQWIM.md`, tidak mengganti cakupan 10 section, acceptance criteria dan TC-01–TC-60 yang sudah disetujui.  
**Mandat:** eksekusi implementasi sekarang, bukan audit ulang atau proposal. Backend terlebih dahulu, frontend setelah kontrak stabil. Tidak ada migrasi/build/dev/deploy pada tahap ini.

## Role

Bertindak sebagai Senior Full Stack Developer, Database Engineer, Application Security Engineer, UI/UX Engineer dan QA Engineer pada Sistem SPP & Kelayakan Ujian — SDIT AT-TAQWIM. Kuasai Next.js App Router, React/TypeScript, Tailwind CSS, Drizzle ORM, Neon PostgreSQL, Zod, private Vercel Blob, RBAC, guardian scoping dan administrasi sekolah dasar. Lindungi data anak serta integritas invoice, pembayaran, dispensasi dan kartu ujian.

Anda bertugas memperbaiki kode yang sudah dikerjakan pada TGS-010–TGS-021. Jangan menulis ulang aplikasi atau menghapus fitur existing. Jangan menutup task karena tampilan, endpoint atau dokumen sudah ada; semua aksi harus benar-benar terintegrasi. Pengguna sudah menyetujui planning awal dan meminta perbaikan hasil audit. Tidak perlu meminta persetujuan ulang atas scope tersebut. Keputusan kebijakan baru yang belum disetujui tetap harus dibatasi dan dilaporkan.

## Task

### Gerbang P0 — Diagnosis error dan pemulihan regresi sebelum pekerjaan lain

Ini bukan permintaan redesign. Pengguna menyampaikan masih banyak error setelah push terakhir. Log error runtime, network response, dan schema Neon aktual belum diberikan kepada penyusun instruksi. Jangan mengarang pesan error yang tidak dilihat. Agent wajib menginvestigasi bukti yang tersedia pada working tree, log existing yang dapat dibaca tanpa mengubah lingkungan, dan hasil pemeriksaan statis; langsung memperbaiki penyebab source yang sudah terbukti. Catat error tambahan yang benar-benar ditemukan. Jangan hanya menganalisis lalu berhenti.

1. Catat branch, SHA working tree, `git status` dan diff terhadap `e3b88d4` serta `31b3adc`; jangan reset/revert massal, jangan menimpa perubahan pengguna. Jika source telah lebih baru, periksa perbaikan yang sudah sah tanpa mengulang atau merusaknya.
2. Jalankan recovery FIN-002 terlebih dahulu: pulihkan 10 definisi kolom `students` dan constraint yang diperlukan. FIN-001 security dan FIN-003 write path dikerjakan berdekatan sebelum integrasi. Tidak perlu menunggu approval ulang atas scope perbaikan yang telah disetujui.
3. Hapus pola conditional `(s.students as any).field` yang melewati penyimpanan. Hapus fallback missing-schema yang mengembalikan `[]`/`null` atau status sukses untuk profil/draft/pengajuan. Tangani root cause schema secara eksplisit; jangan menghilangkan field, menambah `as any`, mock atau memalsukan data untuk membuat error hilang.
4. Pisahkan error validasi, otorisasi, kegagalan jaringan, konflik, kontrak API, dan schema tidak siap. Bila schema target belum tersedia, return error terstruktur misalnya HTTP 503 `SCHEMA_NOT_READY` sesuai error envelope proyek, bukan empty success. Jangan menutupi kegagalan pada database error yang dibungkus oleh Drizzle; klasifikasi SQLSTATE secara aman jika relevan, tanpa mengekspos SQL/secret. Periksa kompatibilitas jalur lama melalui proyeksi kolom existing yang benar-benar diperlukan, tanpa mengklaim fitur baru tersedia. Data identitas lama, SPP, kartu ujian dan portal tetap dipertahankan. Jika runtime memerlukan migrasi untuk berfungsi, catat BLOCKED_SCHEMA dan rencana release/migrasi terpisah; tidak boleh menghapus schema atau mengeksekusi migrasi untuk menghilangkan blocker.
5. Periksa static import/export symbol, TypeScript, Zod schema, enum/status, React hooks, routing, client-server boundary, request/response dan penanganan error/submit. Perbaiki khususnya field yang dikirim tetapi tidak diproses, input optional kosong yang masih divalidasi sebagai new family member, dan input existing yang ter-prefill default fiktif. Jangan menebak gender, agama, jumlah saudara, status keluarga atau data administratif yang belum diketahui pada siswa lama.
6. Setiap error dicatat dengan ID `ERR-xxx` yang merujuk FIN terkait, route/simbol, kondisi pemicu, bukti aktual, root cause, patch, hasil pemeriksaan dan status. ID ERR hanya referensi laporan; ikuti ID task resmi repository. Tidak perlu membuat backlog paralel. Prioritaskan crash/loading gagal dan risiko data, lalu error fungsi. Jika tidak ada log runtime, beri label `SOURCE_CONFIRMED` atau `RUNTIME_UNVERIFIED`; jangan mengklaim semua error runtime sudah hilang.
7. Setelah P0, tuntaskan seluruh FIN yang tidak terblokir menurut dependensi. UI yang telah disetujui tidak boleh dirombak; perubahan frontend hanya wiring, state, mapping, validasi, dan penanganan status/error di slot yang ada. Ketentuan UI FREEZE pada FIN-011 berlaku sejak awal.


### 1. Roadmap finishing dan prioritas

| ID finishing | Pekerjaan | TGS terkait | Prioritas | Dependensi |
|---|---|---|---|---|
| FIN-001 | RBAC, projection, privasi, audit dan keamanan file | 011–015, 021 | P0 | — |
| FIN-002 | Pulihkan 10 kolom, constraint, relasi, kompatibilitas schema | 010–013, 020 | P0 pertama | — (koordinasi FIN-001) |
| FIN-003 | Penyimpanan atomik identitas, alamat, keluarga, registrasi, kesehatan/bantuan | 011–013, 016 | P0 | 001–002 |
| FIN-004 | Private Blob, upload/registrasi/review/download nyata | 014, 016–017 | P0 | 001–003 |
| FIN-005 | Import XLSX aktual, export dan cetak | 019 | P0 | 001–003 |
| FIN-006 | Kontrak API, DTO, client dan typed mapping | 011–019 | P1 | 001–005 |
| FIN-007 | Draft resume, autosave aman, finalisasi idempotent | 011, 015–016 | P1 | 001–004, 006 |
| FIN-008 | Satu sumber kelengkapan biodata dan daftar terfilter | 015, 018 | P1 | 001–004, 006 |
| FIN-009 | Integrasi Karakteristik Anak existing | 015–017 | P1 | 001, 006, 008 |
| FIN-010 | Riwayat akademik dan pembaruan biodata wali | 020 | P1 | 001–003, 006 |
| FIN-011 | Integrasi fungsi FE dengan UI FREEZE | 016–020 | P1 | 001–010 |
| FIN-012 | QA, regression, UAT, koreksi status dan laporan | 021, semua | P1 | 001–011 |

`FIN` adalah ID referensi finishing dalam dokumen ini, bukan klaim bahwa repository sudah mengenal prefix tersebut. Baca konvensi aktual `AGENTS.md`, rules, skills, riwayat dan task terbaru. Jika workflow hanya menerima TGS/ISU/REV/DAT/UJI, buat mapping satu-ke-satu dari FIN ke ID resmi yang tersedia, tanpa bentrok dan tanpa mengganti identitas TGS lama. Pertahankan ID FIN pada judul, cross-reference dan laporan audit. Kelola satu task aktif sesuai konvensi repository. Jangan memaksakan perubahan aturan proyek hanya agar menerima prefix FIN.

P0 = blocker keamanan/data atau pesan sukses palsu; P1 = kelengkapan fungsional, integrasi dan kualitas. Kerjakan recovery FIN-002 lebih dahulu, lalu FIN-001 dan FIN-003–010 menurut dependensi sebelum menyatakan FE terintegrasi. FIN-006 menyelaraskan kontrak sejak awal, tidak menunggu seluruh implementasi selesai untuk merancang DTO; integrasi akhir dilakukan pada FIN-011. Jika satu operasi memerlukan keputusan baru, lanjutkan pekerjaan lain yang tidak terblokir.

### FIN-001 — Perbaiki security, RBAC, masking, audit log

**Bukti:** `server/studentMaster.ts` L706–819 mengembalikan student, family, health, measurements, aid, documents dan portalGuardians utuh setelah `ownStudent()`. `server/security.ts` L187–208 memberi akses non-guardian dengan permission `read`, bukan izin field sensitif. `audit()` L78–99 menyimpan before/after langsung; `updateStudentProfile()` L984 mengirim objek siswa lengkap. `server/state.ts` telah menggunakan projection kolom siswa; pertahankan projection aman. Pada e3b88d4 query profil menggunakan kolom inti tetapi tetap mengembalikan keluarga, kesehatan, bantuan dan dokumen mentah. Projection identitas dasar bukan pengganti RBAC per domain.

**Implementasi backend wajib:**

1. Inventaris role/permission, mekanisme seed/grant existing dan route yang mengakses profil. Definisikan permission granular dengan penamaan mengikuti konvensi repository untuk biodata sensitif, kesehatan, dokumen, bantuan/penghasilan, export, review dan pengubahan keluarga. Jangan memperluas grant existing secara otomatis. Jika persetujuan izin khusus belum tersedia, deny-by-default dan catat BLOCKED_POLICY untuk akses tersebut. Tidak membuat grant/seed di database tahap ini.
2. Bedakan `read` umum, `master` pengelolaan, akses sensitif, dan kepemilikan siswa. `guardian_students` tetap satu-satunya sumber akses portal terhadap anak. `family_members` bukan sumber hak login. Role Kepala Sekolah dengan `read` saja tidak otomatis boleh mengambil data medis, penghasilan atau dokumen identitas. Guardian hanya siswa yang terhubung DAN field/berkas yang diizinkan. Jangan menganggap semua anggota keluarga otomatis boleh melihat berkas individu lain.
3. Terapkan pemeriksaan di server untuk seluruh route baca/tulis (termasuk route generic, batch/import, draft, family search, download, review, profile changes, print/export). Terapkan scoping pada query, bukan filter client saja. Gunakan proyeksi DTO whitelist, jangan kirim objek database mentah. Pisahkan respons daftar, detail umum, detail sensitif dan opsi search. Kembalikan capability/status izin seperlunya tanpa nilai rahasia. Frontend menyembunyikan aksi/section sesuai kemampuan yang diberikan server.
4. Tampilkan NIK/KK dan nomor telepon termasking pada konteks umum; nilai asli hanya melalui jalur khusus yang terotorisasi. Jangan mengirim data sensitif lalu menyamarkannya hanya di React. Pastikan `/api/state`, endpoint audit, log error, telemetry, URL, cache dan export tidak membawa kolom tambahan sensitif. Pertahankan field existing yang dibutuhkan transaksi dan kartu ujian; jika foto dilindungi, gunakan jalur render yang sah, bukan membuka URL publik.
5. Gunakan sanitizer audit terpusat yang membatasi entity/field dan meredaksi nilai sensitif, termasuk nested patch/draft/metadata, before/after, NIK, KK, alamat rinci, HP, penghasilan, catatan kesehatan, isi dokumen, token dan password. Audit mencatat pelaku, waktu, jenis aksi, entity ID, nama field berubah, hasil dan metadata aman. Jangan memasukkan NIK lengkap dalam pesan konflik. Tinjau endpoint existing yang mengembalikan before/after. Jangan hapus histori audit existing secara diam-diam; data historis yang perlu penanganan dicatat untuk keputusan terpisah.
6. Batasi ukuran payload, rate limit pencarian sensitif dan upload sesuai pola existing; gunakan parameterisasi query. Pertahankan CSRF/session existing; semua mutasi memakai helper API resmi atau mekanisme dengan proteksi ekuivalen. Jangan melonggarkan security demi menghilangkan 403.

**Target file:** `server/security.ts`, `server/studentMaster.ts`, `server/state.ts`, `server/files.ts`, `server/app.ts`, `server/resources.ts`, DTO/permission registry existing, `src/lib/api.ts`, AppContext dan view terkait. Tambahkan test otorisasi untuk per-role dan cross-student, unauthorized file/draft/review, projection dan sanitizer audit.

**Acceptance:** pengguna tanpa izin tidak memperoleh nilai sensitif dari respons jaringan; guardian siswa A tidak dapat mengakses siswa B; write/review/export/file tidak bergantung pada tombol tersembunyi; audit tidak menyimpan data mentah terlarang; finance dan exam role tidak mengalami regresi. Jika izin granuler belum dikonfigurasi di runtime, sebutkan blocker, jangan membuka akses sementara.

### FIN-002 — Schema dan integritas relasi yang konsisten

**Bukti regresi terbaru (e3b88d4):** `src/db/schema.ts` L145–169 kembali ke tabel `students` identitas dasar. `server/studentMaster.ts` L473–537 dan L914–978 menulis field tambahan hanya bila `(s.students as any).field` tersedia; karena definisi kolom hilang, payload tambahan dibuang. `server/state.ts` L21–44 mengisi `nickname: null` dan status turunan `active`, bukan data status akademik tersimpan. `getStudentFullProfile()` L708–883 memakai `safeQuery()` untuk mengembalikan fallback apabila SQLSTATE 42P01/42703. Penghapusan pada source bukan bukti penghapusan kolom fisik di Neon.

**Pemulihan wajib sebelum FIN lain:**

| Kolom TypeScript | Kolom PostgreSQL | Target |
|---|---|---|
| `nickname` | `nickname` | text nullable |
| `nik` | `nik` | text nullable, 16 digit, unique saat terisi |
| `familyCardNumber` | `family_card_number` | text nullable, 16 digit, tidak unique |
| `birthCertificateNumber` | `birth_certificate_number` | text nullable |
| `religion` | `religion` | text/enum sesuai kontrak, nullable untuk legacy |
| `citizenship` | `citizenship` | text/enum sesuai kontrak, tidak mengisi fakta legacy secara fiktif |
| `birthOrder` | `birth_order` | integer nullable, >=1 bila diketahui |
| `siblingCount` | `sibling_count` | integer nullable, >=0 bila diketahui |
| `dailyLanguage` | `daily_language` | text nullable |
| `studentStatus` | `student_status` | status akademik yang konsisten dengan active; rencana backfill berbasis fakta |

Pulihkan secara additive dari baseline `31b3adc`, tidak melakukan revert seluruh commit UI. Kembalikan tipe Drizzle yang eksplisit dan typed insert/update/select pada kontrak yang sesuai. Pastikan nama kolom, mapping, nullable/default, check/unique dan perilaku legacy konsisten. `studentStatus` dapat membutuhkan transisi nullable/backfill pada rencana release; jangan memalsukan status GRADUATED/PINDAH menjadi ACTIVE. Jangan menggunakan property runtime schema untuk menguji ketersediaan tabel fisik. Jika feature belum siap di database, gunakan gerbang kesiapan yang benar dan error eksplisit; jangan memberikan status berhasil terhadap data yang dibuang. Pertahankan seluruh 10 tabel tambahan existing. Jangan mengeksekusi migration, schema push, ALTER/DROP SQL atau perubahan database.


**Bukti audit awal (31b3adc):** NIS unique, NIK dan NISN belum unique; banyak relasi hanya memiliki index biasa, `studentStatus` default ACTIVE terpisah dari `active`. Tabel `student_aid_records.supporting_document_id` belum memiliki foreign key. Pada commit terbaru, 10 kolom identitas dihapus dan tidak ada migration baru dalam diff; constraint serta konsistensi status tetap wajib.

**Implementasi:**

- Pertahankan UUID, PK, nama tabel existing dan FK ke keuangan/ujian; kembangkan schema secara additive. Jangan menghapus atau mengganti ID siswa, kelas, tahun, wali, invoice atau pembayaran. Jangan menduplikasi tabel 10 domain yang sudah dibuat.
- NIS tetap unique. NIK dan NISN unik ketika terisi (null untuk string kosong), validasi panjang digit di server dan constraint yang tepat di schema. KK tidak unique. NIK anggota keluarga yang diketahui dapat digunakan untuk deteksi konflik/identitas reuse, bukan penggabungan otomatis; putuskan constraint yang aman dengan analisis data lama dan rencana resolusi duplikat. Jangan gunakan integer untuk identifier.
- Tambahkan unique `(student_id,address_type)` untuk alamat; constraint tipe alamat valid. Tambahkan unique relasi keluarga yang mencegah pengulangan link; atur satu ayah/ibu yang berlaku dan satu kontak utama aktif per siswa sesuai desain. Bila role kontak darurat berbeda, simpan referensi/record dengan relationship, nomor dan urutan yang sah; jangan mengubah semua primary contact menjadi emergency contact secara implisit. Pertahankan data individu shared.
- Sinkronkan enum/status akademik dengan kontrak yang disetujui (aktif, nonaktif, pindah, mengundurkan diri, lulus). Jika ada kode existing `TRANSFERRED_OUT`, `DROPPED_OUT`, `DECEASED` atau variasi lain, petakan eksplisit tanpa reinterpretasi diam-diam. Turunkan `active` dari status yang sah dalam satu service; lindungi jalur generic legacy. Rencanakan normalisasi siswa lama berdasarkan fakta `active`, bukan default ACTIVE untuk semua. Jangan isi NIK/KK, agama, status keluarga atau bantuan dengan asumsi yang tidak diverifikasi.
- Enrollment: validasi kelas milik tahun ajaran yang dipilih; isi `academicYearId` berdasarkan master kelas yang sah; periode efektif valid, tanpa penempatan aktif ganda/overlap yang tidak sah. Pisahkan tanggal penerimaan awal dari histori penempatan. Buat constraint, index dan transactional guard sesuai desain. Jangan menimpa histori invoice.
- Health profile satu per siswa (periksa constraint yang sudah ada untuk upsert); pengukuran dan bantuan tetap histori dengan tanggal, semester, tahun dan FK yang valid. Hubungkan dokumen bantuan dengan siswa yang sama; cegah referensi lintas siswa. Atur dokumen: status, versi, rekaman review, ukuran dan ownership; draft dan change request memiliki state machine, revision dan idempotency. Gunakan `check`, unique index, FK dan transaction yang tepat untuk mencegah race; index biasa bukan unique constraint.
- Rencanakan deteksi data duplicate/invalid serta langkah backfill berbasis fakta pada dokumen DAT terpisah. Siapkan urutan deploy kompatibel, backup, validasi dan rollback plan. Jangan membuat/menerapkan migration SQL atau menjalankan query ke Neon. Pada commit e3b88d4 `/api/state` kembali ke proyeksi kolom lama dengan placeholder nickname/status. Pertahankan kompatibilitas fitur lama melalui DTO minimal yang jujur, bukan mengklaim kolom baru sudah tersedia. Dokumentasikan risiko deployment sebelum schema siap. Jangan membuat fallback dummy, swallowing database errors atau bypass constraint untuk menutupi masalah ini.

**Target:** `src/db/schema.ts`, schema/DTO validation, service guard dan dokumen `5-skema-database.md`. Siapkan diagram relasi final, daftar constraint/index dan tabel risiko legacy. Tidak membuat file di `migrations/` pada tahap ini.

**Acceptance:** seluruh invariants terdefinisi pada source, request tidak dapat menghasilkan status/relasi bertentangan, duplicate/concurrent requests memiliki strategi jelas. Status runtime tetap BLOCKED_SCHEMA sampai schema diterapkan dan diverifikasi secara terpisah.

### FIN-003 — Form tambah/ubah harus menyimpan seluruh data yang diterima

**Bukti:** `createStudentAtomic()` L473–705 menyimpan siswa, alamat, ayah/ibu, registrasi, kesehatan dan bantuan, tetapi tidak memproses emergencyContact terpisah dan link portal. `updateStudentProfile()` L851–988 hanya menyimpan identitas, alamat dan kesehatan. `StudentFormView.tsx` L432–557 tidak memasukkan dokumen/pengukuran, data wali lain dan sejumlah atribut. Tambah pengukuran L349–365 masih state sementara.

**Backend:**

1. Buat kontrak write yang typed dan strict, membedakan create, update, draft, perubahan akademik, pengukuran dan dokumen. Definisikan absent = tidak berubah, null = hapus nilai bila diizinkan, [] = aksi yang disengaja, bukan menghapus diam-diam. Jika PATCH tetap full-profile karena kompatibilitas, jelaskan semantics dan jangan mengklaim partial update. Gunakan revision/conflict guard dan pemetaan error ke section/field.
2. Gunakan transaksi backend untuk data inti, alamat KK/domisili, registrasi, hubungan anggota keluarga, kontak utama, penanggung jawab SPP, emergency contact, profil kesehatan dan record bantuan/pengukuran yang dikirim sebagai satu operasi. Jangan menyimpan sebagian lalu mengembalikan sukses. Storage eksternal punya lifecycle terpisah (FIN-004), staging dan compensating action. Idempotency untuk submit/retry; tangani unique conflict 409 tanpa menampilkan NIK utuh. Validasi NIS/NIK/NISN di create/update/import dan schema constraint. Validasi tanggal nyata (misalnya tanggal kalender tidak valid yang dinormalisasi oleh JS harus ditolak), usia, range, FK dan kelas/tahun.
3. Family selection: `mode=new` membutuhkan data yang sah, `existing` membutuhkan ID yang valid dan diizinkan, `none` tidak mewajibkan nama kosong. Jangan menjalankan validator new-member untuk mode none/existing tanpa perubahan. Tambahkan update relasi secara scoped; mendukung reuse ayah/ibu lintas saudara, edit individu shared dengan izin dan peringatan dampak. Jangan menggabungkan berdasarkan nama/HP. Simpan data wali lain, relationship, kontak darurat yang berbeda, serta pilihan payment/primary contact. Jika data ayah/ibu meninggal atau tidak diketahui, field kondisional tidak menghambat administrasi. Jangan menimpa relasi saudara atau orang tua lain.
4. Portal: pertahankan link existing `guardian_students`. Jika form mendukung link akun wali yang telah diverifikasi, lakukan operasi eksplisit dengan authorization dan audit; jangan otomatis menciptakan akun/hak akses saat menyimpan biodata keluarga. Jangan putus link existing jika input keluarga tidak memuat link tersebut. Kartu/SSP portal harus tetap dapat dilihat oleh wali yang berhak.
5. Registration: simpan nomor/jenis/tanggal daftar dan diterima, tingkat awal, PAUD/TK, nama/NPSN/alamat sekolah asal, catatan dan tahun masuk. Update data administratif yang aman; perubahan kelas/tanggal masuk diproses melalui alur FIN-010, bukan diam-diam diabaikan atau bypass `server/resources.ts`. Berikan 409 yang jelas untuk kasus bertagihan; field yang tidak dapat diedit diberi alasan di UI.
6. Health: simpan semua field yang disetujui, termasuk jenis kebutuhan khusus, catatan medis dan darurat. Gunakan tipe/enum yang konsisten, bukan `z.any()` untuk payload bebas. Pengukuran baru dari form tambah/ubah masuk ke DB melalui kontrak yang jelas (batch atomik atau endpoint append dengan status eksplisit); jangan memasukkan ID `temp-*` sebagai ID permanen, jangan menggandakan histori pada edit. Validasi tanggal/semester/tahun/tinggi/berat. Implementasikan edit/koreksi histori dengan audit dan tanpa menghapus record sebelumnya secara diam-diam.
7. Aid: simpan nomor, sumber, periode, status, jenis, dokumen dan catatan sesuai schema. Bedakan belum diketahui/tidak menerima/menerima. Tambah/update data bantuan dengan ID/ownership; jangan menduplikasi seluruh array existing atau diam-diam mengabaikan update. Tidak mengubah invoice, status lunas atau kelayakan secara otomatis.
8. Return detail tersimpan dan revision/ID yang otoritatif setelah transaksi. Refetch detail/list; jika operasi berkas tertunda, beri status tertunda nyata, bukan semua tersimpan.

**Frontend integration target:** `StudentFormView.tsx`, `/master/siswa/tambah/page.tsx`, `/master/siswa/[id]/ubah/page.tsx`, `StudentDetailView.tsx`; kontrak typed di FIN-006; layout FIN-011. Prefill dari server, loading/error yang nyata. Jangan `.catch(() => {})` lalu menampilkan form kosong yang dapat menimpa data. Field yang tidak dapat diakses tidak dikirim kembali sebagai nilai kosong. Error server tampil inline, fokus section yang bermasalah.

**Acceptance:** pengisian 10 section yang memang dapat ditulis menyimpan data sesuai kontrak; tambah siswa, refresh, detail, ubah, refresh dan perbandingan DB di tahap UAT menghasilkan data yang sama. Transaksi gagal tidak meninggalkan data parsial; perubahan profil tidak mengubah invoice. Pengukuran dan bantuan tidak hilang setelah reload. Pada perubahan kebijakan finansial yang belum disetujui, blokir spesifik dan jangan menghapus proteksi.

### FIN-004 — Upload, download, review dan penggantian dokumen nyata

**Bukti:** `StudentFormView.tsx` L2561–2576 hanya membuat object URL dan setDocuments, tidak memanggil upload/register. `registerStudentDocument()` L1130–1170 mempercayai metadata request (storagePath/MIME/size) dan mengizinkan 10 MB; `server/files.ts` token membatasi 5 MB, signature helper hanya JPEG/PNG/PDF dan tidak dipakai pada registrasi dokumen siswa. `downloadStudentDocument()` L216–258 membaca private Blob, tetapi perlu kontrol akses dokumen dan kontrak unduh yang benar.

**Alur wajib:**

```text
Pilih tipe + file → validasi UI → otorisasi target siswa/draft di server
→ token upload terbatas untuk target/pengunggah → Private Blob upload
→ server verifikasi metadata sebenarnya + signature + ownership
→ registrasi record PENDING → refresh tabel dokumen aktual
→ review TU (VERIFIED / REJECTED + alasan) → histori/versi
→ preview/download terotorisasi
```

- Tambahkan client upload dokumen reusable berdasarkan pola `uploadProof`, bukan mengubah pembayaran. Token dibatasi izin, target yang sah, namespace, uploader, kategori, MIME, ukuran 5 MB dan TTL. Jangan memberi izin upload dokumen hanya karena ada sesi. Gunakan staging yang terikat pada draft/siswa dan actor; file sementara sebelum finalisasi bukan dokumen final. Cegah orphan saat gagal/batal, sediakan retry dan cleanup yang aman; jangan menghapus versi berkas yang masih dirujuk.
- Registrasi hanya menerima referensi upload yang sah; server mengecek Blob head/get dari store private yang benar, ownership/binding, jenis, actual size dan signature. Tidak percaya MIME, size, storagePath atau URL arbitrary dari client. Validasi JPEG/PNG/PDF dan WEBP bila diizinkan (khusus gambar). Pertahankan pembatasan format dan proof existing, jangan mengizinkan format baru pada bukti pembayaran secara tidak sengaja. Simpan metadata authoritative; file tidak disimpan sebagai base64 baru. Gunakan nama acak, pembatasan payload, sanitasi filename, header aman dan no-store.
- Gunakan status PENDING/VERIFIED/REJECTED yang konsisten; dokumentasikan status staging jika diperlukan, tidak mencampur DRAFT dengan VERIFIED. Verifikasi hanya role berizin; penolakan wajib alasan. Penggantian berkas menghasilkan versi baru berstatus PENDING, versi sebelumnya tetap tercatat sesuai kebijakan. Review tidak boleh menimpa status baru dari proses paralel; gunakan revision/lock.
- Gunakan route content yang benar (`GET /api/student-documents/:id/content` pada baseline), helper download dengan byte-range lengkap atau streaming aman. Pastikan seluruh file, termasuk >2 MB sampai 5 MB, dapat diunduh; jangan hanya mengembalikan potongan pertama saat user meminta seluruh file. Validasi range dan tipe respons, jangan membocorkan URL private atau path internal. Preview gambar/PDF melalui endpoint yang memeriksa authorization per request, termasuk identitas dokumen dan scope keluarga.
- Foto existing `photoUrl` berupa URL/data URL: pertahankan render kartu ujian lama. Foto baru disimpan secara aman lewat private storage yang kompatibel dengan detail siswa, kartu ujian individual/massal dan proses cetak; tidak menyimpan data URL baru ke DB. Jangan migrasi atau menghapus foto lama di tahap ini. Jika foto tidak dapat diakses, tampilkan kegagalan nyata, jangan gambar palsu.
- Implementasikan semua jenis dokumen dalam dokumen instruksi awal; daftar dokumen wajib/kondisional berasal dari policy terpusat. Jangan mewajibkan semua jenis kepada semua siswa.

**FE:** hapus object URL sebagai mekanisme penyimpanan. Object URL boleh untuk preview lokal saja dan harus direvoke. Tampilkan progress upload, pending, retry, berhasil setelah record server tercipta, review dengan alasan, unduh, ganti dan histori. Pada tambah siswa, gunakan staging draft yang sah atau simpan siswa terlebih dahulu lalu status berkas terpisah; jangan kehilangan file saat refresh. Tampilkan pesan kegagalan per file. Jangan memberi status sukses sebelum Blob dan record metadata terkonfirmasi.

**Acceptance:** upload/refresh/detail/unduh dokumen nyata; ukuran 5 MB enforced server; file tidak sah ditolak; pengguna tidak berhak tidak menerima berkas; review dan replacement persisten; pembayaran transfer dan kartu ujian tetap kompatibel. Tidak ada path `blob:` atau `temp-*` yang diperlakukan sebagai penyimpanan final.

### FIN-005 — Import XLSX aktual, export dan cetak

**Bukti:** `master/siswa/page.tsx` L1344–1354 memakai `setTimeout` simulasi; L1359–1370 menyatakan seluruh `importRows` sukses tanpa API. L263–351 hanya CSV dan parser split koma; NISN, ayah/ibu, alamat dan HP dari template tidak dipetakan secara lengkap. Export L207–261 hanya CSV client. Tidak ada endpoint import batch pada route student master yang diperiksa.

**Implementasi backend terlebih dahulu:**

- Hapus simulasi dan pesan sukses palsu. Implementasikan import `.xlsx` asli sesuai planning (CSV boleh opsi tambahan dengan parser standar, bukan pengganti XLSX). Pilih library yang kompatibel Node 24/Next.js server dan sesuai aturan dependensi repository; jangan menjalankan kode/macro/formula dari berkas. Tetapkan batas file/baris dan resource yang aman; validasi workbook, sheet, header, tipe, formula, merged cell yang tidak didukung, kolom tak dikenal dan nilai yang tidak dapat dipertanggungjawabkan. Gunakan template kolom dari spesifikasi asli: identitas, registrasi, alamat, ayah/ibu/wali. NIK, KK, NIS, NISN, HP, RT/RW, kode pos adalah text; lindungi leading zero dan jangan merekonstruksi digit yang sudah hilang dari Excel.
- Buat preview/validation server dan commit terpisah (contoh usulan `POST students/import/preview`, `POST students/import/commit`; putuskan naming konsisten FIN-006). Preview tidak menulis siswa; menghasilkan row ID, nomor baris, error per field, status, kelas/tahun hasil resolusi, duplikat intra-file dan database. Gunakan validasi yang sama dengan createStudentAtomic. Snapshot/preview token terikat actor, expiry, content/revision; commit validasi ulang, termasuk konflik yang muncul sejak preview.
- Commit hanya baris yang dipilih/diizinkan, dengan kebijakan eksplisit all-or-nothing atau per-row atomik yang transparan (pilihan awal: baris valid boleh diimpor setelah konfirmasi eksplisit, baris invalid tidak ditulis). Jangan upsert/update siswa existing diam-diam. Gunakan idempotency dan constraint unik; rollback record terkait pada setiap baris yang gagal. Batasi transaksi/batch sesuai serverless. Return jumlah created/failed/skipped yang berasal dari hasil server dan daftar hasil aktual. Sediakan laporan error yang dapat diunduh tanpa membuka data yang tidak berhak. Setelah commit refetch list/summary; jangan menganggap jumlah input sama dengan jumlah berhasil.
- Export XLSX aktual dengan whitelist kolom, filter/scope dan izin backend; CSV opsional. Pilihan seluruh siswa yang diizinkan, kelas, tahun, status, kelengkapan, selected IDs sesuai spesifikasi. Gunakan format text untuk identifier. Cegah formula injection pada seluruh export, termasuk nama/notes. Tidak menyertakan NIK/KK, penghasilan, kesehatan atau file pada export umum. Catat audit export secara aman. Jangan mengklaim kompatibel import Dapodik tanpa verifikasi format.
- Cetak biodata A4 dan ringkasan buku induk memakai data aktual, termasuk tahun/kelas, keluarga, riwayat dan foto terotorisasi, dengan data sensitif hanya sesuai izin. Tidak mengarang nilai, histori atau standar resmi. Pertahankan print existing untuk kuitansi dan kartu ujian. Pastikan CSS print benar: modal/action disembunyikan, A4 margin/print area konsisten, page break aman, foto termuat, header/kop memakai logo existing, field kosong ditandai belum tersedia.

**FE wizard wajib:** tahap 1 unduh template XLSX + petunjuk, tahap 2 pilih file, tahap 3 hasil validasi dengan filter valid/invalid/duplikat, tahap 4 konfirmasi jumlah baris yang benar-benar akan diproses, tahap 5 hasil server (berhasil/gagal/terlewati) + unduh laporan dan refresh. Tombol commit disabled bila tidak ada baris valid, saat loading, atau preview basi. Tidak boleh fake success, timer pengganti API, input data demo otomatis atau mengabaikan data keluarga. Skema lengkap FIN-011.

**Acceptance:** hasil import benar-benar tercatat setelah reload; retry tidak menduplikasi; data invalid tidak tersimpan; angka nol depan terjaga; XLSX tersedia; export/cetak mematuhi scope. Jika database belum bisa diuji, catat NOT_TESTED/BLOCKED_SCHEMA, tidak mengatakan import berhasil.

### FIN-006 — Selaraskan seluruh kontrak API dan typed mapping

**Bukti:** perbandingan `server/app.ts` L204–292 dengan `StudentDetailView.tsx`, `StudentFormView.tsx`, dan `master/siswa/page.tsx` menemukan mismatch di bawah. Jangan membuat endpoint duplikat hanya agar URL salah tampak berhasil.

| Fungsi | Frontend bermasalah | Backend baseline / perbaikan |
|---|---|---|
| Detail/create/edit | `any`, full payload dan error disembunyikan | typed DTO create/read/PATCH; semantics jelas; error 4xx terstruktur |
| Download dokumen | `/student-documents/:id/download` | `/student-documents/:id/content` dengan helper unduh lengkap |
| Review dokumen | `status, verificationNotes` | `status, rejectionReason`; strict schema; alasan penolakan wajib |
| Nama/alasan dokumen | `fileName`, `verificationNotes` | `originalFilename`, `rejectionReason` (atau DTO mapper eksplisit) |
| Pengukuran | `measuredAt`, `headCircumferenceCm` | `measurementDate`, `heightCm`, `weightKg`, `semester`, `academicYearId`, `notes`; jangan kirim field yang tidak didukung |
| Bantuan | `programName`, `year`, `amount` | `aidType`, `aidNumber`, `aidSource`, `startDate`, `endDate`, `status`, `notes`, relasi bukti yang disetujui |
| Registrasi | `enrollmentType`, `hasAttendedPaud` | `registrationType`, `attendedPaud`, `attendedKindergarten`, tanggal dan kelas sesuai DTO |
| Draft list | Sudah menerima `{drafts}` pada e3b88d4 | Pertahankan kontrak wrapper yang sudah diperbaiki; typed mapping, jangan menyamarkan kegagalan schema menjadi daftar kosong |
| Draft resume | URL `?draftId=...` tidak dipulihkan | GET detail draft, PATCH draft yang sama, POST finalize dengan ID/revision |
| Daftar pengajuan | `/student-profile-change-requests` | Alias sudah tersedia pada e3b88d4; tetapkan canonical path dan kompatibilitas sementara, jangan mengulang perbaikan alias |
| Review pengajuan | `status`, `reviewNotes` | `approved: boolean`, `rejectionReason`; strict schema |
| Bentuk list pengajuan | `data.requests`, `r.status` | wrapper `{requests}` sudah ada; item masih nested `{request, student, user}`. Selaraskan consumer atau DTO eksplisit agar status dan ID tidak undefined |

- Tetapkan satu kontrak untuk endpoint final (method/path, request, response, HTTP code, validation errors, pagination, authorization). Contoh response list baru boleh berupa `{rows, pagination, summary}`; jika merubah array existing, perbarui semua consumer dan test bersama. Jangan mencampur shape. Gunakan shared TypeScript types/Zod schema yang aman di server/client atau generated contract. Kurangi `any` pada jalur kritis; Zod strict untuk mutasi, jangan membiarkan field UI penting diam-diam dibuang.
- Gunakan `src/lib/api.ts` dengan aturan session/CSRF existing untuk request, error parsing dan typed response; helper file khusus untuk binary. Normalisasi error 401/403/404/409/422/413/429/5xx sesuai konvensi, hindari menampilkan detail sensitif. Tidak menangkap error lalu mengubahnya menjadi empty success. Refetch atau invalidasi cache setelah mutasi.
- Periksa semua caller, termasuk dashboard wali dan detail profil, route generic yang dapat bypass guard, test, docs `6-kontrak-api.md` dan daftar endpoint. Penyesuaian API hanya yang dibutuhkan, jaga kompatibilitas existing SPP/ujian. Tambahkan contract test (valid payload, wrong field, error, permissions, mapping), termasuk helper yang menghasilkan URL/method yang benar.

**Acceptance:** tidak ada mismatched route/field/response di tabel; pengujian tipe tidak bergantung pada `any` untuk menyembunyikan masalah; error nyata ditampilkan. Dokumentasi sesuai implementasi, bukan endpoint imajiner.

### FIN-007 — Draft/resume dan finalisasi yang aman

**Bukti:** `tambah/page.tsx` L43–49 selalu POST draft, tidak mengambil/menyimpan ID hasil, tidak membaca query `draftId`; list wrapper `{drafts}` sudah disesuaikan pada e3b88d4; resume/finalize tetap belum benar. `createStudentAtomic()` L681–690 memperbarui draft berdasarkan ID saja tanpa pemeriksaan owner/status/revision. `saveStudentDraft()` menyimpan `data as any`, belum membatasi bentuk/ukuran dan belum mengunci state finalized.

- Buat schema draft yang menerima field parsial, tervalidasi tipe dan batas ukuran; tidak memaksa seluruh data final. Gunakan ID draft server, owner, status, revision/updatedAt. POST hanya saat pertama, PATCH untuk perubahan berikutnya, GET untuk resume, DELETE/cancel sesuai izin dan status. Jangan membuat draft baru setiap klik/autosave. Draft tidak boleh masuk `students`, invoice, kartu ujian atau global state data aktif.
- Pada `/master/siswa/tambah?draftId=...`, baca parameter, fetch draft milik actor, restore semua section, referensi file staging dan pilihan keluarga. Tampilkan loading, not found/forbidden, conflict dan retry. Jika draft finalized, jangan buka sebagai form baru; arahkan ke siswa final yang sah. Simpan manual selalu tersedia; autosave debounce jika benar-benar diimplementasikan, jangan menyebut autosave jika hanya manual. Tampilkan waktu tersimpan dari server dan dirty state; jangan menyimpan data sensitif ke localStorage/sessionStorage.
- Finalisasi: verifikasi ownership, status DRAFT, revision, payload final, idempotency dan lock dalam transaksi bersama create. Hanya satu final student per draft; request ulang yang sama mengembalikan ID hasil sebelumnya atau konflik jelas. Tidak boleh memfinalisasi draft orang lain atau mengubah draft finalized. Gunakan file staging yang terikat dan mekanisme cleanup/retry FIN-004; jangan mengklaim DB dan Blob satu transaksi.
- Cegah race save/autosave/finalize; error jaringan tidak dianggap sukses. List draft hanya milik/izin sesuai policy, dapat melanjutkan/menghapus melalui konfirmasi; data tersimpan tidak bocor ke daftar siswa aktif.

**Acceptance:** simpan draft dua kali menghasilkan satu ID dengan revision meningkat; refresh/resume mempertahankan data; finalisasi hanya sekali; actor lain tidak dapat membaca/mengubah; draft tidak menghasilkan tagihan; gagal finalisasi tidak meninggalkan data atau status palsu.

### FIN-008 — Satu sumber kelengkapan biodata

**Bukti:** `estimateCompleteness()` `master/siswa/page.tsx` L44–54 hanya enam field; threshold >=80% dianggap lengkap. `StudentFormView.tsx` L384–428 menghitung versi lokal dan `documents.length>0`. `calculateStudentCompleteness()` L314–456 memakai sepuluh section tetapi bantuan/karakteristik selalu COMPLETE, KK/tempat lahir tidak diperiksa, kontak darurat diambil dari primary contact, dokumen hanya tiga jenis dan N/A tidak digunakan pada penyebut.

- Buat satu evaluator kebijakan terpusat, server-authoritative, mencakup 10 section asli. Bedakan field mandatory/optional/conditional, unknown/not supplied dan not applicable. Untuk profil existing gunakan data persisted; untuk preview form/draft boleh evaluator murni yang sama di server atau shared pure function dengan status jelas "perkiraan belum disimpan". Jangan tampilkan preview sebagai skor server. Daftar, detail dan form setelah save harus sinkron.
- Identitas: periksa data inti, tempat/tanggal lahir, NIK dan KK sebagai kelengkapan administrasi sesuai planning; NISN belum terbit tidak memblokir. Alamat, registrasi, keluarga dan kontak darurat memakai field relevan yang benar-benar disimpan. Kondisi meninggal/tidak diketahui ditangani tanpa memaksa data fiktif. Golongan darah/medis yang opsional tidak mengurangi skor. Bantuan dan karakteristik tidak diberi COMPLETE tanpa bukti atau aturan N/A yang sah. Gunakan data template/submission aktual dan status bantuan yang diketahui.
- Return `{sections, missingFields, applicableCount, completedCount, percentage, isComplete, documentSummary}` dengan tipe yang konsisten; definisikan formula dan denominator yang disetujui (N/A dikeluarkan; 0 applicable => N/A, bukan 100% buatan). Bedakan kelengkapan biodata dan status dokumen: tampilkan dokumen wajib berlaku, belum upload, menunggu, terverifikasi, ditolak. Dokumen hanya memenuhi aturan sesuai status/policy, bukan sekadar panjang array. COMPLETE bila seluruh persyaratan yang berlaku dipenuhi; angka 80% boleh menjadi filter "progres >=80%", tidak diberi label lengkap kecuali kebijakan eksplisit. Jangan mengubah aktivasi, pembayaran dan kelayakan ujian.
- List endpoint harus mengembalikan ringkasan authoritative dan query filter/search/pagination server-side dengan projection aman (tanpa NIK/KK mentah, kesehatan, seluruh keluarga atau berkas). Hitung batch/aggregate tanpa N+1; jika memilih materialized summary, pastikan invalidasi/update transaksional setelah perubahan domain dan fallback aman. Summary cards dan filter harus menggunakan scope yang sama, state filter/reset/page konsisten. Jangan memuat profil lengkap setiap siswa ke browser untuk menghitung progress.

**Acceptance:** siswa lama dengan hanya enam field tidak tampil 100%; nilai form, list dan detail setelah reload konsisten; data conditional tidak dihukum; dokumen dan biodata terpisah; per-section alasan dan aksi menuju section tersedia bagi role berizin; status kelayakan ujian tidak berubah karena skor biodata.

### FIN-009 — Karakteristik Anak harus terintegrasi data nyata

**Bukti:** `StudentFormView.tsx` L2042–2077 dan `StudentDetailView.tsx` L1797–1828 hanya teks/banner yang mengklaim integrasi, tanpa template/submission/answers aktual. Backend profile belum membaca entitas karakteristik untuk completeness.

- Baca schema, route dan komponen Karakteristik Anak existing: `characteristic_form_templates`, `characteristic_form_fields`, `characteristic_submissions`, `characteristic_answers`. Reuse mekanisme template, pengisian dan hak akses; jangan buat tabel/jawaban kedua. Jika data existing hanya mendukung satu submission per template/siswa, jangan mengarang histori revisi; tampilkan data yang memang tersedia dan rancang histori aditif jika sesuai cakupan, tanpa migrasi tahap ini.
- Sediakan ringkasan real berdasarkan siswa dan template berlaku: nama template, status belum diisi/terisi/draft sesuai domain, tanggal, jumlah jawaban dan detail yang diizinkan. Tampilkan pilihan melihat detail/isi/perbarui melalui route existing yang benar. Untuk siswa baru belum memiliki ID, beri keterangan "tersedia setelah siswa disimpan" atau staging yang benar-benar didukung, bukan status lengkap. Gunakan policy FIN-008 untuk completeness.
- Cakupan konten sesuai planning awal (hobi, cita-cita, bakat, kebiasaan belajar, kemandirian, sosial, Al-Qur'an, hafalan, ibadah, harapan/catatan orang tua), melalui template existing dan konfigurasi yang disetujui. Tidak melakukan perubahan data template production, tidak menjadikan karakteristik syarat seleksi/kelayakan ujian.

**Acceptance:** section 09 dan tab detail menunjukkan data submission aktual; kosong/error/loading jujur; aksi membuka halaman/fitur yang bekerja; wali hanya anak terkait; tidak ada label "aktif terhubung" tanpa bukti integrasi.

### FIN-010 — Riwayat akademik & pengajuan perubahan wali

**Bukti:** `updateStudentProfile()` tidak memproses registrasi/kelas; `server/resources.ts` L164–183 memiliki guard siswa bertagihan untuk class/enrolledOn. `reviewProfileChange()` L1209–1320 menggunakan patch record bebas, hanya subset field siswa diterapkan, tidak menangani alamat/HP sebagaimana test/pengajuan contoh; tidak terlihat pemeriksaan status SUBMITTED sebelum review. FE list memanggil route/payload yang berbeda, dashboard wali yang diperiksa tidak menunjukkan handler pengajuan biodata. Belum ada bukti flow end-to-end.

**A. Akademik:**

- Reuse `student_enrollments` untuk initial enrollment, tahun ajaran, penempatan, promosi, pindah, lulus, mengundurkan diri dan histori periode. Buat query/DTO riwayat dengan label kelas/tahun yang benar dan status efektif. Jangan menciptakan histori palsu pada siswa lama; jika belum ada, tampilkan hanya penempatan existing sebagai data saat ini dan tandai kebutuhan backfill terpisah.
- Perubahan administratif (nomor daftar, sekolah asal, catatan) tidak perlu mengubah histori invoice. Perubahan penempatan/status akademik melalui service khusus, lock/revision, validasi tahun/kelas/periode, close previous + create next record dalam transaksi, sinkron status siswa. Pertahankan proteksi `server/resources.ts` untuk siswa yang sudah memiliki invoice. Jangan mengubah kelas/tanggal masuk melalui jalur alternatif yang melewati guard. Untuk pindah/naik kelas bertagihan yang belum memiliki kebijakan finansial disetujui, blokir transaksi dan tampilkan pesan/alur keputusan yang tepat. Jangan hardcode kebijakan baru.
- Tampilkan riwayat akademik kronologis dan audit perubahan biodata terpisah. Jangan hanya menampilkan record enrollment pertama atau memalsukan tanggal. Jika status perubahan akademik terkunci, form jelaskan alasan.

**B. Pengajuan wali:**

- Implementasikan portal yang benar-benar memiliki entry point "Ajukan Pembaruan Biodata" bagi wali untuk anak sah. Gunakan route portal yang benar berdasarkan navigation/role existing, bukan link ke halaman yang tidak tersedia. Wali hanya dapat meminta field whitelist yang disetujui (misalnya kontak/alamat dan identitas administratif yang diizinkan); tidak dapat mengubah NIS, kelas/status, nominal SPP, status bayar atau kelayakan. Validasi tipe/format per field, ownership dan target, alasan/bukti bila dibutuhkan. Unknown key ditolak; jangan simpan arbitrary `z.record(z.string(), z.any())` tanpa validasi.
- Simpan snapshot nilai lama/revision target secara aman, proposed changes, requester dan status SUBMITTED; permission review TU khusus dan audit teredaksi. Tampilkan perbandingan sebelum/sesudah hanya kepada reviewer berizin. Approve harus menerapkan setiap perubahan yang diajukan dan sah ke entity sebenarnya (alamat/HP anggota keluarga sesuai target dan scope; bukan hanya subset `students`). Tidak boleh status APPROVED jika field valid tidak diterapkan. Jika perubahan shared memengaruhi saudara, tampilkan dampak/konfirmasi dan cek izin. Reject wajib alasan. Perubahan yang memerlukan dokumen harus diverifikasi sesuai policy.
- State machine SUBMITTED → APPROVED/REJECTED; lakukan conditional update/lock/revision dan transaction apply + status. Tolak review ganda/konflik nilai yang sudah berubah (409 dan minta review ulang). Wali tidak boleh review pengajuannya; staff tidak boleh memakai jalur guardian request untuk bypass policy. Berikan riwayat/status pengajuan untuk pemohon, masking data pihak lain. Gunakan kontrak FIN-006, queue yang actual, bukan badge kosong.

**Acceptance:** riwayat akademik sesuai data nyata, guard invoice tidak bypass, wali mengirim pengajuan, TU melihat perbandingan, approve memperbarui tepat field sah, reject tidak mengubah biodata; repeated/concurrent review aman; refresh menunjukkan hasil yang benar. Jika keputusan mutasi bertagihan/izin belum disetujui, status blocker spesifik dan fitur lain berjalan.

### FIN-011 — Integrasi fungsional frontend (MANDATORY UI FREEZE)

**Baseline visual yang dikunci:** `e3b88d44279894261c4128ba4ee36d848dd4eb4b`, terutama `src/app/(app)/master/siswa/_components/StudentFormView.tsx`. Pengguna telah memperbarui sendiri tampilan menggunakan Base Component dan mengirim screenshot persetujuan. Pertahankan perubahan tersebut. Jika ada perbaikan visual pengguna yang lebih baru pada working tree, pertahankan pula, jangan reset ke commit lama. Ketentuan ini mengesampingkan instruksi lama yang meminta redesign, wireframe baru, atau restrukturisasi visual. Cakupan fitur tidak dikurangi.

**Skema tampilan yang dikunci (deskriptif, bukan desain baru):** header/progres existing; layout dua panel dengan navigasi 10 bagian di kiri dan section aktif di kanan; pada source baseline grid `grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6`, sidebar sticky desktop; urutan field dan grouping, foto rasio 3:4 pada section Identitas, posisi tombol Batal/Kembali/Selanjutnya/Simpan existing; komponen Card, Button, Input, Select, Textarea, Badge, Modal, FormField, style tokens dan tema sekolah. Pertahankan layout responsif yang ada. Screenshot pengguna menunjukkan halaman Ubah Siswa dengan foto di area atas form, grid dua kolom, sidebar kiri dan tombol di bawah. Jangan mengubah visual tersebut untuk mengatasi error.

**Larangan mutlak:**

- Tidak mengubah layout, grid, lebar panel, ukuran field, spacing, padding, gap, warna, typography, border, radius, posisi foto, header, sidebar, navigasi, posisi/ukuran tombol, atau CSS/theme global untuk alasan error fungsional.
- Tidak mengganti Base Component, menulis ulang `StudentFormView.tsx`, merombak `StudentDetailView.tsx`, membuat desain baru atau mengembalikan inline styling lama. Tidak mengganti komponen bersama dengan cara yang mengubah tampilan halaman lain. Jangan mengganti label/struktur desain yang sudah disetujui kecuali pesan status/error yang memang dibutuhkan.
- Tidak menghapus field/section, tombol, schema, validasi, otorisasi, maupun fitur untuk menyembunyikan error. Tidak mengubah tampilan supaya fitur yang gagal tampak berhasil.
- Jika memang membutuhkan komponen/aksi yang belum ada untuk cakupan yang disetujui (misalnya akses pengajuan wali), gunakan Base Component existing dan slot/halaman yang sesuai tanpa merombak desain existing. Jika perubahan itu menggeser layout atau mengubah tampilan yang sudah disetujui, catat `BLOCKED_UI_APPROVAL`, jangan lakukan perubahan visual tanpa persetujuan. Selesaikan bagian backend dan wiring lain terlebih dahulu. Tidak perlu meminta approval untuk perbaikan nonvisual yang telah disetujui.

**Perubahan yang diperbolehkan dan wajib:** handler, state, props, types, API client, mapping data server, restore draft, loading/disabled/submitting, validasi dan pesan error pada slot existing, akses sesuai permission, binding value, refresh/invalidation, aksi tombol aktual. Gunakan komponen yang sudah dipakai. Jangan mengganti styling demi perubahan fungsi. Gunakan `FormField`/helper error existing untuk field error, bukan redesign form. Pada error load profil jangan membolehkan submit data default kosong menimpa data lama. Jika submit gagal, pertahankan input, tampilkan pesan yang jelas dan arahkan ke section bermasalah. Tombol sukses hanya berdasarkan respons server yang sah.

**Matriks functional wiring wajib (desain tidak berubah):**

| Halaman/section existing | Fungsi yang harus benar | FIN |
|---|---|---|
| Daftar Master Siswa | Summary/filter/pagination berdasarkan server; aksi import/export/draft/review nyata | 005–008, 010 |
| Form tambah/ubah | Fetch prefill yang sah, save atomik, error field, pending, tidak kehilangan data | 002–003, 006–007 |
| 01 Identitas | Seluruh field tambahan tersimpan dan kembali saat reload; foto aman; validasi NIS/NIK/NISN/KK | 001–004 |
| 02 Alamat | KK dan domisili, data bertingkat atau fallback input terstruktur yang nyata | 003 |
| 03 Registrasi | Tahun/kelas dan detail registrasi tersimpan; guard histori tagihan | 003, 010 |
| 04 Ayah / 05 Ibu | Reuse, mode none/new/existing dan update yang sah; prefill nyata | 003 |
| 06 Wali & Kontak Darurat | Penanggung jawab, kontak darurat, relasi portal eksplisit dan terotorisasi | 001, 003 |
| 07 Kesehatan | Profil dan histori pengukuran benar-benar persisten | 001, 003, 006 |
| 08 Bantuan | Periode/jenis/status/sumber sesuai backend, tanpa mengubah invoice | 003, 006 |
| 09 Karakteristik | Template/submission/answers aktual, empty state jujur | 008–009 |
| 10 Dokumen | Upload private, status aktual, preview/unduh/review | 004, 006 |
| Detail siswa | Tab dan tampilan existing dipertahankan; mapping/akses/API diperbaiki | 001–004, 006, 008–010 |
| Import/export/cetak | Wizard dan modal existing, operasi aktual, hasil berdasarkan server | 005 |
| Draft | Resume/save/finalize dengan ID/revision benar | 007 |
| Pengajuan wali & review TU | Validasi, izin, payload, status, refresh sesuai kontrak | 010 |

**Pemeriksaan UI FREEZE:** bandingkan diff JSX/layout/className/style/CSS dengan baseline dan perubahan pengguna. Catat seluruh perubahan visual yang benar-benar diperlukan (misalnya teks error di slot existing); perubahan visual yang belum disetujui tidak boleh masuk patch. Tulis skenario visual regression desktop/mobile untuk tahap UAT yang diizinkan; jangan mengklaim screenshot/visual test telah lulus tanpa eksekusi. Jangan menjalankan dev/build untuk mendapatkan screenshot pada tahap ini.

**Acceptance:** desain visual existing tetap dipertahankan, semua event/aksi yang berada dalam scope terhubung ke backend, tidak ada fake success, semua data tersimpan/terbaca sesuai izin. Laporkan jika penyempurnaan fitur baru membutuhkan keputusan UI; jangan menutup task hanya karena refactor Base Component sudah ada.

### FIN-012 — QA, regression, UAT dan perbaikan laporan Agent

**Bukti:** laporan `LAPORAN_IMPLEMENTASI_MASTER_SISWA.md` menyatakan SELESAI 100% dan semua TC LULUS, `_ACTIVE-TASK.md` juga 100%. `tests/student-master.test.ts` hanya berisi 8 unit test baru (validasi, completeness, masking). Bukti log laporan menyebut 8 test dan typecheck, bukan bukti UAT seluruh 60 skenario. Audit tidak menjalankan ulang test atau database. Ada mismatch mapping test case dan fungsi simulasi yang bertentangan dengan klaim lulus.

**Tindakan:**

1. Reopen pekerjaan yang belum memenuhi DoD menggunakan status yang sah menurut aturan repository. Pertahankan histori laporan awal sebagai catatan; perbarui status dan beri koreksi dengan alasan/bukti, jangan menghapus jejak klaim terdahulu. Jangan menggunakan "100%" tanpa cakupan dan bukti.
2. Pertahankan ID, judul dan expected outcome TC-01–TC-60 asli berikut secara verbatim. Pertahankan juga TC-61–TC-75 dari versi FIN sebelumnya. Tambahkan TC-76–TC-80 tanpa menggeser test asli. Pemetaan test source/UAT harus jelas; satu unit test dapat membuktikan satu bagian acceptance, bukan seluruh end-to-end. Test dengan fixture/migration/DB/build/browser yang dilarang pada tahap ini cukup ditulis dan dicatat belum dijalankan.
3. Tambahkan unit test schema, state machine, completeness conditional, sanitization, import parser/validation, permission dan contract; tambahkan source integration test untuk rollback, unique constraints/race, draft finalisasi, guardian scoping, file validation/download, import commit, request review, finance/exam regression. Gunakan pola `node:test`, PGlite dan Playwright yang sesuai rules existing. Mock terbatas hanya untuk test fixture, tidak untuk jalur runtime production. Jangan menganggap fixture test sebagai bukti Neon production.
4. Audit script sebelum menjalankan typecheck `tsc --noEmit` atau unit test murni yang tidak memerlukan build/dev/migrasi/DB operasional. Jangan menjalankan test suite yang diam-diam menerapkan migration fixture pada tahap terlarang. Jangan mengubah test runner untuk men-skip kegagalan lalu mengklaim lulus. Catat command, waktu, exit code, jumlah pass/fail, output ringkas yang benar, dan commit/source yang diuji. Jika belum ada dependensi/izin, NOT_TESTED atau BLOCKED.
5. Prioritaskan UAT P0 setelah database dan lingkungan test disetujui: login dan role, siswa existing tetap terbaca, create/edit lengkap dan reload, validasi duplicate, upload/download >2 MB, review, import XLSX commit/retry, draft resume/finalize, akses lintas siswa, audit redaction, invoice tetap utuh. Berikutnya daftar/filter/pagination, karakteristik, riwayat, review wali, cetak, mobile/tablet, seluruh regression SPP/kartu ujian. Gunakan data uji sintetis di lingkungan isolasi, bukan data anak nyata untuk demo/log. UAT tidak dilakukan sekarang jika memerlukan build/dev/migration/deploy yang dilarang.

**Matriks test asli (tidak boleh diubah):**

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

**Format hasil pengujian:** ID, FIN/TGS, expected, actual, jenis test (unit/integration/browser/manual/static), path/simbol, command/bukti, status, blocker. Status bukti: IMPLEMENTED_IN_SOURCE, VERIFIED_STATIC, PASSED (hanya test benar-benar dijalankan), FAILED, NOT_TESTED, BLOCKED_SCHEMA, BLOCKED_POLICY. Status tiket resmi tetap mengikuti aturan repo. Pisahkan bukti code review dari eksekusi. Jangan menandai seluruh TC lulus karena 8 unit test atau typecheck lulus.

**Acceptance:** test matrix asli utuh, test tambahan relevan ditulis, laporan status aktual dikoreksi, daftar gerbang yang belum dijalankan jelas. Laporan final tidak menyatakan production-ready selama schema/migrasi/runtime belum diverifikasi.

## Context

### 1. Sumber dan bukti baseline

- Commit audit ulang dan baseline UI: `e3b88d44279894261c4128ba4ee36d848dd4eb4b` (main), pesan `feat: implement comprehensive StudentFormView component for student master data management`. Waktu commit 24 November 2026 14:53:34 WIB, metadata push terakhir repository 14:53:39 WIB. Dibandingkan audit awal `31b3adc` terdapat dua commit baru, delapan file berubah.
- Diff terbaru: `https://github.com/MHamzah1/sistem-sdit-at-taqwim/compare/31b3adc654287e1f09bbee1340d4ce648becedf5...e3b88d44279894261c4128ba4ee36d848dd4eb4b`.
- Tampilan Base Component telah disetujui pengguna; UI FREEZE. Jangan melaksanakan skema redesign lama jika bertentangan.
- [Log error runtime aktual dari Agent/lingkungan yang telah tersedia secara sah], [status schema fisik Neon], [izin tahap migrasi dan UAT] belum diberikan/terverifikasi. Tidak mengarang detail runtime atau menyimpulkan DB live sudah bermigrasi.

**Bukti audit ulang pada e3b88d4:**

| File/simbol | Temuan source terkini |
|---|---|
| `src/db/schema.ts` L145–169 | 10 kolom identitas tambahan tidak lagi ada; pulihkan |
| `server/studentMaster.ts` L473–537, L914–1055 | Conditional `as any` melewati field; update masih hanya subset; constraint/validasi unik NISN belum tersedia |
| `server/studentMaster.ts` L708–883, L1095–1108, L1310–1337 | Fallback 42P01/42703 menjadi null/array kosong; profile masih tanpa izin sensitif granular |
| `server/state.ts` L21–44 | Projection legacy; `nickname: null`, `studentStatus` turunan active bukan nilai status akademik penuh |
| `server/app.ts` L229–296 | Wrapper draft dan alias/wrapper change request ada; kontrak review masih strict `approved,rejectionReason`, download `/content` |
| `master/siswa/page.tsx` L44–54, L165–184, L1340–1370 | Estimasi enam field, review payload salah, import simulasi setTimeout |
| `StudentFormView.tsx` L469–638, L1950–2005, L2365–2435 | Payload tidak membawa measurements/documents; karakteristik statis; upload object URL sementara |
| `StudentFormView.tsx` L1–115, L675–770 | Base Component dan layout dua panel yang disetujui; jangan redesign |
| File yang tidak berubah pada diff terakhir | `server/security.ts`, `server/files.ts`, `StudentDetailView.tsx`, route tambah/ubah, `tests/student-master.test.ts`; masalah audit awal masih perlu ditangani |
| `_ACTIVE-TASK.md` | Masih 100% Complete; laporan finishing belum ditemukan pada path yang diperiksa |

**Bukti historis audit awal (31b3adc) untuk temuan yang belum diselesaikan:**

- Repository: `https://github.com/MHamzah1/sistem-sdit-at-taqwim`.
- Branch: `main`. Commit audit `31b3adc654287e1f09bbee1340d4ce648becedf5`, pesan `feat: add student master data management feature with full CRUD and documentation`, tanggal commit 24 November 2026 12:19 WIB. Baseline sebelum perubahan `d6e6ded839ecfc493ecd083351db0d8f47aa1ad2`.
- Diff: `https://github.com/MHamzah1/sistem-sdit-at-taqwim/compare/d6e6ded839ecfc493ecd083351db0d8f47aa1ad2...31b3adc654287e1f09bbee1340d4ce648becedf5`.
- Referensi utama yang telah disetujui: `docs/instruksi/INSTRUKSI_AGENT_MASTER_SISWA_SDIT_AT_TAQWIM.md`. Salinan dokumen awal dibaca kembali saat menyusun instruksi finishing, terutama cakupan, batasan, skema tampilan dan TC-01–TC-60.
- `docs/fitur/kelengkapan-master-siswa/LAPORAN_IMPLEMENTASI_MASTER_SISWA.md` dan `_ACTIVE-TASK.md`: klaim 100% tidak sesuai bukti source dan gerbang verifikasi. Tidak membuat migrasi sesuai larangan sebelumnya, bukan bukti bahwa migration telah berhasil.
- Stack Next.js App Router, React/TypeScript, Tailwind CSS, Drizzle ORM, Neon PostgreSQL, Zod, private Vercel Blob. Periksa package.json aktual sebelum menambah dependency. Tidak gunakan .NET sebagai stack utama.

**Bukti source yang perlu diperiksa ulang pada working tree Agent sebelum mengedit (line pada commit audit, dapat bergeser setelah perubahan):**

| File | Bukti |
|---|---|
| `src/db/schema.ts` L145–179, L498–718 | Kolom baru, 10 tabel baru, constraint dan relasi yang belum lengkap |
| `server/studentMaster.ts` L68–313 | Validation schema, family mode, health, aid, full payload |
| `server/studentMaster.ts` L314–456 | Completeness belum conditional dan dokumen/bantuan/karakteristik tidak lengkap |
| `server/studentMaster.ts` L473–705 | Create atomik, kontak darurat/portal belum diproses, finalisasi draft belum aman |
| `server/studentMaster.ts` L706–850 | Full-profile select/response dan pencarian keluarga |
| `server/studentMaster.ts` L851–1065 | Update subset saja, draft save/read/delete |
| `server/studentMaster.ts` L1067–1321 | Measurement/aid, register/review doc, change request dan review |
| `server/app.ts` L204–292 | Routing dan kontrak endpoint aktual |
| `server/security.ts` L65–99, L187–208 | Permission, audit, ownStudent |
| `server/files.ts` L20–91, L216–258 | Signature helper, upload token, download private Blob |
| `server/state.ts` L21–41, L91–102 | Projection siswa dan audit, risiko query kolom baru sebelum migrasi |
| `server/resources.ts` L164–183 | Guard perubahan class/enrolledOn pada histori invoice |
| `src/app/(app)/master/siswa/_components/StudentFormView.tsx` L281–595, L1930–2103, L2548–2588 | Foto data URL, pengukuran lokal, getPayload, section statis, upload sementara |
| `src/app/(app)/master/siswa/_components/StudentDetailView.tsx` L222–309, L1302–1394, L1728–1930 | Mismatch payload, mapping registrasi/bantuan, karakteristik statis, route unduh |
| `src/app/(app)/master/siswa/page.tsx` L44–54, L90–370, L1344–1370 | Estimasi 6 field, response/route draft/review, CSV, import simulasi |
| `src/app/(app)/master/siswa/tambah/page.tsx` L24–64 | Create dan POST draft, tidak membaca draftId |
| `src/app/(app)/master/siswa/[id]/ubah/page.tsx` L22–77 | GET fullProfile, error diabaikan, PATCH |
| `src/app/(app)/master/siswa/[id]/page.tsx` L36–51, L74–112 | Fetch detail dengan catch kosong, link/unlink wali existing |
| `src/app/(app)/dashboard/page.tsx` | Dashboard wali, perlu entry point pembaruan biodata nyata |
| `src/lib/api.ts` | Helper request, error, upload/download proof existing |
| `tests/student-master.test.ts` | 8 unit test baru, bukan seluruh acceptance |

**Keterbatasan bukti:** audit dilakukan secara read-only terhadap commit GitHub. Tidak ada eksekusi database, build, dev server, migrasi, deployment, test atau UAT independen. Kesalahan yang terbukti dari source harus diperbaiki; dugaan kegagalan runtime ditandai risiko sampai diuji. Jika working tree Agent sudah lebih baru, catat SHA/diff dan validasi apakah suatu temuan sudah diperbaiki; jangan menghapus perbaikan sah, jangan mengulang pekerjaan tanpa kebutuhan. Bila temuan sudah diperbaiki, buktikan source dan catat statusnya.

### 2. Aturan repository yang wajib diikuti

Baca `AGENTS.md`, `.agents/rules/alur-kerja.md`, `backend-serverless.md`, `database.md`, `frontend-react.md`, `form.md`, `list-table.md`, `display-formatting.md`, `kelayakan-dan-keuangan.md`, `project-context.md`, `logging.md`, `tests.md`, serta `.agents/skills/`, `.claude/rules/` dan `.claude/commands/` yang relevan. Gunakan workflow task yang benar menurut source aktual (`/tugas-kerjakan`, `/verifikasi`, `/laporan` bila tersedia) tanpa membuat audit-only. Jangan mengarang approval, mengubah workflow agar pekerjaan tampak selesai, atau menghapus aturan keselamatan. Satu task aktif sesuai ketentuan `_ACTIVE-TASK.md` dan histori `.development-history/`.

### 3. Scope dan keputusan yang mengikat

- Tetap Master Siswa existing, bukan modul PPDB baru. Sepuluh section dipertahankan; baseline tampilan terbaru e3b88d4 dan perubahan visual sah milik pengguna dikunci (UI FREEZE). Skema lama yang berbeda tidak berlaku untuk desain; cakupan fungsional tetap berlaku. Tidak menyederhanakan scope menjadi identitas dasar saja.
- DB/API aktual, tanpa mock/dummy runtime; state React hanya untuk input dan preview, bukan penyimpanan permanen. Ketika sesuatu belum terintegrasi, tunjukkan status belum tersimpan/terblokir yang jujur.
- Pertahankan transaksi SPP, pembayaran tunai/transfer, bukti transfer, tagihan immutable, histori kelas, dispensasi, kelayakan ujian (ELIGIBLE/ELIGIBLE_DISPENSATION), kartu ujian QR, karakteristik dan guardian scoping. Tidak ada perubahan kebijakan finansial atau kelayakan berdasarkan kelengkapan administrasi.
- Field opsional dan data legacy yang belum tersedia tidak memaksa input palsu; siswa baru tanpa NISN tetap dapat dicatat. Tidak memakai kesehatan, kebutuhan khusus, PAUD/TK atau kemampuan Al-Qur'an sebagai seleksi otomatis. Peringatan usia/aturan administrasi mengikuti kebijakan yang telah diverifikasi; bila belum ada, jangan membuat rule penolakan baru.
- Keputusan yang perlu persetujuan terpisah jika belum tersedia: [grant izin sensitif yang tepat per role], [kebijakan mutasi kelas bertagihan], [dokumen wajib kondisional sekolah], [aturan retention/cleanup file dan data historis], [jadwal penerapan schema Neon dan lingkungan UAT]. Gunakan deny-by-default dan implementasikan bagian tidak terblokir; jangan mengarang keputusan.

### 4. Batasan teknis tahap finishing

DILARANG membuat atau menjalankan migrasi database dalam bentuk apa pun (termasuk `npm run db:generate`, `db:migrate`, `drizzle-kit generate`, SQL migration baru, `dotnet ef migrations add`, `dotnet ef database update` atau perintah setara), menjalankan `db:init`, `db:seed`, perubahan DB production/Neon, `npm run build`, `next build`, `dotnet build`, `npm run dev`, server development/preview yang setara, deployment, commit/push/merge tanpa instruksi terpisah. Jangan mengubah secret, .env aktual atau konfigurasi koneksi live. Perubahan schema TypeScript, service, DTO, route, frontend, test source dan dokumen diperbolehkan. Typecheck no emit dan test murni yang tidak menjalankan operasi terlarang hanya jika script diperiksa dan aman. Jangan menjalankan fixture yang menerapkan migrasi pada tahap ini. Rencana DAT/migrasi dan pengujian runtime adalah gerbang berikutnya, bukan izin eksekusi sekarang.

## Reasoning

Gunakan alur backend-first berikut dan sertakan alasan desain singkat berbasis kode, bukan penjelasan panjang tanpa pekerjaan.

1. Baca working tree, rules, approval dan bukti audit. Jaga perubahan user dan UI FREEZE. Kerjakan recovery P0 FIN-002 terlebih dahulu, catat error aktual dan mapping FIN dengan ID resmi. Perbaiki status laporan yang tidak didukung bukti.
2. FIN-001–002: kunci authorization, projection, audit, constraint dan invariants; identifikasi policy yang belum disetujui. Desain kontrak typed FIN-006 sejak awal. Pastikan route legacy dan route baru memakai guard yang sama.
3. FIN-003–005: implementasikan write service transaksi dan idempotency, keluarga/portal terpisah, dokumen private, import XLSX dan export server. Prioritaskan penghapusan sukses palsu. Jangan menyamakan transaksi DB dengan keberhasilan Blob. Pastikan error memetakan field dan penyebab tanpa bocor data.
4. FIN-006–010: sinkronkan URL/method/DTO, draft, completeness, karakteristik, histori dan pengajuan. Cegah perbedaan shape dan status antar layer, gunakan satu sumber fakta. Untuk operasi yang memerlukan izin khusus atau kebijakan finansial, blokir spesifik; jangan menghentikan semua pekerjaan.
5. FIN-011: sambungkan FE ke service sebenarnya tanpa redesign atau perubahan layout/style. Hapus simulasi dan state sementara sebagai storage. Pastikan status, izin dan kegagalan aktual ditampilkan dalam komponen yang sudah ada; perubahan visual di luar baseline memerlukan persetujuan.
6. FIN-012: tulis test source, static review, typecheck/test murni yang diizinkan; koreksi laporan dan DoD. UAT dan DB runtime memerlukan persetujuan tahap terpisah. Laporkan bukti path/simbol/line/diff serta hasil aktual, bukan kesimpulan berbasis banyaknya baris kode.
7. Sebelum serah terima, telusuri setiap aksi pengguna dari button → client API → route → validation → permission → service → DB/Blob → response → refresh. Telusuri pula read/projection dan integrasi existing. Aksi yang tidak sampai ke storage tidak boleh disebut persisten. Pastikan error/rollback/retry, data legacy, role dan regresi dipertimbangkan.

## Stop conditions

Jangan mengubah desain yang dikunci, menghapus definisi schema atau menutupi error dengan empty success. Jangan berhenti pada planning, audit, membuat dokumen, menambah endpoint tanpa consumer, mengganti status laporan tanpa kode, atau memperbaiki satu section saja. Kerjakan semua FIN yang tidak terblokir. Jangan mengakali larangan dengan data mock, fake success, fallback yang menyembunyikan error, melemahkan security, menghapus guard invoice, mengubah test agar lulus, atau mengubah aturan repo.

**Gerbang wajib (isi berdasarkan bukti, bukan asumsi):**

- [ ] P0: seluruh error source-confirmed ditangani, tidak ada silent omission, daftar ERR dan blocker runtime aktual dilaporkan; UI FREEZE diperiksa sejak awal.

- [ ] FIN-001: data sensitif hanya dikirim ke role/scope berizin; audit teredaksi; guardian scoping berlaku pada semua jalur.
- [ ] FIN-002: 10 kolom dipulihkan, typed mapping tanpa silent omission, constraint/relasi/status terdefinisi, legacy compatibility dan rencana DAT jelas; tidak mengklaim sudah diterapkan di DB.
- [ ] FIN-003: create/update lengkap, semua field yang dapat diedit memiliki write path nyata, transaction/idempotency/conflict; tidak ada perubahan yang diabaikan diam-diam.
- [ ] FIN-004: upload/registrasi/review/unduh/ganti dokumen private terintegrasi, metadata diverifikasi server, foto existing kompatibel.
- [ ] FIN-005: import XLSX bukan simulasi, preview/commit aktual, hasil berdasarkan server; export/cetak sesuai izin.
- [ ] FIN-006: setiap URL, payload, DTO dan consumer konsisten, error states nyata.
- [ ] FIN-007: save/resume/finalize draft terikat owner/revision, tidak membuat siswa ganda atau invoice sebelum finalisasi.
- [ ] FIN-008: kelengkapan server-authoritative, N/A/conditional dan dokumen terpisah, list/detail/form konsisten, pagination dan filter tepat.
- [ ] FIN-009: karakteristik memakai data existing nyata, bukan badge/banner statis.
- [ ] FIN-010: histori akademik dan pengajuan wali benar-benar terintegrasi; guard invoice dan conflict review tetap berlaku.
- [ ] FIN-011: UI FREEZE dipertahankan; 10 section dan aksi existing terintegrasi, loading/empty/error/permission benar; tidak ada aksi palsu atau perubahan visual tanpa persetujuan.
- [ ] FIN-012: TC-01–TC-60 tetap utuh, tambahan TC-61–80, test/source evidence aktual, status laporan dikoreksi, regression/UAT yang belum dijalankan ditandai.
- [ ] Tidak melakukan build, development server, pembuatan/eksekusi migrasi, seed, deploy, commit/push atau perubahan database production/secret.
- [ ] Laporan menyatakan batas bukti static vs runtime, daftar blocker dan langkah tahap database/UAT berikutnya.

Berhenti hanya pada gerbang yang dilarang atau kebutuhan keputusan yang benar-benar belum tersedia. Jangan menjalankan `npm run build`, `next build`, `npm run dev`, `dotnet build`, migration generation/SQL/EF, database update, seed atau deployment meski DoD normal mensyaratkannya. Jangan mengatakan 100% selesai, fully verified atau production-ready jika gerbang belum dipenuhi. Gunakan BLOCKED_SCHEMA/BLOCKED_POLICY/NOT_TESTED sesuai kondisi; status resmi mengikuti aturan repository. Implementasi source boleh dinyatakan selesai pada bagian yang benar-benar memenuhi acceptance static, tetapi verifikasi runtime tetap terpisah.

## Output

Hasil utama adalah perubahan source code backend dan frontend yang benar-benar dikerjakan, bukan hanya file planning atau laporan. Gunakan folder fitur existing dan konvensi tugas yang sah. Satu instruksi induk ini mencakup seluruh finishing; jangan membuat modul atau dokumentasi fitur paralel yang duplikat.

### 1. Dokumen dan histori yang harus diperbarui Agent

```text
docs/fitur/kelengkapan-master-siswa/
├── 3-spesifikasi.md                     # update fakta/keputusan yang sah
├── 4-urutan-tugas.md                     # mapping FIN → ID resmi
├── 5-skema-database.md                   # constraint, ERD, rencana DAT
├── 6-kontrak-api.md                      # kontrak aktual (method/path/DTO)
├── 7-skema-tampilan.md                   # baseline UI FREEZE, functional wiring, 10 section
├── 8-acceptance-criteria.md              # evidence per FIN/TGS
├── 9-skenario-pengujian.md               # TC-01–75 tetap + TC-76–80
├── tugas/                               # tiket per FIN/ID resmi sesuai rules
├── LAPORAN_IMPLEMENTASI_MASTER_SISWA.md  # koreksi status dan referensi audit
└── LAPORAN_FINISHING_MASTER_SISWA.md     # laporan utama hasil perbaikan
```

Perbarui `_ACTIVE-TASK.md` dan `.development-history/` sesuai workflow. Jangan mengubah `2-wawancara.md` dengan keputusan fiktif. Jika repo menggunakan format folder berbeda, pertahankan konvensi existing dan mapping jelas. Dokumen original tetap menjadi acuan planning; catat penyimpangan dengan alasan dan persetujuan bila diperlukan. Setiap FIN/tiket memuat tujuan, dependensi, status, perubahan file, implementasi, acceptance, bukti, test, blocker dan tindak lanjut.

### 2. Laporan akhir `LAPORAN_FINISHING_MASTER_SISWA.md`

1. Ringkasan: temuan audit awal dan audit ulang, commit dasar, scope dan status terkini; daftar ERR-xxx dengan root cause, patch, bukti dan status aktual. Bedakan error source-confirmed dan runtime-unverified.
2. Matriks FIN-001–012 → TGS/ID resmi → temuan → perbaikan → bukti path/simbol/diff → status.
3. Daftar file ditambah/diubah, detail schema dan constraint, rencana kompatibilitas/backfill tanpa eksekusi migration.
4. Kontrak endpoint aktual, DTO, authorization, error dan idempotency; penyelarasan caller.
5. Bukti alur create/edit lengkap, keluarga, dokumen, import/export/cetak, draft, completeness, karakteristik, histori dan usulan wali.
6. Matriks functional wiring seluruh 10 section, diff UI FREEZE terhadap baseline dan perubahan user, source component, API terkait, aksi, state, status verifikasi. Screenshot hanya jika benar-benar diambil pada tahap yang diizinkan.
7. Security, permission, projection, audit redaction, storage, guardian scoping dan integrasi SPP/ujian/portal.
8. Test matrix TC-01–TC-80 (ID asli dipertahankan) dengan expected/actual, command, status, bukti; unit, static, integration dan UAT terpisah.
9. Gerbang belum terpenuhi (schema/database, build/dev, test runtime, policy), risiko deploy sebelum schema kompatibel, rencana DAT terpisah dan urutan UAT manual.
10. Kesimpulan yang jujur: bagian yang benar-benar diimplementasikan, yang sudah diverifikasi, yang belum diuji, yang terblokir dan keputusan yang diperlukan. Jangan membuat angka progres tanpa definisi penyebut dan bukti.

**Mulai eksekusi perbaikan sekarang.** Dahulukan recovery FIN-002 (10 kolom dan hilangkan silent omission), FIN-001 dan FIN-003–005, lanjut FIN-006–010, integrasi fungsi FIN-011 dengan UI FREEZE, lalu FIN-012. Pertahankan implementasi existing yang benar. Jangan berhenti pada audit atau proposal ulang. Jangan mengulang klaim selesai 100% tanpa bukti. Serahkan diff source dan laporan yang dapat diaudit.
