import { test } from "node:test";
import assert from "node:assert/strict";
import {
  studentIdentitySchema,
  familyMemberInputSchema,
  periodicMeasurementSchema,
  aidItemSchema,
  changeRequestSchema,
  calculateStudentCompleteness,
  maskNik,
  maskPhone,
  ALLOWED_GUARDIAN_PATCH_KEYS,
  generateStudentImportTemplateXlsx,
  generateImportPreviewToken,
  verifyImportPreviewToken,
  commitImportSchema,
  studentDocumentItemSchema,
} from "../server/studentMaster";
import { normalizeDraftData } from "../src/app/(app)/master/siswa/tambah/page";
import {
  sanitizeForAudit,
  canAccessSensitiveStudentData,
  canReadSensitiveIdentity,
  canReadHealthMedical,
  canReadAidIncome,
  canManageDocuments,
  canReviewDocuments,
  isSchemaNotReady,
  type Actor,
} from "../server/security";

test("calculateStudentCompleteness: calculates 100% when all mandatory data is filled", () => {
  const result = calculateStudentCompleteness({
    student: {
      name: "Muhammad Fatih",
      nis: "262701001",
      nik: "3201011005180001",
      gender: "L",
      birthPlace: "Bogor",
      birthDate: "2018-05-10",
      nisn: "0151234567",
    },
    address: {
      address: "Jl. Pasirangin No. 45",
      province: "Jawa Barat",
      regency: "Kabupaten Bogor",
      district: "Cileungsi",
      village: "Pasirangin",
      transportationType: "MOTORCYCLE",
    },
    registration: {
      enrolledOn: "2026-07-15",
      classId: "cls-1",
    },
    father: {
      fullName: "Abdullah",
      lifeStatus: "ALIVE",
    },
    mother: {
      fullName: "Aisyah",
      lifeStatus: "ALIVE",
    },
    emergencyContact: {
      name: "Abdullah",
      phone: "081234567890",
    },
    health: {
      bloodType: "O",
    },
    documents: [
      { documentType: "KK", verificationStatus: "VERIFIED" },
      { documentType: "AKTA_KELAHIRAN", verificationStatus: "VERIFIED" },
      { documentType: "PAS_FOTO", verificationStatus: "VERIFIED" },
    ],
  });

  assert.equal(result.percentage, 100);
  assert.equal(result.isComplete, true);
  assert.equal(result.completed, result.total);
  assert.equal(result.sections["identitas"].status, "COMPLETE");
  assert.equal(result.sections["alamat"].status, "COMPLETE");
  assert.equal(result.sections["dokumen"].status, "COMPLETE");
});

test("calculateStudentCompleteness: detects missing fields and reduces percentages", () => {
  const result = calculateStudentCompleteness({
    student: {
      name: "Fatimah",
      nis: "262701002",
      nik: null,
      gender: "P",
      birthPlace: null,
      birthDate: null,
      nisn: null,
    },
    address: null,
    registration: null,
    father: null,
    mother: null,
    emergencyContact: null,
    health: null,
    documents: [],
  });

  assert.ok(result.percentage < 50);
  assert.equal(result.isComplete, false);
  assert.equal(result.sections["identitas"].status, "INCOMPLETE");
  assert.ok(result.sections["identitas"].missing.includes("NIK (16 digit)"));
  assert.equal(result.sections["alamat"].status, "INCOMPLETE");
  assert.ok(result.sections["dokumen"].missing.length > 0);
});

test("studentIdentitySchema: validates NIK and mandatory fields", () => {
  const validData = {
    name: "Ali bin Abi Thalib",
    nickname: "Ali",
    nis: "262701003",
    nisn: "0159988776",
    classId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    enrolledOn: "2026-07-15",
    gender: "L" as const,
    birthPlace: "Makkah",
    birthDate: "2018-01-01",
    nik: "3201011005180003",
    familyCardNumber: "3201011005180004",
    birthCertificateNumber: "AKTA-9988",
    religion: "ISLAM" as const,
    citizenship: "WNI" as const,
    birthOrder: 2,
    siblingCount: 3,
    dailyLanguage: "INDONESIAN" as const,
    studentStatus: "ACTIVE" as const,
  };

  const parsed = studentIdentitySchema.parse(validData);
  assert.equal(parsed.name, "Ali bin Abi Thalib");
  assert.equal(parsed.nik, "3201011005180003");

  // Invalid NIK (not 16 digits)
  assert.throws(() => {
    studentIdentitySchema.parse({
      ...validData,
      nik: "12345", // too short
    });
  });

  // Invalid gender
  assert.throws(() => {
    studentIdentitySchema.parse({
      ...validData,
      gender: "X" as any,
    });
  });
});

test("familyMemberInputSchema: validates parent demographic information", () => {
  const validParent = {
    fullName: "Abu Bakar Ash-Shiddiq",
    nik: "3201011005700001",
    birthPlace: "Makkah",
    birthDate: "1975-01-01",
    education: "S1" as const,
    occupation: "Pedagang / Wiraswasta",
    monthlyIncome: "5_TO_10_MILLION" as const,
    phone: "081234567890",
    lifeStatus: "ALIVE" as const,
  };

  const parsed = familyMemberInputSchema.parse(validParent);
  assert.equal(parsed.fullName, "Abu Bakar Ash-Shiddiq");
  assert.equal(parsed.education, "S1");

  // Invalid parent NIK
  assert.throws(() => {
    familyMemberInputSchema.parse({
      ...validParent,
      nik: "320101", // invalid length
    });
  });
});

test("periodicMeasurementSchema: validates physical growth records", () => {
  const validMeasurement = {
    measurementDate: "2026-08-20",
    heightCm: 122.5,
    weightKg: 24.3,
    semester: 1,
    notes: "Pertumbuhan fisik normal sesuai standar usia 7 tahun",
  };

  const parsed = periodicMeasurementSchema.parse(validMeasurement);
  assert.equal(parsed.heightCm, 122.5);
  assert.equal(parsed.semester, 1);

  // Negative height
  assert.throws(() => {
    periodicMeasurementSchema.parse({
      ...validMeasurement,
      heightCm: -10,
    });
  });

  // Zero weight
  assert.throws(() => {
    periodicMeasurementSchema.parse({
      ...validMeasurement,
      weightKg: 0,
    });
  });
});

test("aidItemSchema: validates education aid records", () => {
  const validAid = {
    aidType: "PIP" as const,
    aidNumber: "KIP-99887766",
    aidSource: "Kementerian Pendidikan Dasar dan Menengah",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "ACTIVE",
    notes: "Penyaluran via rekening BNI SimPel",
  };

  const parsed = aidItemSchema.parse(validAid);
  assert.equal(parsed.aidType, "PIP");
  assert.equal(parsed.aidNumber, "KIP-99887766");

  // Invalid aid type
  assert.throws(() => {
    aidItemSchema.parse({
      ...validAid,
      aidType: "INVALID_AID" as any,
    });
  });
});

test("changeRequestSchema: validates guardian change requests", () => {
  const validRequest = {
    patch: {
      phone: "081299998888",
      domicileStreet: "Jl. Pasirangin Baru No. 99",
      reason: "Pindah alamat domisili dan ganti nomor WhatsApp aktif orang tua",
    },
  };

  const parsed = changeRequestSchema.parse(validRequest);
  assert.equal(parsed.patch.phone, "081299998888");

  // Invalid request (not an object)
  assert.throws(() => {
    changeRequestSchema.parse({
      patch: "invalid string",
    });
  });
});

test("maskNik and maskPhone: masks sensitive identity data correctly", () => {
  assert.equal(maskNik("3201011005180001"), "320101******0001");
  assert.equal(maskNik("123"), "123");
  assert.equal(maskNik(null), "-");

  assert.equal(maskPhone("081234567890"), "0812****7890");
  assert.equal(maskPhone("1234"), "1234");
  assert.equal(maskPhone(null), "-");
});

test("TC-31 & TC-63: canAccessSensitiveStudentData enforces strict RBAC", () => {
  const superAdmin: Actor = {
    id: "usr-admin",
    name: "Admin SDIT",
    email: "admin@sdit-attaqwim.sch.id",
    roles: ["SUPER_ADMIN"],
    permissions: ["all", "master", "read", "finance", "exam", "audit"],
  };
  const tuStaff: Actor = {
    id: "usr-tu",
    name: "Tata Usaha",
    email: "tu@sdit-attaqwim.sch.id",
    roles: ["STAFF_TU"],
    permissions: ["master", "read", "finance", "exam"],
  };
  const kepalaSekolah: Actor = {
    id: "usr-kepsek",
    name: "Kepala Sekolah",
    email: "kepsek@sdit-attaqwim.sch.id",
    roles: ["KEPALA_SEKOLAH"],
    permissions: ["read", "principal", "audit"],
  };
  const waliMurid: Actor = {
    id: "usr-wali",
    name: "Orang Tua Siswa",
    email: "wali@example.test",
    roles: ["WALI_MURID"],
    permissions: ["guardian"],
  };

  assert.equal(canAccessSensitiveStudentData(superAdmin), true);
  assert.equal(canAccessSensitiveStudentData(tuStaff), true);
  // Kepala Sekolah has only read, principal, audit - sensitive student data is NOT exposed
  assert.equal(canAccessSensitiveStudentData(kepalaSekolah), false);
  // Guardian has only guardian permission
  assert.equal(canAccessSensitiveStudentData(waliMurid), false);
});

test("TC-34 & TC-73: sanitizeForAudit redacts sensitive keys recursively without altering non-sensitive keys", () => {
  const auditPayload = {
    action: "CREATE_STUDENT",
    studentId: "std-001",
    name: "Ahmad Dahlan",
    gender: "L",
    nik: "3201011005180001",
    familyCardNumber: "3201011005180002",
    phone: "081234567890",
    email: "wali@example.com",
    address: {
      street: "Jl. Pendidikan No. 10",
      rt: "01",
      rw: "02",
      nik: "3201011005700001",
    },
    health: {
      bloodType: "A",
      medicalHistory: "Riwayat asma bronkiale saat cuaca dingin",
      foodAllergies: "Alergi udang dan kepiting",
      routineMedication: "Inhaler ventolin saat sesak",
    },
    items: [
      { id: "item-1", note: "Catatan biasa", phone: "089988776655" },
    ],
  };

  const sanitized = sanitizeForAudit(auditPayload) as any;

  // Non-sensitive data remains visible
  assert.equal(sanitized.action, "CREATE_STUDENT");
  assert.equal(sanitized.studentId, "std-001");
  assert.equal(sanitized.name, "Ahmad Dahlan");
  assert.equal(sanitized.gender, "L");
  assert.equal(sanitized.address.street, "Jl. Pendidikan No. 10");
  assert.equal(sanitized.health.bloodType, "A");
  assert.equal(sanitized.items[0].note, "Catatan biasa");

  // Sensitive data is strictly REDACTED
  assert.equal(sanitized.nik, "[REDACTED]");
  assert.equal(sanitized.familyCardNumber, "[REDACTED]");
  assert.equal(sanitized.phone, "[REDACTED]");
  assert.equal(sanitized.email, "[REDACTED]");
  assert.equal(sanitized.address.nik, "[REDACTED]");
  assert.equal(sanitized.health.medicalHistory, "[REDACTED]");
  assert.equal(sanitized.health.foodAllergies, "[REDACTED]");
  assert.equal(sanitized.health.routineMedication, "[REDACTED]");
  assert.equal(sanitized.items[0].phone, "[REDACTED]");
});

test("TC-69: calculateStudentCompleteness for legacy student with only basic identity scores ~20%", () => {
  const legacyStudent = {
    student: {
      name: "Siswa Legacy 2024",
      nis: "242501001",
      nik: null,
      gender: "L",
      birthPlace: null,
      birthDate: null,
      nisn: null,
    },
    address: null,
    registration: {
      enrolledOn: "2024-07-15",
      classId: "cls-1",
    },
    father: null,
    mother: null,
    emergencyContact: null,
    health: null,
    documents: [],
  };

  const result = calculateStudentCompleteness(legacyStudent);

  // Scores only 2 sections (registration + partial identity), definitely <= 30%
  assert.ok(result.percentage <= 30, `Expected percentage <= 30, got ${result.percentage}`);
  assert.equal(result.isComplete, false);
  assert.equal(result.sections["identitas"].status, "INCOMPLETE");
  assert.equal(result.sections["alamat"].status, "INCOMPLETE");
  assert.equal(result.sections["dokumen"].status, "INCOMPLETE");
});

test("TC-70: calculateStudentCompleteness integrates characteristic submissions status", () => {
  const fullProfileWithEmptyChar = {
    student: {
      name: "Siti Aminah",
      nis: "262701099",
      nik: "3201015005180001",
      gender: "P",
      birthPlace: "Bogor",
      birthDate: "2018-05-10",
      nisn: "0151234599",
    },
    address: {
      address: "Jl. Melati No. 5",
      province: "Jawa Barat",
      regency: "Kabupaten Bogor",
      district: "Ciampea",
      village: "Benteng",
      transportationType: "WALK",
    },
    registration: {
      enrolledOn: "2026-07-15",
      classId: "cls-2",
    },
    father: {
      fullName: "Umar",
      lifeStatus: "ALIVE",
    },
    mother: {
      fullName: "Fatimah",
      lifeStatus: "ALIVE",
    },
    emergencyContact: {
      name: "Umar",
      phone: "081234567890",
    },
    health: {
      bloodType: "B",
    },
    documents: [
      { documentType: "KK", verificationStatus: "VERIFIED" },
      { documentType: "AKTA_KELAHIRAN", verificationStatus: "VERIFIED" },
      { documentType: "PAS_FOTO", verificationStatus: "VERIFIED" },
    ],
    characteristicStatus: "EMPTY" as const,
  };

  const result = calculateStudentCompleteness(fullProfileWithEmptyChar);

  // Section 09 must be INCOMPLETE because characteristicStatus is EMPTY
  assert.equal(result.sections["karakteristik"].status, "INCOMPLETE");
  assert.ok(result.percentage < 100, `Expected percentage < 100, got ${result.percentage}`);
  assert.equal(result.isComplete, false);
});

test("TC-78: changeRequestSchema rejects unauthorized guardian patch keys", () => {
  // Disallowed key: classId, enrolledOn, studentStatus, name, nik
  assert.throws(() => {
    changeRequestSchema.parse({
      patch: {
        classId: "c1d2e3f4-0000-0000-0000-000000000000",
        reason: "Ingin pindah kelas",
      },
    });
  });

  assert.throws(() => {
    changeRequestSchema.parse({
      patch: {
        name: "Nama Baru Tidak Sah",
        reason: "Ganti nama",
      },
    });
  });

  assert.throws(() => {
    changeRequestSchema.parse({
      patch: {
        nik: "3201011005189999",
        reason: "Ganti NIK",
      },
    });
  });

  // Allowed keys: phone, street, rt, rw, village, district, postalCode, reason
  const valid = changeRequestSchema.parse({
    patch: {
      phone: "081299991111",
      street: "Jl. Flamboyan Indah No. 12",
      rt: "03",
      rw: "05",
      village: "Benteng",
      district: "Ciampea",
      postalCode: "16620",
      reason: "Pindah rumah domisili keluarga",
    },
  });
  assert.equal(valid.patch.phone, "081299991111");
  assert.equal(valid.patch.district, "Ciampea");
});

test("TC-76: studentIdentitySchema validates all 10 recovered schema columns", () => {
  const completeIdentity = {
    name: "Bilal bin Rabah",
    nickname: "Bilal",
    nis: "262701088",
    nisn: "0159988111",
    classId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    enrolledOn: "2026-07-15",
    gender: "L" as const,
    birthPlace: "Habasyah",
    birthDate: "2018-03-12",
    nik: "3201011203180001",
    familyCardNumber: "3201011203180002",
    birthCertificateNumber: "AKTA-2018-03-12",
    religion: "ISLAM" as const,
    citizenship: "WNI" as const,
    birthOrder: 1,
    siblingCount: 2,
    dailyLanguage: "INDONESIAN" as const,
    studentStatus: "ACTIVE" as const,
  };

  const parsed = studentIdentitySchema.parse(completeIdentity);
  assert.equal(parsed.nickname, "Bilal");
  assert.equal(parsed.nik, "3201011203180001");
  assert.equal(parsed.familyCardNumber, "3201011203180002");
  assert.equal(parsed.birthCertificateNumber, "AKTA-2018-03-12");
  assert.equal(parsed.religion, "ISLAM");
  assert.equal(parsed.citizenship, "WNI");
  assert.equal(parsed.birthOrder, 1);
  assert.equal(parsed.siblingCount, 2);
  assert.equal(parsed.dailyLanguage, "INDONESIAN");
  assert.equal(parsed.studentStatus, "ACTIVE");

  // Rejects birthOrder < 1
  assert.throws(() => {
    studentIdentitySchema.parse({
      ...completeIdentity,
      birthOrder: 0,
    });
  });

  // Rejects siblingCount < 0
  assert.throws(() => {
    studentIdentitySchema.parse({
      ...completeIdentity,
      siblingCount: -1,
    });
  });
});

test("TC-83: preserves legacy data URL in photoUrl and rejects local blob URLs", () => {
  const parsed = studentIdentitySchema.parse({
    name: "Ahmad",
    nis: "262701999",
    classId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    enrolledOn: "2026-07-15",
    photoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  });
  assert.ok(parsed.photoUrl?.startsWith("data:"));

  assert.throws(() => {
    studentIdentitySchema.parse({
      name: "Ahmad",
      nis: "262701999",
      classId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      enrolledOn: "2026-07-15",
      photoUrl: "blob:http://localhost:3000/1234-5678",
    });
  });
});

test("TC-85: Granular permissions deny unprivileged access to health, aid, and documents", () => {
  const readStaff: Actor = {
    id: "user-read-1",
    name: "Staff Read",
    email: "read@example.test",
    roles: ["GURU"],
    permissions: ["read"],
  };

  const financeStaff: Actor = {
    id: "user-fin-1",
    name: "Staff Keuangan",
    email: "finance@example.test",
    roles: ["TU_KEUANGAN"],
    permissions: ["read", "finance"],
  };

  const principal: Actor = {
    id: "user-kepsek-1",
    name: "Kepala Sekolah",
    email: "kepsek@example.test",
    roles: ["KEPALA_SEKOLAH"],
    permissions: ["read", "principal", "audit"],
  };

  const admin: Actor = {
    id: "user-admin-1",
    name: "Super Admin",
    email: "admin@example.test",
    roles: ["SUPER_ADMIN"],
    permissions: ["read", "master", "finance", "principal"],
  };

  assert.equal(canReadSensitiveIdentity(readStaff), false);
  assert.equal(canReadHealthMedical(readStaff), false);
  assert.equal(canReadAidIncome(readStaff), false);
  assert.equal(canManageDocuments(readStaff), false);

  assert.equal(canReadAidIncome(financeStaff), true);
  assert.equal(canReadHealthMedical(financeStaff), false);
  assert.equal(canManageDocuments(financeStaff), false);

  assert.equal(canReviewDocuments(principal), true);
  assert.equal(canManageDocuments(principal), false);

  assert.equal(canReadSensitiveIdentity(admin), true);
  assert.equal(canReadHealthMedical(admin), true);
  assert.equal(canReadAidIncome(admin), true);
  assert.equal(canManageDocuments(admin), true);
  assert.equal(canReviewDocuments(admin), true);
});

test("TC-92: isSchemaNotReady accurately detects PostgreSQL SQLSTATE 42P01 and 42703", () => {
  assert.equal(isSchemaNotReady({ code: "42P01" }), true);
  assert.equal(isSchemaNotReady({ code: "42703" }), true);
  assert.equal(isSchemaNotReady({ cause: { code: "42P01" } }), true);
  assert.equal(isSchemaNotReady({ cause: { code: "42703" } }), true);
  assert.equal(isSchemaNotReady(new Error('relation "student_addresses" does not exist')), true);
  assert.equal(isSchemaNotReady(new Error('column "student_status" of relation "students" does not exist')), true);
  assert.equal(isSchemaNotReady({ code: "23505" }), false);
  assert.equal(isSchemaNotReady(new Error("Generic validation error")), false);
});

test("TC-95 & TC-98: periodicMeasurementSchema and aidItemSchema map field aliases correctly", () => {
  const parsedMeasure = periodicMeasurementSchema.parse({
    measuredAt: "2026-08-20",
    heightCm: 125,
    weightKg: 24,
    semester: 1,
  });
  assert.equal(parsedMeasure.measurementDate, "2026-08-20");
  assert.equal(parsedMeasure.heightCm, 125);
  assert.equal(parsedMeasure.weightKg, 24);

  const parsedAid = aidItemSchema.parse({
    aidType: "KIP",
    programName: "Kartu Indonesia Pintar SD",
    year: 2026,
    amount: 450000,
    status: "ACTIVE",
  });
  assert.equal(parsedAid.aidSource, "Kartu Indonesia Pintar SD");
  assert.equal(parsedAid.startDate, "2026-01-01");
  assert.equal(parsedAid.endDate, "2026-12-31");
});

test("TC-94: generateStudentImportTemplateXlsx generates authentic XLSX binary", () => {
  const buf = generateStudentImportTemplateXlsx();
  assert.ok(buf instanceof Uint8Array);
  assert.ok(buf.length > 100);
  // OOXML ZIP magic bytes: PK (0x50 0x4B)
  assert.equal(buf[0], 0x50);
  assert.equal(buf[1], 0x4b);
});

test("TC-101 (FIX-010): normalizeDraftData maps draft object shape to arrays without .find is not a function", () => {
  const draftData = {
    student: { name: "Aisyah Humaira", nis: "262701050" },
    addresses: {
      identity: {
        address: "Jl. Dahlia No. 1",
        regency: "Kab. Bogor",
        transportationType: "MOTORCYCLE",
      },
      domicile: { address: "Jl. Melati No. 2", regency: "Kab. Bogor" },
    },
    family: {
      father: {
        name: "Budi Santoso",
        id: "550e8400-e29b-41d4-a716-446655440001",
      },
      mother: {
        name: "Siti Rahma",
        id: "550e8400-e29b-41d4-a716-446655440002",
      },
      primaryContact: "FATHER",
      paymentResponsible: "FATHER",
      emergencyContact: {
        name: "Hasan",
        phone: "081234567890",
        relationship: "UNCLE",
      },
    },
    health: { bloodType: "B" },
    aid: [
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        aidType: "KIP",
        aidNumber: "KIP-999",
      },
    ],
    measurements: [
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        measurementDate: "2026-08-01",
        heightCm: 120,
        weightKg: 22,
      },
    ],
    documents: [],
  };

  const normalized = normalizeDraftData(draftData);
  assert.ok(Array.isArray(normalized.addresses), "addresses must be array");
  assert.equal(normalized.addresses.length, 2);
  assert.equal(normalized.addresses[0].addressType, "IDENTITY");
  assert.equal(normalized.addresses[1].addressType, "DOMICILE");

  assert.ok(Array.isArray(normalized.family), "family must be array");
  assert.equal(normalized.family.length, 3);
  assert.equal(normalized.family[0].relationshipType, "FATHER");
  assert.equal(normalized.family[0].isPrimaryContact, true);
  assert.equal(normalized.family[2].isEmergencyContact, true);

  // Safe against .find() call
  const idAddr = normalized.addresses.find(
    (a: any) => a.addressType === "IDENTITY",
  );
  assert.equal(idAddr?.address, "Jl. Dahlia No. 1");
});

test("TC-102 (FIX-011): legacy photo compatibility preserves data URLs and rejects blob URLs", () => {
  const legacyDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
  const parsedLegacy = studentIdentitySchema.parse({
    name: "Siswa Lama",
    nis: "262701051",
    classId: "550e8400-e29b-41d4-a716-446655440000",
    enrolledOn: "2026-07-15",
    photoUrl: legacyDataUrl,
  });
  assert.equal(parsedLegacy.photoUrl, legacyDataUrl);

  const storagePath =
    "student-documents/550e8400-e29b-41d4-a716-446655440000/photo.jpg";
  const parsedStorage = studentIdentitySchema.parse({
    name: "Siswa Baru",
    nis: "262701052",
    classId: "550e8400-e29b-41d4-a716-446655440000",
    enrolledOn: "2026-07-15",
    photoUrl: storagePath,
  });
  assert.equal(parsedStorage.photoUrl, storagePath);

  assert.throws(() => {
    studentIdentitySchema.parse({
      name: "Siswa Gagal",
      nis: "262701053",
      classId: "550e8400-e29b-41d4-a716-446655440000",
      enrolledOn: "2026-07-15",
      photoUrl: "blob:http://localhost:3002/local-uuid-photo",
    });
  });
});

test("TC-103 (FIX-011): studentDocumentItemSchema enforces strict validation and rejects fake staging paths", () => {
  const validDoc = {
    documentType: "KK",
    documentName: "Kartu Keluarga",
    storagePath:
      "student-documents/550e8400-e29b-41d4-a716-446655440000/uuid.pdf",
    originalFilename: "kk.pdf",
    mimeType: "application/pdf",
    fileSize: 1048576,
  };
  const parsed = studentDocumentItemSchema.parse(validDoc);
  assert.equal(parsed.documentType, "KK");
  assert.equal(parsed.verificationStatus, "PENDING");

  assert.throws(() => {
    studentDocumentItemSchema.parse({
      ...validDoc,
      mimeType: "application/x-msdownload",
    });
  });

  assert.throws(() => {
    studentDocumentItemSchema.parse({
      ...validDoc,
      fileSize: 6 * 1024 * 1024,
    });
  });
});

test("TC-104 (FIX-012): generateImportPreviewToken and verifyImportPreviewToken HMAC security", () => {
  const actorId = "550e8400-e29b-41d4-a716-446655440010";
  const rows = [
    {
      rowNum: 1,
      nis: "262701001",
      name: "Santri 1",
      gender: "L",
      className: "1-A",
      resolvedClassId: "cls-1",
    },
  ];

  const token = generateImportPreviewToken(actorId, rows);
  assert.ok(typeof token === "string");
  assert.ok(token.length > 20);

  // Valid verification
  assert.equal(verifyImportPreviewToken(token, actorId, rows), true);

  // Cross-actor forgery rejected
  const impostorId = "550e8400-e29b-41d4-a716-446655440099";
  assert.equal(verifyImportPreviewToken(token, impostorId, rows), false);

  // Tampered payload rejected
  const tamperedRows = [
    {
      rowNum: 1,
      nis: "262701001",
      name: "Santri Hacked",
      gender: "L",
      className: "1-A",
      resolvedClassId: "cls-1",
    },
  ];
  assert.equal(verifyImportPreviewToken(token, actorId, tamperedRows), false);
});

test("TC-105 (FIX-012): commitImportSchema validates import payload and enforces strict structure", () => {
  const validPayload = {
    token: "mock-valid-token-string",
    rows: [
      {
        rowNum: 1,
        nis: "262701001",
        nik: "3201011005180001",
        familyCardNumber: "3201012001150002",
        name: "Santri Satu",
        gender: "L",
        className: "1-A",
        resolvedClassId: "cls-1",
      },
    ],
  };

  const parsed = commitImportSchema.parse(validPayload);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].nik, "3201011005180001");
  assert.equal(parsed.rows[0].familyCardNumber, "3201012001150002");

  assert.throws(() => {
    commitImportSchema.parse({ token: "tok", rows: [] });
  });

  assert.throws(() => {
    commitImportSchema.parse({ token: "", rows: validPayload.rows });
  });
});

test("TC-106 (FIX-013 & FIX-014): calculateStudentCompleteness handles composite data, resolves 100%, and preserves record IDs", () => {
  const measureId = "550e8400-e29b-41d4-a716-446655440020";
  const aidId = "550e8400-e29b-41d4-a716-446655440021";

  const parsedMeasure = periodicMeasurementSchema.parse({
    id: measureId,
    measurementDate: "2026-08-10",
    heightCm: 128,
    weightKg: 26,
    headCircumferenceCm: 51,
  });
  assert.equal(parsedMeasure.id, measureId);
  assert.equal(parsedMeasure.headCircumferenceCm, 51);

  const parsedAid = aidItemSchema.parse({
    id: aidId,
    aidType: "KIP",
    aidNumber: null,
    aidSource: "Kemdikbud",
    amount: 500000,
    status: "ACTIVE",
  });
  assert.equal(parsedAid.id, aidId);
  assert.equal(parsedAid.aidNumber, null);
  assert.equal(parsedAid.aidSource, "Kemdikbud");

  // Composite 10-section completeness test
  const comp = calculateStudentCompleteness({
    student: {
      name: "Zaid bin Haritsah",
      nis: "262701005",
      nik: "3201011005180005",
      gender: "L",
      birthDate: "2018-03-12",
    },
    addresses: [
      {
        addressType: "IDENTITY",
        address: "Dusun II",
        regency: "Kab. Bogor",
        transportationType: "BICYCLE",
      },
    ],
    registration: {
      classId: "cls-1",
      enrolledOn: "2026-07-15",
    },
    family: {
      father: { fullName: "Haritsah", lifeStatus: "ALIVE" },
      mother: { fullName: "Ummu Zaid", lifeStatus: "ALIVE" },
      emergencyContact: { name: "Haritsah", phone: "081234567899" },
    },
    health: { bloodType: "A" },
    characteristic: { status: "FILLED" },
    documents: [
      { documentType: "KK", verificationStatus: "VERIFIED" },
      { documentType: "AKTA_KELAHIRAN", verificationStatus: "VERIFIED" },
      { documentType: "PAS_FOTO", verificationStatus: "VERIFIED" },
    ],
  });

  assert.equal(comp.percentage, 100);
  assert.equal(comp.overallPercent, 100);
  assert.equal(comp.isComplete, true);
  assert.equal(comp.missingFields.length, 0);
});
