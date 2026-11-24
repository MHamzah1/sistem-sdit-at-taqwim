import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database, Transaction } from "../src/db/client";
import * as s from "../src/db/schema";
import {
  allow,
  audit,
  HttpError,
  isGuardian,
  ownStudent,
  requireValue,
  type Actor,
  type Context,
} from "./security";
import { date, uuid, normalizePhone } from "./business";

// --- Enums & Constants ---
export const GENDERS = ["L", "P"] as const;
export const STUDENT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "TRANSFERRED",
  "WITHDRAWN",
  "GRADUATED",
] as const;
export const ADDRESS_TYPES = ["IDENTITY", "DOMICILE"] as const;
export const RELATIONSHIP_TYPES = [
  "FATHER",
  "MOTHER",
  "GRANDFATHER",
  "GRANDMOTHER",
  "UNCLE",
  "AUNT",
  "OTHER_GUARDIAN",
] as const;
export const LIFE_STATUSES = ["ALIVE", "DECEASED", "UNKNOWN"] as const;
export const AID_TYPES = [
  "KIP",
  "PIP",
  "PKH",
  "KKS",
  "KPS",
  "BEASISWA_INTERNAL",
  "BEASISWA_EKSTERNAL",
  "OTHER",
] as const;
export const DOCUMENT_TYPES = [
  "KK",
  "AKTA_KELAHIRAN",
  "KTP_AYAH",
  "KTP_IBU",
  "KTP_WALI",
  "PAS_FOTO",
  "IJAZAH_TK",
  "BUKTI_NISN",
  "SURAT_PINDAH",
  "RAPOR_ASAL",
  "BUKTI_BANTUAN",
  "LAINNYA",
] as const;
export const VERIFICATION_STATUSES = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
] as const;

// --- Zod Validation Schemas ---
export const studentIdentitySchema = z.object({
  name: z.string().trim().min(1, "Nama lengkap wajib diisi").max(200),
  nickname: z
    .string()
    .trim()
    .max(50)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  nis: z.string().trim().min(1, "NIS wajib diisi").max(50),
  nisn: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{10}$/.test(v), {
      message: "NISN harus terdiri dari tepat 10 digit angka",
    })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  nik: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{16}$/.test(v), {
      message: "NIK harus terdiri dari tepat 16 digit angka",
    })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  familyCardNumber: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{16}$/.test(v), {
      message: "Nomor Kartu Keluarga harus terdiri dari tepat 16 digit angka",
    })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  birthCertificateNumber: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  gender: z
    .enum(["L", "P"])
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  birthPlace: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir YYYY-MM-DD")
    .refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime()) && d <= new Date();
    }, "Tanggal lahir tidak boleh di masa depan")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  photoUrl: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  religion: z
    .string()
    .trim()
    .max(50)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  citizenship: z
    .string()
    .trim()
    .max(50)
    .default("WNI")
    .nullable()
    .optional(),
  birthOrder: z
    .number()
    .int()
    .min(1, "Anak ke- minimal 1")
    .nullable()
    .optional(),
  siblingCount: z
    .number()
    .int()
    .min(0, "Jumlah saudara kandung minimal 0")
    .nullable()
    .optional(),
  dailyLanguage: z
    .string()
    .trim()
    .max(50)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  classId: uuid,
  enrolledOn: date,
  studentStatus: z.enum(STUDENT_STATUSES).default("ACTIVE"),
  active: z.boolean().default(true),
});

export const addressItemSchema = z.object({
  address: z.string().trim().max(300).nullable().optional(),
  rt: z.string().trim().max(10).nullable().optional(),
  rw: z.string().trim().max(10).nullable().optional(),
  hamlet: z.string().trim().max(100).nullable().optional(),
  village: z.string().trim().max(100).nullable().optional(),
  district: z.string().trim().max(100).nullable().optional(),
  regency: z.string().trim().max(100).nullable().optional(),
  province: z.string().trim().max(100).nullable().optional(),
  postalCode: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{5}$/.test(v), "Kode pos harus 5 digit")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  residenceType: z.string().trim().max(50).nullable().optional(),
  transportationType: z.string().trim().max(50).nullable().optional(),
  distanceToSchool: z.coerce.number().min(0).nullable().optional(),
  travelTimeMinutes: z.coerce.number().int().min(0).nullable().optional(),
});

export const addressesSchema = z.object({
  identity: addressItemSchema.optional(),
  domicile: addressItemSchema.optional(),
  sameAsIdentity: z.boolean().default(true),
});

export const registrationSchema = z.object({
  registrationNumber: z.string().trim().max(100).nullable().optional(),
  registrationType: z
    .enum(["NEW_STUDENT", "TRANSFER_STUDENT"])
    .default("NEW_STUDENT"),
  registrationDate: date.nullable().optional(),
  acceptedDate: date.nullable().optional(),
  entryGrade: z.number().int().min(1).max(6).default(1),
  attendedPaud: z.boolean().nullable().optional(),
  attendedKindergarten: z.boolean().nullable().optional(),
  previousSchoolName: z.string().trim().max(150).nullable().optional(),
  previousSchoolNpsn: z.string().trim().max(50).nullable().optional(),
  previousSchoolAddress: z.string().trim().max(300).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const familyMemberInputSchema = z.object({
  fullName: z.string().trim().min(1, "Nama anggota keluarga wajib diisi").max(200),
  nik: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{16}$/.test(v), "NIK harus 16 digit angka")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  birthPlace: z.string().trim().max(100).nullable().optional(),
  birthDate: date.nullable().optional(),
  birthYear: z.number().int().min(1900).max(2100).nullable().optional(),
  lifeStatus: z.enum(LIFE_STATUSES).default("ALIVE"),
  education: z.string().trim().max(50).nullable().optional(),
  occupation: z.string().trim().max(100).nullable().optional(),
  institutionName: z.string().trim().max(150).nullable().optional(),
  monthlyIncomeRange: z.string().trim().max(50).nullable().optional(),
  phone: z
    .string()
    .transform(normalizePhone)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  email: z
    .string()
    .email("Format email tidak valid")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  address: z.string().trim().max(300).nullable().optional(),
});

export const familyMemberSelectionSchema = z.object({
  mode: z.enum(["new", "existing", "none"]).default("new"),
  familyMemberId: uuid.nullable().optional(),
  data: familyMemberInputSchema.optional(),
});

export const familySchema = z.object({
  father: familyMemberSelectionSchema.optional(),
  mother: familyMemberSelectionSchema.optional(),
  guardian: familyMemberSelectionSchema.optional(),
  guardianRelationship: z.enum(RELATIONSHIP_TYPES).optional(),
  primaryContact: z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"]).default("FATHER"),
  paymentResponsible: z
    .enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"])
    .default("FATHER"),
  emergencyContact: z
    .object({
      name: z.string().trim().max(200).optional(),
      relationship: z.string().trim().max(50).optional(),
      phone: z.string().transform(normalizePhone).optional(),
    })
    .optional(),
});

export const healthSchema = z.object({
  bloodType: z.enum(["A", "B", "AB", "O", "UNKNOWN"]).default("UNKNOWN"),
  medicalHistory: z.string().trim().max(1000).nullable().optional(),
  foodAllergies: z.string().trim().max(500).nullable().optional(),
  drugAllergies: z.string().trim().max(500).nullable().optional(),
  hasSpecialNeeds: z.boolean().default(false),
  specialNeedsTypes: z.any().optional(),
  routineMedication: z.string().trim().max(500).nullable().optional(),
  emergencyHandlingNotes: z.string().trim().max(1000).nullable().optional(),
  assistanceNeeds: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const aidItemSchema = z.object({
  aidType: z.enum(AID_TYPES),
  aidNumber: z.string().trim().max(100).nullable().optional(),
  aidSource: z.string().trim().max(150).nullable().optional(),
  startDate: date.nullable().optional(),
  endDate: date.nullable().optional(),
  status: z.string().default("ACTIVE"),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const fullStudentProfileSchema = z.object({
  student: studentIdentitySchema,
  addresses: addressesSchema.optional(),
  registration: registrationSchema.optional(),
  family: familySchema.optional(),
  health: healthSchema.optional(),
  aid: z.array(aidItemSchema).optional(),
  draftId: uuid.nullable().optional(),
});

// --- Completeness Calculation Engine ---
export function calculateStudentCompleteness(data: {
  student: {
    name?: string | null;
    nis?: string | null;
    nik?: string | null;
    gender?: string | null;
    birthPlace?: string | null;
    birthDate?: string | null;
    nisn?: string | null;
  };
  address?: {
    address?: string | null;
    province?: string | null;
    regency?: string | null;
    district?: string | null;
    village?: string | null;
    transportationType?: string | null;
  } | null;
  registration?: {
    enrolledOn?: string | null;
    classId?: string | null;
  } | null;
  father?: { fullName?: string | null; lifeStatus?: string | null } | null;
  mother?: { fullName?: string | null; lifeStatus?: string | null } | null;
  emergencyContact?: { name?: string | null; phone?: string | null } | null;
  health?: { bloodType?: string | null } | null;
  documents?: Array<{ documentType: string; verificationStatus: string }>;
}) {
  const sections: Record<
    string,
    { status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE"; missing: string[] }
  > = {};

  // 1. Identitas
  const identMissing: string[] = [];
  if (!data.student.name) identMissing.push("Nama Lengkap");
  if (!data.student.nis) identMissing.push("NIS");
  if (!data.student.nik) identMissing.push("NIK (16 digit)");
  if (!data.student.gender) identMissing.push("Jenis Kelamin");
  if (!data.student.birthDate) identMissing.push("Tanggal Lahir");
  sections["identitas"] = {
    status: identMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: identMissing,
  };

  // 2. Alamat
  const addrMissing: string[] = [];
  if (!data.address?.address) addrMissing.push("Alamat Jalan / Tempat Tinggal");
  if (!data.address?.regency) addrMissing.push("Kota / Kabupaten");
  if (!data.address?.transportationType) addrMissing.push("Moda Transportasi");
  sections["alamat"] = {
    status: addrMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: addrMissing,
  };

  // 3. Registrasi
  const regMissing: string[] = [];
  if (!data.registration?.classId) regMissing.push("Kelas Penempatan");
  if (!data.registration?.enrolledOn) regMissing.push("Tanggal Masuk");
  sections["registrasi"] = {
    status: regMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: regMissing,
  };

  // 4. Data Ayah
  const fatherMissing: string[] = [];
  if (data.father?.lifeStatus === "DECEASED") {
    sections["ayah"] = { status: "COMPLETE", missing: [] };
  } else {
    if (!data.father?.fullName) fatherMissing.push("Nama Lengkap Ayah");
    sections["ayah"] = {
      status: fatherMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
      missing: fatherMissing,
    };
  }

  // 5. Data Ibu
  const motherMissing: string[] = [];
  if (data.mother?.lifeStatus === "DECEASED") {
    sections["ibu"] = { status: "COMPLETE", missing: [] };
  } else {
    if (!data.mother?.fullName) motherMissing.push("Nama Lengkap Ibu");
    sections["ibu"] = {
      status: motherMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
      missing: motherMissing,
    };
  }

  // 6. Wali & Kontak Darurat
  const emMissing: string[] = [];
  if (!data.emergencyContact?.name) emMissing.push("Nama Kontak Darurat");
  if (!data.emergencyContact?.phone) emMissing.push("Nomor Telepon Darurat");
  sections["wali_darurat"] = {
    status: emMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: emMissing,
  };

  // 7. Kesehatan
  sections["kesehatan"] = {
    status: data.health?.bloodType ? "COMPLETE" : "INCOMPLETE",
    missing: data.health?.bloodType ? [] : ["Golongan Darah"],
  };

  // 8. Bantuan Pendidikan (Opsional, status selalu terpenuhi jika ada / tidak ada)
  sections["bantuan"] = {
    status: "COMPLETE",
    missing: [],
  };

  // 9. Karakteristik
  sections["karakteristik"] = {
    status: "COMPLETE",
    missing: [],
  };

  // 10. Dokumen (KK, Akta Kelahiran, Pas Foto)
  const coreDocs = ["KK", "AKTA_KELAHIRAN", "PAS_FOTO"];
  const verifiedDocs = (data.documents || [])
    .filter((d) => d.verificationStatus === "VERIFIED")
    .map((d) => d.documentType);
  const docMissing = coreDocs.filter((cd) => !verifiedDocs.includes(cd));
  sections["dokumen"] = {
    status: docMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: docMissing.map((d) => `Dokumen ${d} belum terverifikasi`),
  };

  const sectionKeys = Object.keys(sections);
  const total = sectionKeys.length;
  const completed = sectionKeys.filter(
    (k) => sections[k].status === "COMPLETE",
  ).length;
  const percentage = Math.round((completed / total) * 100);

  return {
    percentage,
    completed,
    total,
    sections,
    isComplete: completed === total,
    verifiedDocsCount: verifiedDocs.length,
    totalDocsCount: (data.documents || []).length,
  };
}

// --- Masking Helpers ---
export function maskNik(nik: string | null | undefined): string {
  if (!nik) return "-";
  if (nik.length !== 16) return nik;
  return nik.slice(0, 6) + "******" + nik.slice(12);
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  if (phone.length < 8) return phone;
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

// --- Atomic CRUD Functions ---

export async function createStudentAtomic(
  db: Database,
  ctx: Context,
  input: z.infer<typeof fullStudentProfileSchema>,
) {
  allow(ctx.actor, "master");

  // Check NIS uniqueness
  const existingNis = await db
    .select({ id: s.students.id })
    .from(s.students)
    .where(eq(s.students.nis, input.student.nis))
    .limit(1);
  if (existingNis.length > 0) {
    throw new HttpError(409, `NIS ${input.student.nis} sudah terdaftar`);
  }

  // Check NIK uniqueness if provided
  if (input.student.nik && (s.students as any).nik) {
    const existingNik = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(eq((s.students as any).nik, input.student.nik))
      .limit(1);
    if (existingNik.length > 0) {
      throw new HttpError(409, `NIK ${input.student.nik} sudah digunakan siswa lain`);
    }
  }

  return await db.transaction(async (tx) => {
    // 1. Insert Student
    const studentValues: any = {
      name: input.student.name,
      nis: input.student.nis,
      nisn: input.student.nisn,
      gender: input.student.gender,
      birthPlace: input.student.birthPlace,
      birthDate: input.student.birthDate,
      photoUrl: input.student.photoUrl,
      classId: input.student.classId,
      enrolledOn: input.student.enrolledOn,
      active: input.student.active ?? true,
    };
    if ((s.students as any).nickname) studentValues.nickname = input.student.nickname;
    if ((s.students as any).nik) studentValues.nik = input.student.nik;
    if ((s.students as any).familyCardNumber) studentValues.familyCardNumber = input.student.familyCardNumber;
    if ((s.students as any).birthCertificateNumber) studentValues.birthCertificateNumber = input.student.birthCertificateNumber;
    if ((s.students as any).religion) studentValues.religion = input.student.religion;
    if ((s.students as any).citizenship) studentValues.citizenship = input.student.citizenship || "WNI";
    if ((s.students as any).birthOrder) studentValues.birthOrder = input.student.birthOrder;
    if ((s.students as any).siblingCount) studentValues.siblingCount = input.student.siblingCount;
    if ((s.students as any).dailyLanguage) studentValues.dailyLanguage = input.student.dailyLanguage;
    if ((s.students as any).studentStatus) studentValues.studentStatus = input.student.studentStatus || "ACTIVE";

    const [createdStudent] = await tx
      .insert(s.students)
      .values(studentValues)
      .returning();

    const studentId = createdStudent.id;

    // 2. Insert Addresses
    if (input.addresses) {
      if (input.addresses.identity) {
        await tx.insert(s.studentAddresses).values({
          studentId,
          addressType: "IDENTITY",
          ...input.addresses.identity,
          distanceToSchool: input.addresses.identity.distanceToSchool?.toString(),
        });
      }
      if (!input.addresses.sameAsIdentity && input.addresses.domicile) {
        await tx.insert(s.studentAddresses).values({
          studentId,
          addressType: "DOMICILE",
          ...input.addresses.domicile,
          distanceToSchool: input.addresses.domicile.distanceToSchool?.toString(),
        });
      } else if (input.addresses.sameAsIdentity && input.addresses.identity) {
        await tx.insert(s.studentAddresses).values({
          studentId,
          addressType: "DOMICILE",
          ...input.addresses.identity,
          distanceToSchool: input.addresses.identity.distanceToSchool?.toString(),
        });
      }
    }

    // 3. Handle Family Members
    if (input.family) {
      // Helper to handle one family member
      const handleMember = async (
        entry: z.infer<typeof familyMemberSelectionSchema> | undefined,
        relationshipType: (typeof RELATIONSHIP_TYPES)[number],
        isPrimary: boolean,
        isPayment: boolean,
      ) => {
        if (!entry || entry.mode === "none") return;
        let memberId = entry.familyMemberId;
        if (entry.mode === "new" && entry.data) {
          const [newMember] = await tx
            .insert(s.familyMembers)
            .values({
              fullName: entry.data.fullName,
              nik: entry.data.nik,
              birthPlace: entry.data.birthPlace,
              birthDate: entry.data.birthDate,
              birthYear: entry.data.birthYear,
              lifeStatus: entry.data.lifeStatus || "ALIVE",
              education: entry.data.education,
              occupation: entry.data.occupation,
              institutionName: entry.data.institutionName,
              monthlyIncomeRange: entry.data.monthlyIncomeRange,
              phone: entry.data.phone,
              email: entry.data.email,
              address: entry.data.address,
            })
            .returning();
          memberId = newMember.id;
        }

        if (memberId) {
          await tx.insert(s.studentFamilyMembers).values({
            studentId,
            familyMemberId: memberId,
            relationshipType,
            isPrimaryContact: isPrimary,
            isPaymentResponsible: isPayment,
            isEmergencyContact: false,
          });
        }
      };

      const isFatherPrimary = input.family.primaryContact === "FATHER";
      const isMotherPrimary = input.family.primaryContact === "MOTHER";
      const isGuardianPrimary = input.family.primaryContact === "GUARDIAN";

      const isFatherPayment = input.family.paymentResponsible === "FATHER";
      const isMotherPayment = input.family.paymentResponsible === "MOTHER";
      const isGuardianPayment = input.family.paymentResponsible === "GUARDIAN";

      await handleMember(input.family.father, "FATHER", isFatherPrimary, isFatherPayment);
      await handleMember(input.family.mother, "MOTHER", isMotherPrimary, isMotherPayment);
      if (input.family.guardian) {
        await handleMember(
          input.family.guardian,
          input.family.guardianRelationship || "OTHER_GUARDIAN",
          isGuardianPrimary,
          isGuardianPayment,
        );
      }
    }

    // 4. Insert Enrollment Initial Record
    if (input.registration) {
      await tx.insert(s.studentEnrollments).values({
        studentId,
        registrationNumber: input.registration.registrationNumber,
        registrationType: input.registration.registrationType || "NEW_STUDENT",
        registrationDate: input.registration.registrationDate,
        acceptedDate: input.registration.acceptedDate,
        enrollmentDate: input.student.enrolledOn,
        classId: input.student.classId,
        entryGrade: input.registration.entryGrade || 1,
        attendedPaud: input.registration.attendedPaud,
        attendedKindergarten: input.registration.attendedKindergarten,
        previousSchoolName: input.registration.previousSchoolName,
        previousSchoolNpsn: input.registration.previousSchoolNpsn,
        previousSchoolAddress: input.registration.previousSchoolAddress,
        enrollmentStatus: "ACTIVE",
        effectiveStartDate: input.student.enrolledOn,
        notes: input.registration.notes,
      });
    }

    // 5. Insert Health Profile
    if (input.health) {
      await tx.insert(s.studentHealthProfiles).values({
        studentId,
        bloodType: input.health.bloodType,
        medicalHistory: input.health.medicalHistory,
        foodAllergies: input.health.foodAllergies,
        drugAllergies: input.health.drugAllergies,
        hasSpecialNeeds: input.health.hasSpecialNeeds ?? false,
        specialNeedsTypes: input.health.specialNeedsTypes,
        routineMedication: input.health.routineMedication,
        emergencyHandlingNotes: input.health.emergencyHandlingNotes,
        assistanceNeeds: input.health.assistanceNeeds,
        notes: input.health.notes,
      });
    }

    // 6. Insert Aid Records
    if (input.aid && input.aid.length > 0) {
      for (const item of input.aid) {
        await tx.insert(s.studentAidRecords).values({
          studentId,
          aidType: item.aidType,
          aidNumber: item.aidNumber,
          aidSource: item.aidSource,
          startDate: item.startDate,
          endDate: item.endDate,
          status: item.status || "ACTIVE",
          notes: item.notes,
        });
      }
    }

    // 7. Finalize Draft if present
    if (input.draftId) {
      await tx
        .update(s.studentDrafts)
        .set({
          status: "FINALIZED",
          finalStudentId: studentId,
          updatedAt: new Date(),
        })
        .where(eq(s.studentDrafts.id, input.draftId));
    }

    // Audit log
    await audit(
      tx,
      ctx,
      "CREATE",
      "students",
      studentId,
      undefined,
      { name: createdStudent.name, nis: createdStudent.nis },
    );

    return createdStudent;
  });
}

export async function getStudentFullProfile(
  db: Database,
  actor: Actor,
  studentId: string,
) {
  // Check permission / guardian scoping
  await ownStudent(db, actor, studentId);

  const safeQuery = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (err: any) {
      if (err?.code === "42P01" || err?.code === "42703") return fallback;
      throw err;
    }
  };

  let student: any;
  try {
    const [row] = await db
      .select({
        id: s.students.id,
        nis: s.students.nis,
        nisn: s.students.nisn,
        name: s.students.name,
        gender: s.students.gender,
        birthPlace: s.students.birthPlace,
        birthDate: s.students.birthDate,
        photoUrl: s.students.photoUrl,
        classId: s.students.classId,
        enrolledOn: s.students.enrolledOn,
        active: s.students.active,
        createdAt: s.students.createdAt,
        updatedAt: s.students.updatedAt,
      })
      .from(s.students)
      .where(eq(s.students.id, studentId));
    student = row;
  } catch (err) {
    const [row] = await db
      .select()
      .from(s.students)
      .where(eq(s.students.id, studentId));
    student = row;
  }

  if (!student) throw new HttpError(404, "Siswa tidak ditemukan");

  const addresses = await safeQuery(
    () =>
      db
        .select()
        .from(s.studentAddresses)
        .where(eq(s.studentAddresses.studentId, studentId)),
    [],
  );

  const enrollments = await safeQuery(
    () =>
      db
        .select()
        .from(s.studentEnrollments)
        .where(eq(s.studentEnrollments.studentId, studentId))
        .orderBy(desc(s.studentEnrollments.createdAt)),
    [],
  );

  const familyRelations = await safeQuery(
    () =>
      db
        .select({
          relation: s.studentFamilyMembers,
          member: s.familyMembers,
        })
        .from(s.studentFamilyMembers)
        .innerJoin(
          s.familyMembers,
          eq(s.familyMembers.id, s.studentFamilyMembers.familyMemberId),
        )
        .where(eq(s.studentFamilyMembers.studentId, studentId)),
    [],
  );

  const health = await safeQuery(
    async () =>
      (
        await db
          .select()
          .from(s.studentHealthProfiles)
          .where(eq(s.studentHealthProfiles.studentId, studentId))
      )[0] || null,
    null,
  );

  const measurements = await safeQuery(
    () =>
      db
        .select()
        .from(s.studentPeriodicData)
        .where(eq(s.studentPeriodicData.studentId, studentId))
        .orderBy(desc(s.studentPeriodicData.measurementDate)),
    [],
  );

  const aidRecords = await safeQuery(
    () =>
      db
        .select()
        .from(s.studentAidRecords)
        .where(eq(s.studentAidRecords.studentId, studentId))
        .orderBy(desc(s.studentAidRecords.createdAt)),
    [],
  );

  const documents = await safeQuery(
    () =>
      db
        .select()
        .from(s.studentDocuments)
        .where(eq(s.studentDocuments.studentId, studentId))
        .orderBy(desc(s.studentDocuments.createdAt)),
    [],
  );

  // Linked guardians (portal)
  const portalGuardians = await db
    .select({
      guardian: s.guardians,
      link: s.guardianStudents,
    })
    .from(s.guardianStudents)
    .innerJoin(
      s.guardians,
      eq(s.guardians.id, s.guardianStudents.guardianId),
    )
    .where(eq(s.guardianStudents.studentId, studentId));

  // Compute completeness
  const identityAddr = addresses.find((a) => a.addressType === "IDENTITY");
  const fatherRel = familyRelations.find((r) => r.relation.relationshipType === "FATHER");
  const motherRel = familyRelations.find((r) => r.relation.relationshipType === "MOTHER");
  const primaryRel = familyRelations.find((r) => r.relation.isPrimaryContact);

  const completeness = calculateStudentCompleteness({
    student,
    address: identityAddr,
    registration: {
      classId: student.classId,
      enrolledOn: student.enrolledOn,
    },
    father: fatherRel?.member,
    mother: motherRel?.member,
    emergencyContact: primaryRel?.member
      ? { name: primaryRel.member.fullName, phone: primaryRel.member.phone }
      : undefined,
    health,
    documents,
  });

  return {
    student,
    addresses,
    enrollments,
    family: familyRelations.map((fr) => ({
      ...fr.relation,
      member: fr.member,
    })),
    health,
    measurements,
    aidRecords,
    documents,
    portalGuardians: portalGuardians.map((pg) => pg.guardian),
    completeness,
  };
}

export async function searchFamilyMembers(
  db: Database,
  actor: Actor,
  query: string,
) {
  allow(actor, "master");
  const q = `%${query.trim()}%`;
  const members = await db
    .select()
    .from(s.familyMembers)
    .where(
      or(
        ilike(s.familyMembers.fullName, q),
        ilike(s.familyMembers.nik, q),
        ilike(s.familyMembers.phone, q),
      ),
    )
    .limit(20);

  return members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    maskedNik: maskNik(m.nik),
    maskedPhone: maskPhone(m.phone),
    occupation: m.occupation,
    lifeStatus: m.lifeStatus,
    education: m.education,
  }));
}

export async function updateStudentProfile(
  db: Database,
  ctx: Context,
  studentId: string,
  input: z.infer<typeof fullStudentProfileSchema>,
) {
  allow(ctx.actor, "master");

  const [existing] = await db
    .select()
    .from(s.students)
    .where(eq(s.students.id, studentId));
  if (!existing) throw new HttpError(404, "Siswa tidak ditemukan");

  // Check NIS uniqueness if changed
  if (input.student.nis !== existing.nis) {
    const dupNis = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(eq(s.students.nis, input.student.nis))
      .limit(1);
    if (dupNis.length > 0 && dupNis[0].id !== studentId) {
      throw new HttpError(409, `NIS ${input.student.nis} sudah terdaftar`);
    }
  }

  // Check NIK uniqueness if changed
  if (input.student.nik && (s.students as any).nik && input.student.nik !== (existing as any).nik) {
    const dupNik = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(eq((s.students as any).nik, input.student.nik))
      .limit(1);
    if (dupNik.length > 0 && dupNik[0].id !== studentId) {
      throw new HttpError(409, `NIK ${input.student.nik} sudah digunakan siswa lain`);
    }
  }

  return await db.transaction(async (tx) => {
    // 1. Update Student core fields
    const studentUpdateValues: any = {
      name: input.student.name,
      nis: input.student.nis,
      nisn: input.student.nisn,
      gender: input.student.gender,
      birthPlace: input.student.birthPlace,
      birthDate: input.student.birthDate,
      photoUrl: input.student.photoUrl,
      active: input.student.active ?? existing.active,
      updatedAt: new Date(),
    };
    if ((s.students as any).nickname) studentUpdateValues.nickname = input.student.nickname;
    if ((s.students as any).nik) studentUpdateValues.nik = input.student.nik;
    if ((s.students as any).familyCardNumber) studentUpdateValues.familyCardNumber = input.student.familyCardNumber;
    if ((s.students as any).birthCertificateNumber) studentUpdateValues.birthCertificateNumber = input.student.birthCertificateNumber;
    if ((s.students as any).religion) studentUpdateValues.religion = input.student.religion;
    if ((s.students as any).citizenship) studentUpdateValues.citizenship = input.student.citizenship || "WNI";
    if ((s.students as any).birthOrder) studentUpdateValues.birthOrder = input.student.birthOrder;
    if ((s.students as any).siblingCount) studentUpdateValues.siblingCount = input.student.siblingCount;
    if ((s.students as any).dailyLanguage) studentUpdateValues.dailyLanguage = input.student.dailyLanguage;
    if ((s.students as any).studentStatus) studentUpdateValues.studentStatus = input.student.studentStatus || (existing as any).studentStatus;

    const [updated] = await tx
      .update(s.students)
      .set(studentUpdateValues)
      .where(eq(s.students.id, studentId))
      .returning();

    // 2. Update Addresses
    if (input.addresses) {
      await tx
        .delete(s.studentAddresses)
        .where(eq(s.studentAddresses.studentId, studentId));

      if (input.addresses.identity) {
        await tx.insert(s.studentAddresses).values({
          studentId,
          addressType: "IDENTITY",
          ...input.addresses.identity,
          distanceToSchool: input.addresses.identity.distanceToSchool?.toString(),
        });
      }
      if (!input.addresses.sameAsIdentity && input.addresses.domicile) {
        await tx.insert(s.studentAddresses).values({
          studentId,
          addressType: "DOMICILE",
          ...input.addresses.domicile,
          distanceToSchool: input.addresses.domicile.distanceToSchool?.toString(),
        });
      } else if (input.addresses.sameAsIdentity && input.addresses.identity) {
        await tx.insert(s.studentAddresses).values({
          studentId,
          addressType: "DOMICILE",
          ...input.addresses.identity,
          distanceToSchool: input.addresses.identity.distanceToSchool?.toString(),
        });
      }
    }

    // 3. Update Health Profile
    if (input.health) {
      await tx
        .insert(s.studentHealthProfiles)
        .values({
          studentId,
          bloodType: input.health.bloodType,
          medicalHistory: input.health.medicalHistory,
          foodAllergies: input.health.foodAllergies,
          drugAllergies: input.health.drugAllergies,
          hasSpecialNeeds: input.health.hasSpecialNeeds ?? false,
          specialNeedsTypes: input.health.specialNeedsTypes,
          routineMedication: input.health.routineMedication,
          emergencyHandlingNotes: input.health.emergencyHandlingNotes,
          assistanceNeeds: input.health.assistanceNeeds,
          notes: input.health.notes,
        })
        .onConflictDoUpdate({
          target: s.studentHealthProfiles.studentId,
          set: {
            bloodType: input.health.bloodType,
            medicalHistory: input.health.medicalHistory,
            foodAllergies: input.health.foodAllergies,
            drugAllergies: input.health.drugAllergies,
            hasSpecialNeeds: input.health.hasSpecialNeeds ?? false,
            specialNeedsTypes: input.health.specialNeedsTypes,
            routineMedication: input.health.routineMedication,
            emergencyHandlingNotes: input.health.emergencyHandlingNotes,
            assistanceNeeds: input.health.assistanceNeeds,
            notes: input.health.notes,
            updatedAt: new Date(),
          },
        });
    }

    // Audit log
    await audit(tx, ctx, "UPDATE", "students", studentId, existing, updated);

    return updated;
  });
}

// --- Draft Handlers ---

export async function saveStudentDraft(
  db: Database,
  actor: Actor,
  data: unknown,
  draftId?: string,
) {
  allow(actor, "master");
  if (draftId) {
    const [existing] = await db
      .select()
      .from(s.studentDrafts)
      .where(and(eq(s.studentDrafts.id, draftId), eq(s.studentDrafts.userId, actor.id)));
    if (!existing) throw new HttpError(404, "Draft tidak ditemukan");

    const [updated] = await db
      .update(s.studentDrafts)
      .set({
        data: data as any,
        revision: existing.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(s.studentDrafts.id, draftId))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(s.studentDrafts)
      .values({
        userId: actor.id,
        data: data as any,
        status: "DRAFT",
        revision: 1,
      })
      .returning();
    return created;
  }
}

export async function getStudentDrafts(db: Database, actor: Actor) {
  allow(actor, "master");
  try {
    return await db
      .select()
      .from(s.studentDrafts)
      .where(and(eq(s.studentDrafts.userId, actor.id), eq(s.studentDrafts.status, "DRAFT")))
      .orderBy(desc(s.studentDrafts.updatedAt));
  } catch (err: any) {
    if (err?.code === "42P01" || err?.code === "42703") return [];
    throw err;
  }
}

export async function getStudentDraftById(
  db: Database,
  actor: Actor,
  draftId: string,
) {
  allow(actor, "master");
  const [draft] = await db
    .select()
    .from(s.studentDrafts)
    .where(and(eq(s.studentDrafts.id, draftId), eq(s.studentDrafts.userId, actor.id)));
  if (!draft) throw new HttpError(404, "Draft tidak ditemukan");
  return draft;
}

export async function deleteStudentDraft(
  db: Database,
  actor: Actor,
  draftId: string,
) {
  allow(actor, "master");
  await db
    .delete(s.studentDrafts)
    .where(and(eq(s.studentDrafts.id, draftId), eq(s.studentDrafts.userId, actor.id)));
  return { ok: true };
}

// --- Measurements & Aid ---

export const periodicMeasurementSchema = z.object({
  academicYearId: uuid.nullable().optional(),
  semester: z.number().int().min(1).max(2).default(1),
  measurementDate: date,
  heightCm: z.coerce.number().positive("Tinggi badan harus angka positif").max(250),
  weightKg: z.coerce.number().positive("Berat badan harus angka positif").max(200),
  notes: z.string().trim().max(500).nullable().optional(),
});

export async function addPeriodicMeasurement(
  db: Database,
  ctx: Context,
  studentId: string,
  input: unknown,
) {
  allow(ctx.actor, "master");
  const data = periodicMeasurementSchema.parse(input);
  const [created] = await db
    .insert(s.studentPeriodicData)
    .values({
      studentId,
      academicYearId: data.academicYearId || undefined,
      semester: data.semester,
      measurementDate: data.measurementDate,
      heightCm: data.heightCm.toString(),
      weightKg: data.weightKg.toString(),
      notes: data.notes,
      recordedBy: ctx.actor.id,
    })
    .returning();

  await audit(db, ctx, "CREATE", "student_periodic_data", created.id, undefined, created);
  return created;
}

export async function addStudentAid(
  db: Database,
  ctx: Context,
  studentId: string,
  input: unknown,
) {
  allow(ctx.actor, "master");
  const data = aidItemSchema.parse(input);
  const [created] = await db
    .insert(s.studentAidRecords)
    .values({
      studentId,
      aidType: data.aidType,
      aidNumber: data.aidNumber,
      aidSource: data.aidSource,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || "ACTIVE",
      notes: data.notes,
    })
    .returning();

  await audit(db, ctx, "CREATE", "student_aid_records", created.id, undefined, created);
  return created;
}

// --- Document Registration & Review ---

export const registerDocSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  documentName: z.string().trim().min(1).max(200),
  documentNumber: z.string().trim().max(100).nullable().optional(),
  storagePath: z.string().trim().min(1),
  originalFilename: z.string().trim().min(1).max(300),
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
});

export async function registerStudentDocument(
  db: Database,
  ctx: Context,
  studentId: string,
  input: unknown,
) {
  await ownStudent(db, ctx.actor, studentId);
  const data = registerDocSchema.parse(input);

  const [created] = await db
    .insert(s.studentDocuments)
    .values({
      studentId,
      documentType: data.documentType,
      documentName: data.documentName,
      documentNumber: data.documentNumber,
      storagePath: data.storagePath,
      originalFilename: data.originalFilename,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      verificationStatus: "PENDING",
      uploadedBy: ctx.actor.id,
    })
    .returning();

  await audit(db, ctx, "CREATE", "student_documents", created.id, undefined, {
    studentId,
    documentType: data.documentType,
    documentName: data.documentName,
  });
  return created;
}

export async function reviewStudentDocument(
  db: Database,
  ctx: Context,
  documentId: string,
  status: "VERIFIED" | "REJECTED",
  rejectionReason?: string,
) {
  allow(ctx.actor, "master");
  if (status === "REJECTED" && !rejectionReason?.trim()) {
    throw new HttpError(422, "Alasan penolakan dokumen wajib diisi");
  }

  const [existing] = await db
    .select()
    .from(s.studentDocuments)
    .where(eq(s.studentDocuments.id, documentId));
  if (!existing) throw new HttpError(404, "Dokumen tidak ditemukan");

  const [updated] = await db
    .update(s.studentDocuments)
    .set({
      verificationStatus: status,
      verifiedBy: ctx.actor.id,
      verifiedAt: new Date(),
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
      updatedAt: new Date(),
    })
    .where(eq(s.studentDocuments.id, documentId))
    .returning();

  await audit(db, ctx, "UPDATE", "student_documents", documentId, existing, updated);
  return updated;
}

// --- Guardian Profile Change Request ---

export const changeRequestSchema = z.object({
  patch: z.record(z.string(), z.any()),
});

export async function requestProfileChange(
  db: Database,
  ctx: Context,
  studentId: string,
  input: unknown,
) {
  await ownStudent(db, ctx.actor, studentId);
  const { patch } = changeRequestSchema.parse(input);

  const [created] = await db
    .insert(s.studentProfileChangeRequests)
    .values({
      studentId,
      requestedBy: ctx.actor.id,
      patch,
      status: "SUBMITTED",
      revision: 1,
    })
    .returning();

  await audit(db, ctx, "CREATE", "student_profile_change_requests", created.id, undefined, {
    studentId,
    patchKeys: Object.keys(patch),
  });
  return created;
}

export async function getProfileChangeRequests(db: Database, actor: Actor) {
  allow(actor, "master");
  try {
    return await db
      .select({
        request: s.studentProfileChangeRequests,
        student: {
          id: s.students.id,
          name: s.students.name,
          nis: s.students.nis,
        },
        user: {
          id: s.users.id,
          name: s.users.name,
          email: s.users.email,
        },
      })
      .from(s.studentProfileChangeRequests)
      .innerJoin(s.students, eq(s.students.id, s.studentProfileChangeRequests.studentId))
      .innerJoin(s.users, eq(s.users.id, s.studentProfileChangeRequests.requestedBy))
      .where(eq(s.studentProfileChangeRequests.status, "SUBMITTED"))
      .orderBy(desc(s.studentProfileChangeRequests.createdAt));
  } catch (err: any) {
    if (err?.code === "42P01" || err?.code === "42703") return [];
    throw err;
  }
}

export async function reviewProfileChange(
  db: Database,
  ctx: Context,
  requestId: string,
  approved: boolean,
  rejectionReason?: string,
) {
  allow(ctx.actor, "master");
  if (!approved && !rejectionReason?.trim()) {
    throw new HttpError(422, "Alasan penolakan pengajuan wajib diisi");
  }

  const [reqRecord] = await db
    .select()
    .from(s.studentProfileChangeRequests)
    .where(eq(s.studentProfileChangeRequests.id, requestId));
  if (!reqRecord) throw new HttpError(404, "Pengajuan tidak ditemukan");

  return await db.transaction(async (tx) => {
    if (approved) {
      const patch = reqRecord.patch as Record<string, any>;
      const allowedStudentFields = [
        "nickname",
        "birthPlace",
        "birthDate",
        "dailyLanguage",
        "birthOrder",
        "siblingCount",
        "religion",
      ];
      const studentUpdate: Record<string, any> = {};
      for (const key of allowedStudentFields) {
        if (patch[key] !== undefined && (s.students as any)[key]) studentUpdate[key] = patch[key];
      }
      if (Object.keys(studentUpdate).length > 0) {
        studentUpdate.updatedAt = new Date();
        await tx
          .update(s.students)
          .set(studentUpdate)
          .where(eq(s.students.id, reqRecord.studentId));
      }
    }

    const [updatedReq] = await tx
      .update(s.studentProfileChangeRequests)
      .set({
        status: approved ? "APPROVED" : "REJECTED",
        reviewerId: ctx.actor.id,
        rejectionReason: approved ? null : rejectionReason,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(s.studentProfileChangeRequests.id, requestId))
      .returning();

    await audit(tx, ctx, "UPDATE", "student_profile_change_requests", requestId, reqRecord, updatedReq);
    return updatedReq;
  });
}
