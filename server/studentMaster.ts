import { createHash, createHmac } from "node:crypto";
import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import { z } from "zod";
import type { Database, Transaction } from "../src/db/client";
import * as s from "../src/db/schema";
import {
  allow,
  audit,
  canAccessSensitiveStudentData,
  canManageDocuments,
  canReadAidIncome,
  canReadHealthMedical,
  canReadSensitiveIdentity,
  canReviewDocuments,
  HttpError,
  isGuardian,
  isSchemaNotReady,
  ownStudent,
  requireValue,
  type Actor,
  type Context,
} from "./security";
import { date, uuid, normalizePhone } from "./business";
import { verifyStudentFile } from "./files";
import {
  calculateStudentCompleteness,
  type StudentCompletenessInput,
  type StudentCompletenessResult,
} from "../src/lib/completeness";
export {
  calculateStudentCompleteness,
  type StudentCompletenessInput,
  type StudentCompletenessResult,
};

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
    .refine((v) => !v || !v.startsWith("blob:"), {
      message: "Foto tidak boleh berupa blob URL lokal",
    })
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

export const aidItemSchema = z
  .object({
    id: uuid.optional(),
    aidType: z.enum(AID_TYPES),
    aidNumber: z.string().trim().max(100).nullable().optional(),
    aidSource: z.string().trim().max(150).nullable().optional(),
    programName: z.string().trim().max(150).nullable().optional(),
    startDate: date.nullable().optional(),
    endDate: date.nullable().optional(),
    year: z.coerce.number().int().nullable().optional(),
    amount: z.coerce.number().nullable().optional(),
    status: z.string().default("ACTIVE"),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .transform((data) => ({
    ...data,
    aidSource: data.aidSource || data.programName || data.aidType,
    startDate: data.startDate || (data.year ? `${data.year}-01-01` : null),
    endDate: data.endDate || (data.year ? `${data.year}-12-31` : null),
  }));

export const periodicMeasurementSchema = z
  .object({
    id: uuid.optional(),
    academicYearId: uuid.nullable().optional(),
    semester: z.coerce.number().int().min(1).max(2).default(1),
    measurementDate: date.optional(),
    measuredAt: date.optional(),
    heightCm: z.coerce.number().positive("Tinggi badan harus angka positif").max(250),
    weightKg: z.coerce.number().positive("Berat badan harus angka positif").max(200),
    headCircumferenceCm: z.coerce.number().nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .transform((data) => ({
    ...data,
    measurementDate:
      data.measurementDate ||
      data.measuredAt ||
      new Date().toISOString().slice(0, 10),
  }));

export const studentDocumentItemSchema = z.object({
  id: uuid.optional(),
  documentType: z.enum([
    "KK",
    "AKTA_KELAHIRAN",
    "KTP_AYAH",
    "KTP_IBU",
    "IJAZAH_SEBELUMNYA",
    "KIP_PIP",
    "PAS_FOTO",
    "SURAT_PINDAH",
    "OTHER",
  ]),
  documentName: z.string().trim().min(1, "Nama dokumen wajib diisi").max(150),
  documentNumber: z.string().trim().max(100).nullable().optional(),
  storagePath: z.string().trim().min(1, "Storage path wajib ada"),
  originalFilename: z.string().trim().min(1, "Nama file asli wajib ada"),
  mimeType: z.enum(["image/jpeg", "image/png", "application/pdf", "image/webp"]),
  fileSize: z.number().int().positive().max(5 * 1024 * 1024),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional().default("PENDING"),
  uploadedBy: uuid.optional(),
});

export const fullStudentProfileSchema = z.object({
  student: studentIdentitySchema,
  addresses: addressesSchema.optional(),
  registration: registrationSchema.optional(),
  family: familySchema.optional(),
  health: healthSchema.optional(),
  aid: z.array(aidItemSchema).optional(),
  measurements: z.array(periodicMeasurementSchema).optional(),
  documents: z.array(studentDocumentItemSchema).optional(),
  draftId: uuid.nullable().optional(),
});

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
  if (input.student.nik) {
    const existingNik = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(eq(s.students.nik, input.student.nik))
      .limit(1);
    if (existingNik.length > 0) {
      throw new HttpError(409, `NIK ${maskNik(input.student.nik)} sudah digunakan siswa lain`);
    }
  }

  // Check NISN uniqueness if provided
  if (input.student.nisn) {
    const existingNisn = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(eq(s.students.nisn, input.student.nisn))
      .limit(1);
    if (existingNisn.length > 0) {
      throw new HttpError(409, `NISN ${input.student.nisn} sudah terdaftar di sistem`);
    }
  }

  return await db.transaction(async (tx) => {
    // 1. Insert Student with all 10 restored typed schema columns
    const [createdStudent] = await tx
      .insert(s.students)
      .values({
        name: input.student.name,
        nickname: input.student.nickname || null,
        nis: input.student.nis,
        nisn: input.student.nisn || null,
        nik: input.student.nik || null,
        familyCardNumber: input.student.familyCardNumber || null,
        birthCertificateNumber: input.student.birthCertificateNumber || null,
        gender: input.student.gender || null,
        birthPlace: input.student.birthPlace || null,
        birthDate: input.student.birthDate || null,
        photoUrl: input.student.photoUrl || null,
        religion: input.student.religion || null,
        citizenship: input.student.citizenship || "WNI",
        birthOrder: input.student.birthOrder ?? null,
        siblingCount: input.student.siblingCount ?? null,
        dailyLanguage: input.student.dailyLanguage || null,
        classId: input.student.classId,
        enrolledOn: input.student.enrolledOn,
        studentStatus: input.student.studentStatus || "ACTIVE",
        active: input.student.active ?? true,
      })
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
      let emergencyContactLinked = false;
      const emName = input.family.emergencyContact?.name?.trim().toLowerCase();
      const emPhone = input.family.emergencyContact?.phone?.trim();

      const handleMember = async (
        entry: z.infer<typeof familyMemberSelectionSchema> | undefined,
        relationshipType: (typeof RELATIONSHIP_TYPES)[number],
        isPrimary: boolean,
        isPayment: boolean,
      ) => {
        if (!entry || entry.mode === "none") return;
        let memberId = entry.familyMemberId;
        let memberName = "";
        let memberPhone = "";

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
          memberName = newMember.fullName;
          memberPhone = newMember.phone || "";
        } else if (memberId) {
          const [existingMem] = await tx
            .select()
            .from(s.familyMembers)
            .where(eq(s.familyMembers.id, memberId));
          if (existingMem) {
            memberName = existingMem.fullName;
            memberPhone = existingMem.phone || "";
          }
        }

        if (memberId) {
          const isThisEmergency =
            !emergencyContactLinked &&
            emName &&
            (memberName.trim().toLowerCase() === emName ||
              (emPhone && memberPhone && memberPhone === emPhone));

          if (isThisEmergency) emergencyContactLinked = true;

          await tx.insert(s.studentFamilyMembers).values({
            studentId,
            familyMemberId: memberId,
            relationshipType,
            isPrimaryContact: isPrimary,
            isPaymentResponsible: isPayment,
            isEmergencyContact: Boolean(isThisEmergency),
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

      // If emergency contact wasn't father/mother/guardian, create standalone emergency contact record
      if (!emergencyContactLinked && input.family.emergencyContact?.name && input.family.emergencyContact?.phone) {
        const [emMember] = await tx
          .insert(s.familyMembers)
          .values({
            fullName: input.family.emergencyContact.name,
            phone: input.family.emergencyContact.phone,
            lifeStatus: "ALIVE",
          })
          .returning();

        await tx.insert(s.studentFamilyMembers).values({
          studentId,
          familyMemberId: emMember.id,
          relationshipType: (input.family.emergencyContact.relationship as any) || "OTHER_GUARDIAN",
          isPrimaryContact: false,
          isPaymentResponsible: false,
          isEmergencyContact: true,
        });
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
          amount: item.amount ?? null,
          status: item.status || "ACTIVE",
          notes: item.notes,
        });
      }
    }

    // 7. Insert Physical Measurements (Pengukuran Fisik)
    if (input.measurements && input.measurements.length > 0) {
      for (const m of input.measurements) {
        await tx.insert(s.studentPeriodicData).values({
          studentId,
          academicYearId: m.academicYearId || undefined,
          semester: m.semester || 1,
          measurementDate: m.measurementDate,
          heightCm: m.heightCm.toString(),
          weightKg: m.weightKg.toString(),
          headCircumferenceCm: m.headCircumferenceCm
            ? m.headCircumferenceCm.toString()
            : null,
          notes: m.notes,
          recordedBy: ctx.actor.id,
        });
      }
    }

    // 8. Insert Documents (only pre-staged in private blob by this actor)
    if (input.documents && input.documents.length > 0) {
      for (const d of input.documents) {
        if (!d.storagePath) continue;
        if (
          d.storagePath.startsWith("staging/") ||
          d.storagePath.startsWith("blob:") ||
          d.storagePath.startsWith("data:")
        ) {
          throw new HttpError(
            422,
            "Jalur dokumen fiktif/staging lokal tidak diizinkan; unggah berkas terlebih dahulu",
            "INVALID_STORAGE_PATH",
          );
        }
        if (!d.storagePath.startsWith(`student-documents/${ctx.actor.id}/`)) {
          throw new HttpError(
            403,
            "Dokumen harus diunggah oleh akun yang sedang aktif",
            "FORBIDDEN",
          );
        }
        await verifyStudentFile(
          d.storagePath,
          ["image/jpeg", "image/png", "image/webp", "application/pdf"],
          5 * 1024 * 1024,
        );
        await tx.insert(s.studentDocuments).values({
          studentId,
          documentType: d.documentType,
          documentName: d.documentName,
          documentNumber: d.documentNumber,
          storagePath: d.storagePath,
          originalFilename: d.originalFilename || d.documentName,
          mimeType: d.mimeType || "application/pdf",
          fileSize: d.fileSize || 1024,
          verificationStatus: "PENDING",
          uploadedBy: ctx.actor.id,
        });
      }
    }

    // 9. Finalize Draft with ownership & status guard
    if (input.draftId) {
      const [draft] = await tx
        .select()
        .from(s.studentDrafts)
        .where(eq(s.studentDrafts.id, input.draftId));
      if (!draft) throw new HttpError(404, "Draft tidak ditemukan", "NOT_FOUND");
      if (draft.userId !== ctx.actor.id)
        throw new HttpError(403, "Akses draft ditolak", "FORBIDDEN");
      if (draft.status === "FINALIZED")
        throw new HttpError(409, "Draft sudah difinalisasi sebelumnya", "ALREADY_FINALIZED");

      const updateResult = await tx
        .update(s.studentDrafts)
        .set({
          status: "FINALIZED",
          finalStudentId: studentId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(s.studentDrafts.id, input.draftId),
            eq(s.studentDrafts.status, "DRAFT"),
          ),
        )
        .returning();

      if (updateResult.length === 0) {
        throw new HttpError(409, "Draft sedang diproses atau sudah difinalisasi", "ALREADY_FINALIZED");
      }
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
  db: Database | Transaction,
  actor: Actor,
  studentId: string,
) {
  // Check permission / guardian scoping
  await ownStudent(db, actor, studentId);

  const [student] = await db
    .select()
    .from(s.students)
    .where(eq(s.students.id, studentId));

  if (!student) throw new HttpError(404, "Siswa tidak ditemukan", "NOT_FOUND");

  const addresses = await db
    .select()
    .from(s.studentAddresses)
    .where(eq(s.studentAddresses.studentId, studentId));

  const enrollments = await db
    .select()
    .from(s.studentEnrollments)
    .where(eq(s.studentEnrollments.studentId, studentId))
    .orderBy(desc(s.studentEnrollments.createdAt));

  const familyRelations = await db
    .select({
      relation: s.studentFamilyMembers,
      member: s.familyMembers,
    })
    .from(s.studentFamilyMembers)
    .innerJoin(
      s.familyMembers,
      eq(s.familyMembers.id, s.studentFamilyMembers.familyMemberId),
    )
    .where(eq(s.studentFamilyMembers.studentId, studentId));

  const [health] = await db
    .select()
    .from(s.studentHealthProfiles)
    .where(eq(s.studentHealthProfiles.studentId, studentId));

  const measurements = await db
    .select()
    .from(s.studentPeriodicData)
    .where(eq(s.studentPeriodicData.studentId, studentId))
    .orderBy(desc(s.studentPeriodicData.measurementDate));

  const aidRecords = await db
    .select()
    .from(s.studentAidRecords)
    .where(eq(s.studentAidRecords.studentId, studentId))
    .orderBy(desc(s.studentAidRecords.createdAt));

  const documents = await db
    .select()
    .from(s.studentDocuments)
    .where(eq(s.studentDocuments.studentId, studentId))
    .orderBy(desc(s.studentDocuments.createdAt));

  // Submissions for Karakteristik Anak
  const submissions = await db
    .select()
    .from(s.characteristicSubmissions)
    .where(eq(s.characteristicSubmissions.studentId, studentId))
    .orderBy(desc(s.characteristicSubmissions.createdAt));

  const characteristicSummary = submissions.length > 0
    ? {
        status: "FILLED" as const,
        submissionId: submissions[0].id,
        templateId: submissions[0].templateId,
        submittedAt: submissions[0].createdAt,
      }
    : {
        status: "EMPTY" as const,
        submissionId: null,
        templateId: null,
      };

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
  const emergencyRel =
    familyRelations.find((r) => r.relation.isEmergencyContact) ||
    familyRelations.find((r) => r.relation.isPrimaryContact);

  const completeness = calculateStudentCompleteness({
    student,
    address: identityAddr,
    registration: {
      classId: student.classId,
      enrolledOn: student.enrolledOn,
    },
    father: fatherRel?.member,
    mother: motherRel?.member,
    emergencyContact: emergencyRel?.member
      ? { name: emergencyRel.member.fullName, phone: emergencyRel.member.phone }
      : undefined,
    health: health || null,
    characteristic: characteristicSummary,
    aidRecords,
    documents,
  });

  const canReadIdentity = canReadSensitiveIdentity(actor);
  const canReadMedical = canReadHealthMedical(actor);
  const canReadAid = canReadAidIncome(actor);
  const canDocs = canManageDocuments(actor) || canReviewDocuments(actor);

  // Granular RBAC projection: mask sensitive data for unprivileged roles
  const studentProjected = {
    ...student,
    nik: canReadIdentity ? student.nik : maskNik(student.nik),
    familyCardNumber: canReadIdentity
      ? student.familyCardNumber
      : maskNik(student.familyCardNumber),
    birthCertificateNumber: canReadIdentity
      ? student.birthCertificateNumber
      : maskNik(student.birthCertificateNumber),
  };

  const familyProjected = familyRelations.map((fr) => ({
    ...fr.relation,
    member: {
      ...fr.member,
      nik: canReadIdentity ? fr.member.nik : maskNik(fr.member.nik),
      phone: canReadIdentity ? fr.member.phone : maskPhone(fr.member.phone),
      monthlyIncomeRange: canReadAid ? fr.member.monthlyIncomeRange : null,
    },
  }));

  const documentsProjected = documents.map((d) => ({
    ...d,
    storagePath: canDocs ? d.storagePath : "[PROTECTED]",
  }));

  return {
    student: studentProjected,
    addresses,
    enrollments,
    family: familyProjected,
    health: canReadMedical ? health || null : null,
    measurements: canReadMedical ? measurements : [],
    aidRecords: canReadAid ? aidRecords : [],
    documents: documentsProjected,
    portalGuardians: portalGuardians.map((pg) => pg.guardian),
    characteristic: characteristicSummary,
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

  let existing: any;
  try {
    const [row] = await db
      .select()
      .from(s.students)
      .where(eq(s.students.id, studentId));
    existing = row;
  } catch (err: any) {
    if (err?.code === "42703" || err?.cause?.code === "42703") {
      const [baseRow] = await db
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
      existing = baseRow
        ? {
            ...baseRow,
            studentStatus: baseRow.active ? "ACTIVE" : "INACTIVE",
            nik: null,
          }
        : null;
    } else {
      throw err;
    }
  }
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
  if (input.student.nik && input.student.nik !== existing.nik) {
    const dupNik = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(eq(s.students.nik, input.student.nik))
      .limit(1);
    if (dupNik.length > 0 && dupNik[0].id !== studentId) {
      throw new HttpError(409, `NIK ${maskNik(input.student.nik)} sudah digunakan siswa lain`);
    }
  }

  // Check NISN uniqueness if changed
  if (input.student.nisn && input.student.nisn !== existing.nisn) {
    const dupNisn = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(eq(s.students.nisn, input.student.nisn))
      .limit(1);
    if (dupNisn.length > 0 && dupNisn[0].id !== studentId) {
      throw new HttpError(409, `NISN ${input.student.nisn} sudah terdaftar di sistem`);
    }
  }

  // Guard against changing classId or enrolledOn if invoices already exist (FIN-010 point A)
  if (
    input.student.classId !== existing.classId ||
    input.student.enrolledOn !== existing.enrolledOn
  ) {
    const invoices = await db
      .select()
      .from(s.invoices)
      .where(eq(s.invoices.studentId, studentId))
      .limit(1);
    if (invoices.length > 0) {
      throw new HttpError(
        409,
        "Perubahan kelas/tanggal masuk siswa bertagihan memerlukan proses mutasi terpisah",
      );
    }
  }

  return await db.transaction(async (tx) => {
    // Check invoice constraint on class change
    if (input.student.classId !== existing.classId) {
      const invoices = await tx
        .select({ id: s.invoices.id })
        .from(s.invoices)
        .where(eq(s.invoices.studentId, studentId))
        .limit(1);

      if (invoices.length > 0) {
        throw new HttpError(
          409,
          "Siswa sudah memiliki riwayat tagihan aktif; perubahan kelas harus melalui alur mutasi resmi",
          "CLASS_MUTATION_RESTRICTED",
        );
      }
    }

    // 1. Update Student with all 10 schema fields typed
    const [updated] = await tx
      .update(s.students)
      .set({
        name: input.student.name,
        nickname: input.student.nickname || null,
        nis: input.student.nis,
        nisn: input.student.nisn || null,
        nik: input.student.nik || null,
        familyCardNumber: input.student.familyCardNumber || null,
        birthCertificateNumber: input.student.birthCertificateNumber || null,
        gender: input.student.gender || null,
        birthPlace: input.student.birthPlace || null,
        birthDate: input.student.birthDate || null,
        photoUrl: input.student.photoUrl || null,
        religion: input.student.religion || null,
        citizenship: input.student.citizenship || "WNI",
        birthOrder: input.student.birthOrder ?? null,
        siblingCount: input.student.siblingCount ?? null,
        dailyLanguage: input.student.dailyLanguage || null,
        classId: input.student.classId,
        enrolledOn: input.student.enrolledOn,
        studentStatus: input.student.studentStatus || existing.studentStatus,
        active: input.student.active ?? existing.active,
        updatedAt: new Date(),
      })
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

    // 3. Update / Upsert Registration Enrollment
    if (input.registration) {
      const [existingEnroll] = await tx
        .select()
        .from(s.studentEnrollments)
        .where(eq(s.studentEnrollments.studentId, studentId))
        .limit(1);

      if (existingEnroll) {
        await tx
          .update(s.studentEnrollments)
          .set({
            registrationNumber: input.registration.registrationNumber,
            registrationType: input.registration.registrationType || "NEW_STUDENT",
            registrationDate: input.registration.registrationDate,
            acceptedDate: input.registration.acceptedDate,
            entryGrade: input.registration.entryGrade || 1,
            attendedPaud: input.registration.attendedPaud,
            attendedKindergarten: input.registration.attendedKindergarten,
            previousSchoolName: input.registration.previousSchoolName,
            previousSchoolNpsn: input.registration.previousSchoolNpsn,
            previousSchoolAddress: input.registration.previousSchoolAddress,
            notes: input.registration.notes,
            updatedAt: new Date(),
          })
          .where(eq(s.studentEnrollments.id, existingEnroll.id));
      } else {
        await tx.insert(s.studentEnrollments).values({
          studentId,
          classId: input.student.classId,
          registrationNumber: input.registration.registrationNumber,
          registrationType: input.registration.registrationType || "NEW_STUDENT",
          registrationDate: input.registration.registrationDate,
          acceptedDate: input.registration.acceptedDate,
          enrollmentDate: input.student.enrolledOn,
          entryGrade: input.registration.entryGrade || 1,
          attendedPaud: input.registration.attendedPaud,
          attendedKindergarten: input.registration.attendedKindergarten,
          previousSchoolName: input.registration.previousSchoolName,
          previousSchoolNpsn: input.registration.previousSchoolNpsn,
          previousSchoolAddress: input.registration.previousSchoolAddress,
          enrollmentStatus: "ACTIVE",
          notes: input.registration.notes,
        });
      }
    }

    // 4. Update / Upsert Health Profile
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

    // 5. Update Family Members
    if (input.family) {
      let emergencyContactLinked = false;
      const emName = input.family.emergencyContact?.name?.trim().toLowerCase();
      const emPhone = input.family.emergencyContact?.phone?.trim();

      const handleMemberUpdate = async (
        entry: z.infer<typeof familyMemberSelectionSchema> | undefined,
        relType: (typeof RELATIONSHIP_TYPES)[number],
        isPrimary: boolean,
        isPayment: boolean,
      ) => {
        if (!entry || entry.mode === "none") return;
        let memberId = entry.familyMemberId;
        let memberName = "";
        let memberPhone = "";

        if (entry.mode === "new" && entry.data) {
          const [newMem] = await tx
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
          memberId = newMem.id;
          memberName = newMem.fullName;
          memberPhone = newMem.phone || "";
        } else if (memberId && entry.data) {
          await tx
            .update(s.familyMembers)
            .set({
              fullName: entry.data.fullName,
              nik: entry.data.nik,
              education: entry.data.education,
              occupation: entry.data.occupation,
              institutionName: entry.data.institutionName,
              monthlyIncomeRange: entry.data.monthlyIncomeRange,
              phone: entry.data.phone,
              email: entry.data.email,
              address: entry.data.address,
              lifeStatus: entry.data.lifeStatus || "ALIVE",
              updatedAt: new Date(),
            })
            .where(eq(s.familyMembers.id, memberId));
          memberName = entry.data.fullName;
          memberPhone = entry.data.phone || "";
        }

        if (memberId) {
          const isThisEmergency =
            !emergencyContactLinked &&
            emName &&
            (memberName.trim().toLowerCase() === emName ||
              (emPhone && memberPhone && memberPhone === emPhone));

          if (isThisEmergency) emergencyContactLinked = true;

          // Delete existing relationship for this relType to prevent duplicate
          await tx
            .delete(s.studentFamilyMembers)
            .where(
              and(
                eq(s.studentFamilyMembers.studentId, studentId),
                eq(s.studentFamilyMembers.relationshipType, relType),
              ),
            );

          await tx.insert(s.studentFamilyMembers).values({
            studentId,
            familyMemberId: memberId,
            relationshipType: relType,
            isPrimaryContact: isPrimary,
            isPaymentResponsible: isPayment,
            isEmergencyContact: Boolean(isThisEmergency),
          });
        }
      };

      const isFatherPrimary = input.family.primaryContact === "FATHER";
      const isMotherPrimary = input.family.primaryContact === "MOTHER";
      const isGuardianPrimary = input.family.primaryContact === "GUARDIAN";

      const isFatherPayment = input.family.paymentResponsible === "FATHER";
      const isMotherPayment = input.family.paymentResponsible === "MOTHER";
      const isGuardianPayment = input.family.paymentResponsible === "GUARDIAN";

      await handleMemberUpdate(input.family.father, "FATHER", isFatherPrimary, isFatherPayment);
      await handleMemberUpdate(input.family.mother, "MOTHER", isMotherPrimary, isMotherPayment);
      if (input.family.guardian) {
        await handleMemberUpdate(
          input.family.guardian,
          input.family.guardianRelationship || "OTHER_GUARDIAN",
          isGuardianPrimary,
          isGuardianPayment,
        );
      }

      // If emergency contact wasn't father/mother/guardian, handle standalone emergency contact
      if (
        !emergencyContactLinked &&
        input.family.emergencyContact?.name &&
        input.family.emergencyContact?.phone
      ) {
        const existingEmRels = await tx
          .select({
            relation: s.studentFamilyMembers,
            member: s.familyMembers,
          })
          .from(s.studentFamilyMembers)
          .innerJoin(
            s.familyMembers,
            eq(s.familyMembers.id, s.studentFamilyMembers.familyMemberId),
          )
          .where(
            and(
              eq(s.studentFamilyMembers.studentId, studentId),
              eq(s.studentFamilyMembers.isEmergencyContact, true),
            ),
          );

        const nonParentEmRel = existingEmRels.find(
          (r) =>
            r.relation.relationshipType !== "FATHER" &&
            r.relation.relationshipType !== "MOTHER",
        );

        if (nonParentEmRel) {
          await tx
            .update(s.familyMembers)
            .set({
              fullName: input.family.emergencyContact.name,
              phone: input.family.emergencyContact.phone,
              updatedAt: new Date(),
            })
            .where(eq(s.familyMembers.id, nonParentEmRel.member.id));
        } else {
          const [emMember] = await tx
            .insert(s.familyMembers)
            .values({
              fullName: input.family.emergencyContact.name,
              phone: input.family.emergencyContact.phone,
              lifeStatus: "ALIVE",
            })
            .returning();

          await tx.insert(s.studentFamilyMembers).values({
            studentId,
            familyMemberId: emMember.id,
            relationshipType:
              (input.family.emergencyContact.relationship as any) ||
              "OTHER_GUARDIAN",
            isPrimaryContact: false,
            isPaymentResponsible: false,
            isEmergencyContact: true,
          });
        }
      }
    }

    // 6. Upsert measurements if provided (idempotent, prevents duplicates)
    if (input.measurements && input.measurements.length > 0) {
      for (const m of input.measurements) {
        if (m.id) {
          const updateResult = await tx
            .update(s.studentPeriodicData)
            .set({
              semester: m.semester || 1,
              measurementDate: m.measurementDate,
              heightCm: m.heightCm.toString(),
              weightKg: m.weightKg.toString(),
              headCircumferenceCm: m.headCircumferenceCm
                ? m.headCircumferenceCm.toString()
                : null,
              notes: m.notes,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(s.studentPeriodicData.id, m.id),
                eq(s.studentPeriodicData.studentId, studentId),
              ),
            )
            .returning();
          if (updateResult.length === 0) {
            throw new HttpError(
              404,
              `Data pengukuran ${m.id} tidak ditemukan untuk siswa ini`,
            );
          }
        } else {
          // Idempotent insert: only skip/reuse if an EXACT identical measurement exists
          const [existingM] = await tx
            .select()
            .from(s.studentPeriodicData)
            .where(
              and(
                eq(s.studentPeriodicData.studentId, studentId),
                eq(s.studentPeriodicData.measurementDate, m.measurementDate),
                eq(s.studentPeriodicData.semester, m.semester || 1),
                eq(s.studentPeriodicData.heightCm, m.heightCm.toString()),
                eq(s.studentPeriodicData.weightKg, m.weightKg.toString()),
              ),
            );
          if (existingM) {
            await tx
              .update(s.studentPeriodicData)
              .set({
                headCircumferenceCm: m.headCircumferenceCm
                  ? m.headCircumferenceCm.toString()
                  : existingM.headCircumferenceCm,
                notes: m.notes || existingM.notes,
                updatedAt: new Date(),
              })
              .where(eq(s.studentPeriodicData.id, existingM.id));
          } else {
            await tx.insert(s.studentPeriodicData).values({
              studentId,
              academicYearId: m.academicYearId || undefined,
              semester: m.semester || 1,
              measurementDate: m.measurementDate,
              heightCm: m.heightCm.toString(),
              weightKg: m.weightKg.toString(),
              headCircumferenceCm: m.headCircumferenceCm
                ? m.headCircumferenceCm.toString()
                : null,
              notes: m.notes,
              recordedBy: ctx.actor.id,
            });
          }
        }
      }
    }

    // 7. Upsert aid records if provided (idempotent, prevents duplicates)
    if (input.aid && input.aid.length > 0) {
      for (const a of input.aid) {
        if (a.id) {
          const updateResult = await tx
            .update(s.studentAidRecords)
            .set({
              aidType: a.aidType,
              aidNumber: a.aidNumber,
              aidSource: a.aidSource,
              startDate: a.startDate,
              endDate: a.endDate,
              amount: a.amount ?? null,
              status: a.status || "ACTIVE",
              notes: a.notes,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(s.studentAidRecords.id, a.id),
                eq(s.studentAidRecords.studentId, studentId),
              ),
            )
            .returning();
          if (updateResult.length === 0) {
            throw new HttpError(
              404,
              `Data bantuan ${a.id} tidak ditemukan untuk siswa ini`,
            );
          }
        } else {
          const aidConds = [
            eq(s.studentAidRecords.studentId, studentId),
            eq(s.studentAidRecords.aidType, a.aidType),
          ];
          if (a.aidNumber) {
            aidConds.push(eq(s.studentAidRecords.aidNumber, a.aidNumber));
          } else if (a.aidSource) {
            aidConds.push(eq(s.studentAidRecords.aidSource, a.aidSource));
          }
          const [existingA] = await tx
            .select()
            .from(s.studentAidRecords)
            .where(and(...aidConds));
          if (
            existingA &&
            existingA.aidNumber === a.aidNumber &&
            existingA.aidSource === a.aidSource
          ) {
            await tx
              .update(s.studentAidRecords)
              .set({
                startDate: a.startDate,
                endDate: a.endDate,
                amount: a.amount ?? existingA.amount,
                status: a.status || "ACTIVE",
                notes: a.notes,
                updatedAt: new Date(),
              })
              .where(eq(s.studentAidRecords.id, existingA.id));
          } else {
            await tx.insert(s.studentAidRecords).values({
              studentId,
              aidType: a.aidType,
              aidNumber: a.aidNumber,
              aidSource: a.aidSource,
              startDate: a.startDate,
              endDate: a.endDate,
              amount: a.amount ?? null,
              status: a.status || "ACTIVE",
              notes: a.notes,
            });
          }
        }
      }
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
    if (existing.status === "FINALIZED") {
      throw new HttpError(409, "Draf sudah difinalisasi dan tidak dapat diubah lagi");
    }

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
  const [existing] = await db
    .select()
    .from(s.studentDrafts)
    .where(and(eq(s.studentDrafts.id, draftId), eq(s.studentDrafts.userId, actor.id)));
  if (!existing) throw new HttpError(404, "Draft tidak ditemukan");
  if (existing.status === "FINALIZED") {
    throw new HttpError(409, "Draf yang sudah difinalisasi tidak dapat dihapus");
  }
  await db
    .delete(s.studentDrafts)
    .where(and(eq(s.studentDrafts.id, draftId), eq(s.studentDrafts.userId, actor.id)));
  return { ok: true };
}

// --- Measurements & Aid ---

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
      headCircumferenceCm: data.headCircumferenceCm
        ? data.headCircumferenceCm.toString()
        : null,
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
      amount: data.amount ?? null,
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
  mimeType: z.enum(["image/jpeg", "image/png", "application/pdf", "image/webp"]),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024, "Ukuran dokumen maksimal 5 MB"),
});

export async function registerStudentDocument(
  db: Database,
  ctx: Context,
  studentId: string,
  input: unknown,
) {
  await ownStudent(db, ctx.actor, studentId);
  const data = registerDocSchema.parse(input);

  // Validate storage path prefix and actor binding to prevent IDOR / arbitrary storagePath
  if (!data.storagePath.startsWith(`student-documents/${ctx.actor.id}/`)) {
    throw new HttpError(422, "Jalur penyimpanan dokumen tidak sah");
  }

  await verifyStudentFile(
    data.storagePath,
    ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    5 * 1024 * 1024,
  );

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

export const ALLOWED_GUARDIAN_PATCH_KEYS = new Set([
  "nickname",
  "birthPlace",
  "birthDate",
  "dailyLanguage",
  "birthOrder",
  "siblingCount",
  "religion",
  "citizenship",
  "address",
  "street",
  "rt",
  "rw",
  "hamlet",
  "village",
  "district",
  "regency",
  "province",
  "postalCode",
  "phone",
  "guardianPhone",
  "guardianAddress",
  "domicileStreet",
  "reason",
]);

export const changeRequestSchema = z.object({
  patch: z.record(z.string(), z.any()).refine((p) => {
    for (const key of Object.keys(p)) {
      if (!ALLOWED_GUARDIAN_PATCH_KEYS.has(key)) {
        return false;
      }
    }
    return true;
  }, {
    message: "Pengajuan memuat kolom yang tidak diizinkan untuk diubah secara mandiri",
  }),
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

export async function getProfileChangeRequests(db: Database, actor: Actor, studentId?: string) {
  try {
    if (isGuardian(actor)) {
      if (studentId) {
        await ownStudent(db, actor, studentId);
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
          .where(eq(s.studentProfileChangeRequests.studentId, studentId))
          .orderBy(desc(s.studentProfileChangeRequests.createdAt));
      }

      const rows = await db
        .select({ studentId: s.guardianStudents.studentId })
        .from(s.guardianStudents)
        .innerJoin(s.guardians, eq(s.guardians.id, s.guardianStudents.guardianId))
        .where(eq(s.guardians.userId, actor.id));
      const accessible = rows.map((r) => r.studentId);
      if (accessible.length === 0) return [];

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
        .where(inArray(s.studentProfileChangeRequests.studentId, accessible))
        .orderBy(desc(s.studentProfileChangeRequests.createdAt));
    }

    allow(actor, "master");
    const condition = studentId
      ? eq(s.studentProfileChangeRequests.studentId, studentId)
      : eq(s.studentProfileChangeRequests.status, "SUBMITTED");

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
      .where(condition)
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

  if (reqRecord.status !== "SUBMITTED") {
    throw new HttpError(409, "Pengajuan sudah diputuskan sebelumnya");
  }

  return await db.transaction(async (tx) => {
    if (approved) {
      const patch = reqRecord.patch as Record<string, any>;

      // 1. Apply Student whitelisted fields (typed)
      const studentUpdate: Record<string, any> = {};
      if (patch.nickname !== undefined) studentUpdate.nickname = patch.nickname;
      if (patch.birthPlace !== undefined) studentUpdate.birthPlace = patch.birthPlace;
      if (patch.birthDate !== undefined) studentUpdate.birthDate = patch.birthDate;
      if (patch.dailyLanguage !== undefined) studentUpdate.dailyLanguage = patch.dailyLanguage;
      if (patch.birthOrder !== undefined) studentUpdate.birthOrder = patch.birthOrder;
      if (patch.siblingCount !== undefined) studentUpdate.siblingCount = patch.siblingCount;
      if (patch.religion !== undefined) studentUpdate.religion = patch.religion;
      if (patch.citizenship !== undefined) studentUpdate.citizenship = patch.citizenship;

      if (Object.keys(studentUpdate).length > 0) {
        studentUpdate.updatedAt = new Date();
        await tx
          .update(s.students)
          .set(studentUpdate)
          .where(eq(s.students.id, reqRecord.studentId));
      }

      // 2. Apply address updates if present in patch (Strictly separates IDENTITY and DOMICILE)
      if (
        patch.address ||
        patch.street ||
        patch.village ||
        patch.district ||
        patch.regency ||
        patch.postalCode
      ) {
        const [existingIdAddr] = await tx
          .select()
          .from(s.studentAddresses)
          .where(
            and(
              eq(s.studentAddresses.studentId, reqRecord.studentId),
              eq(s.studentAddresses.addressType, "IDENTITY"),
            ),
          )
          .limit(1);

        const addrData = {
          address: patch.address || patch.street || existingIdAddr?.address || "",
          rt: patch.rt || existingIdAddr?.rt || null,
          rw: patch.rw || existingIdAddr?.rw || null,
          hamlet: patch.hamlet || existingIdAddr?.hamlet || null,
          village: patch.village || existingIdAddr?.village || null,
          district: patch.district || existingIdAddr?.district || null,
          regency: patch.regency || existingIdAddr?.regency || null,
          province: patch.province || existingIdAddr?.province || null,
          postalCode: patch.postalCode || existingIdAddr?.postalCode || null,
          updatedAt: new Date(),
        };

        if (existingIdAddr) {
          await tx
            .update(s.studentAddresses)
            .set(addrData)
            .where(eq(s.studentAddresses.id, existingIdAddr.id));
        } else {
          await tx.insert(s.studentAddresses).values({
            studentId: reqRecord.studentId,
            addressType: "IDENTITY",
            ...addrData,
          });
        }
      }

      if (patch.domicileStreet) {
        const [existingDomAddr] = await tx
          .select()
          .from(s.studentAddresses)
          .where(
            and(
              eq(s.studentAddresses.studentId, reqRecord.studentId),
              eq(s.studentAddresses.addressType, "DOMICILE"),
            ),
          )
          .limit(1);

        if (existingDomAddr) {
          await tx
            .update(s.studentAddresses)
            .set({
              address: patch.domicileStreet,
              updatedAt: new Date(),
            })
            .where(eq(s.studentAddresses.id, existingDomAddr.id));
        } else {
          await tx.insert(s.studentAddresses).values({
            studentId: reqRecord.studentId,
            addressType: "DOMICILE",
            address: patch.domicileStreet,
          });
        }
      }

      // 3. Apply guardian phone updates if present in patch
      const newPhone = patch.phone || patch.guardianPhone;
      if (newPhone) {
        await tx
          .update(s.guardians)
          .set({ phone: newPhone, updatedAt: new Date() })
          .where(eq(s.guardians.userId, reqRecord.requestedBy));
      }
    }

    const [updatedReq] = await tx
      .update(s.studentProfileChangeRequests)
      .set({
        status: approved ? "APPROVED" : "REJECTED",
        reviewerId: ctx.actor.id,
        rejectionReason: approved ? null : (rejectionReason || null),
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(s.studentProfileChangeRequests.id, requestId),
          eq(s.studentProfileChangeRequests.status, "SUBMITTED"),
        ),
      )
      .returning();

    if (!updatedReq) {
      throw new HttpError(409, "Pengajuan sudah diputuskan sebelumnya atau status berubah", "CONFLICT");
    }

    await audit(tx, ctx, "UPDATE", "student_profile_change_requests", requestId, reqRecord, updatedReq);
    return updatedReq;
  });
}

// --- Import Preview & Commit (FIN-005) ---

export type ImportRowPreview = {
  rowNum: number;
  nis: string;
  nisn: string | null;
  nik: string | null;
  familyCardNumber: string | null;
  name: string;
  gender: string;
  birthPlace: string | null;
  birthDate: string | null;
  className: string | null;
  resolvedClassId: string | null;
  fatherName: string | null;
  motherName: string | null;
  guardianPhone: string | null;
  address: string | null;
  enrolledOn: string | null;
  isValid: boolean;
  errors: string[];
};

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim() === "") {
    throw new HttpError(
      500,
      "Konfigurasi server tidak lengkap: AUTH_SECRET wajib diset",
      "CONFIG_ERROR",
    );
  }
  return secret;
}

export function generateImportPreviewToken(
  actorId: string,
  validRows: any[],
): string {
  const secret = getAuthSecret();
  const contentHash = createHash("sha256")
    .update(JSON.stringify(validRows))
    .digest("hex");
  const expiry = Date.now() + 15 * 60 * 1000; // 15 mins
  const payloadStr = `${actorId}:${contentHash}:${validRows.length}:${expiry}`;
  const signature = createHmac("sha256", secret).update(payloadStr).digest("hex");
  return Buffer.from(`${payloadStr}:${signature}`).toString("base64url");
}

export function verifyImportPreviewToken(
  token: string,
  actorId: string,
  rows: any[],
): boolean {
  const secret = getAuthSecret();
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 5) return false;
    const [
      tokenActorId,
      tokenContentHash,
      tokenRowCount,
      tokenExpiryStr,
      signature,
    ] = parts;
    if (tokenActorId !== actorId) return false;
    const expiry = Number(tokenExpiryStr);
    if (isNaN(expiry) || expiry < Date.now()) return false;
    const payloadStr = `${tokenActorId}:${tokenContentHash}:${tokenRowCount}:${tokenExpiryStr}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(payloadStr)
      .digest("hex");
    if (signature !== expectedSignature) return false;
    const actualHash = createHash("sha256")
      .update(JSON.stringify(rows))
      .digest("hex");
    return actualHash === tokenContentHash;
  } catch {
    return false;
  }
}

export async function previewStudentImport(
  db: Database,
  actor: Actor,
  inputRows: Array<Record<string, string>>,
) {
  allow(actor, "master");

  const existingStudents = await db
    .select({
      id: s.students.id,
      nis: s.students.nis,
      nisn: s.students.nisn,
      nik: s.students.nik,
    })
    .from(s.students);

  const existingNisSet = new Set(
    existingStudents.map((st) => st.nis.trim().toLowerCase()),
  );
  const existingNisnSet = new Set(
    existingStudents
      .filter((st) => st.nisn)
      .map((st) => st.nisn!.trim().toLowerCase()),
  );
  const existingNikSet = new Set(
    existingStudents
      .filter((st) => st.nik)
      .map((st) => st.nik!.trim().toLowerCase()),
  );

  const activeYears = await db
    .select({ id: s.academicYears.id })
    .from(s.academicYears)
    .where(eq(s.academicYears.active, true));
  const activeYearIds = new Set(activeYears.map((y) => y.id));

  const classes = await db.select().from(s.classes);
  const classesByName = new Map<string, typeof classes>();
  for (const c of classes) {
    const key = c.name.trim().toLowerCase();
    if (!classesByName.has(key)) classesByName.set(key, []);
    classesByName.get(key)!.push(c);
  }

  const fileNisSet = new Set<string>();
  const fileNisnSet = new Set<string>();
  const fileNikSet = new Set<string>();
  const previewRows: ImportRowPreview[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  for (let i = 0; i < inputRows.length; i++) {
    const raw = inputRows[i];
    const rowNum = i + 1;
    const errors: string[] = [];

    const nis = (raw["NIS"] || raw["NO_INDUK"] || raw["nis"] || "").trim();
    const nisn = (raw["NISN"] || raw["nisn"] || "").trim() || null;
    const nik = (raw["NIK"] || raw["nik"] || "").trim() || null;
    const familyCardNumber =
      (raw["NO_KK"] || raw["KK"] || raw["familyCardNumber"] || "").trim() ||
      null;
    const name = (
      raw["NAMA_LENGKAP"] ||
      raw["NAMA"] ||
      raw["name"] ||
      ""
    ).trim();

    const rawGender = (
      raw["JENIS_KELAMIN"] ||
      raw["JK"] ||
      raw["gender"] ||
      ""
    )
      .trim()
      .toUpperCase();
    let gender: string = "";
    if (
      rawGender === "LAKI-LAKI" ||
      rawGender === "PRIA" ||
      rawGender === "L"
    ) {
      gender = "L";
    } else if (
      rawGender === "PEREMPUAN" ||
      rawGender === "WANITA" ||
      rawGender === "P"
    ) {
      gender = "P";
    } else if (!rawGender) {
      errors.push("Jenis kelamin wajib diisi");
    } else {
      errors.push(`Jenis kelamin "${rawGender}" tidak valid (harus L atau P)`);
    }

    const birthPlace =
      (raw["TEMPAT_LAHIR"] || raw["birthPlace"] || "").trim() || null;
    const birthDate =
      (raw["TANGGAL_LAHIR"] || raw["birthDate"] || "").trim() || null;
    const className = (raw["KELAS"] || raw["className"] || "").trim() || null;
    const fatherName =
      (raw["NAMA_AYAH"] || raw["AYAH"] || raw["fatherName"] || "").trim() ||
      null;
    const motherName =
      (raw["NAMA_IBU"] || raw["IBU"] || raw["motherName"] || "").trim() ||
      null;
    const guardianPhone =
      (raw["NO_HP_WALI"] || raw["HP"] || raw["guardianPhone"] || "").trim() ||
      null;
    const address = (raw["ALAMAT"] || raw["address"] || "").trim() || null;

    // Parse enrolledOn date
    const rawEnrolledOn = (
      raw["TANGGAL_MASUK"] ||
      raw["TANGGAL_DITERIMA"] ||
      raw["MASUK"] ||
      raw["enrolledOn"] ||
      ""
    ).trim();

    let enrolledOn: string = todayStr;
    if (rawEnrolledOn) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawEnrolledOn)) {
        const d = new Date(rawEnrolledOn + "T00:00:00Z");
        if (!isNaN(d.getTime())) {
          enrolledOn = rawEnrolledOn;
        } else {
          errors.push(`Format tanggal masuk "${rawEnrolledOn}" tidak valid`);
        }
      } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(rawEnrolledOn)) {
        const parts = rawEnrolledOn.split(/[/-]/);
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        const iso = `${year}-${month}-${day}`;
        const d = new Date(iso + "T00:00:00Z");
        if (!isNaN(d.getTime())) {
          enrolledOn = iso;
        } else {
          errors.push(`Format tanggal masuk "${rawEnrolledOn}" tidak valid`);
        }
      } else if (/^\d+$/.test(rawEnrolledOn)) {
        const serial = Number(rawEnrolledOn);
        if (serial > 10000 && serial < 100000) {
          const utcDays = Math.floor(serial - 25569);
          const utcValue = utcDays * 86400;
          const dateInfo = new Date(utcValue * 1000);
          enrolledOn = dateInfo.toISOString().split("T")[0];
        } else {
          errors.push(`Serial tanggal masuk "${rawEnrolledOn}" tidak valid`);
        }
      } else {
        errors.push(
          `Format tanggal masuk "${rawEnrolledOn}" tidak valid (gunakan DD/MM/YYYY atau YYYY-MM-DD)`,
        );
      }
    }

    if (!nis) {
      errors.push("NIS wajib diisi");
    } else {
      const lowerNis = nis.toLowerCase();
      if (fileNisSet.has(lowerNis)) {
        errors.push(`NIS ${nis} duplikat di dalam berkas`);
      } else if (existingNisSet.has(lowerNis)) {
        errors.push(`NIS ${nis} sudah terdaftar di sistem`);
      }
      fileNisSet.add(lowerNis);
    }

    if (!name) {
      errors.push("Nama siswa wajib diisi");
    }

    if (nisn) {
      if (!/^\d{10}$/.test(nisn)) {
        errors.push("NISN harus tepat 10 digit");
      } else {
        const lowerNisn = nisn.toLowerCase();
        if (fileNisnSet.has(lowerNisn)) {
          errors.push(`NISN ${nisn} duplikat di dalam berkas`);
        } else if (existingNisnSet.has(lowerNisn)) {
          errors.push(`NISN ${nisn} sudah terdaftar di sistem`);
        }
        fileNisnSet.add(lowerNisn);
      }
    }

    if (nik) {
      if (!/^\d{16}$/.test(nik)) {
        errors.push("NIK harus tepat 16 digit angka");
      } else {
        const lowerNik = nik.toLowerCase();
        if (fileNikSet.has(lowerNik)) {
          errors.push(`NIK ${nik} duplikat di dalam berkas`);
        } else if (existingNikSet.has(lowerNik)) {
          errors.push(`NIK ${nik} sudah terdaftar di sistem`);
        }
        fileNikSet.add(lowerNik);
      }
    }

    if (familyCardNumber && !/^\d{16}$/.test(familyCardNumber)) {
      errors.push("Nomor Kartu Keluarga harus tepat 16 digit angka");
    }

    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      errors.push("Format tanggal lahir harus YYYY-MM-DD");
    }

    let resolvedClassId: string | null = null;
    if (!className) {
      errors.push("Nama kelas wajib diisi");
    } else {
      const matches = classesByName.get(className.toLowerCase()) || [];
      if (matches.length === 0) {
        errors.push(
          `Kelas "${className}" tidak ditemukan pada daftar kelas aktif`,
        );
      } else if (matches.length === 1) {
        resolvedClassId = matches[0].id;
      } else {
        const inActiveYear = matches.filter(
          (c) => c.academicYearId && activeYearIds.has(c.academicYearId),
        );
        if (inActiveYear.length === 1) {
          resolvedClassId = inActiveYear[0].id;
        } else if (inActiveYear.length > 1) {
          errors.push(
            `Kelas "${className}" bersifat ambigu (terdapat lebih dari 1 kelas dengan nama sama pada tahun ajaran aktif). Harap periksa konfigurasi kelas.`,
          );
        } else {
          errors.push(
            `Kelas "${className}" bersifat ambigu (terdapat di beberapa tahun ajaran dan tidak ada yang berada pada tahun ajaran aktif). Harap periksa konfigurasi kelas.`,
          );
        }
      }
    }

    previewRows.push({
      rowNum,
      nis,
      nisn,
      nik,
      familyCardNumber,
      name,
      gender,
      birthPlace,
      birthDate,
      className,
      resolvedClassId,
      fatherName,
      motherName,
      guardianPhone,
      address,
      enrolledOn,
      isValid: errors.length === 0,
      errors,
    });
  }

  const validRows = previewRows.filter((r) => r.isValid);
  const previewToken = generateImportPreviewToken(actor.id, validRows);

  return {
    previewToken,
    totalRows: previewRows.length,
    validRowsCount: validRows.length,
    invalidRowsCount: previewRows.length - validRows.length,
    rows: previewRows,
  };
}

export const commitImportSchema = z.object({
  token: z.string().min(1, "Preview token wajib disertakan"),
  rows: z
    .array(
      z.object({
        rowNum: z.number().int().positive(),
        nis: z.string().min(1),
        nisn: z.string().nullable().optional(),
        nik: z.string().nullable().optional(),
        familyCardNumber: z.string().nullable().optional(),
        name: z.string().min(1),
        gender: z.string().min(1),
        birthPlace: z.string().nullable().optional(),
        birthDate: z.string().nullable().optional(),
        className: z.string().nullable().optional(),
        resolvedClassId: z.string().nullable().optional(),
        fatherName: z.string().nullable().optional(),
        motherName: z.string().nullable().optional(),
        guardianPhone: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        enrolledOn: z.string().nullable().optional(),
        isValid: z.boolean().optional(),
        errors: z.array(z.string()).optional(),
      }),
    )
    .min(1, "Data baris import tidak boleh kosong"),
});

export async function commitStudentImport(
  db: Database,
  ctx: Context,
  input: unknown,
) {
  allow(ctx.actor, "master");
  const parsed = commitImportSchema.parse(input);

  if (!verifyImportPreviewToken(parsed.token, ctx.actor.id, parsed.rows)) {
    throw new HttpError(
      403,
      "Token preview import tidak valid, telah kedaluwarsa, atau tidak cocok dengan data",
      "INVALID_PREVIEW_TOKEN",
    );
  }

  // Persistent token replay protection via audit logs
  const tokenHash = createHash("sha256").update(parsed.token).digest("hex");
  const [alreadyUsed] = await db
    .select({ id: s.auditLogs.id })
    .from(s.auditLogs)
    .where(
      and(
        eq(s.auditLogs.entity, "student_import_token"),
        eq(s.auditLogs.entityId, tokenHash),
      ),
    )
    .limit(1);

  if (alreadyUsed) {
    throw new HttpError(
      409,
      "Token preview import ini sudah pernah digunakan (replay detected). Silakan lakukan preview ulang.",
      "TOKEN_ALREADY_USED",
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return await db.transaction(async (tx) => {
    // Record token usage persistently to prevent concurrent / subsequent replay
    await tx.insert(s.auditLogs).values({
      userId: ctx.actor.id,
      action: "IMPORT_COMMITTED",
      entity: "student_import_token",
      entityId: tokenHash,
      after: {
        rowCount: parsed.rows.length,
        status: "USED",
        usedAt: new Date().toISOString(),
      },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    let createdCount = 0;
    const createdIds: string[] = [];
    const errors: Array<{ rowNum: number; message: string }> = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      if (!row.resolvedClassId) {
        errors.push({
          rowNum: row.rowNum,
          message: "Kelas belum ditentukan untuk baris ini",
        });
        continue;
      }

      // Safe server-generated savepoint identifier (eliminates raw client input in SQL)
      const spName = `sp_imp_${i}`;
      await tx.execute(sql.raw(`SAVEPOINT ${spName}`));
      try {
        // Re-check NIS uniqueness
        const [existing] = await tx
          .select({ id: s.students.id })
          .from(s.students)
          .where(eq(s.students.nis, row.nis))
          .limit(1);

        if (existing) {
          throw new HttpError(
            409,
            `NIS ${row.nis} sudah terdaftar pada database`,
          );
        }

        const [student] = await tx
          .insert(s.students)
          .values({
            name: row.name,
            nis: row.nis,
            nisn: row.nisn,
            nik: row.nik || null,
            familyCardNumber: row.familyCardNumber || null,
            gender: row.gender === "P" ? "P" : "L",
            birthPlace: row.birthPlace,
            birthDate: row.birthDate,
            classId: row.resolvedClassId,
            enrolledOn: row.enrolledOn || todayStr,
            active: true,
            studentStatus: "ACTIVE",
          })
          .returning();

        // Add identity address if provided
        if (row.address) {
          await tx.insert(s.studentAddresses).values({
            studentId: student.id,
            addressType: "IDENTITY",
            address: row.address,
          });
        }

        // Add enrollment record
        await tx.insert(s.studentEnrollments).values({
          studentId: student.id,
          classId: row.resolvedClassId,
          registrationType: "NEW_STUDENT",
          registrationDate: row.enrolledOn || todayStr,
          enrollmentDate: row.enrolledOn || todayStr,
          enrollmentStatus: "ACTIVE",
        });

        // Add father if provided
        if (row.fatherName) {
          const [father] = await tx
            .insert(s.familyMembers)
            .values({
              fullName: row.fatherName,
              phone: row.guardianPhone,
              address: row.address,
              lifeStatus: "ALIVE",
            })
            .returning();

          await tx.insert(s.studentFamilyMembers).values({
            studentId: student.id,
            familyMemberId: father.id,
            relationshipType: "FATHER",
            isPrimaryContact: true,
            isPaymentResponsible: true,
            isEmergencyContact: false,
          });
        }

        // Add mother if provided
        if (row.motherName) {
          const [mother] = await tx
            .insert(s.familyMembers)
            .values({
              fullName: row.motherName,
              address: row.address,
              lifeStatus: "ALIVE",
            })
            .returning();

          await tx.insert(s.studentFamilyMembers).values({
            studentId: student.id,
            familyMemberId: mother.id,
            relationshipType: "MOTHER",
            isPrimaryContact: !row.fatherName,
            isPaymentResponsible: !row.fatherName,
            isEmergencyContact: false,
          });
        }

        await tx.execute(sql.raw(`RELEASE SAVEPOINT ${spName}`));
        createdIds.push(student.id);
        createdCount++;
      } catch (err: any) {
        await tx.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${spName}`));
        errors.push({
          rowNum: row.rowNum,
          message: err?.message || "Gagal mengimpor siswa",
        });
      }
    }

    await audit(tx, ctx, "IMPORT", "students", undefined, undefined, {
      total: parsed.rows.length,
      createdCount,
      failedCount: errors.length,
    });

    return {
      success: true,
      createdCount,
      failedCount: errors.length,
      skippedCount: parsed.rows.length - createdCount - errors.length,
      createdIds,
      errors,
    };
  });
}

export function generateStudentImportTemplateXlsx(): Uint8Array {
  const wb = XLSX.utils.book_new();
  const headers = [
    "NIS",
    "NISN",
    "NIK",
    "NO_KK",
    "NAMA_LENGKAP",
    "JENIS_KELAMIN",
    "TEMPAT_LAHIR",
    "TANGGAL_LAHIR",
    "KELAS",
    "NAMA_AYAH",
    "NAMA_IBU",
    "NO_HP_WALI",
    "ALAMAT",
  ];
  const sampleRow = [
    "262701099",
    "0158912345",
    "3201011505180001",
    "3201012001150002",
    "Ahmad Fauzan Al-Baqir",
    "L",
    "Bogor",
    "2018-05-14",
    "1-A Abu Bakar",
    "Muhammad Ridwan",
    "Siti Nurhaliza",
    "081234567890",
    "Jl. Pasirangin No. 12 RT 02/03",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export async function getStudentsCompletenessSummary(
  db: Database,
  actor: Actor,
  classId?: string,
) {
  allow(actor, "read");
  try {
    const studentQuery = classId
      ? db.select().from(s.students).where(eq(s.students.classId, classId))
      : db.select().from(s.students);
    const allStudents = await studentQuery;
    if (allStudents.length === 0) return {};

    const studentIds = allStudents.map((st) => st.id);

    // Bulk query all sections without N+1
    const [addresses, family, health, aid, chars, docs] = await Promise.all([
      db
        .select()
        .from(s.studentAddresses)
        .where(inArray(s.studentAddresses.studentId, studentIds)),
      db
        .select({
          studentId: s.studentFamilyMembers.studentId,
          relationshipType: s.studentFamilyMembers.relationshipType,
          isPrimaryContact: s.studentFamilyMembers.isPrimaryContact,
          isPaymentResponsible: s.studentFamilyMembers.isPaymentResponsible,
          isEmergencyContact: s.studentFamilyMembers.isEmergencyContact,
          fullName: s.familyMembers.fullName,
          phone: s.familyMembers.phone,
          lifeStatus: s.familyMembers.lifeStatus,
        })
        .from(s.studentFamilyMembers)
        .leftJoin(
          s.familyMembers,
          eq(s.studentFamilyMembers.familyMemberId, s.familyMembers.id),
        )
        .where(inArray(s.studentFamilyMembers.studentId, studentIds)),
      db
        .select()
        .from(s.studentHealthProfiles)
        .where(inArray(s.studentHealthProfiles.studentId, studentIds)),
      db
        .select()
        .from(s.studentAidRecords)
        .where(inArray(s.studentAidRecords.studentId, studentIds)),
      db
        .select()
        .from(s.characteristicSubmissions)
        .where(inArray(s.characteristicSubmissions.studentId, studentIds)),
      db
        .select()
        .from(s.studentDocuments)
        .where(inArray(s.studentDocuments.studentId, studentIds)),
    ]);

    const addrMap = new Map<string, any[]>();
    for (const a of addresses) {
      if (!addrMap.has(a.studentId)) addrMap.set(a.studentId, []);
      addrMap.get(a.studentId)!.push(a);
    }

    const familyMap = new Map<string, any[]>();
    for (const f of family) {
      if (!familyMap.has(f.studentId)) familyMap.set(f.studentId, []);
      familyMap.get(f.studentId)!.push(f);
    }

    const healthMap = new Map<string, any>();
    for (const h of health) {
      healthMap.set(h.studentId, h);
    }

    const aidMap = new Map<string, any[]>();
    for (const a of aid) {
      if (!aidMap.has(a.studentId)) aidMap.set(a.studentId, []);
      aidMap.get(a.studentId)!.push(a);
    }

    const charMap = new Map<string, any>();
    for (const c of chars) {
      charMap.set(c.studentId, c);
    }

    const docMap = new Map<string, any[]>();
    for (const d of docs) {
      if (!docMap.has(d.studentId)) docMap.set(d.studentId, []);
      docMap.get(d.studentId)!.push(d);
    }

    const summaryMap: Record<
      string,
      { percentage: number; isComplete: boolean; missingCount: number }
    > = {};
    for (const st of allStudents) {
      const studentFamily = familyMap.get(st.id) || [];
      const father = studentFamily.find((f) => f.relationshipType === "FATHER");
      const mother = studentFamily.find((f) => f.relationshipType === "MOTHER");
      const emergency = studentFamily.find((f) => f.isEmergencyContact);

      const comp = calculateStudentCompleteness({
        student: st,
        registration: {
          classId: st.classId,
          enrolledOn: st.enrolledOn,
        },
        addresses: addrMap.get(st.id) || [],
        father: father
          ? { fullName: father.fullName, lifeStatus: father.lifeStatus }
          : undefined,
        mother: mother
          ? { fullName: mother.fullName, lifeStatus: mother.lifeStatus }
          : undefined,
        emergencyContact: emergency
          ? { name: emergency.fullName, phone: emergency.phone }
          : undefined,
        health: healthMap.get(st.id),
        aidRecords: aidMap.get(st.id) || [],
        characteristic: charMap.has(st.id)
          ? { status: "FILLED" }
          : { status: "EMPTY" },
        documents: docMap.get(st.id) || [],
      });

      summaryMap[st.id] = {
        percentage: comp.percentage,
        isComplete: comp.isComplete,
        missingCount: comp.missingFields.length,
      };
    }
    return summaryMap;
  } catch (err) {
    if (isSchemaNotReady(err)) {
      throw new HttpError(
        503,
        "Skema database Master Siswa belum siap",
        "SCHEMA_NOT_READY",
      );
    }
    throw err;
  }
}
