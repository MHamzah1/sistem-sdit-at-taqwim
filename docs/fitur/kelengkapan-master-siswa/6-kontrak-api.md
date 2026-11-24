# 6. Kontrak API — Master Siswa SDIT AT-TAQWIM

Seluruh endpoint terintegrasi di route handler Next.js dengan prefix `/api/`.

## 1. Daftar Endpoint Utama

| Metode | Path | Hak Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/students/list` | `read` | Daftar siswa terpaginasi + search + filter + ringkasan kelengkapan |
| `GET` | `/api/students/:id/profile` | `read` (guardian-scoped) | Detail lengkap 10 section siswa berizin |
| `POST` | `/api/students/profile` | `master` | Tambah siswa baru atomik (biodata, alamat, keluarga, registrasi) |
| `PATCH` | `/api/students/:id/profile` | `master` | Ubah biodata siswa atomik |
| `POST` | `/api/student-drafts` | `master` | Simpan draft pendaftaran baru |
| `GET` | `/api/student-drafts` | `master` | Ambil daftar draft pengguna aktif |
| `GET` | `/api/student-drafts/:id` | `master` | Ambil detail satu draft |
| `PATCH` | `/api/student-drafts/:id` | `master` | Simpan ulang / update draft |
| `DELETE` | `/api/student-drafts/:id` | `master` | Hapus draft |
| `POST` | `/api/student-drafts/:id/finalize` | `master` | Finalisasi draft menjadi record siswa resmi |
| `GET` | `/api/family-members/search` | `master` | Pencarian individu keluarga existing (nama/NIK/HP tersamarkan) |
| `GET` | `/api/students/:id/health` | `read` / khusus | Ambil profil kesehatan siswa |
| `PUT` | `/api/students/:id/health` | `master` | Simpan/ubah profil kesehatan siswa |
| `GET` | `/api/students/:id/measurements` | `read` / khusus | Riwayat pengukuran fisik berkala |
| `POST` | `/api/students/:id/measurements` | `master` | Tambah catatan pengukuran baru |
| `GET` | `/api/students/:id/aid` | `read` | Riwayat bantuan pendidikan siswa |
| `POST` | `/api/students/:id/aid` | `master` | Tambah catatan bantuan baru |
| `GET` | `/api/students/:id/documents` | `read` | Checklist dan metadata dokumen siswa |
| `POST` | `/api/student-documents/upload` | `read` / `master` | Dapatkan token upload private Blob untuk dokumen |
| `POST` | `/api/students/:id/documents` | `master` / guardian | Registrasi metadata dokumen yang telah terunggah |
| `GET` | `/api/student-documents/:id/content` | `read` | Preview / unduh file dokumen terotorisasi |
| `POST` | `/api/student-documents/:id/review` | `master` | Verifikasi (`VERIFIED`) atau tolak (`REJECTED`) dokumen |
| `GET` | `/api/students/:id/completeness` | `read` | Status kelengkapan per-section (pembilang/penyebut, %) |
| `GET` | `/api/students/:id/enrollments` | `read` | Riwayat mutasi/penempatan akademik |
| `POST` | `/api/students/:id/enrollment-changes` | `master` | Catat mutasi akademik (dengan guard invoice) |
| `POST` | `/api/students/:id/change-requests` | `guardian` | Wali mengajukan pembaruan biodata anak |
| `GET` | `/api/student-change-requests` | `master` | Antrean review usulan revisi wali |
| `POST` | `/api/student-change-requests/:id/review` | `master` | Setujui atau tolak usulan wali |
| `POST` | `/api/students/import/preview` | `master` | Parsing & preview validasi baris file Excel (XLSX) |
| `POST` | `/api/students/import/commit` | `master` | Eksekusi import data siswa yang telah tervalidasi |
| `POST` | `/api/students/export` | `read` | Export data siswa terfilter ke format XLSX |

## 2. Struktur Payload Contoh

### A. POST `/api/students/profile` (Create Atomik)
```json
{
  "student": {
    "name": "Ahmad Fauzi",
    "nickname": "Fauzi",
    "nis": "2026001",
    "nisn": "0123456789",
    "nik": "3201011205160001",
    "familyCardNumber": "3201011205160002",
    "birthCertificateNumber": "12345/DIS/2016",
    "gender": "L",
    "birthPlace": "Bogor",
    "birthDate": "2016-05-12",
    "photoUrl": null,
    "religion": "Islam",
    "citizenship": "WNI",
    "birthOrder": 1,
    "siblingCount": 2,
    "dailyLanguage": "Indonesia",
    "classId": "c4b4a3...",
    "enrolledOn": "2026-07-15",
    "studentStatus": "ACTIVE"
  },
  "addresses": {
    "identity": {
      "address": "Jl. Raya Ciampea No. 12",
      "rt": "02",
      "rw": "05",
      "hamlet": "Dusun I",
      "village": "Benteng",
      "district": "Ciampea",
      "regency": "Kab. Bogor",
      "province": "Jawa Barat",
      "postalCode": "16620",
      "residenceType": "BERSAMA_ORANG_TUA",
      "transportationType": "SEPEDA_MOTOR",
      "distanceToSchool": 2.5,
      "travelTimeMinutes": 15
    },
    "sameAsIdentity": true
  },
  "registration": {
    "registrationNumber": "REG-2026-001",
    "registrationType": "NEW_STUDENT",
    "registrationDate": "2026-05-10",
    "acceptedDate": "2026-06-01",
    "entryGrade": 1,
    "attendedPaud": true,
    "attendedKindergarten": true,
    "previousSchoolName": "TK Islam Terpadu Al-Ikhlas"
  },
  "family": {
    "father": {
      "mode": "new",
      "data": {
        "fullName": "Budi Santoso",
        "nik": "3201010101800001",
        "phone": "081234567890",
        "education": "S1",
        "occupation": "KARYAWAN_SWASTA",
        "monthlyIncomeRange": "RP_5_JT_SD_20_JT"
      }
    },
    "mother": {
      "mode": "new",
      "data": {
        "fullName": "Siti Aminah",
        "nik": "3201010101820002",
        "phone": "081298765432",
        "education": "D3",
        "occupation": "IBU_RUMAH_TANGGA"
      }
    },
    "primaryContact": "FATHER",
    "paymentResponsible": "FATHER",
    "emergencyContact": {
      "name": "Budi Santoso",
      "relationship": "AYAH_KANDUNG",
      "phone": "081234567890"
    }
  }
}
```
