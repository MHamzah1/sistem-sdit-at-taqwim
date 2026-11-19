# Spesifikasi: Format Nomor Peserta Ujian & Cetak Massal Kartu Ujian

**Slug:** `nomor-peserta-dan-cetak-massal-kartu` · **Dibuat:** 2026-11-19 · **Sumber keputusan:** [2-wawancara.md](2-wawancara.md)

---

## Masalah

1. **Ketiadaan Nomor Peserta Resmi:** Pada kartu peserta ujian yang ada saat ini, hanya tertera NIS siswa dan kode UUID verifikasi acak (`verificationCode: 3fa85f64-...`). Panitia ujian dan pengawas ruang kesulitan mengatur denah tempat duduk dan nomor meja siswa karena tidak memiliki nomor peserta terstruktur seperti format standar PRD (`UAS26-05A-001`).
2. **Proses Cetak Satu per Satu yang Merepotkan:** Menjelang pelaksanaan ujian (UTS/UAS), staf Tata Usaha harus mengklik tombol "Kartu" satu per satu untuk ratusan siswa di tabel untuk mencetak kartu. Tidak adanya fitur cetak massal per rombel kelas atau seluruh siswa layak sangat membuang waktu panitia ujian sekolah.

---

## Tujuan

1. Menyediakan generator format Nomor Peserta Ujian otomatis dan teratur (`[Singkatan Ujian][2 Digit Tahun]-[Kelas]-[Nomor Urut 3 Digit]`, contoh: `PTS26-1A-001`) yang tersaji jelas pada setiap kartu ujian.
2. Menyediakan fitur Cetak Massal Kartu Ujian (*Batch Exam Cards Print*) untuk 1 kelas atau seluruh siswa layak sekaligus, dengan lembar cetak standar A4 berisi 2 kartu per lembar lengkap dengan garis putus-putus untuk gunting pemotong dan kode QR validasi.

---

## Latar Belakang

Dokumen PRD Bagian 18 FR-CARD-001, FR-CARD-003, dan FR-CARD-004 secara eksplisit mensyaratkan pencetakan kartu ujian ber-nomor peserta dan mendukung mode cetak perorangan, per kelas, maupun seluruh siswa layak. Sistem kelayakan (*Eligibility Engine*) yang sudah berjalan dapat diintegrasikan dengan pembuat kartu massal sehingga hanya siswa yang sah (*Lunas* atau *Dispensasi*) yang tercetak kartunya.

---

## Definition of Done

- [ ] Fungsi generator nomor peserta `examParticipantNumber()` tersedia di `src/data.ts` menghasilkan format `[Kode][Tahun]-[Kelas]-[Urutan]`, misal `PTS26-1A-001` berdasarkan urutan abjad siswa di kelas.
- [ ] Kartu ujian individual di modal pratinjau menampilkan Nomor Peserta resmi secara jelas.
- [ ] Endpoint `POST /api/exam-cards/bulk` tersedia di `server/app.ts` untuk memproses pembuatan kartu massal bagi seluruh siswa layak dalam satu kelas atau satu periode ujian secara idempoten.
- [ ] Daftar `examCards` termuat di `AppState` (`server/state.ts`) dengan proteksi hak akses.
- [ ] Terdapat tombol aksi `"Cetak Massal Kartu"` di halaman menu Ujian Kartu (`/ujian/kartu`) dengan opsi: *Per Kelas* atau *Semua Siswa Layak*.
- [ ] Modal pratinjau lembar cetak massal (`.bulk-cards-sheet`) menampilkan daftar kartu siswa layak (2 kartu per halaman A4) dengan kode QR yang ter-render sempurna dan garis pemotong.
- [ ] Siswa yang berstatus belum layak (`NOT_ELIGIBLE`) secara otomatis dilewati dari pencetakan massal disertai pemberitahuan ringkasan jumlah yang dicetak.
- [ ] Gaya cetak `@media print` menata lembar cetak massal rapi tanpa terpotong elemen antarmuka aplikasi web.
- [ ] Seluruh unit/integration test suite (`npm test`) dan typecheck (`npm run typecheck`) lulus 100%.

---

## Scope

1. **Backend Endpoint & State:**
   - Menambahkan query `examCards` pada `readState()` di `server/state.ts` (ter-scope untuk wali murid).
   - Menambahkan rute handler `POST /api/exam-cards/bulk` di `server/app.ts` yang menerima `{ examPeriodId, classId? }` dan menghasilkan kartu bagi seluruh siswa berstatus `ELIGIBLE` atau `ELIGIBLE_DISPENSATION`.
2. **Helper Data:**
   - Menambahkan fungsi `examParticipantNumber(examName, yearName, className, studentName, classStudents)` di `src/data.ts`.
3. **Komponen Antarmuka (UI):**
   - Pembaruan tampilan kartu ujian individual dengan label Nomor Peserta.
   - Tombol "Cetak Massal" dan modal lembar cetak massal multi-kartu (`BulkCardsModal`) di `src/main.tsx`.
   - Notifikasi ringkasan (misal: *"18 kartu kelas 1A siap dicetak. 2 siswa belum layak dilewati."*).
4. **Styling Lembar Cetak:**
   - Pengaturan CSS `.bulk-cards-sheet`, `.bulk-card-item`, dan garis potong di `src/production.css` serta penyesuaian `@media print`.

---

## Di Luar Scope

1. Integrasi mesin cetak kartu PVC plastik otomatis (cetak berbasis kertas A4 / HVS / karton tebal standar printer sekolah).
2. Cetak kartu untuk siswa yang belum layak (pelanggaran aturan BR-009).

---

## Pengguna & User Story

- **US-1 (Panitia Ujian / TU):** Sebagai panitia ujian sekolah, saya ingin mencetak seluruh kartu ujian untuk satu kelas sekaligus agar saya dapat membagikannya kepada wali kelas/pengawas dalam hitungan menit.
- **US-2 (Pengawas Ruang Ujian):** Sebagai pengawas ujian, saya ingin melihat nomor peserta teratur (misal: `PTS26-1A-001`) pada kartu siswa agar saya dapat mencocokkan nomor meja dan daftar hadir ujian dengan cepat.
- **US-3 (Siswa & Wali Murid):** Sebagai wali murid, saya ingin melihat nomor peserta ujian resmi pada kartu ujian anak saya.

---

## Kebutuhan Fungsional

### UI (Antarmuka)
- **KF-1:** Tampilan kartu individual menampilkan baris "Nomor Peserta: [Nomor]".
- **KF-2:** Tombol "Cetak Massal" di `/ujian/kartu` membuka pilihan cetak per kelas atau semua siswa layak.
- **KF-3:** Modal lembar cetak massal merender kartu-kartu siswa layak dalam tata letak 2 kartu per lembar A4 dengan garis putus-putus pembatas.
- **KF-4:** Setiap kartu dalam lembar cetak massal memiliki kode QR validasi yang dapat dipindai langsung.

### API & Logika Bisnis
- **KF-5:** Endpoint `POST /api/exam-cards/bulk` memvalidasi kelayakan setiap siswa di kelas/periode ujian, membuat `exam_cards` jika belum ada secara idempoten, dan mengembalikan kartu yang berstatus layak.
- **KF-6:** Siswa non-aktif atau berstatus `NOT_ELIGIBLE` tidak dibuatkan kartu dan tidak disertakan dalam dokumen cetak massal.
- **KF-7:** Penomoran peserta menghitung urutan abjad siswa secara konsisten di rombel kelasnya.

### Otorisasi & Keamanan
- **KF-8:** Pemanggilan cetak massal hanya dapat dilakukan oleh staf sekolah yang memiliki hak akses `principal` atau `master` (Super Admin, TU, Kepsek).
- **KF-9:** Wali murid tidak memiliki akses ke fitur cetak massal, tetapi nomor peserta tetap muncul pada kartu individual anaknya.

---

## Kebutuhan Non-Fungsional

- **KNF-1 (Performa Rendering):** Pratinjau lembar cetak massal untuk 30 siswa satu kelas ter-render dalam waktu < 1 detik.
- **KNF-2 (Kualitas Cetak):** Ukuran kartu proporsional untuk plastik name tag B2/B3 (~105 x 148 mm) dengan resolusi QR code yang tajam.

---

## Keputusan Terkunci

1. **KT-1 (Format Nomor):** `[Singkatan Ujian][2 Digit Tahun]-[Kelas]-[Urutan 3 Digit]`.
2. **KT-2 (Dasar Urutan):** Alfabetis (A–Z) nama siswa di kelas terkait.
3. **KT-3 (Penyimpanan):** Dihitung secara deterministik oleh helper runtime.
4. **KT-4 (Tata Letak):** 2 Kartu per lembar halaman A4 dengan garis potong.
5. **KT-5 (Penyaringan Kelayakan):** Siswa belum layak secara otomatis dilewati saat cetak massal.

---

## Kesiapan Data

- Tidak memerlukan penambahan tabel atau kolom baru di database PostgreSQL (`DAT-NNN` tidak diperlukan). Menggunakan tabel `exam_cards`, `exam_periods`, `exam_types`, `students`, `classes`, dan `academic_years`.

---

## Pertanyaan Terbuka

- Tidak ada pertanyaan terbuka yang memblokir.

---

## Modul yang Diubah

1. `server/state.ts`: Menambahkan query data `examCards` ke `AppState`.
2. `server/app.ts`: Menambahkan endpoint batch `POST /api/exam-cards/bulk`.
3. `src/data.ts`: Menambahkan helper generator `examParticipantNumber()`.
4. `src/main.tsx`: Integrasi nomor peserta pada kartu individual, tombol cetak massal, dan modal `BulkCardsModal`.
5. `src/production.css`: Styling lembar cetak massal `.bulk-cards-sheet` dan aturan `@media print`.
6. `tests/business.test.ts`: Uji generator nomor peserta dan endpoint `exam-cards/bulk`.

---

## Risiko

- **Beban Generate QR Code:** Rendering puluhan QR code sekaligus di browser bisa lambat jika tidak dioptimasi.  
  *Mitigasi:* Menggunakan batch `Promise.all(cards.map(c => QRCode.toDataURL(...)))` yang efisien.

---

## Ukuran Keberhasilan

1. Staf TU dapat mencetak seluruh kartu ujian satu kelas layak dalam satu kali klik cetak.
2. Setiap kartu ujian memuat nomor peserta rapi berformat `PTS26-1A-001` dan dapat divalidasi live via scanner QR.
3. Test suite (`npm test`) dan build produksi Next.js tetap 100% lulus.
