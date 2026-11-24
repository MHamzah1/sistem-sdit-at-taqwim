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
} from "../server/studentMaster";

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
