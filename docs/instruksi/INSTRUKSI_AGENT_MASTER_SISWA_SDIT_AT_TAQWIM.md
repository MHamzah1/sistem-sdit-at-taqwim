# Master Prompt — Pengembangan Master Siswa SDIT AT-TAQWIM

**Status cakupan:** Planning telah disetujui pengguna; lanjutkan implementasi kode.  
**Repository:** `MHamzah1/sistem-sdit-at-taqwim` | **Branch:** `main`  
**Baseline:** `sistem-sdit-at-taqwim-main.zip` (snapshot yang diberikan pengguna; bukan verifikasi HEAD GitHub terkini).  
**Rangkaian pekerjaan:** TGS-010–TGS-021 (verifikasi ketersediaan ID pada working tree aktual).  
**Target:** Master Siswa lengkap untuk administrasi sekolah dasar, dengan kelengkapan biodata setara kebutuhan formulir PPDB/SPMB, tanpa membuat modul PPDB tersendiri.  
**Urutan wajib:** Backend dan database schema → frontend → integrasi → pemeriksaan dan laporan.  
**Dokumen ini:** Satu instruksi induk untuk Agent; wireframe di dalam dokumen merupakan spesifikasi tampilan wajib, bukan hasil implementasi.

---

## Role

Bertindak sebagai Senior Full Stack Developer, Software Architect, Database Engineer, UI/UX Engineer, dan QA Engineer untuk Sistem SPP & Kelayakan Ujian — SDIT AT-TAQWIM. Kuasai Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL Neon, Drizzle ORM, Zod, private Vercel Blob, RBAC, administrasi sekolah dasar, integrasi keuangan dan perlindungan data anak.

**Kerjakan implementasi secara langsung.** Pengguna telah menyetujui planning pengembangan Master Siswa. Jangan mengulang diskusi cakupan, hanya membuat proposal, atau menjalankan audit sebagai pengganti implementasi. Implementasikan semua bagian yang tidak terblokir dalam batas yang ditetapkan di dokumen ini.

## Task

Kembangkan menu Master Siswa existing sebagai sumber data induk siswa sejak penerimaan sampai lulus. Seluruh data yang disimpan harus menggunakan API backend dan database yang sebenarnya. Tidak boleh memakai dummy data, mock endpoint, data hardcoded siswa, atau localStorage sebagai penyimpanan utama. Data ilustrasi dalam wireframe hanya contoh posisi dan format komponen, tidak boleh masuk ke data operasional.

### 1. Roadmap implementasi

| ID | Pekerjaan | Dependensi |
|---|---|---|
| TGS-010 | Schema Master Siswa, relasi dan kontrak data | — |
| TGS-011 | Backend identitas, alamat, registrasi, draft dan penyimpanan atomik | 010 |
| TGS-012 | Backend keluarga, wali, kontak darurat | 010, 011 |
| TGS-013 | Backend kesehatan, pengukuran periodik dan bantuan pendidikan | 010, 011 |
| TGS-014 | Backend dokumen, storage dan verifikasi | 010, 011 |
| TGS-015 | Backend indikator kelengkapan dan integrasi karakteristik | 011–014 |
| TGS-016 | Frontend tambah/ubah siswa: 10 section form | 011–015 |
| TGS-017 | Frontend detail profil siswa | 015, 016 |
| TGS-018 | Frontend daftar Master Siswa, pencarian, filter dan pagination | 015–017 |
| TGS-019 | Import Excel, export, cetak biodata dan buku induk | 011–018 |
| TGS-020 | Riwayat akademik dan pengajuan perubahan biodata wali | 011–018 |
| TGS-021 | Integrasi, keamanan, regresi, UAT dan laporan | 010–020 |

Nomor mengikuti konvensi global `TGS-NNN`. Snapshot menunjukkan TGS-009 sebagai nomor TGS terakhir. Jika working tree sudah memuat nomor lebih tinggi, catat pemetaan nomor baru untuk seluruh task tanpa bentrok. Angka di dokumen ini adalah nomor rencana, bukan bukti tiket sudah dibuat atau pekerjaan sudah selesai. Kerjakan satu tiket aktif sesuai konvensi `_ACTIVE-TASK.md`.

---

### FASE 1 — Backend dan database schema

#### TGS-010 — Schema dan relasi Master Siswa

Ubah `src/db/schema.ts` secara additive dan siapkan tipe/kontrak yang diperlukan. Gunakan entity berikut sebagai target desain; nama teknis dapat diselaraskan dengan konvensi repository. Dokumentasikan perubahan dan keputusan pemetaan aktual. **Pada tahap ini jangan membuat maupun menjalankan migrasi SQL.** Perubahan source schema belum berarti database sudah berubah.

##### A. `students` — extend existing

Pertahankan `id`, `nis`, `nisn`, `name`, `gender`, `birthPlace`, `birthDate`, `photoUrl`, `classId`, `enrolledOn`, `active`, dan timestamps. Jangan mengubah PK, memutus FK atau mengganti identitas yang digunakan invoice dan ujian.

| Field tambahan (usulan) | Jenis data | Ketentuan |
|---|---|---|
| nickname | text nullable | Nama panggilan |
| nik | text nullable | 16 digit, unik bila terisi |
| familyCardNumber | text nullable | 16 digit, tidak unik |
| birthCertificateNumber | text nullable | Nomor akta, bukan integer |
| religion | text/reference | Pilihan terpusat |
| citizenship | text/reference | WNI/WNA dan detail bila relevan |
| birthOrder | integer nullable | Minimal 1 bila diketahui |
| siblingCount | integer nullable | Minimal 0; saudara kandung tidak termasuk siswa |
| dailyLanguage | text nullable | Bahasa sehari-hari |
| studentStatus | enum/reference | ACTIVE, INACTIVE, TRANSFERRED, WITHDRAWN, GRADUATED |

Usia dihitung dari tanggal lahir, tidak disimpan. Sinkronkan `active` dengan status akademik secara konsisten dan jangan mengubah perilaku bisnis existing tanpa keputusan. NISN sudah ada tetapi pada snapshot belum ada unique constraint DB; lakukan preflight duplikasi non-destruktif pada tahap DAT berikutnya sebelum constraint unik diterapkan. Jangan menggabungkan siswa otomatis.

##### B. `student_addresses` — baru

- `id`, `studentId`, `addressType` (IDENTITY/DOMICILE), `address`, `rt`, `rw`, `hamlet`, `province`, `regency`, `district`, `village`, `postalCode`, timestamps.
- Profil tempat tinggal dan akses sekolah: `residenceType`, `transportationType`, `distanceToSchool`, `travelTimeMinutes`. Simpan pada lokasi yang konsisten (domisili/profil), jangan gandakan nilai tanpa kebutuhan.
- Unik per siswa dan tipe alamat; relasi alamat identitas dan domisili sama harus memiliki satu sumber data yang jelas (referensi atau salinan yang dikontrol).
- Pilihan wilayah bertingkat dengan referensi valid; bila belum ada master wilayah, gunakan fallback input terstruktur yang jujur dan tidak mengklaim seluruh wilayah tersedia.

##### C. Data keluarga — baru, reusable lintas siswa

Gunakan `student_family_members` sebagai nama usulan untuk penyimpanan individu atau relasi. Secara fisik pisahkan individu (`family_members`) dari relasi (`student_family_members`) agar satu ayah/ibu dapat digunakan untuk beberapa anak. Bila menggunakan struktur lain, penuhi invariant yang sama.

- Individu: `id`, `fullName`, `nik`, `birthPlace`, `birthDate`/`birthYear`, `lifeStatus`, `education`, `occupation`, `institutionName`, `monthlyIncomeRange`, `phone`, `email`, `address`, timestamps.
- Relasi: `studentId`, `familyMemberId`, `relationshipType`, `isPrimaryContact`, `isPaymentResponsible`, `isEmergencyContact`, timestamps.
- Tipe hubungan: FATHER, MOTHER, GRANDFATHER, GRANDMOTHER, UNCLE, AUNT, OTHER_GUARDIAN; tambah jenis hubungan lain jika diperlukan sesuai referensi yang terdokumentasi.
- Kontak darurat dapat merujuk individu keluarga atau individu kontak lain yang sah; jangan harus membuat akun wali.
- Pertahankan `guardians` dan `guardian_students` sebagai mekanisme akses portal. Sediakan hubungan eksplisit antara individu dan guardian jika diperlukan; jangan otomatis menyamakan akun wali dan biodata keluarga.
- Cegah relasi duplikat dan kontak utama ganda (constraint/transaction). Jangan melakukan penggabungan individu hanya karena nama atau nomor telepon sama.

##### D. `student_enrollments` — baru

- `id`, `studentId`, `registrationNumber`, `registrationType` (NEW_STUDENT/TRANSFER_STUDENT), `registrationDate`, `acceptedDate`, `enrollmentDate`, `academicYearId`, `classId`, `entryGrade`, `attendedPaud`, `attendedKindergarten`, `previousSchoolName`, `previousSchoolNpsn`, `previousSchoolAddress`, `enrollmentStatus`, `effectiveStartDate`, `effectiveEndDate`, `notes`, timestamps.
- Pisahkan fakta penerimaan awal yang tetap dari histori penempatan (tabel terpisah bila diperlukan); hanya satu penempatan berjalan yang konsisten dengan siswa.
- FK kelas/tahun ajaran harus konsisten. Jangan membuat histori penempatan fiktif. Data siswa lama dapat dibaca dari `students` dan `classes` selama proses pemutakhiran belum dilakukan.
- `students.classId` dan `enrolledOn` existing tetap kompatibel dengan proses invoice; jangan mengubah keduanya melalui jalur histori yang menghindari proteksi server.

##### E. `student_health_profiles` — baru

`id`, `studentId` (unik), `bloodType`, `medicalHistory`, `foodAllergies`, `drugAllergies`, `hasSpecialNeeds`, `specialNeedsTypes`, `routineMedication`, `emergencyHandlingNotes`, `assistanceNeeds`, `notes`, timestamps. Sediakan nilai tidak diketahui. Jangan menyimpan diagnosis hasil tebakan atau membuka data medis kepada role umum.

##### F. `student_periodic_data` — baru

`id`, `studentId`, `academicYearId`, `semester`, `measurementDate`, `heightCm`, `weightKg`, `notes`, `recordedBy`, timestamps. Pengukuran baru menambah histori; koreksi harus terlacak. Validasi angka positif, satuan cm/kg, tanggal dan semester yang sah. Jangan menimpa pengukuran lama.

##### G. `student_aid_records` — baru

`id`, `studentId`, `aidType`, `aidNumber`, `aidSource`, `startDate`, `endDate`, `status`, `notes`, `supportingDocumentId` bila relevan, timestamps. Jenis KIP, PIP, PKH, KKS, KPS, BEASISWA_INTERNAL, BEASISWA_EKSTERNAL, OTHER. Penerimaan bantuan merupakan informasi administrasi, bukan instruksi membuat diskon SPP.

##### H. `student_documents` — baru

`id`, `studentId`, `documentType`, `documentName`, `documentNumber` (opsional), `storagePath`, `originalFilename`, `mimeType`, `fileSize`, `verificationStatus`, `verifiedBy`, `verifiedAt`, `rejectionReason`, `uploadedBy`, `uploadedAt`, timestamps. Status PENDING/VERIFIED/REJECTED. Belum diunggah dihitung dari daftar dokumen yang berlaku, bukan record file palsu. Pertahankan versi atau histori penggantian secara aman. Dokumen bantuan dapat merujuk record ini. Jangan menaruh data dokumen siswa pada `payment_proofs`.

##### I. Draft dan usulan perubahan biodata

Siapkan draft database terotorisasi (mis. `student_drafts`) dengan owner, payload tervalidasi, status, revision, timestamps dan idempotency key/final student reference. Jangan menggunakan record `students` aktif atau FK kelas palsu untuk draft. Draft tidak menghasilkan invoice/kartu ujian. Jika upload sebelum finalisasi didukung, gunakan scope draft yang sah dan pindahkan/tautkan dokumen secara aman ketika siswa resmi terbentuk; jika tidak, jelaskan upload dilakukan setelah draft memiliki identitas yang sah.

Siapkan `student_profile_change_requests` (nama usulan) untuk usulan perubahan wali dengan studentId, requester, patch field yang diizinkan, revision, status SUBMITTED/APPROVED/REJECTED, reviewer, alasan, timestamps. Simpan hanya data yang diperlukan, dengan akses terbatas dan audit aman.

##### J. Diagram relasi target

```text
academic_years 1 --- N classes 1 --- N students (existing)
                                        |
       +--------------------------------+----------------------------+
       |             |                  |               |            |
  addresses      enrollments     family relations     health      aid records
       N             N             N : 1 family        0..1          N
                                     members             |
       +---------------------+-----------------------+---+-----------+
       |                     |                       |               |
  periodic data N       documents N       guardian_students N    characteristic
                                                   |             submissions N
                                              guardians N
                                                   |
                                              users (portal)

  student_drafts -> finalisasi atomik -> students
  change_requests -> review terotorisasi -> update profil
```

Diagram konseptual; setiap cabang profil berelasi langsung dengan siswa, bukan satu dengan yang lain kecuali dinyatakan (mis. aid → supporting document). Pertahankan relasi FK existing.

##### K. Standar skema dan kesiapan rollout

- UUID, timestamp, FK, index sesuai pola existing. Gunakan unique/check constraints dan validasi server untuk integritas; pertimbangkan race condition dan konflik paralel.
- Identifier NIS/NISN/NIK/KK/RT/RW/kode pos berbentuk string; pertahankan nol di depan. Normalisasi string kosong ke null sesuai kontrak. NIS wajib unik, NIK/NISN unik jika terisi; KK bukan unique.
- Field tambahan nullable/default yang aman bagi data lama; jangan mengisi nilai tak diketahui dengan data fiktif. Jangan mengubah atau menghapus data existing.
- Dokumentasikan rencana DAT terpisah: daftar perubahan schema, preflight data duplikat, mapping/backfill yang sah, urutan penerapan, validasi, kompatibilitas old/new, rollback dan deployment. Jangan membuat SQL migration maupun menjalankannya sekarang.
- Lindungi runtime sebelum schema tersedia: jangan merilis kode yang mengasumsikan tabel baru sudah ada ke environment lama. Laporkan BLOCKED_SCHEMA; rancang rollout yang terkoordinasi, bukan fallback dummy.

**Acceptance:** desain schema source, tipe data, constraints, kontrak relasi dan rencana DAT terdokumentasi; data existing tetap kompatibel secara desain. Status runtime tetap belum terverifikasi sampai migrasi dan pengujian diizinkan.

#### TGS-011 — Backend identitas, alamat, registrasi dan draft

Gunakan `server/app.ts`, `server/resources.ts`, `server/state.ts`, `server/security.ts`, `src/db/client.ts` serta route handler existing. Gunakan Zod strict validation dan response DTO/projection sesuai izin.

Implementasikan operasi daftar siswa terfilter, detail profil, tambah, ubah, alamat KK/domisili, registrasi, penyimpanan/pembacaan draft dan finalisasi. Hitung usia kalender dengan benar (tanggal acuan eksplisit); validasi tanggal lahir nyata, tidak di masa depan. Siswa baru tanpa NISN tetap dapat dicatat. NIK/KK yang belum tersedia dicatat sebagai ketidaklengkapan, bukan data palsu. Validasi NISN 10 digit, NIK/KK 16 digit, nama, tanggal, birthOrder/siblingCount, jarak/waktu dan relasi kelas/tahun. Error harus menunjuk field dan section. Validasi unik juga di server dan database; edit tidak dianggap duplikat terhadap dirinya sendiri.

Pertahankan syarat inti existing saat finalisasi siswa resmi (`name`, `nis`, `classId`, `enrolledOn`, dan validasi yang berlaku). Field administrasi tambahan dapat dilengkapi kemudian; jangan memblokir siswa lama hanya karena kolom baru kosong. Peringatan usia masuk kelas 1 mengikuti kebijakan sekolah dan aturan penerimaan yang berlaku; bila aturan belum terverifikasi, jangan hardcode penolakan. Riwayat TK, kemampuan Al-Qur'an, kesehatan dan disabilitas bukan syarat seleksi otomatis.

Ubah proses penambahan siswa + wali yang saat ini terpisah menjadi transaksi atomik untuk data inti, alamat, keluarga, registrasi dan link portal yang sah. Gunakan idempotency/revision agar retry tidak membuat siswa ganda dan edit konkuren tidak menimpa perubahan tanpa peringatan. Untuk storage eksternal gunakan staging dan compensating cleanup, bukan menganggap transaksi PostgreSQL mencakup Blob.

**Acceptance:** create/update/detail/draft benar-benar terhubung dengan DB; validasi dan rollback transaction tersedia; draft tidak menagih; histori invoice dilindungi.

#### TGS-012 — Backend keluarga, wali dan kontak darurat

Sediakan pencarian individu existing dengan paginasi dan akses yang sah (nama, NIK atau nomor HP sesuai izin); hasil pencarian minimum dan identifier sensitif dimasking. Pilih individu existing atau buat baru; hubungan ayah/ibu/wali/kontak darurat dapat dipakai ulang lintas saudara.

Satu ayah/ibu di database dapat direlasikan dengan anak di 1A, 3B dan 5A. Pemilihan ayah/ibu sebagai wali atau kontak utama mengambil referensi, bukan menduplikasi biodata. Jika data individu shared diubah, beri peringatan mengenai dampak pada saudara dan periksa izin pengubah. Status meninggal/tidak diketahui tidak memaksa NIK, pekerjaan, kontak atau data lain yang memang tidak tersedia.

Bedakan penanggung jawab administratif, penanggung jawab SPP, kontak darurat dan akun portal. `guardian_students` tetap sumber otorisasi. Membuat keluarga tidak otomatis membuat akun, mereset password, atau menambah akses portal; gunakan mekanisme link/unlink existing dengan authorization dan audit. Jangan hapus relasi lain saat form edit hanya menampilkan satu kontak utama. Validasi nomor HP dan email bila terisi; jangan menggabungkan orang berdasarkan kemiripan nama/HP saja. Cegah duplikasi dan perubahan yang mengaitkan akun salah.

**Acceptance:** pencarian dan reuse data keluarga tersedia; relasi banyak siswa tetap sah; orang tua yang tidak diketahui dapat ditangani; tidak ada eskalasi akses portal.

#### TGS-013 — Backend kesehatan dan bantuan pendidikan

Implementasikan profil kesehatan, CRUD riwayat pengukuran, dan CRUD bantuan pendidikan. Riwayat penyakit, alergi makanan/obat, golongan darah, kebutuhan khusus, penanganan darurat dan kebutuhan pendampingan dapat diisi/ditandai belum diketahui. Pengukuran berisi tinggi, berat, tanggal, semester dan tahun ajaran; tambah data baru tanpa menimpa histori. Validasi rentang/format yang masuk akal; jangan membuat diagnosis otomatis.

Untuk KIP/PIP/PKH/KKS/KPS/beasiswa, catat status, nomor, sumber, periode, bukti dan catatan. Bedakan belum diketahui dengan tidak menerima. Jangan mengubah nominal invoice, status lunas atau kelayakan ujian berdasarkan bantuan. Endpoint kesehatan, bantuan dan penghasilan memiliki izin khusus deny-by-default. Audit tindakan, bukan isi data kesehatan secara bebas.

**Acceptance:** profil dan histori dapat disimpan/diambil sesuai izin, bantuan tidak berdampak otomatis terhadap keuangan, informasi tidak bocor melalui API umum.

#### TGS-014 — Backend dokumen persyaratan

Integrasikan private Vercel Blob dengan pola `server/files.ts` dan `src/lib/api.ts`. Buat namespace terpisah untuk dokumen siswa/draft; jangan mencampur metadata atau scope dengan bukti transfer.

Jenis dokumen: KK, akta kelahiran, KTP ayah, KTP ibu, KTP wali, pas foto 3x4, ijazah/sertifikat TK/RA, bukti NISN, surat pindah, rapor sebelumnya, bukti KIP/KKS/PKH, surat rekomendasi psikolog bila relevan, surat pernyataan orang tua, lainnya. Dokumen bersifat wajib/opsional/kondisional sesuai kebijakan sekolah, bukan semua diwajibkan.

Implementasikan token upload terbatas, registrasi metadata, preview/download melalui endpoint terotorisasi, ganti dokumen, verifikasi, tolak disertai alasan, histori dan penanganan orphan. Gunakan JPEG/PNG/PDF dan WEBP untuk foto jika tervalidasi; maksimum 5 MB/file sebagai batas awal. Validasi MIME, signature, ukuran, storage path, kepemilikan, status dan sesi di server. Jangan mengambil URL bebas dari client, menggunakan URL publik permanen atau menyimpan isi dokumen baru sebagai base64 di DB. Jangan menampilkan filename/path mentah yang tidak perlu. Jangan menghapus versi existing sembarangan.

**Foto existing:** snapshot `StudentFormView.tsx` masih memproses compressed data URL dan URL HTTP melalui `photoUrl`. Pertahankan kompatibilitas render foto, kartu ujian individual/massal dan data lama. Untuk foto baru, gunakan storage terotorisasi yang kompatibel dengan renderer kartu ujian; rencana pemindahan foto lama dilakukan terpisah, tidak diam-diam. Pastikan proses cetak menunggu foto termuat atau memberi pesan kegagalan.

**Acceptance:** dokumen benar-benar dapat dikelola oleh role berizin; status diverifikasi server; pengguna tidak sah tidak bisa membaca file; kartu ujian existing tidak rusak.

#### TGS-015 — Backend kelengkapan dan karakteristik anak

Hitung kelengkapan pada server berdasarkan sepuluh section yang disetujui: identitas, alamat, registrasi, ayah, ibu, wali/darurat, kesehatan, bantuan, karakteristik, dokumen. Return per-section status COMPLETE/INCOMPLETE/NOT_APPLICABLE, daftar missing field/checklist, pembilang/penyebut dan persentase.

Definisikan aturan wajib dan kondisional secara eksplisit dan terpusat. Field opsional tidak menurunkan skor; NISN belum terbit, orang tua meninggal, bukan pindahan, bukan penerima bantuan dan dokumen tidak berlaku harus diperhitungkan secara benar. Bedakan belum diisi, tidak berlaku dan belum terverifikasi. Jika penyebut nol, tampilkan tidak berlaku, bukan angka palsu. Persentase dokumen terverifikasi dipisah dari persentase biodata; status ini tidak mengubah kelayakan ujian atau aktivasi secara otomatis.

Reuse `characteristic_form_templates`, `characteristic_form_fields`, `characteristic_submissions`, `characteristic_answers`; jangan membuat sistem karakteristik kedua. Tampilkan template, status, ringkasan, jawaban dan histori yang memang tersedia. Kembangkan template sesuai kemampuan existing untuk hobi, cita-cita, minat/bakat, kebiasaan belajar, kemandirian, sosialisasi, kemampuan baca Al-Qur'an, metode sebelumnya, hafalan surat/doa, kebiasaan ibadah, harapan dan catatan orang tua. Jangan mengubah template atau jawaban lama secara destruktif; bila model existing membatasi histori, pertahankan data dan jelaskan pengembangan yang dibutuhkan.

**Acceptance:** daftar dan detail memakai definisi kelengkapan yang sama; indikator bukan hardcoded; karakteristik memakai sumber existing; tidak ada aturan finansial/seleksi baru.

##### Kontrak API minimum (target, bukan endpoint yang diklaim sudah ada)

Sesuaikan path final dengan dispatcher `server/app.ts` dan helper `api()` existing. Jangan menduplikasi route jika dapat mengembangkan kontrak existing secara backward-compatible. Contoh rancangan:

| Metode dan path usulan (prefix `/api/`) | Fungsi | Proteksi minimum |
|---|---|---|
| GET `students` atau `students/list` | Daftar terfilter, paginasi, summary | Izin baca, projection minimum |
| GET `students/:id/profile` | Detail section yang diizinkan | Izin baca + student scope |
| POST `students/profile` | Buat siswa atomik | Izin master + validasi + idempotency |
| PATCH `students/:id/profile` | Update biodata | Izin field + revision |
| POST `student-drafts` | Simpan draft | Owner/role |
| GET/PATCH `student-drafts/:id` | Muat/simpan ulang draft | Owner/role + revision |
| POST `student-drafts/:id/finalize` | Finalisasi | Izin master + idempotency |
| GET `family-members/search` | Cari individu existing | Izin khusus, masking, pagination |
| PUT `students/:id/family` | Atur relasi keluarga/kontak | Izin relasi, transaction |
| GET/PUT `students/:id/health` | Profil kesehatan | Izin kesehatan |
| GET/POST `students/:id/measurements` | Riwayat/tambah ukur | Izin kesehatan |
| GET/POST/PATCH `students/:id/aid[/... ]` | Bantuan | Izin bantuan |
| GET `students/:id/documents` | Checklist dan metadata | Izin dokumen |
| POST `student-documents/upload` | Token/staging upload | Owner/scope, limit |
| POST `students/:id/documents` | Registrasi metadata | Izin upload + ownership |
| GET `student-documents/:id/content` | Preview/unduh | Izin + ownership setiap akses |
| POST `student-documents/:id/review` | Verifikasi/tolak | Izin reviewer + alasan |
| GET `students/:id/completeness` | Status biodata dan dokumen | Scope dan projection |
| GET `students/:id/enrollments` | Histori akademik | Izin baca |
| POST `students/:id/enrollment-changes` | Mutasi/status terkontrol | Izin + guard invoice |
| POST `students/:id/change-requests` | Usulan wali | Guardian scoping + whitelist |
| GET `student-change-requests` | Antrean review | Izin reviewer |
| POST `student-change-requests/:id/review` | Review usulan | Izin reviewer + transaction |
| POST `students/import/preview` | Validasi Excel | Izin import, batas ukuran/baris |
| POST `students/import/commit` | Import tervalidasi | Izin import, revalidasi, idempotency |
| GET/POST `students/export` | Export terfilter | Izin export + whitelist |

Contoh kontrak daftar: `{ items, page, pageSize, total, summary }`; filter `search`, `academicYearId`, `classId`, `status`, `completeness`, `page`, `pageSize`. Summary harus jelas apakah mengikuti filter aktif atau seluruh scope. Contoh detail: `{ student, addresses, registration, family, completeness, permissions, revision }`, dengan bagian sensitif hanya bila diminta dan diizinkan. Jangan mengirim field kesehatan/dokumen/penghasilan secara default.

Contoh error validasi: `{ message, fieldErrors: [{ section, field, message }] }`; sesuaikan envelope existing. Konflik duplikasi/revision/kelas bertagihan memakai HTTP 409; input invalid 422; tanpa sesi 401; akses ditolak 403 atau 404 sesuai kebijakan anti-enumeration. Gunakan helper error existing. Dokumentasikan kontrak final aktual, termasuk error, status dan idempotency.

---

### FASE 2 — Frontend dan skema tampilan wajib

#### TGS-016 — Form tambah dan ubah Master Siswa

**Route existing wajib dipertahankan:** `/master/siswa/tambah`, `/master/siswa/[id]/ubah`. Kembangkan `src/app/(app)/master/siswa/_components/StudentFormView.tsx` dan page wrapper terkait. Satu arsitektur form reusable untuk tambah dan ubah; bukan dua form yang menyimpang.

##### 2.1. Aturan visual global (WAJIB)

1. Pertahankan brand, logo, palet, tipografi, spacing, radius, sidebar global dan bahasa antarmuka SDIT AT-TAQWIM. Gunakan komponen dan token existing; baca `src/styles.css`, `src/production.css`, `src/components/` dan `.agents/rules/frontend-react.md` sebelum mengubah tampilan. Jangan mengganti tema aplikasi atau membuat design system paralel.
2. Gunakan satu panel form dengan navigasi section di kiri dan konten aktif di kanan. **Jangan membuat 10 card besar ditumpuk vertikal dalam satu halaman.** User dapat membuka section langsung, tanpa kehilangan input.
3. Desktop: sidebar section sekitar 240–280 px (sekitar 25% area form), konten sekitar 75%, min-width 0; grid field dua kolom. Tablet: sesuaikan lebar dan pindah ke satu kolom bila sempit. Mobile: navigasi section berupa select/accordion ringkas di atas form; field satu kolom; tombol tidak keluar viewport.
4. Gunakan label jelas, tanda wajib hanya untuk field yang benar-benar wajib, helper text, error inline, focus visible, tab order logis, dan status dengan teks (bukan warna saja). Gunakan textarea/full-width untuk alamat dan catatan.
5. Satu bar tindakan konsisten di bawah panel: Batal, Simpan Draft (mode tambah), Kembali, Selanjutnya, Simpan Siswa pada akhir. Mode ubah menampilkan Simpan Perubahan sesuai kemampuan backend. Jangan mengosongkan state saat berpindah section. Tombol tidak boleh palsu; periksa izin dan kondisi disabled.
6. Indikator kelengkapan biodata dan dokumen terpisah; backend sumber nilai resmi. Preview draft lokal dapat ditandai belum tersimpan. Tampilkan timestamp terakhir simpan atau status perubahan belum disimpan, loading, empty, error, retry, confirm sebelum meninggalkan perubahan.
7. Jangan menyimpan NIK, KK, kesehatan, penghasilan atau dokumen sensitif di localStorage/sessionStorage. Gunakan state memori dan draft backend. Jangan mengirim seluruh data sensitif ke AppContext global.
8. Sediakan responsive QA pada lebar desktop 1440, tablet 1024/768 dan mobile 390 px (UAT manual setelah lingkungan diizinkan). Ukuran adalah target pemeriksaan, bukan desain pixel-perfect yang mengharuskan semua field di atas fold.

##### 2.2. Kerangka form desktop (WAJIB)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Master Data / Siswa / Tambah Siswa                                           │
│ Tambah Siswa Baru                    Lengkapi biodata dan administrasi siswa │
├─────────────────────────────────────────────────────────────────────────────┤
│ Kelengkapan biodata [██████░░░░] 60%    Dokumen: 3/5 terverifikasi             │
│ Draft: perubahan belum tersimpan                                             │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ BAGIAN PENGISIAN          │ 01. Identitas Siswa                              │
│ 01 Identitas Siswa      ● │ Isi identitas sesuai dokumen kependudukan.       │
│ 02 Alamat & Domisili    ! │                                                  │
│ 03 Registrasi Akademik  ✓ │ [ FOTO 3×4 ]  [Pilih/Ganti Foto] [Hapus Foto]      │
│ 04 Data Ayah            ! │               Format & batas ukuran              │
│ 05 Data Ibu             ! │                                                  │
│ 06 Wali & Darurat       ! │ Nama lengkap *           Nama panggilan          │
│ 07 Kesehatan            – │ [___________________]   [____________________]  │
│ 08 Bantuan Pendidikan   – │ NIS *                    NISN                    │
│ 09 Karakteristik Anak   – │ [___________________]   [____________________]  │
│ 10 Dokumen              ! │ NIK                      Nomor KK               │
│                          │ [___________________]   [____________________]  │
│ ✓ Lengkap  ! Belum lengkap│ ... field section aktif                          │
│ – Tidak berlaku          │                                                  │
├──────────────────────────┴──────────────────────────────────────────────────┤
│ [Batal] [Simpan Draft]                         [Kembali] [Selanjutnya →]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

Pada section 10, tombol Selanjutnya diganti Simpan Siswa. Untuk mode ubah, heading menjadi Ubah Data Siswa, gunakan prefill data aktual dan tampilkan NIS/nama siswa. Jika ada field error pada submit final, pindahkan fokus ke section pertama yang bermasalah dan pertahankan input section lainnya. Status section yang tidak berlaku harus memiliki alasan yang dapat dipahami.

##### 2.3. Kerangka mobile (WAJIB)

```text
┌──────────────────────────────┐
│ ← Master Siswa               │
│ Tambah Siswa Baru            │
│ Biodata [████░░] 60%         │
│ Bagian 01/10                 │
│ [ Identitas Siswa        ▼ ] │
├──────────────────────────────┤
│ Identitas Siswa              │
│ [Foto 3×4] [Pilih Foto]      │
│ Nama lengkap *              │
│ [________________________]  │
│ Nama panggilan               │
│ [________________________]  │
│ ... field satu kolom         │
├──────────────────────────────┤
│ [Kembali] [Selanjutnya]      │
│ [Simpan Draft] [Batal]       │
└──────────────────────────────┘
```

Navigasi global tidak berubah; pada mobile gunakan pola drawer existing. Pastikan tidak ada horizontal overflow pada form, dialog atau footer.

##### 2.4. SECTION 01 — Identitas Siswa

```text
┌─ Identitas Siswa ────────────────────────────────────────────────────┐
│ [ FOTO ]  Pas Foto 3×4 | [Pilih/Ganti] [Hapus] | JPG/PNG/WEBP ≤5 MB  │
│ Nama lengkap sesuai KK *            Nama panggilan                  │
│ [__________________________]        [___________________________]   │
│ NIS *                               NISN (10 digit jika ada)        │
│ [__________________________]        [___________________________]   │
│ NIK (16 digit)                      Nomor KK (16 digit)            │
│ [__________________________]        [___________________________]   │
│ Nomor akta kelahiran                 Jenis kelamin                  │
│ [__________________________]        ( ) Laki-laki ( ) Perempuan    │
│ Tempat lahir                        Tanggal lahir                   │
│ [__________________________]        [ dd/mm/yyyy       📅 ]         │
│ Usia (otomatis, read-only)          Agama [Pilih ▼]                  │
│ Kewarganegaraan [Pilih ▼]           Bahasa sehari-hari [_______]    │
│ Anak ke- [____]                     Jumlah saudara kandung [____]  │
└─────────────────────────────────────────────────────────────────────┘
```

| Field | Input dan perilaku |
|---|---|
| Pas foto | File, preview 3:4, ganti/hapus terotorisasi, loading dan error |
| Nama lengkap | Text, wajib, sesuai KK |
| Nama panggilan | Text, opsional |
| NIS | Text, wajib; generate hanya bila kebijakan existing mendukung |
| NISN | Numeric text 10 digit; boleh kosong bila belum terbit |
| NIK, KK | Numeric text 16 digit; indikator belum lengkap bila belum ada |
| Akta | Text, jika tersedia |
| Jenis kelamin | Radio L/P sesuai skema existing |
| Tempat/tanggal lahir | Text/date; target kelengkapan, kompatibel data lama |
| Usia | Read-only, hitung otomatis, tidak disimpan |
| Agama, kewarganegaraan | Select, opsi terpusat; detail WNA jika relevan |
| Anak ke-, jumlah saudara | Integer dengan batas yang benar |
| Bahasa sehari-hari | Text/select, opsional |

NIK/NISN/KK bukan input number. Tampilkan error panjang digit dan duplikasi di bawah field. Preview foto harus memakai source terotorisasi, mempertahankan foto legacy dan rasio 3:4. Contoh format tidak berupa nilai siswa fiktif yang tersimpan.

##### 2.5. SECTION 02 — Alamat & Tempat Tinggal

```text
┌─ Alamat & Tempat Tinggal ────────────────────────────────────────────┐
│ ALAMAT SESUAI KARTU KELUARGA                                         │
│ Alamat lengkap [_________________________________________________]  │
│ RT [____] RW [____]           Dusun/Lingkungan [________________]   │
│ Provinsi [Pilih ▼]            Kabupaten/Kota [Pilih ▼]              │
│ Kecamatan [Pilih ▼]           Kelurahan/Desa [Pilih ▼]               │
│ Kode pos [________]                                                  │
│ [✓] Alamat domisili sama dengan alamat KK                            │
│ (Jika tidak dicentang, tampilkan ulang kelompok alamat domisili)     │
│ TEMPAT TINGGAL & AKSES SEKOLAH                                        │
│ Jenis tempat tinggal [Pilih ▼]  Moda transportasi [Pilih ▼]           │
│ Jarak (km) [________]           Waktu tempuh (menit) [________]      │
└─────────────────────────────────────────────────────────────────────┘
```

Alamat textarea; RT/RW/kode pos text dengan nol depan. Wilayah bertingkat provinsi → kabupaten/kota → kecamatan → desa/kelurahan, reset child bila parent berubah. Jika sumber referensi belum tersedia, tampilkan input terstruktur, bukan dropdown kosong/dummy. Checkbox mengisi/merujuk domisili dari alamat KK; bila dilepas, user dapat mengisi alamat berbeda. Pilihan tempat tinggal: bersama orang tua, wali, keluarga lainnya, asrama, panti asuhan, lainnya. Transportasi: jalan kaki, sepeda, motor, mobil, antar jemput, angkutan umum, lainnya. Jarak dan waktu opsional nonnegatif, satuan jelas.

##### 2.6. SECTION 03 — Registrasi & Akademik

```text
┌─ Registrasi & Akademik ─────────────────────────────────────────────┐
│ Nomor pendaftaran [_______]      Jenis [Siswa baru/Pindahan ▼]     │
│ Tanggal pendaftaran [📅]        Tanggal diterima [📅]              │
│ Tanggal masuk sekolah * [📅]    Tahun ajaran masuk [Pilih ▼]       │
│ Tingkat saat masuk [1–6 ▼]      Kelas saat ini * [Pilih ▼]         │
│ Pernah PAUD? ( ) Ya ( ) Tidak ( ) Belum diketahui                  │
│ Pernah TK/RA? ( ) Ya ( ) Tidak ( ) Belum diketahui                  │
│ Nama sekolah asal [_______]    NPSN sekolah asal [_______]        │
│ Alamat sekolah asal [__________________________________________]   │
│ Status siswa [Pilih ▼]          Catatan administrasi [________]    │
│ [Info] Perubahan kelas/tanggal masuk siswa bertagihan diproteksi.  │
└────────────────────────────────────────────────────────────────────┘
```

Jenis pendaftaran: baru/pindahan. Status: aktif, nonaktif, pindah, mengundurkan diri, lulus. Gunakan tahun ajaran/kelas existing, jangan hardcode kelas 1A dst; pilihan mengikuti FK. Tingkat kelas saat masuk dan kelas saat ini berbeda konsep. Siswa pindahan menampilkan sekolah asal dan checklist surat pindah/rapor. PAUD/TK bukan syarat mutlak. Tampilkan peringatan usia administratif jika aturan telah disepakati; jangan otomatis menolak. Bila kelas/tanggal terkunci karena invoice, tampilkan pesan server dan arahkan ke alur histori/mutasi yang sah, bukan bypass.

##### 2.7. SECTION 04 — Data Ayah Kandung

```text
┌─ Data Ayah Kandung ──────────────────────────────────────────────────┐
│ Status informasi: [Tersedia / Meninggal / Tidak diketahui ▼]        │
│ ( ) Pilih data ayah existing    ( ) Tambah individu baru           │
│ [Cari nama/NIK/no. HP____________________] [Cari]                  │
│ [Hasil: nama • identitas tersamarkan • siswa terkait] [Pilih]       │
│ Nama lengkap [_____________]    NIK [________________________]      │
│ Tempat lahir [_____________]    Tanggal/tahun lahir [________]      │
│ Status hidup [Pilih ▼]          Pendidikan terakhir [Pilih ▼]       │
│ Pekerjaan [Pilih ▼]             Instansi/perusahaan [_________]     │
│ Penghasilan [Pilih ▼]           No. HP/WhatsApp [_____________]     │
│ Email [_______________________________________________________]     │
│ [ ] Alamat sama dengan siswa                                        │
│ Alamat [______________________________________________________]     │
│ [Info] Data keluarga dapat terhubung ke beberapa siswa bersaudara.  │
└─────────────────────────────────────────────────────────────────────┘
```

Pilih existing mengisi profil tanpa duplikasi; tampilkan ringkasan saudara hanya bila diizinkan. Status meninggal atau tidak diketahui menyesuaikan field yang diperlukan. Jangan membuat individu palsu untuk data yang tidak diketahui. Jika pengguna ingin mengedit individu shared, tampilkan dampak dan konfirmasi.

##### 2.8. SECTION 05 — Data Ibu Kandung

```text
┌─ Data Ibu Kandung ───────────────────────────────────────────────────┐
│ Status informasi: [Tersedia / Meninggal / Tidak diketahui ▼]        │
│ ( ) Pilih data ibu existing     ( ) Tambah individu baru           │
│ [Cari nama/NIK/no. HP____________________] [Cari]                  │
│ [Hasil: nama • identitas tersamarkan • siswa terkait] [Pilih]       │
│ Nama lengkap [_____________]    NIK [________________________]      │
│ Tempat lahir [_____________]    Tanggal/tahun lahir [________]      │
│ Status hidup [Pilih ▼]          Pendidikan terakhir [Pilih ▼]       │
│ Pekerjaan [Pilih ▼]             Instansi/perusahaan [_________]     │
│ Penghasilan [Pilih ▼]           No. HP/WhatsApp [_____________]     │
│ Email [_______________________________________________________]     │
│ [ ] Alamat sama dengan siswa                                        │
│ Alamat [______________________________________________________]     │
└─────────────────────────────────────────────────────────────────────┘
```

Ayah dan ibu wajib memakai reusable family form dengan tipe hubungan berbeda. Biodata mencakup nama, NIK, tempat lahir, tanggal/tahun lahir, status hidup, pendidikan, pekerjaan, instansi, penghasilan, HP, email dan alamat. Pilihan terpusat untuk keduanya:

- Status hidup: hidup, meninggal, tidak diketahui.
- Pendidikan: tidak sekolah, SD, SMP, SMA/SMK, D1, D2, D3, D4/S1, S2, S3, tidak diketahui.
- Pekerjaan: tidak bekerja, ibu rumah tangga, ASN/PNS, TNI/Polri, guru/dosen, karyawan swasta, wiraswasta, pedagang, petani, nelayan, buruh, pensiunan, tenaga kesehatan, lainnya.
- Penghasilan bulanan (kategori internal usulan): tidak berpenghasilan; < Rp500 ribu; Rp500 ribu–< Rp1 juta; Rp1 juta–< Rp2 juta; Rp2 juta–< Rp5 juta; Rp5 juta–Rp20 juta; > Rp20 juta; tidak diketahui/tidak bersedia.

Jangan mengklaim opsi internal sebagai kode resmi Dapodik tanpa mapping terverifikasi. Email/HP dan identifier divalidasi ketika terisi. Field penghasilan tidak boleh wajib untuk setiap orang tua.

##### 2.9. SECTION 06 — Wali & Kontak Darurat

```text
┌─ Wali & Kontak Darurat ──────────────────────────────────────────────┐
│ PENANGGUNG JAWAB SISWA                                               │
│ ( ) Ayah  ( ) Ibu  ( ) Wali lainnya                                 │
│ Nama [terisi dari keluarga]      Hubungan [Pilih ▼]                │
│ WhatsApp [______________]        Email [___________________]       │
│ [✓] Kontak utama sekolah         [✓] Penanggung jawab SPP           │
│ Jika wali lain: NIK, tahun lahir, pendidikan, pekerjaan,           │
│ penghasilan, alamat; pilih existing atau tambah individu.          │
│ KONTAK DARURAT                                                       │
│ [Pilih dari keluarga / Tambah kontak ▼]                            │
│ Nama [_________________]         Hubungan [_______________]        │
│ Nomor telepon darurat [___________________________________]        │
│ AKSES PORTAL WALI (terpisah)                                         │
│ Akun wali | Status hubungan | [Kelola akses sesuai izin]            │
└─────────────────────────────────────────────────────────────────────┘
```

Ayah/ibu mengisi referensi dan biodata otomatis; wali lain dapat berupa kakek, nenek, paman, bibi atau wali lainnya. Satu kontak utama; kontak darurat boleh sama atau berbeda. Tampilkan semua akses portal existing yang relevan, jangan hapus relasi lain saat edit. Aksi kelola akses harus melalui izin dan validasi backend, bukan sekadar checkbox kontak.

##### 2.10. SECTION 07 — Kesehatan & Kebutuhan Khusus

```text
┌─ Kesehatan & Kebutuhan Khusus ───────────────────────────────────────┐
│ Data sensitif — hanya untuk pengguna berizin                        │
│ Golongan darah [A/B/AB/O/Tidak diketahui ▼]                         │
│ Riwayat penyakit [____________________________________________]     │
│ Alergi makanan [____________]    Alergi obat [_______________]      │
│ Kebutuhan khusus [Ya/Tidak/Belum diketahui ▼]                       │
│ Jenis kebutuhan khusus [Multi-select ▼] (jika relevan)             │
│ Pengobatan rutin [____________________________________________]     │
│ Catatan penanganan darurat [__________________________________]     │
│ Kebutuhan pendampingan [______________________________________]     │
│ PENGUKURAN BERKALA                          [+ Tambah Pengukuran]    │
│ Tanggal     Tahun/Semester      Tinggi (cm)    Berat (kg)   Catatan │
│ ─────────────────────────────────────────────────────────────────── │
│ ... riwayat aktual / Belum ada pengukuran ...                        │
└─────────────────────────────────────────────────────────────────────┘
```

Modal tambah pengukuran: tanggal, tahun ajaran, semester, tinggi cm, berat kg, catatan, Batal/Simpan. Saat draft belum memiliki studentId, staging pengukuran disimpan bersama draft atau aksi baru tersedia setelah finalisasi dengan keterangan jelas. Hindari diagnosis otomatis. Pengguna tanpa izin tidak mendapat payload maupun section medis. Empty state tidak mengartikan anak sehat tanpa data.

##### 2.11. SECTION 08 — Bantuan Pendidikan

```text
┌─ Bantuan Pendidikan ────────────────────────────────────────────────┐
│ Status informasi [Belum diketahui / Ada / Tidak ada ▼]             │
│ Memiliki KIP? [Ya/Tidak/Belum diketahui ▼]  Nomor KIP [________]    │
│ Penerima PIP? [Ya/Tidak/Belum diketahui ▼]                          │
│ Penerima PKH? [Ya/Tidak/Belum diketahui ▼]                          │
│ KKS/KPS [Jika memiliki]                                            │
│ Penerima beasiswa? [Ya/Tidak/Belum diketahui ▼]                      │
│ Jenis [Pilih ▼]                  Sumber [____________________]      │
│ Periode mulai [📅]               Periode akhir [📅]                 │
│ Dokumen pendukung [Pilih/Upload]                                    │
│ Catatan [_____________________________________________________]     │
│ RIWAYAT BANTUAN                           [+ Tambah Bantuan]        │
│ Jenis | Nomor | Sumber | Periode | Status | Dokumen | Aksi          │
└─────────────────────────────────────────────────────────────────────┘
```

Input hanya muncul ketika relevan; jangan menghapus histori bantuan saat memilih tidak menerima saat ini. Jenis beasiswa internal/eksternal/lainnya. Dokumen merujuk pengelolaan dokumen siswa. Tampilkan helper bahwa pencatatan tidak mengubah tagihan SPP secara otomatis.

##### 2.12. SECTION 09 — Karakteristik & Perkembangan Anak

```text
┌─ Karakteristik & Perkembangan Anak ──────────────────────────────────┐
│ Template karakteristik [Pilih template existing ▼]                 │
│ Status: Belum diisi / Terisi   Terakhir diisi: —                    │
│ [Isi/Perbarui Karakteristik]   [Lihat Detail]                        │
│ RINGKASAN JAWABAN                                                   │
│ Hobi, cita-cita, minat & bakat       ... jawaban aktual              │
│ Kebiasaan belajar & kemandirian      ... jawaban aktual             │
│ Sosialisasi dan kebutuhan dukungan   ... jawaban aktual             │
│ Baca Al-Qur'an, metode, hafalan       ... jawaban aktual             │
│ Doa, kebiasaan ibadah                ... jawaban aktual              │
│ Harapan dan catatan orang tua        ... jawaban aktual             │
│ RIWAYAT PENGISIAN (jika tersedia)                                   │
│ Tanggal | Template | Pengisi | Status | Lihat                      │
└─────────────────────────────────────────────────────────────────────┘
```

Gunakan form/renderer karakteristik existing dan response data asli. Jika belum ada template, tampilkan empty state dan arahkan pihak berwenang ke menu existing. Saat tambah siswa belum final, jelaskan kapan karakteristik dapat diisi; bila menggunakan staging draft, finalisasi harus terhubung aman. Tidak boleh menyimpan jawaban duplikat di `students` atau menjadikannya aturan seleksi.

##### 2.13. SECTION 10 — Dokumen Persyaratan

```text
┌─ Dokumen Persyaratan ────────────────────────────────────────────────┐
│ Dokumen berlaku: 5 | Terunggah: 4 | Terverifikasi: 3                │
│ Kelengkapan verifikasi [██████░░░░] 3/5                            │
│ [Semua ▼] [Status ▼]                                                │
│ Dokumen           Kebutuhan    Status         Aksi                  │
│ ─────────────────────────────────────────────────────────────────── │
│ Kartu Keluarga    Utama        Terverifikasi  Lihat / Unduh         │
│ Akta Kelahiran    Utama        Terverifikasi  Lihat / Unduh         │
│ KTP Ayah          Jika ada     Terverifikasi  Lihat / Unduh         │
│ KTP Ibu           Jika ada     Menunggu       Review                │
│ Pas Foto          Sesuai aturan Belum unggah  Unggah                │
│ Surat Pindah      Tidak berlaku —             —                     │
│ [+ Dokumen Lainnya]                                                 │
│ [Info] Dokumen ditolak dapat diunggah ulang beserta catatan.       │
└─────────────────────────────────────────────────────────────────────┘
```

Gunakan tabel tunggal, bukan card per berkas. Semua jenis dokumen pada TGS-014 harus dapat ditangani, termasuk dokumen kondisional. Status: belum unggah, menunggu verifikasi, terverifikasi, ditolak, tidak berlaku. Tampilkan alasan penolakan dan aksi unggah ulang; jangan menampilkan aksi review untuk pengguna tanpa izin.

```text
MODAL REVIEW DOKUMEN (WAJIB)
┌─────────────────────────────────────────────────────────────┐
│ Verifikasi Dokumen — [jenis]                            [×] │
│ Preview PDF/gambar terotorisasi     │ Informasi             │
│                                     │ Nama file, ukuran     │
│ [ Preview / gagal muat + ulangi ]  │ Pengunggah, tanggal   │
│                                     │ Status saat ini      │
│                                     │ Catatan review       │
│                                     │ [_________________]  │
│ [Unduh] [Tutup]                    [Tolak] [Verifikasi]     │
└─────────────────────────────────────────────────────────────┘
```

Tolak memerlukan alasan; verifikasi memerlukan konfirmasi yang jelas. Modal upload berisi jenis, kebutuhan, file picker, batas format/ukuran, progress, Batal/Simpan. Kegagalan tidak menutup form atau menghilangkan input. Status berubah hanya setelah server mengonfirmasi. Jangan menggunakan data contoh wireframe sebagai state default.

**Acceptance TGS-016:** seluruh 10 section sesuai layout di atas, dapat dinavigasi, field tersimpan lewat kontrak aktual, edit prefill, draft resume, error section, keyboard/mobile, conditional field dan kontrol akses berfungsi. Tidak ada dummy data/tombol palsu.

#### TGS-017 — Detail Profil Siswa (skema wajib)

Route `/master/siswa/[id]`; kembangkan `StudentDetailView.tsx`. Pertahankan ringkasan, keuangan, ujian dan wali existing, termasuk pembayaran dan aksi kartu ujian. Tambahkan bagian biodata tanpa memindahkan histori keuangan ke schema baru.

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Master Data / Siswa / Detail Siswa                          [Kembali]     │
├───────────────────────────────────────────────────────────────────────────┤
│ [FOTO 3×4]  Nama Lengkap Siswa                    [Ubah Data]            │
│             NIS • NISN                            [Cetak Biodata ▼]      │
│             Kelas • Tahun Ajaran • Status siswa                           │
├───────────────────────────────────────────────────────────────────────────┤
│ Kelengkapan biodata       Dokumen terverifikasi     Administrasi          │
│ [████████░░] 80%          5/7                       Perlu dilengkapi       │
├───────────────────────────────────────────────────────────────────────────┤
│ Ringkasan | Biodata | Akademik | Keluarga | Kesehatan | Lainnya ...       │
├───────────────────────────────────────────────────────────────────────────┤
│ KONTEN TAB AKTIF                                                           │
│ Informasi dua kolom berupa label dan nilai.                                 │
│ Bila data belum tersedia: “Belum diisi” + tautan ke section edit.         │
│ Aksi khusus tab hanya tersedia sesuai izin.                                │
└───────────────────────────────────────────────────────────────────────────┘
```

Gunakan satu permukaan konten per tab, navigasi horizontal scrollable atau grup tab untuk menghindari overflow. Jangan menampilkan seluruh detail sekaligus atau membangun rangkaian card vertikal tanpa navigasi. Pada mobile foto/header dapat wrap, aksi menjadi menu atau tombol ringkas, tab tetap dapat dijangkau.

##### Isi wajib setiap tab

| Tab | Isi utama | Aksi / perilaku wajib |
|---|---|---|
| Ringkasan | Identitas ringkas, status siswa, kelas, kontak utama yang diizinkan, status kelengkapan, ringkasan SPP dan ujian existing | Lihat detail section yang belum lengkap; pertahankan navigasi existing |
| Biodata | Identitas siswa (label/value), alamat KK dan domisili, tempat tinggal, transportasi | Ubah → section 01/02; NIK/KK masked secara default |
| Akademik | Registrasi awal, sekolah asal, PAUD/TK, tahun ajaran dan kelas aktif, histori penempatan | Lihat histori; pencatatan perubahan dengan guard invoice |
| Orang Tua & Wali | Ayah, ibu, wali, kontak utama, penanggung jawab SPP, kontak darurat, akun portal | Ubah sesuai izin; reuse data keluarga; tidak memberikan akses otomatis |
| Kesehatan | Profil kesehatan, alergi, kebutuhan pendampingan, histori pengukuran | Tambah pengukuran; hanya role berizin khusus |
| Bantuan Pendidikan | Daftar bantuan, sumber, periode, status, bukti | Tambah/ubah sesuai izin; tidak memicu diskon |
| Karakteristik Anak | Template, jawaban, status dan histori existing | Lihat/isi/perbarui jika diizinkan |
| Dokumen | Tabel dan modal review yang sama dengan section 10 | Unggah, lihat, unduh, review sesuai izin |
| Keuangan | Tab existing: histori invoice, pembayaran dan ringkasan terkait | Pertahankan seluruh alur finansial dan format kuitansi |
| Ujian | Tab existing: periode ujian, kelayakan, dispensasi, kartu | Pertahankan aturan server dan aksi cetak/QR |
| Riwayat Perubahan | Tanggal, aksi, pelaku, ringkasan perubahan aman | Filter waktu/aksi; jangan tampilkan nilai sensitif ke role umum |

Contoh susunan Biodata (read-only):

```text
BIODATA SISWA                                           [Ubah Biodata]
Nama lengkap        : [nilai aktual]      Nama panggilan : [nilai aktual]
NIS                 : [nilai aktual]      NISN           : [nilai aktual]
NIK                 : ************1234    Nomor KK       : ************5678
Jenis kelamin       : [nilai aktual]      TTL / Usia     : [nilai aktual]
Agama               : [nilai aktual]      Kewarganegaraan: [nilai aktual]
Anak ke-/Saudara    : [nilai aktual]      Bahasa         : [nilai aktual]
Nomor akta          : [nilai aktual jika diizinkan]
────────────────────────────────────────────────────────────────────────
ALAMAT & DOMISILI                                        [Ubah Alamat]
Alamat KK : [nilai aktual] | Domisili: [sama/berbeda + nilai aktual]
Jenis tempat tinggal, transportasi, jarak dan waktu tempuh: [nilai aktual]
```

Contoh susunan Orang Tua & Wali:

```text
KELUARGA                                                 [Ubah Keluarga]
┌──────────────────────────────┬────────────────────────────────────────┐
│ Ayah Kandung                 │ Ibu Kandung                            │
│ Nama, status hidup, kontak   │ Nama, status hidup, kontak             │
│ Pendidikan, pekerjaan        │ Pendidikan, pekerjaan                 │
│ Data sensitif sesuai izin    │ Data sensitif sesuai izin              │
└──────────────────────────────┴────────────────────────────────────────┘
Kontak utama: [individu] | Penanggung jawab SPP: [individu]
Kontak darurat: [nama, hubungan, nomor telepon yang diizinkan]
Akses Portal Wali: tabel akun/guardian yang terhubung dan status
```

Contoh susunan Kesehatan dan Bantuan: pakai tampilan section 07/08 dalam mode baca dengan tabel histori yang sama; tombol tambah/ubah membuka form terotorisasi. Karakteristik dan dokumen memakai komponen yang sama dengan section 09/10. Pada Keuangan/Ujian pertahankan tampilan existing dan hanya sesuaikan layout tab luar jika perlu.

**Acceptance:** detail menggunakan data backend terotorisasi, tidak ada field sensitif yang dikirim tanpa izin, tab existing tetap bekerja, deep-link edit menuju section sesuai, data lama kosong ditampilkan jujur.

#### TGS-018 — Daftar Master Siswa (skema wajib)

Route `/master/siswa`; baseline sudah menggunakan `st-page-shell`, header, strip filter/metrics dan tabel `st-table` di page existing, bukan selalu `DataTable`. Gunakan komponen reusable `DataTable` bila mampu mempertahankan desain dan perilaku; bila tidak, kembangkan tabel existing tanpa menduplikasi design system. Pertahankan identitas visual dan CTA tambah.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Master Data / Data Siswa                                                   │
│ Data Siswa / Santri                   [Import] [Export ▼] [+ Tambah Siswa] │
│ Kelola biodata dan administrasi siswa.                                     │
├────────────────────────────────────────────────────────────────────────────┤
│ Total Siswa │ Aktif │ Biodata Lengkap │ Belum Lengkap │ Dokumen Menunggu     │
│   [nilai]   │[nilai]│     [nilai]     │    [nilai]    │     [nilai]         │
├────────────────────────────────────────────────────────────────────────────┤
│ [Cari nama/NIS/NISN___________________] [Tahun Ajaran ▼] [Kelas ▼]       │
│ [Status ▼] [Kelengkapan ▼] [Reset]          [Draft Pendaftaran (jumlah)]   │
├────────────────────────────────────────────────────────────────────────────┤
│ No | Siswa/Foto | NIS/NISN | Kelas/Tahun | Wali | Kelengkapan | Status | ⋮ │
│ ────────────────────────────────────────────────────────────────────────── │
│       Data aktual dari backend; bukan hardcoded.                           │
├────────────────────────────────────────────────────────────────────────────┤
│ Menampilkan 1–15 dari [total]         [15 per halaman ▼]   [‹] 1 2 3 [›] │
└────────────────────────────────────────────────────────────────────────────┘
```

- Ringkasan jumlah berasal dari query backend; jelas scope/filter yang dipakai. Data sensitif tidak ikut query ringkasan umum.
- Pencarian nama/NIS/NISN, filter tahun ajaran dan kelas berkaitan, status dan kelengkapan, reset, pagination server-side. Pertahankan state filter saat kembali dari detail bila memungkinkan. Gunakan debounce/cancel stale request.
- Tabel: nama + foto ringkas, NIS/NISN, kelas/tahun, nama wali utama yang diizinkan, badge/progress kelengkapan, status dan aksi. NIK/KK lengkap, kesehatan, penghasilan dan isi dokumen tidak ditampilkan pada daftar.
- Aksi Lihat Detail, Ubah, Cetak Biodata, Nonaktifkan bila izin dan aturan existing mengizinkan. Jika masih ada aksi hapus existing, pertahankan proteksi histori dan konfirmasi; jangan menambah hard-delete terhadap data bersejarah.
- Draft dipisah dari daftar siswa resmi; buka daftar/modal draft terotorisasi dengan nama (bila diisi), timestamp, progres dan Lanjutkan. Jangan memasukkan draft ke total siswa aktif/kelayakan/tagihan.
- Loading skeleton/table overlay, empty state dengan reset filter atau tambah (jika berizin), error dan retry, pagination valid setelah filter atau perubahan data.
- Mobile: ringkaskan kolom, gunakan overflow tabel terkontrol atau representasi row responsif. Aksi tidak menutupi data. Jangan memaksa horizontal scroll pada seluruh halaman.

**Acceptance:** daftar terfilter dan terpaginasikan sesuai data DB, jumlah sesuai scope, semua aksi berizin, draft terpisah, responsif, tidak bocor data sensitif.

#### TGS-019 — Import Excel, export, cetak biodata dan buku induk

##### A. Import Excel

Tambahkan template XLSX yang memuat identitas, registrasi, alamat, data ayah, ibu dan wali. Dokumentasikan nama sheet/kolom, tipe, wajib/kondisional, referensi kelas/tahun dan instruksi pengisian. Snapshot `package.json` belum memuat library XLSX khusus; jika menambah dependency, pilih library yang sesuai, minimalkan dependency dan dokumentasikan alasan, lisensi serta batas keamanan. Jangan mengklaim format ini siap import Dapodik tanpa kontrak terverifikasi.

Alur: download template → upload XLSX → parsing/preview → validasi tiap baris → perbaiki sumber → konfirmasi → revalidasi server → import → laporan. Pertahankan leading zero, jangan eksekusi formula, batasi ukuran/row, hindari zip bomb, hindari merge otomatis berdasarkan kemiripan. Jelaskan kebijakan baris valid/invalid. Default aman: blokir commit selama ada error, user dapat memperbaiki lalu mengunggah ulang. Jangan mengimpor sebagian diam-diam; bila disediakan opsi baris valid saja harus eksplisit dan terkonfirmasi. Commit idempotent dengan fingerprint/batch token serta revalidasi. Jangan update data existing secara implisit. Terapkan transaksi/hasil per baris sesuai kebijakan terdokumentasi.

**Skema wizard import (WAJIB):**

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Import Data Siswa                                                      │
│ 1. Template ── 2. Upload ── 3. Validasi ── 4. Konfirmasi ── 5. Hasil     │
├───────────────────────────────────────────────────────────────────────┤
│ [Unduh Template XLSX] [Panduan Pengisian]                               │
│ [ Pilih file / seret XLSX ]    Nama file • Ukuran • [Ganti]             │
│ Total [N]   Valid [N]   Tidak valid [N]                                 │
│ [Semua] [Valid] [Perlu diperbaiki] [Unduh laporan error]               │
│ Baris | NIS | Nama | Kelas | Status | Field bermasalah | Pesan          │
│ ────────────────────────────────────────────────────────────────────── │
│ ... hasil validasi aktual ...                                         │
├───────────────────────────────────────────────────────────────────────┤
│ [Batal] [Unggah ulang]                          [Konfirmasi Import]    │
└───────────────────────────────────────────────────────────────────────┘
```

Tombol konfirmasi disabled jika belum valid menurut kebijakan; alasan terlihat. Konfirmasi menampilkan jumlah baris yang akan diproses, duplikat, mode create dan dampak. Hasil menampilkan berhasil/gagal/skipped, detail baris dan tautan daftar siswa yang berhasil. Retry menggunakan idempotency agar tidak menduplikasi. Simpan log ringkas tanpa isi dokumen atau NIK penuh.

##### B. Export

Modal export berisi cakupan sesuai filter, seluruh data yang diizinkan atau siswa terpilih; pilih kolom/kelompok yang diizinkan, format XLSX, jumlah data, tombol Batal dan Unduh. Field umum default: NIS, nama, kelas, tahun, status, kelengkapan dan data administratif yang diizinkan. NIK, KK, penghasilan, kesehatan dan dokumen tidak ikut export umum; kebutuhan khusus memerlukan izin, konfirmasi dan audit. Cegah spreadsheet formula injection; server menentukan whitelist, bukan mempercayai pilihan client.

```text
┌─ Export Data Siswa ───────────────────────────────────────┐
│ Cakupan: (•) Filter aktif  ( ) Semua  ( ) Siswa terpilih    │
│ Kolom: [✓] Identitas umum [✓] Akademik [ ] Kontak berizin   │
│ Kolom sensitif: hanya tersedia jika izin khusus terpenuhi.  │
│ Format: XLSX                     Jumlah: [hasil query]     │
│ [Batal]                                 [Unduh Export]    │
└───────────────────────────────────────────────────────────┘
```

##### C. Cetak Formulir Biodata Siswa — A4

Gunakan logo sekolah existing, identitas sekolah, pas foto 3×4, section identitas/alamat/registrasi/ayah/ibu/wali/kontak darurat, tanggal cetak, tempat tanda tangan jika dibutuhkan. Cetak hanya data yang diizinkan; field sensitif perlu izin yang sesuai. Jangan memasukkan kesehatan/penghasilan/dokumen secara default. Gunakan print preview dan CSS print A4; sembunyikan sidebar/aksi, jaga margin, page breaks, font dan keterbacaan. Jika banyak data, tambah halaman, bukan mengecilkan font ekstrem. Data tidak diketahui tampil kosong atau “Belum diisi”.

```text
┌────────────────────── A4 — FORMULIR BIODATA ──────────────────────┐
│ [LOGO]            SDIT AT-TAQWIM                                  │
│                   FORMULIR BIODATA SISWA                           │
│ ───────────────────────────────────────────────────────────────── │
│ IDENTITAS SISWA                                      [Foto 3×4]   │
│ Nama, NIS/NISN, TTL, jenis kelamin, identitas yang diizinkan       │
│ ALAMAT & DOMISILI                                                 │
│ REGISTRASI & AKADEMIK                                             │
│ DATA AYAH KANDUNG                                                 │
│ DATA IBU KANDUNG                                                  │
│ WALI & KONTAK DARURAT                                             │
│ ───────────────────────────────────────────────────────────────── │
│ Tanggal cetak: [tanggal aktual]                                    │
│ Orang Tua/Wali                         Petugas TU (bila dibutuhkan) │
│ (________________)                     (________________)         │
└───────────────────────────────────────────────────────────────────┘
```

##### D. Cetak Buku Induk Siswa

Sediakan ringkasan buku induk berdasarkan identitas dan histori akademik yang benar-benar tercatat. Layout A4: identitas sekolah, identitas siswa dan nomor induk, data keluarga yang berizin, registrasi awal, tabel riwayat tahun ajaran/kelas/status/tanggal, keterangan pindah/lulus jika tersedia. Jangan menambahkan nilai, rapor, prestasi atau riwayat yang belum dimiliki sistem. Labeli sebagai ringkasan buku induk internal, bukan format resmi pemerintah tanpa verifikasi.

**Acceptance:** template, parsing, preview, validasi dan import aktual tersedia; export terotorisasi dan aman; cetak A4 dapat dipreview, foto termuat, pagination cetak wajar; kuitansi dan kartu ujian existing tidak berubah.

#### TGS-020 — Riwayat akademik dan pembaruan biodata oleh wali

##### A. Riwayat akademik

Catat penempatan awal, kenaikan/perpindahan kelas, pindah sekolah, lulus, mengundurkan diri dengan effective date dan histori yang tidak ditimpa. Pisahkan perubahan akademik dari edit profil. **Guard wajib:** `server/resources.ts` saat ini menolak perubahan `classId`/`enrolledOn` pada siswa bertagihan dengan HTTP 409. Jangan melemahkan guard atau mengubah invoice retroaktif. Untuk kasus mutasi yang berdampak finansial, siapkan alur permohonan/rencana mutasi terpisah dan blokir eksekusi sampai kebijakan disetujui. Tidak boleh ada tombol yang terlihat berhasil padahal DB belum berubah. Pencatatan status akademik yang memengaruhi invoice/ujian mengikuti gerbang kebijakan existing.

```text
┌─ Riwayat Akademik ──────────────────────────────────────────────────┐
│ Penempatan saat ini: [Tahun Ajaran] / [Kelas] / [Status]            │
│ [Catat Perubahan Akademik] (jika diizinkan)                         │
│ Tahun Ajaran | Tingkat/Kelas | Mulai | Akhir | Status | Keterangan │
│ ... histori nyata ...                                              │
│ [Info] Mutasi yang memengaruhi tagihan memerlukan proses terpisah. │
└─────────────────────────────────────────────────────────────────────┘
```

Modal perubahan: jenis perubahan, tanggal efektif, kelas/tahun tujuan bila relevan, alasan, ringkasan dampak; Batal/Konfirmasi. Jika diblokir, tampilkan pesan backend dan langkah yang diperlukan. Jangan menampilkan “berhasil” palsu.

##### B. Pengajuan pembaruan biodata wali

Wali hanya dapat mengajukan perubahan field yang diizinkan untuk siswa yang terhubung lewat `guardian_students`. Jangan memberi edit langsung pada NIS, kelas, status akademik, SPP, pembayaran atau kelayakan ujian. Perubahan data bersama lintas saudara harus mendapat pemeriksaan dampak dan izin. Identitas/dokumen tertentu dapat memerlukan bukti; jangan bocorkan informasi anggota keluarga yang bukan scope wali.

Alur: wali memilih siswa → lihat biodata berizin → ajukan patch dan alasan/bukti bila diperlukan → SUBMITTED → TU review → APPROVED/REJECTED → apply atomik dan audit. Reviewer memeriksa revision/konflik; permintaan lama tidak boleh menimpa update terbaru tanpa pemeriksaan.

```text
PORTAL WALI — BIODATA ANAK
┌──────────────────────────────────────────────────────────────────────┐
│ [Pilih Anak ▼]  Biodata Anak                                        │
│ [Lihat Biodata] [Ajukan Pembaruan] [Riwayat Pengajuan]               │
│ Field yang dapat diusulkan | Nilai saat ini | Nilai usulan         │
│ Alasan [_________________________________________]                 │
│ Bukti pendukung [jika diperlukan]                                 │
│ [Batal]                                         [Kirim Pengajuan]  │
└──────────────────────────────────────────────────────────────────────┘

TU — REVIEW PERUBAHAN BIODATA
┌──────────────────────────────────────────────────────────────────────┐
│ [Menunggu ▼] [Cari siswa]                                           │
│ Siswa | Wali | Tanggal | Field berubah | Status | [Review]         │
│ Detail review: Field | Sebelum | Usulan | Dampak/konflik            │
│ Bukti terotorisasi | Catatan reviewer [____________________]       │
│ [Tutup]                                  [Tolak] [Setujui & Terapkan]│
└──────────────────────────────────────────────────────────────────────┘
```

Tambahkan akses UI melalui area portal wali dan Master Siswa existing, bukan menu PPDB baru. Route final mengikuti navigasi aktual. Tolak memerlukan alasan. Status dan history ditampilkan setelah server mengonfirmasi.

**Acceptance:** histori akademik tidak fiktif/tertindih, proteksi invoice tetap aktif, wali hanya dapat mengajukan data anak terkait, review terotorisasi dan audit tersedia, eksekusi kebijakan finansial yang belum disetujui tetap terblokir.

---

### FASE 3 — Integrasi, keamanan dan QA

#### TGS-021 — Pengujian, integrasi, regresi dan laporan

Gunakan `node:test`, `node:assert/strict`, `tests/fixture.ts` (PGlite). Aturan repository menginisialisasi fixture dari migration produksi. Karena tahap ini melarang pembuatan/eksekusi migrasi, tulis test baru dan tandai yang butuh schema baru sebagai `BLOCKED_SCHEMA`/`NOT_TESTED`. Jalankan hanya pemeriksaan yang diizinkan dan tidak mengakses Neon. Jangan menggunakan fixture lama untuk mengklaim skema baru telah lulus. Untuk UI, siapkan UAT dan skenario Playwright tanpa menjalankan dev server/build pada tahap ini.

##### Skenario pengujian wajib

| ID | Skenario | Hasil yang diharapkan |
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

Untuk setiap TC dokumentasikan jenis (unit/integrasi/UAT), precondition, data uji sintetis yang hanya berada di test fixture, langkah, expected, actual, status, bukti file atau hasil eksekusi. Jangan menganggap tabel test case sebagai bukti PASS.

## Context

### 1. Bukti source code yang harus dijadikan baseline

Repository `MHamzah1/sistem-sdit-at-taqwim` branch `main`, dari ZIP yang diunggah pengguna. Pemeriksaan ini tidak mengonfirmasi isi HEAD remote terbaru. Sebelum perubahan, baca working tree Agent aktual dan cek apakah ada perubahan lain yang harus dipertahankan.

| Path | Bukti snapshot yang relevan |
|---|---|
| `package.json` | Next.js `^16.4.6`, React `^19.2.0`, Tailwind 4, Drizzle `^0.45.2`, Zod `^4.6.2`, Node `24.x`; scripts `typecheck`, `test`, `build`, `db:*` |
| `AGENTS.md` | Aturan integritas transaksi, guardian scoping, no secret leak, DoD typecheck/test/build; dokumentasi masih menyebut Next.js 15 sehingga manifest aktual lebih tepat untuk versi |
| `src/db/schema.ts:111–184` | `academicYears`, `classes`, `guardians`, `students`, `guardianStudents`; NIS unik; NISN nullable tanpa unique constraint pada snapshot; classId/enrolledOn wajib; `active` boolean; link guardian/student composite PK |
| `src/db/schema.ts` | Entity karakteristik existing; gunakan kembali model template dan submission |
| `server/resources.ts:32–85` | Validasi Zod master siswa/wali existing; NISN 10 digit jika diisi, gender L/P, data lahir dan foto nullable |
| `server/resources.ts:164–188` | Validasi kelas; HTTP 409 bila classId/enrolledOn diubah pada siswa dengan invoice |
| `server/state.ts:6–62` | Guardian scope melalui guardianStudents/guardians; query `.select().from(s.students)` menuntut projection eksplisit saat schema ditambah |
| `server/app.ts` | Dispatcher API existing, handler file dan relasi guardian; gunakan pola route/authorization aktual |
| `server/files.ts` | Private Blob upload/metadata/read untuk bukti transfer; perlu namespace dan authorization terpisah untuk dokumen siswa |
| `src/lib/api.ts` | API client dan helper upload proof/download existing |
| `src/app/(app)/master/siswa/_components/StudentFormView.tsx:215–294` | Form existing menerima guardian mode existing/new/none, memvalidasi nama/NIS/kelas/NISN, lalu mengirim payload siswa dan pilihan wali ke onSave |
| `src/app/(app)/master/siswa/_components/StudentFormView.tsx` | Foto 3×4, pemrosesan compressed data URL, opsi URL; pertahankan kompatibilitas saat private storage dikembangkan |
| `src/app/(app)/master/siswa/_components/StudentDetailView.tsx` | Detail siswa serta data kelas, wali, identitas, keuangan/ujian dan integrasi foto kartu |
| `src/app/(app)/master/siswa/page.tsx:90–231` | Desain header, CTA tambah, filter nama/NIS/NISN, kelas/status dan tabel existing (`st-*`) |
| `src/app/(app)/master/siswa/tambah/page.tsx`, `[id]/ubah/page.tsx`, `[id]/page.tsx` | Page wrapper route existing yang harus dipertahankan; baca kembali wiring sebelum edit |
| `docs/fitur/kelengkapan-identitas-siswa/4-urutan-tugas.md` | TGS-006 dan TGS-007 terdokumentasi selesai; perluasan ini melanjutkan bukan menggantikan |
| `.development-history/` | TGS-001 sampai 009, DAT-001 dan DAT-002 tercatat; status riwayat bukan bukti runtime baru |

Informasi schema/field baru, endpoint baru, wireframe dan flow tambahan dalam dokumen ini adalah target implementasi yang disetujui, bukan fakta sudah tersedia. Jangan mengklaim persyaratan ini sebagai seluruh field wajib Dapodik atau format resmi tanpa verifikasi kebijakan yang relevan.

### 2. Aturan repository yang wajib dibaca dan diterapkan

- `AGENTS.md`.
- `.agents/rules/alur-kerja.md`, `backend-serverless.md`, `database.md`, `frontend-react.md`, `form.md`, `list-table.md`, `display-formatting.md`, `kelayakan-dan-keuangan.md`, `logging.md`, `tests.md`, `project-context.md`.
- `.agents/skills/` dan `.claude/commands/` sesuai ketersediaan. Baca `/tugas-kerjakan`, `/verifikasi`, `/laporan`, `/fitur-spesifikasi`, `/fitur-pecah-tugas` dan `/data-periksa` bila diperlukan. Jangan memakai skill audit read-only untuk mengubah kode.
- Baca dokumentasi versi Next.js yang terpasang sebagaimana diperintahkan AGENTS.md (`node_modules/next/dist/docs/` jika tersedia); jangan menjalankan instalasi atau build tanpa kebutuhan/izin yang sesuai.
- Gunakan siklus status `usulan → disetujui → berjalan → selesai` atau `ditolak`/`terblokir`. Hanya pengguna berhak menyetujui; persetujuan planning yang mendasari instruksi ini dicatat sebagai bukti ruang lingkup yang disetujui. Jangan mengarang persetujuan kebijakan tambahan. Bila konvensi lokal mengharuskan persetujuan ID baru yang belum tercakup, catat blocker spesifik tanpa mengganti persetujuan pengguna dengan klaim palsu.
- `_ACTIVE-TASK.md` mencatat satu objek aktif dan ditutup sesuai `/laporan` ketika kriteria yang sah terpenuhi. Penomoran global per prefix. Fitur baru menggunakan TGS, bug murni menggunakan ISU, revisi menggunakan REV, eksekusi skema menggunakan DAT, UAT browser menggunakan UJI. Jangan menimpa tiket lain.

### 3. Base components dan arsitektur FE

Gunakan kembali `src/components/DataForm.tsx`, `DataTable.tsx`, `Panel.tsx`, `Badge.tsx`, `Modal.tsx`, `PageHeader.tsx`, `Brand.tsx`, `Toast.tsx`, `CopyButton.tsx` dan primitives di `src/components/ui/` (button, input, select, tabs, pagination, table, dialog, card). Gunakan komponen yang memang sesuai kebutuhan; jangan memaksa wrapper yang merusak tampilan existing. Buat komponen reusable section form, family picker, completeness summary, document table/review dan error state di lokasi yang sesuai konvensi repository jika belum ada. Tidak perlu membuat duplikat base component.

Pakai API client `src/lib/api.ts`; AppContext di `src/lib/context/AppContext.tsx` hanya untuk data global minimum yang relevan. Halaman sensitif mengambil data detail terotorisasi ketika dibutuhkan. Gunakan CSS/tokens existing dan Lucide React sesuai pola aplikasi. Pisahkan logic/DTO dari view; gunakan TypeScript tanpa `any` sembarangan.

### 4. RBAC, privasi dan audit

Role existing: SUPER_ADMIN, TU_KEUANGAN, KEPALA_SEKOLAH, WALI_MURID. Periksa permission/helper aktual di `server/security.ts`; jangan berasumsi role secara otomatis memiliki semua izin baru. Gunakan policy granular deny-by-default untuk NIK/KK, kesehatan, penghasilan, dokumen, perubahan akun wali, import/export dan review. Jangan memberi hak baru tanpa keputusan yang sah. Hak baca halaman bukan hak baca semua field.

| Role | Prinsip akses target |
|---|---|
| SUPER_ADMIN | Pengelolaan master dan akses sesuai permission yang sah; akses sensitif tetap purpose-limited |
| TU_KEUANGAN | Biodata/administrasi, verifikasi, import/export jika diberi izin; bukan akses otomatis seluruh kesehatan |
| KEPALA_SEKOLAH | Informasi yang diperlukan untuk tugas sekolah; field sensitif tidak otomatis terbuka |
| WALI_MURID | Hanya siswa yang sah terhubung melalui `guardian_students`, subset biodata dan pengajuan perubahan |

Cegah IDOR pada setiap read/write/download/export, termasuk query melalui ID dokumen atau ID anggota keluarga. Validasi izin di server, bukan hanya menyembunyikan tombol. Pakai projection explicit untuk list/detail/state. Masking NIK/KK pada tampilan umum; data penuh hanya dikirim ke endpoint yang memerlukan dan berizin. Jangan mengungkap data anak lain saat memilih anggota keluarga shared. Data kesehatan dan finansial keluarga hanya dikumpulkan jika diperlukan, akses dibatasi, dan rencana retensi mengikuti kebijakan sekolah serta ketentuan perlindungan data yang berlaku.

Audit melalui helper existing: actor, waktu, action, target, hasil, ringkasan perubahan yang sudah direduksi/redaksi. Jangan simpan password mentah, token, secret, connection string, NIK/KK penuh, isi dokumen, riwayat penyakit atau penghasilan di log/snapshot audit tanpa kebutuhan/otorisasi. Error client tidak mengungkap stack/query/secret. Private storage, otorisasi saat preview/unduh, rate limit yang relevan, validasi file dan kontrol upload.

### 5. Batasan teknis tahap ini (mengikat)

- Dilarang `npm run build`, `npm run dev`, `npm run db:generate`, `npm run db:migrate`, `npm run db:init`, `npm run db:seed`, atau perintah ekuivalen; dilarang membuat file migration SQL baru, menjalankan migrasi manual atau mengubah database development/production Neon.
- Dilarang `dotnet build`, `dotnet ef migrations add`, `dotnet ef database update` bila ada komponen lain; project utama Next.js, sehingga tidak perlu perintah .NET.
- Tidak melakukan deployment, commit/push/merge tanpa instruksi terpisah, penghapusan data, perubahan rahasia/environment atau perubahan tidak terkait.
- Perubahan schema TypeScript, kontrak, backend, frontend, test source dan dokumentasi diperbolehkan. `npm run typecheck` hanya bila tersedia dan aman (script `tsc --noEmit`), tanpa build/dev/migrasi; audit script sebelum eksekusi. Jangan menjalankan fixture yang membuat/menerapkan migrasi pada tahap terlarang. Gunakan pemeriksaan statis; jika pengujian murni tanpa database diizinkan, dokumentasikan command dan hasilnya secara tepat.
- Aturan normal repository meminta migrasi ketika schema berubah dan DoD memerlukan typecheck/test/build. Batasan tahap ini menunda gerbang tersebut; jangan mengklaim DoD lulus atau produksi siap. Siapkan DAT dan UAT terpisah setelah izin. Status pekerjaan yang belum memenuhi gerbang menjadi `terblokir`/status sah sesuai repository, dengan bukti source terpisah.

## Reasoning

Laksanakan pekerjaan dalam urutan berikut; berikan ringkasan keputusan desain dan bukti yang dapat ditinjau, bukan analisis tanpa implementasi.

1. Baca aturan dan working tree, identifikasi file existing dan potensi perubahan pengguna. Catat ID serta approval yang memang ada. Buat spesifikasi, task dan kontrak dengan cakupan yang sudah disetujui.
2. Kembangkan schema additive (tanpa file migrasi), tipe data dan DTO. Pastikan constraint, index, FK, relasi keluarga reusable, draft dan status akademik konsisten. Jangan menambah tabel ganda bila entity existing mampu memenuhi kebutuhan.
3. Implementasikan backend dahulu: Zod, authorization, transaction, idempotency, conflict handling, query pagination/projection, private storage, audit. Gunakan Drizzle type-safe (`eq`, `and`, `inArray` dst.), hindari SQL concatenation dan N+1 query.
4. Validasi seluruh kontrak data dan dampak terhadap API existing. Khusus `/api/state`, hindari `select *` setelah kolom sensitif bertambah. Pastikan field yang dibutuhkan keuangan/ujian tetap tersedia tanpa membawa seluruh biodata.
5. Implementasikan frontend tambah/ubah, detail, daftar, dokumen, import/export/cetak dan riwayat sesuai **seluruh wireframe wajib**, memakai base components dan tema existing. Hubungkan ke backend aktual. Loading/error, disabled, permission, mobile dan accessibility bukan opsional.
6. Integrasikan karakteristik dan portal wali existing. Gunakan link yang sah dan review perubahan; jangan menyamakan data keluarga dengan hak portal.
7. Lindungi seluruh rantai integrasi: Master Siswa → Wali → Kelas/Tahun → SPP → Pembayaran/Tunggakan → Kelayakan/Dispensasi → Kartu Ujian/QR → Karakteristik → Portal Wali. Invoice existing tidak berubah karena edit biodata. `ELIGIBLE`/`ELIGIBLE_DISPENSATION` tetap mengikuti aturan server, bukan progres biodata.
8. Tulis test prioritas tinggi dan regresi, lakukan pemeriksaan statis/typecheck yang diizinkan, dokumentasikan command dan hasil aktual. Siapkan UAT untuk staf TU, reviewer dan wali setelah schema/deployment test disetujui. Jangan menyamakan code review dengan uji runtime.
9. Jika schema belum dapat diterapkan, kebijakan mutasi finansial belum disetujui atau permission sensitif belum diputuskan, blokir hanya operasi yang memerlukan keputusan tersebut; kerjakan bagian lain. Jangan membuat fallback dummy atau memaksa perubahan database production.

## Stop conditions

Jangan berhenti pada tahap membaca kode, membuat planning, membuat schema, menambah endpoint saja, membuat satu section, membuat tampilan dummy atau menyusun laporan tanpa perubahan source. Kerjakan seluruh bagian yang dapat dikerjakan sesuai batasan. Berhenti pada gerbang database/build/dev/deploy atau keputusan bisnis yang memang dilarang/belum disetujui, dengan blocker spesifik dan daftar sisa pekerjaan.

### Checklist penerimaan wajib (Agent isi berdasarkan bukti)

- [ ] TGS-010 schema dan relasi additive lengkap, kompatibilitas data existing dirancang, rencana DAT dan konflik duplikasi dicatat.
- [ ] Seluruh 10 section tambah/ubah sesuai wireframe wajib; tidak ada form panjang bertumpuk.
- [ ] Form tambah, ubah dan draft memakai API/DB; submit inti atomik, retry aman dan edit prefill benar.
- [ ] Identitas, NIK/KK/NISN, alamat, registrasi dan validasi kondisional tersedia di backend.
- [ ] Ayah/ibu reusable lintas siswa; wali/kontak dan portal dipisahkan, tidak ada link akses otomatis.
- [ ] Kesehatan dan pengukuran periodik tercatat dengan histori; bantuan tidak mengubah invoice.
- [ ] Dokumen private storage, upload/review/unduh terotorisasi dan kompatibilitas foto legacy.
- [ ] Kelengkapan dihitung server, conditional/NA benar, biodata bukan kelayakan ujian.
- [ ] Karakteristik memakai entity/template existing.
- [ ] Daftar siswa aktual memiliki filter, pagination, indikator, draft terpisah dan aksi sesuai izin.
- [ ] Detail memiliki seluruh tab yang ditentukan dan mempertahankan fitur keuangan/ujian/portal.
- [ ] Import, export, cetak biodata A4 dan ringkasan buku induk mengikuti spesifikasi dan privacy controls.
- [ ] Histori akademik tercatat tanpa bypass guard invoice; permohonan wali ditinjau sebelum diterapkan.
- [ ] RBAC, guardian scoping, projection `/api/state`, masking, audit dan storage security diperiksa.
- [ ] Wireframe desktop/mobile, dialog review dan import/export dipenuhi; tidak ada tombol palsu atau mock.
- [ ] Seluruh TC-01–TC-60 dipetakan ke bukti/test/UAT; status tidak diuji ditulis secara jujur.
- [ ] Tidak menjalankan build, server development, pembuatan/eksekusi migrasi, seed, deployment atau perubahan DB production.
- [ ] Daftar file dan laporan implementasi tersedia; DoD tidak dinyatakan lulus bila gerbang belum dijalankan.

Checklist tidak boleh dicentang hanya karena terdapat rancangan, nama komponen atau dokumen. Setiap bukti harus mengarah pada source nyata atau hasil pengujian yang benar-benar dilakukan.

## Output

### 1. Hasil utama

Perubahan source code backend dan frontend yang benar-benar dikerjakan dalam batasan instruksi. Jangan hanya mengembalikan dokumen planning. Hasil harus dapat diaudit melalui diff, path, simbol, kontrak dan status pengujian aktual.

### 2. Dokumentasi fitur di repository

Gunakan konvensi existing; struktur target berikut dapat disesuaikan jika workflow resmi meminta nama lain. Satu dokumen ini menjadi instruksi induk, bukan pengganti artefak tugas yang harus dihasilkan Agent.

```text
docs/fitur/kelengkapan-master-siswa/
├── 1-riset.md
├── 2-wawancara.md
├── 3-spesifikasi.md
├── 4-urutan-tugas.md
├── 5-skema-database.md
├── 6-kontrak-api.md
├── 7-skema-tampilan.md
├── 8-acceptance-criteria.md
├── 9-skenario-pengujian.md
├── tugas/
│   ├── TGS-010-skema-database-master-siswa.md
│   ├── TGS-011-backend-identitas-registrasi.md
│   ├── TGS-012-backend-orang-tua-wali.md
│   ├── TGS-013-backend-kesehatan-bantuan.md
│   ├── TGS-014-backend-dokumen-siswa.md
│   ├── TGS-015-backend-kelengkapan-biodata.md
│   ├── TGS-016-frontend-form-siswa.md
│   ├── TGS-017-frontend-detail-siswa.md
│   ├── TGS-018-frontend-daftar-siswa.md
│   ├── TGS-019-import-export-cetak.md
│   ├── TGS-020-riwayat-pembaruan-biodata.md
│   └── TGS-021-pengujian-integrasi.md
└── LAPORAN_IMPLEMENTASI_MASTER_SISWA.md
```

`2-wawancara.md` mencatat keputusan pengguna yang benar-benar tersedia, tidak membuat percakapan fiktif. `7-skema-tampilan.md` harus memuat wireframe global desktop/mobile, **10 wireframe section**, detail profil dan isi setiap tab, daftar siswa/draft, modal review/upload dokumen, modal import/export, cetak A4, histori akademik dan pengajuan wali. Catat implementasi final dan alasan jika ada penyimpangan yang diperlukan; jangan menghilangkan field atau aksi diam-diam. Screenshot runtime hanya jika pengujian benar-benar dilakukan pada tahap yang diizinkan.

Setiap task: ID, tujuan, dependensi, status dan riwayat status, daftar file ditambah/diubah, implementasi, acceptance criteria, bukti source (path/simbol/line atau diff), hasil verifikasi, blocker dan keputusan yang diperlukan. Catat `.development-history/` mengikuti aturan `/laporan`. Jangan memalsukan status selesai atau menutup tiket yang belum memenuhi DoD.

### 3. Laporan akhir Agent

Buat `LAPORAN_IMPLEMENTASI_MASTER_SISWA.md` yang memuat:

1. Executive summary dan baseline working tree.
2. Cakupan aktual vs planning.
3. Status dan bukti setiap TGS-010–TGS-021 (atau ID pemetaan aktual).
4. Perubahan schema dan diagram entity/relasi; compatibility serta rencana DAT yang belum dilakukan.
5. Endpoint aktual, request/response/error, authorization dan idempotency.
6. Backend dan frontend yang berubah, daftar path/simbol/diff.
7. Matriks skema tampilan wajib vs implementasi, termasuk seluruh section, detail, list, modal dan cetak.
8. Integrasi SPP, pembayaran, dispensasi, kartu ujian, karakteristik dan portal wali.
9. Security/RBAC, perlindungan file dan data sensitif.
10. Checklist acceptance criteria dan bukti setiap item.
11. Test matrix TC-01–TC-60: expected, actual, command, hasil dan bukti (jika dijalankan).
12. Pemeriksaan statis/typecheck yang diizinkan, blocker, gerbang yang belum terpenuhi.
13. Rencana UAT manual per role setelah database dan runtime diizinkan.
14. Kesimpulan: perubahan source, kesiapan runtime yang sebenarnya, pekerjaan tersisa dan keputusan yang diperlukan.

Label bukti laporan: `IMPLEMENTED_IN_SOURCE`, `VERIFIED_STATIC`, `PASSED`, `FAILED`, `NOT_TESTED`, `BLOCKED_SCHEMA`, `BLOCKED_POLICY` (sesuaikan dengan kebutuhan). Label bukti bukan pengganti status tiket resmi. Jangan membuat persentase progres tanpa penyebut dan bukti yang sah. Jangan mengatakan migrasi, build, test atau deployment berhasil jika tidak dikerjakan.

**Mulai implementasi sekarang. Kerjakan backend terlebih dahulu, lalu frontend sesuai skema tampilan wajib, integrasi, verifikasi yang diizinkan dan laporan. Jangan berhenti pada analisis atau planning ulang.**
