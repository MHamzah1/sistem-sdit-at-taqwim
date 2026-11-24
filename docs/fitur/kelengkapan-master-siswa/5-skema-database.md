# 5. Skema Database Target — Master Siswa SDIT AT-TAQWIM

## 1. Perubahan Additive pada Tabel `students`
```sql
ALTER TABLE students
  ADD COLUMN nickname text,
  ADD COLUMN nik text,
  ADD COLUMN family_card_number text,
  ADD COLUMN birth_certificate_number text,
  ADD COLUMN religion text,
  ADD COLUMN citizenship text DEFAULT 'WNI',
  ADD COLUMN birth_order integer,
  ADD COLUMN sibling_count integer,
  ADD COLUMN daily_language text,
  ADD COLUMN student_status text DEFAULT 'ACTIVE';
```

## 2. Entitas Baru

### A. `student_addresses`
Menyimpan alamat KK dan domisili siswa secara terpisah.
- `id` (uuid, PK)
- `student_id` (uuid, FK ke `students.id`)
- `address_type` (text: 'IDENTITY' atau 'DOMICILE')
- `address` (text)
- `rt` (text)
- `rw` (text)
- `hamlet` (text - dusun/lingkungan)
- `province` (text)
- `regency` (text - kabupaten/kota)
- `district` (text - kecamatan)
- `village` (text - kelurahan/desa)
- `postal_code` (text)
- `residence_type` (text - bersama ortu, wali, asrama, dll)
- `transportation_type` (text - jalan kaki, motor, mobil, antar jemput, dll)
- `distance_to_school` (numeric / integer - dalam km)
- `travel_time_minutes` (integer - dalam menit)
- `created_at`, `updated_at`

### B. `family_members`
Master individu ayah, ibu, wali yang dapat dipakai ulang lintas saudara.
- `id` (uuid, PK)
- `full_name` (text, NOT NULL)
- `nik` (text, nullable)
- `birth_place` (text)
- `birth_date` (date)
- `birth_year` (integer)
- `life_status` (text: 'ALIVE', 'DECEASED', 'UNKNOWN')
- `education` (text: 'SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'S3', dll)
- `occupation` (text: 'PNS', 'KARYAWAN_SWASTA', 'WIRASWASTA', dll)
- `institution_name` (text)
- `monthly_income_range` (text)
- `phone` (text)
- `email` (text)
- `address` (text)
- `created_at`, `updated_at`

### C. `student_family_members`
Relasi m:n antara siswa dan individu keluarga.
- `id` (uuid, PK)
- `student_id` (uuid, FK ke `students.id`)
- `family_member_id` (uuid, FK ke `family_members.id`)
- `relationship_type` (text: 'FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER', 'UNCLE', 'AUNT', 'OTHER_GUARDIAN')
- `is_primary_contact` (boolean DEFAULT false)
- `is_payment_responsible` (boolean DEFAULT false)
- `is_emergency_contact` (boolean DEFAULT false)
- `created_at`, `updated_at`

### D. `student_enrollments`
Riwayat registrasi dan mutasi akademik siswa.
- `id` (uuid, PK)
- `student_id` (uuid, FK ke `students.id`)
- `registration_number` (text)
- `registration_type` (text: 'NEW_STUDENT', 'TRANSFER_STUDENT')
- `registration_date` (date)
- `accepted_date` (date)
- `enrollment_date` (date)
- `academic_year_id` (uuid, FK ke `academic_years.id`)
- `class_id` (uuid, FK ke `classes.id`)
- `entry_grade` (integer: 1-6)
- `attended_paud` (boolean)
- `attended_kindergarten` (boolean)
- `previous_school_name` (text)
- `previous_school_npsn` (text)
- `previous_school_address` (text)
- `enrollment_status` (text: 'ACTIVE', 'PROMOTED', 'TRANSFERRED_OUT', 'GRADUATED', 'WITHDRAWN')
- `effective_start_date` (date)
- `effective_end_date` (date)
- `notes` (text)
- `created_at`, `updated_at`

### E. `student_health_profiles`
Data medis dan kebutuhan khusus.
- `id` (uuid, PK)
- `student_id` (uuid, FK ke `students.id`, UNIQUE)
- `blood_type` (text: 'A', 'B', 'AB', 'O', 'UNKNOWN')
- `medical_history` (text)
- `food_allergies` (text)
- `drug_allergies` (text)
- `has_special_needs` (boolean DEFAULT false)
- `special_needs_types` (jsonb / text)
- `routine_medication` (text)
- `emergency_handling_notes` (text)
- `assistance_needs` (text)
- `notes` (text)
- `created_at`, `updated_at`

### F. `student_periodic_data`
Riwayat pengukuran fisik berkala.
- `id` (uuid, PK)
- `student_id` (uuid, FK ke `students.id`)
- `academic_year_id` (uuid, FK ke `academic_years.id`)
- `semester` (integer: 1 atau 2)
- `measurement_date` (date)
- `height_cm` (integer / numeric)
- `weight_kg` (numeric)
- `notes` (text)
- `recorded_by` (uuid, FK ke `users.id`)
- `created_at`, `updated_at`

### G. `student_aid_records`
Catatan bantuan pendidikan (KIP, PIP, dsb).
- `id` (uuid, PK)
- `student_id` (uuid, FK ke `students.id`)
- `aid_type` (text: 'KIP', 'PIP', 'PKH', 'KKS', 'BEASISWA_INTERNAL', 'BEASISWA_EKSTERNAL', 'OTHER')
- `aid_number` (text)
- `aid_source` (text)
- `start_date` (date)
- `end_date` (date)
- `status` (text: 'ACTIVE', 'EXPIRED', 'PROPOSED')
- `notes` (text)
- `supporting_document_id` (uuid, nullable)
- `created_at`, `updated_at`

### H. `student_documents`
Metadata berkas dokumen siswa di private Vercel Blob.
- `id` (uuid, PK)
- `student_id` (uuid, FK ke `students.id`)
- `document_type` (text: 'KK', 'AKTA_KELAHIRAN', 'KTP_AYAH', 'KTP_IBU', 'KTP_WALI', 'PAS_FOTO', 'IJAZAH_TK', 'RAPOR_ASAL', 'SURAT_PINDAH', 'BUKTI_BANTUAN', 'LAINNYA')
- `document_name` (text)
- `document_number` (text)
- `storage_path` (text, NOT NULL)
- `original_filename` (text, NOT NULL)
- `mime_type` (text, NOT NULL)
- `file_size` (integer, NOT NULL)
- `verification_status` (text: 'PENDING', 'VERIFIED', 'REJECTED')
- `verified_by` (uuid, FK ke `users.id`, nullable)
- `verified_at` (timestamp, nullable)
- `rejection_reason` (text, nullable)
- `uploaded_by` (uuid, FK ke `users.id`)
- `created_at`, `updated_at`

### I. `student_drafts`
Penyimpanan draft pendaftaran sementara.
- `id` (uuid, PK)
- `user_id` (uuid, FK ke `users.id`)
- `data` (jsonb, NOT NULL)
- `status` (text: 'DRAFT', 'FINALIZED')
- `revision` (integer DEFAULT 1)
- `final_student_id` (uuid, nullable)
- `created_at`, `updated_at`

### J. `student_profile_change_requests`
Usulan revisi biodata dari wali murid melalui portal.
- `id` (uuid, PK)
- `student_id` (uuid, FK ke `students.id`)
- `requested_by` (uuid, FK ke `users.id`)
- `patch` (jsonb, NOT NULL)
- `status` (text: 'SUBMITTED', 'APPROVED', 'REJECTED')
- `revision` (integer DEFAULT 1)
- `reviewer_id` (uuid, FK ke `users.id`, nullable)
- `rejection_reason` (text, nullable)
- `reviewed_at` (timestamp, nullable)
- `created_at`, `updated_at`
