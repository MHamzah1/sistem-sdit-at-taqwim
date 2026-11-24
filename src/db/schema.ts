import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  check,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";
const id = () => uuid("id").defaultRandom().primaryKey();
const times = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const invoiceStatus = pgEnum("invoice_status", [
  "UNPAID",
  "PENDING_VERIFICATION",
  "PAID",
  "OVERDUE",
]);
export const paymentStatus = pgEnum("payment_status", [
  "PENDING_VERIFICATION",
  "APPROVED",
  "REJECTED",
]);
export const eligibilityStatus = pgEnum("eligibility_status", [
  "NOT_EVALUATED",
  "NOT_ELIGIBLE",
  "ELIGIBLE",
  "ELIGIBLE_DISPENSATION",
]);
export const dispensationStatus = pgEnum("dispensation_status", [
  "SUBMITTED",
  "REVIEWED",
  "APPROVED",
  "REJECTED",
]);
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").default(true).notNull(),
  ...times(),
});
export const roles = pgTable("roles", {
  id: id(),
  code: text("code").notNull().unique(),
  ...times(),
});
export const permissions = pgTable("permissions", {
  id: id(),
  code: text("code").notNull().unique(),
  ...times(),
});
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id)
      .notNull(),
    ...times(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .references(() => roles.id)
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permissions.id)
      .notNull(),
    ...times(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);
export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...times(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").default(0).notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});
export const academicYears = pgTable(
  "academic_years",
  {
    id: id(),
    name: text("name").notNull().unique(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    active: boolean("active").default(true).notNull(),
    ...times(),
  },
  (t) => [check("year_dates", sql`${t.endDate} >= ${t.startDate}`)],
);
export const classes = pgTable(
  "classes",
  {
    id: id(),
    name: text("name").notNull(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull(),
    ...times(),
  },
  (t) => [uniqueIndex("class_year_name").on(t.academicYearId, t.name)],
);
export const guardians = pgTable("guardians", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id)
    .unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  ...times(),
});
export const students = pgTable(
  "students",
  {
    id: id(),
    nis: text("nis").notNull().unique(),
    nisn: text("nisn"),
    name: text("name").notNull(),
    gender: text("gender"),
    birthPlace: text("birth_place"),
    birthDate: date("birth_date"),
    photoUrl: text("photo_url"),
    classId: uuid("class_id")
      .references(() => classes.id)
      .notNull(),
    enrolledOn: date("enrolled_on").notNull(),
    active: boolean("active").default(true).notNull(),
    ...times(),
  },
  (t) => [
    index("students_class_idx").on(t.classId),
    check(
      "student_gender_check",
      sql`${t.gender} IS NULL OR ${t.gender} IN ('L', 'P')`,
    ),
  ],
);
export const guardianStudents = pgTable(
  "guardian_students",
  {
    guardianId: uuid("guardian_id")
      .references(() => guardians.id)
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    ...times(),
  },
  (t) => [
    primaryKey({ columns: [t.guardianId, t.studentId] }),
    index("guardian_student_idx").on(t.studentId),
  ],
);
export const sppConfigs = pgTable(
  "spp_configs",
  {
    id: id(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull()
      .unique(),
    amount: integer("amount").notNull(),
    dueDay: integer("due_day").default(10).notNull(),
    ...times(),
  },
  (t) => [
    check("spp_positive", sql`${t.amount} > 0`),
    check("spp_due_day", sql`${t.dueDay} BETWEEN 1 AND 28`),
  ],
);
export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull(),
    month: date("month").notNull(),
    dueDate: date("due_date").notNull(),
    amount: integer("amount").notNull(),
    status: invoiceStatus("status").default("UNPAID").notNull(),
    ...times(),
  },
  (t) => [
    uniqueIndex("invoice_student_year_month").on(
      t.studentId,
      t.academicYearId,
      t.month,
    ),
    index("invoice_status_month_idx").on(t.status, t.month),
    check("invoice_positive", sql`${t.amount} > 0`),
    check("invoice_month_start", sql`extract(day from ${t.month}) = 1`),
  ],
);
export const payments = pgTable(
  "payments",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id)
      .notNull(),
    idempotencyKey: uuid("idempotency_key").notNull().unique(),
    amount: integer("amount").notNull(),
    method: text("method").notNull(),
    status: paymentStatus("status").notNull(),
    paidOn: date("paid_on").notNull(),
    notes: text("notes"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewReason: text("review_reason"),
    ...times(),
  },
  (t) => [
    check("payment_method", sql`${t.method} in ('CASH','TRANSFER')`),
    check("payment_positive", sql`${t.amount} > 0`),
    index("payment_student_idx").on(t.studentId),
  ],
);
export const paymentInvoiceItems = pgTable(
  "payment_invoice_items",
  {
    paymentId: uuid("payment_id")
      .references(() => payments.id)
      .notNull(),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id)
      .notNull(),
    amount: integer("amount").notNull(),
    ...times(),
  },
  (t) => [
    primaryKey({ columns: [t.paymentId, t.invoiceId] }),
    index("payment_invoice_idx").on(t.invoiceId),
  ],
);
export const paymentProofs = pgTable(
  "payment_proofs",
  {
    id: id(),
    paymentId: uuid("payment_id")
      .references(() => payments.id)
      .unique(),
    url: text("url").notNull().unique(),
    pathname: text("pathname").notNull().unique(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    uploaderId: uuid("uploader_id")
      .references(() => users.id)
      .notNull(),
    metadata: jsonb("metadata"),
    ...times(),
  },
  (t) => [check("proof_size", sql`${t.size} > 0 and ${t.size} <= 5242880`)],
);
export const examTypes = pgTable("exam_types", {
  id: id(),
  name: text("name").notNull().unique(),
  ...times(),
});
export const examPeriods = pgTable(
  "exam_periods",
  {
    id: id(),
    name: text("name").notNull(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull(),
    examTypeId: uuid("exam_type_id")
      .references(() => examTypes.id)
      .notNull(),
    semester: integer("semester").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    administrativeDeadline: date("administrative_deadline").notNull(),
    requiredUntilMonth: date("required_until_month").notNull(),
    guardianDownload: boolean("guardian_download").default(false).notNull(),
    ...times(),
  },
  (t) => [
    check("exam_semester", sql`${t.semester} IN (1,2)`),
    check("exam_dates", sql`${t.endDate} >= ${t.startDate}`),
  ],
);
export const studentExamEligibilities = pgTable(
  "student_exam_eligibilities",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    examPeriodId: uuid("exam_period_id")
      .references(() => examPeriods.id)
      .notNull(),
    status: eligibilityStatus("status").default("NOT_EVALUATED").notNull(),
    reason: text("reason").notNull(),
    ...times(),
  },
  (t) => [
    uniqueIndex("eligibility_student_exam").on(t.studentId, t.examPeriodId),
  ],
);
export const dispensations = pgTable(
  "dispensations",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    examPeriodId: uuid("exam_period_id")
      .references(() => examPeriods.id)
      .notNull(),
    requestedBy: uuid("requested_by")
      .references(() => users.id)
      .notNull(),
    reason: text("reason").notNull(),
    status: dispensationStatus("status").default("SUBMITTED").notNull(),
    ...times(),
  },
  (t) => [
    uniqueIndex("dispensation_student_exam").on(t.studentId, t.examPeriodId),
  ],
);
export const dispensationReviews = pgTable("dispensation_reviews", {
  id: id(),
  dispensationId: uuid("dispensation_id")
    .references(() => dispensations.id)
    .notNull(),
  reviewerId: uuid("reviewer_id")
    .references(() => users.id)
    .notNull(),
  action: text("action").notNull(),
  notes: text("notes").notNull(),
  ...times(),
});
export const paymentPromises = pgTable(
  "payment_promises",
  {
    id: id(),
    dispensationId: uuid("dispensation_id")
      .references(() => dispensations.id)
      .notNull()
      .unique(),
    amount: integer("amount").notNull(),
    promisedOn: date("promised_on").notNull(),
    ...times(),
  },
  (t) => [check("promise_amount", sql`${t.amount} >= 0`)],
);
export const examCards = pgTable(
  "exam_cards",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    examPeriodId: uuid("exam_period_id")
      .references(() => examPeriods.id)
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id)
      .notNull(),
    verificationCode: uuid("verification_code")
      .defaultRandom()
      .notNull()
      .unique(),
    ...times(),
  },
  (t) => [uniqueIndex("card_student_exam").on(t.studentId, t.examPeriodId)],
);
export const characteristicFormTemplates = pgTable(
  "characteristic_form_templates",
  {
    id: id(),
    name: text("name").notNull(),
    deadline: date("deadline").notNull(),
    active: boolean("active").default(true).notNull(),
    ...times(),
  },
);
export const characteristicFormFields = pgTable("characteristic_form_fields", {
  id: id(),
  templateId: uuid("template_id")
    .references(() => characteristicFormTemplates.id)
    .notNull(),
  label: text("label").notNull(),
  required: boolean("required").default(true).notNull(),
  position: integer("position").notNull(),
  ...times(),
});
export const characteristicSubmissions = pgTable(
  "characteristic_submissions",
  {
    id: id(),
    templateId: uuid("template_id")
      .references(() => characteristicFormTemplates.id)
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    submittedBy: uuid("submitted_by")
      .references(() => users.id)
      .notNull(),
    ...times(),
  },
  (t) => [
    uniqueIndex("submission_template_student").on(t.templateId, t.studentId),
  ],
);
export const characteristicAnswers = pgTable(
  "characteristic_answers",
  {
    id: id(),
    submissionId: uuid("submission_id")
      .references(() => characteristicSubmissions.id)
      .notNull(),
    fieldId: uuid("field_id")
      .references(() => characteristicFormFields.id)
      .notNull(),
    value: text("value").notNull(),
    ...times(),
  },
  (t) => [uniqueIndex("answer_submission_field").on(t.submissionId, t.fieldId)],
);
export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  ...times(),
});
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    ...times(),
  },
  (t) => [
    index("audit_created_idx").on(t.createdAt),
    index("audit_entity_idx").on(t.entity, t.entityId),
  ],
);

export const studentAddresses = pgTable(
  "student_addresses",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    addressType: text("address_type").notNull(),
    address: text("address"),
    rt: text("rt"),
    rw: text("rw"),
    hamlet: text("hamlet"),
    province: text("province"),
    regency: text("regency"),
    district: text("district"),
    village: text("village"),
    postalCode: text("postal_code"),
    residenceType: text("residence_type"),
    transportationType: text("transportation_type"),
    distanceToSchool: numeric("distance_to_school"),
    travelTimeMinutes: integer("travel_time_minutes"),
    ...times(),
  },
  (t) => [index("address_student_idx").on(t.studentId)],
);

export const familyMembers = pgTable(
  "family_members",
  {
    id: id(),
    fullName: text("full_name").notNull(),
    nik: text("nik"),
    birthPlace: text("birth_place"),
    birthDate: date("birth_date"),
    birthYear: integer("birth_year"),
    lifeStatus: text("life_status").default("ALIVE").notNull(),
    education: text("education"),
    occupation: text("occupation"),
    institutionName: text("institution_name"),
    monthlyIncomeRange: text("monthly_income_range"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    ...times(),
  },
  (t) => [index("fam_member_nik_idx").on(t.nik)],
);

export const studentFamilyMembers = pgTable(
  "student_family_members",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    familyMemberId: uuid("family_member_id")
      .references(() => familyMembers.id)
      .notNull(),
    relationshipType: text("relationship_type").notNull(),
    isPrimaryContact: boolean("is_primary_contact").default(false).notNull(),
    isPaymentResponsible: boolean("is_payment_responsible").default(false).notNull(),
    isEmergencyContact: boolean("is_emergency_contact").default(false).notNull(),
    ...times(),
  },
  (t) => [
    index("fam_rel_student_idx").on(t.studentId),
    index("fam_rel_member_idx").on(t.familyMemberId),
  ],
);

export const studentEnrollments = pgTable(
  "student_enrollments",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    registrationNumber: text("registration_number"),
    registrationType: text("registration_type").default("NEW_STUDENT"),
    registrationDate: date("registration_date"),
    acceptedDate: date("accepted_date"),
    enrollmentDate: date("enrollment_date"),
    academicYearId: uuid("academic_year_id").references(() => academicYears.id),
    classId: uuid("class_id").references(() => classes.id),
    entryGrade: integer("entry_grade"),
    attendedPaud: boolean("attended_paud"),
    attendedKindergarten: boolean("attended_kindergarten"),
    previousSchoolName: text("previous_school_name"),
    previousSchoolNpsn: text("previous_school_npsn"),
    previousSchoolAddress: text("previous_school_address"),
    enrollmentStatus: text("enrollment_status").default("ACTIVE").notNull(),
    effectiveStartDate: date("effective_start_date"),
    effectiveEndDate: date("effective_end_date"),
    notes: text("notes"),
    ...times(),
  },
  (t) => [index("enroll_student_idx").on(t.studentId)],
);

export const studentHealthProfiles = pgTable(
  "student_health_profiles",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull()
      .unique(),
    bloodType: text("blood_type"),
    medicalHistory: text("medical_history"),
    foodAllergies: text("food_allergies"),
    drugAllergies: text("drug_allergies"),
    hasSpecialNeeds: boolean("has_special_needs").default(false).notNull(),
    specialNeedsTypes: jsonb("special_needs_types"),
    routineMedication: text("routine_medication"),
    emergencyHandlingNotes: text("emergency_handling_notes"),
    assistanceNeeds: text("assistance_needs"),
    notes: text("notes"),
    ...times(),
  },
  (t) => [index("health_student_idx").on(t.studentId)],
);

export const studentPeriodicData = pgTable(
  "student_periodic_data",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    academicYearId: uuid("academic_year_id").references(() => academicYears.id),
    semester: integer("semester"),
    measurementDate: date("measurement_date").notNull(),
    heightCm: numeric("height_cm"),
    weightKg: numeric("weight_kg"),
    notes: text("notes"),
    recordedBy: uuid("recorded_by").references(() => users.id),
    ...times(),
  },
  (t) => [index("periodic_student_idx").on(t.studentId)],
);

export const studentAidRecords = pgTable(
  "student_aid_records",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    aidType: text("aid_type").notNull(),
    aidNumber: text("aid_number"),
    aidSource: text("aid_source"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    status: text("status").default("ACTIVE").notNull(),
    notes: text("notes"),
    supportingDocumentId: uuid("supporting_document_id"),
    ...times(),
  },
  (t) => [index("aid_student_idx").on(t.studentId)],
);

export const studentDocuments = pgTable(
  "student_documents",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    documentType: text("document_type").notNull(),
    documentName: text("document_name").notNull(),
    documentNumber: text("document_number"),
    storagePath: text("storage_path").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    verificationStatus: text("verification_status").default("PENDING").notNull(),
    verifiedBy: uuid("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    ...times(),
  },
  (t) => [index("doc_student_idx").on(t.studentId)],
);

export const studentDrafts = pgTable(
  "student_drafts",
  {
    id: id(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    data: jsonb("data").notNull(),
    status: text("status").default("DRAFT").notNull(),
    revision: integer("revision").default(1).notNull(),
    finalStudentId: uuid("final_student_id").references(() => students.id),
    ...times(),
  },
  (t) => [index("draft_user_idx").on(t.userId)],
);

export const studentProfileChangeRequests = pgTable(
  "student_profile_change_requests",
  {
    id: id(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    requestedBy: uuid("requested_by")
      .references(() => users.id)
      .notNull(),
    patch: jsonb("patch").notNull(),
    status: text("status").default("SUBMITTED").notNull(),
    revision: integer("revision").default(1).notNull(),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    rejectionReason: text("rejection_reason"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...times(),
  },
  (t) => [index("change_req_student_idx").on(t.studentId)],
);
