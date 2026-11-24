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
} from "../server/studentMaster";
import {
  sanitizeForAudit,
  canAccessSensitiveStudentData,
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
