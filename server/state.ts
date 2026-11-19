import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { Database } from "../src/db/client";
import * as s from "../src/db/schema";
import { isGuardian, type Actor } from "./security";
export async function readState(db: Database, actor: Actor) {
  const guardianOnly = isGuardian(actor);
  const linked = guardianOnly
    ? await db
        .select({ studentId: s.guardianStudents.studentId })
        .from(s.guardianStudents)
        .innerJoin(
          s.guardians,
          eq(s.guardians.id, s.guardianStudents.guardianId),
        )
        .where(eq(s.guardians.userId, actor.id))
    : [];
  const ids = linked.map((r) => r.studentId);
  const scoped = (column: AnyPgColumn) =>
    guardianOnly ? (ids.length ? inArray(column, ids) : sql`false`) : undefined;
  const students = await db
    .select()
    .from(s.students)
    .where(scoped(s.students.id))
    .orderBy(s.students.name);
  const invoices = await db
    .select()
    .from(s.invoices)
    .where(scoped(s.invoices.studentId))
    .orderBy(desc(s.invoices.month));
  const payments = await db
    .select()
    .from(s.payments)
    .where(scoped(s.payments.studentId))
    .orderBy(desc(s.payments.createdAt));
  const dispensations = await db
    .select()
    .from(s.dispensations)
    .where(scoped(s.dispensations.studentId))
    .orderBy(desc(s.dispensations.createdAt));
  const eligibilities = await db
    .select()
    .from(s.studentExamEligibilities)
    .where(scoped(s.studentExamEligibilities.studentId));
  const guardians = await db
    .select()
    .from(s.guardians)
    .where(guardianOnly ? eq(s.guardians.userId, actor.id) : undefined);
  const guardianStudents = await db
    .select()
    .from(s.guardianStudents)
    .where(
      guardianOnly
        ? and(
            scoped(s.guardianStudents.studentId),
            inArray(
              s.guardianStudents.guardianId,
              guardians.map((g) => g.id),
            ),
          )
        : undefined,
    );
  const academicYears = await db
    .select()
    .from(s.academicYears)
    .orderBy(desc(s.academicYears.startDate));
  const classes = await db.select().from(s.classes).orderBy(s.classes.name);
  const sppConfigs = await db.select().from(s.sppConfigs);
  const exams = await db
    .select()
    .from(s.examPeriods)
    .orderBy(desc(s.examPeriods.startDate));
  const examTypes = await db.select().from(s.examTypes);
  const settings = await db.select().from(s.systemSettings);
  const auditLogs = actor.permissions.includes("audit")
    ? await db
        .select({
          id: s.auditLogs.id,
          userId: s.auditLogs.userId,
          action: s.auditLogs.action,
          entity: s.auditLogs.entity,
          entityId: s.auditLogs.entityId,
          createdAt: s.auditLogs.createdAt,
        })
        .from(s.auditLogs)
        .orderBy(desc(s.auditLogs.createdAt))
        .limit(100)
    : [];
  const users = actor.permissions.includes("users")
    ? await db
        .select({
          id: s.users.id,
          name: s.users.name,
          email: s.users.email,
          active: s.users.active,
        })
        .from(s.users)
    : [];
  const proofs = payments.length
    ? await db
        .select({
          id: s.paymentProofs.id,
          paymentId: s.paymentProofs.paymentId,
          filename: s.paymentProofs.filename,
          mimeType: s.paymentProofs.mimeType,
          size: s.paymentProofs.size,
        })
        .from(s.paymentProofs)
        .where(
          inArray(
            s.paymentProofs.paymentId,
            payments.map((p) => p.id),
          ),
        )
    : [];
  const paymentItems = payments.length
    ? await db
        .select({
          paymentId: s.paymentInvoiceItems.paymentId,
          invoiceId: s.paymentInvoiceItems.invoiceId,
          amount: s.paymentInvoiceItems.amount,
        })
        .from(s.paymentInvoiceItems)
        .where(
          inArray(
            s.paymentInvoiceItems.paymentId,
            payments.map((p) => p.id),
          ),
        )
    : [];
  const templates = await db.select().from(s.characteristicFormTemplates);
  const fields = await db
    .select()
    .from(s.characteristicFormFields)
    .orderBy(s.characteristicFormFields.position);
  const submissions = await db
    .select()
    .from(s.characteristicSubmissions)
    .where(scoped(s.characteristicSubmissions.studentId));
  const answers = submissions.length
    ? await db
        .select()
        .from(s.characteristicAnswers)
        .where(
          inArray(
            s.characteristicAnswers.submissionId,
            submissions.map((v) => v.id),
          ),
        )
    : [];
  const promises = dispensations.length
    ? await db
        .select()
        .from(s.paymentPromises)
        .where(
          inArray(
            s.paymentPromises.dispensationId,
            dispensations.map((d) => d.id),
          ),
        )
    : [];
  const reviews = dispensations.length
    ? await db
        .select()
        .from(s.dispensationReviews)
        .where(
          inArray(
            s.dispensationReviews.dispensationId,
            dispensations.map((d) => d.id),
          ),
        )
    : [];
  const examCards = await db
    .select()
    .from(s.examCards)
    .where(scoped(s.examCards.studentId));
  return {
    actor,
    students,
    invoices,
    payments,
    dispensations,
    eligibilities,
    guardians,
    guardianStudents,
    academicYears,
    classes,
    sppConfigs,
    exams,
    examTypes,
    settings,
    auditLogs,
    users,
    proofs,
    paymentItems,
    templates,
    fields,
    submissions,
    answers,
    promises,
    reviews,
    examCards,
  };
}
export type AppState = Awaited<ReturnType<typeof readState>>;
