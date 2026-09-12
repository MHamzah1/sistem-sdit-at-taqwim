# API

Semua endpoint berawalan `/api`. Selain health, login, dan callback Blob yang ditandatangani provider, endpoint memerlukan cookie sesi. Request mutasi JSON memerlukan origin sesuai `APP_ORIGIN`. Status umum: 200/201, 400, 401, 403, 404, 409, 413, 416, 422, 429, 503. Error tidak menyertakan query, connection string, atau stack trace.

| Endpoint | Method | Akses / perilaku |
| --- | --- | --- |
| `/health` | GET | Query PostgreSQL dan schema users; 503 jika unavailable |
| `/auth/login` | POST | email/password; scrypt; limit account/IP; cookie 8 jam |
| `/auth/me` | GET | Profil, role, permission tanpa password hash |
| `/auth/logout` | POST | Revoke sesi di database |
| `/auth/password` | POST | currentPassword/newPassword; revoke seluruh sesi user |
| `/state` | GET | Snapshot UI; guardian-scoped; audit hanya permission audit |
| `/students`, `/guardians`, `/classes`, `/academic-years`, `/spp/config`, `/exams` | GET, POST | List berhalaman / create; write master atau finance |
| Resource di atas `/:id` | PATCH, DELETE | Update penuh tervalidasi / delete dengan foreign key protection |
| `/exam-types` | POST | Buat jenis ujian |
| `/users` | POST | SUPER_ADMIN membuat akun dengan role yang tersedia |
| `/guardian-students` | POST, DELETE | Master data menghubungkan/melepas relasi guardianId/studentId |
| `/invoices` | GET | List invoice, scoped untuk wali |
| `/invoices/generate` | POST | Finance; academicYearId, month (`YYYY-MM-01`) |
| `/payments` | GET, POST | List / pembayaran; guardian hanya TRANSFER |
| `/payments/:id/approve`, `/payments/:id/reject` | POST | Finance; reason; hanya dari PENDING_VERIFICATION |
| `/exams/:id/eligibility` | POST | studentId; ownership dicek; transaksi evaluasi aktual |
| `/dispensations` | GET, POST | studentId, examPeriodId, reason, amount, promisedOn |
| `/dispensations/:id/review` | POST | Finance; notes; SUBMITTED → REVIEWED |
| `/dispensations/:id/approve`, `/dispensations/:id/reject` | POST | Principal; notes; REVIEWED → APPROVED/REJECTED |
| `/exam-cards` | POST | studentId/examPeriodId; evaluasi ulang dan izin download |
| `/exam-cards/:code/validate` | GET | Staff terautentikasi; evaluasi ulang, QR bukan akses data publik |
| `/files/upload` | POST | SDK Blob token; sesi/CSRF; signed callback provider |
| `/files` | POST | pathname; ownership, metadata, MIME, size, magic bytes; returns proof id |
| `/files/:id` | GET | File private; Range maksimal 2 MB per response |
| `/forms` | POST | Master; name, deadline, fields[{label,required}] |
| `/form-submissions` | POST | templateId, studentId, answers[{fieldId,value}]; ownership |
| `/settings` | POST | Admin; schoolName/phone; audit SETTING_CHANGED |
| `/students/:id/reminder?examId=…` | GET | Finance; membentuk link WhatsApp aktual, tidak mengirim pesan otomatis |
| `/reports/spp`, `/reports/payments`, `/reports/eligibility` | GET | List berhalaman, scoped untuk wali |
| `/audit-logs?page=…` | GET | Audit permission; before/after/IP/user agent; 50 per batch |

List REST menerima `page` mulai 1, ukuran halaman 50. Snapshot UI `/state` saat ini memuat data scoped seluruh sekolah; tabel frontend melakukan filter/pagination 15 baris. Snapshot perlu dipecah menjadi query server per layar jika volume histori membuat payload mendekati batas Function. Ini batas skalabilitas yang belum diuji dengan dataset besar.

## Pembayaran

```json
{
  "studentId": "UUID",
  "invoiceIds": ["UUID"],
  "method": "CASH",
  "paidOn": "YYYY-MM-DD",
  "notes": "Catatan opsional",
  "idempotencyKey": "UUID unik per upaya pembayaran"
}
```

TRANSFER wajib menambahkan `proofId` yang diperoleh dari `/files`. Amount tidak diterima dari client; dihitung dari invoice. Satu invoice dilunasi penuh. Transaksi mengunci siswa dan invoice, menyimpan payment/items, memperbarui invoice, mengevaluasi ujian, dan menulis audit. Retry key yang sama mengembalikan pembayaran semula; payload berbeda ditolak. Approval yang diulang menghasilkan 409.

## Keamanan

Session token acak disimpan sebagai HMAC dengan AUTH_SECRET di PostgreSQL. Cookie HttpOnly, SameSite=Lax, Secure di production, expiry 8 jam. Password scrypt dengan salt unik. Permission dibaca dari relasi database pada setiap request. Wali dibatasi melalui guardian_students di API, termasuk file/kartu/form/pembayaran. Blob private memakai token upload terbatas path user, MIME, 5 MB, expiry 5 menit; 20 token per user per jam. File tidak disimpan Base64/binary di database.
