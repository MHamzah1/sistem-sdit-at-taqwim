import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Database, Transaction } from '../src/db/client';
import * as s from '../src/db/schema';
import { allow, audit, HttpError, isGuardian, ownStudent, requireValue, type Context } from './security';
export const uuid = z.string().uuid();
export const date = z.iso.date();
export const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/);
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
export function monthsBetween(start: string, end: string): string[] { const result: string[] = []; let m = start.slice(0, 7) + '-01'; while (m <= end) { result.push(m); const d = new Date(m + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); m = d.toISOString().slice(0, 10); if (result.length > 240) throw new HttpError(422, 'Rentang tahun ajaran terlalu panjang'); } return result; }
export function evaluate(required: string[], invoices: { month: string; status: string }[], approvedDispensation: boolean) {
  const missing = required.filter(m => !invoices.some(i => i.month === m));
  const unpaid = invoices.filter(i => i.status !== 'PAID');
  if (!missing.length && !unpaid.length && required.length) return { status: 'ELIGIBLE' as const, reason: 'Seluruh invoice wajib lunas' };
  if (approvedDispensation) return { status: 'ELIGIBLE_DISPENSATION' as const, reason: 'Dispensasi disetujui Kepala Sekolah; tagihan tetap berlaku' };
  return { status: 'NOT_ELIGIBLE' as const, reason: `${missing.length} invoice wajib belum terbit; ${unpaid.length} invoice belum lunas` };
}
export async function lockStudent(tx: Transaction, studentId: string) { return requireValue((await tx.select().from(s.students).where(eq(s.students.id, studentId)).for('update'))[0]); }
export async function recalculate(tx: Transaction, studentId: string, examId?: string) {
  const student = requireValue((await tx.select().from(s.students).where(eq(s.students.id, studentId)))[0]);
  const classroom = requireValue((await tx.select().from(s.classes).where(eq(s.classes.id, student.classId)))[0]);
  const exams = await tx.select().from(s.examPeriods).where(examId ? eq(s.examPeriods.id, examId) : eq(s.examPeriods.academicYearId, classroom.academicYearId));
  const results = [];
  for (const exam of exams) {
    if (exam.academicYearId !== classroom.academicYearId) throw new HttpError(422, 'Tahun ajaran siswa tidak sesuai periode ujian');
    const year = requireValue((await tx.select().from(s.academicYears).where(eq(s.academicYears.id, exam.academicYearId)))[0]);
    const start = student.enrolledOn > year.startDate ? student.enrolledOn : year.startDate;
    const required = monthsBetween(start, exam.requiredUntilMonth);
    // Include old outstanding invoices, including those from previous academic years.
    const invoices = await tx.select().from(s.invoices).where(and(eq(s.invoices.studentId, studentId), lte(s.invoices.month, exam.requiredUntilMonth)));
    const dispensation = await tx.select().from(s.dispensations).where(and(eq(s.dispensations.studentId, studentId), eq(s.dispensations.examPeriodId, exam.id), eq(s.dispensations.status, 'APPROVED')));
    const result = evaluate(required, invoices, dispensation.length > 0);
    const values = { studentId, examPeriodId: exam.id, ...result, updatedAt: new Date() };
    const [saved] = await tx.insert(s.studentExamEligibilities).values(values).onConflictDoUpdate({ target: [s.studentExamEligibilities.studentId, s.studentExamEligibilities.examPeriodId], set: values }).returning();
    results.push(saved);
  }
  return results;
}
export const paymentInput = z.object({ studentId: uuid, invoiceIds: z.array(uuid).min(1).max(60).refine(v => new Set(v).size === v.length), method: z.enum(['CASH', 'TRANSFER']), paidOn: date, notes: z.string().trim().max(2000).optional(), proofId: uuid.optional(), idempotencyKey: uuid }).strict();
export async function createPayment(db: Database, ctx: Context, input: unknown) {
  const data = paymentInput.parse(input);
  if (!isGuardian(ctx.actor)) allow(ctx.actor, 'finance');
  if (isGuardian(ctx.actor) && data.method !== 'TRANSFER') throw new HttpError(403, 'Wali hanya dapat membayar melalui transfer');
  if (data.paidOn > today()) throw new HttpError(422, 'Tanggal pembayaran tidak boleh di masa depan');
  return db.transaction(async tx => {
    await ownStudent(tx, ctx.actor, data.studentId);
    await lockStudent(tx, data.studentId);
    const previous = (await tx.select().from(s.payments).where(eq(s.payments.idempotencyKey, data.idempotencyKey)))[0];
    if (previous) {
      if (previous.createdBy !== ctx.actor.id || previous.studentId !== data.studentId) throw new HttpError(409, 'Idempotency key telah digunakan');
      const items = await tx.select().from(s.paymentInvoiceItems).where(eq(s.paymentInvoiceItems.paymentId, previous.id));
      if (previous.method !== data.method || previous.paidOn !== data.paidOn || items.map(i => i.invoiceId).sort().join() !== [...data.invoiceIds].sort().join()) throw new HttpError(409, 'Payload pembayaran berbeda dari permintaan pertama');
      return previous;
    }
    const invoices = await tx.select().from(s.invoices).where(inArray(s.invoices.id, data.invoiceIds)).orderBy(s.invoices.id).for('update');
    if (invoices.length !== data.invoiceIds.length || invoices.some(i => i.studentId !== data.studentId)) throw new HttpError(422, 'Invoice tidak valid untuk siswa ini');
    if (invoices.some(i => !['UNPAID', 'OVERDUE'].includes(i.status))) throw new HttpError(409, 'Invoice sudah lunas atau sedang diverifikasi');
    let proof;
    if (data.method === 'TRANSFER') {
      if (!data.proofId) throw new HttpError(422, 'Bukti transfer wajib diunggah');
      proof = requireValue((await tx.select().from(s.paymentProofs).where(eq(s.paymentProofs.id, data.proofId)).for('update'))[0]);
      if (proof.uploaderId !== ctx.actor.id || proof.paymentId) throw new HttpError(409, 'Bukti tidak tersedia');
    }
    const [payment] = await tx.insert(s.payments).values({ studentId: data.studentId, createdBy: ctx.actor.id, idempotencyKey: data.idempotencyKey, amount: invoices.reduce((a, i) => a + i.amount, 0), method: data.method, status: data.method === 'CASH' ? 'APPROVED' : 'PENDING_VERIFICATION', paidOn: data.paidOn, notes: data.notes }).returning();
    await tx.insert(s.paymentInvoiceItems).values(invoices.map(i => ({ invoiceId: i.id, paymentId: payment.id, amount: i.amount })));
    if (proof) await tx.update(s.paymentProofs).set({ paymentId: payment.id, updatedAt: new Date() }).where(eq(s.paymentProofs.id, proof.id));
    await tx.update(s.invoices).set({ status: data.method === 'CASH' ? 'PAID' : 'PENDING_VERIFICATION', updatedAt: new Date() }).where(inArray(s.invoices.id, data.invoiceIds));
    await recalculate(tx, data.studentId);
    await audit(tx, ctx, 'PAYMENT_CREATED', 'payments', payment.id, undefined, payment);
    return payment;
  });
}
export async function reviewPayment(db: Database, ctx: Context, id: string, approve: boolean, reason: string) {
  allow(ctx.actor, 'finance');
  if (!approve && !reason.trim()) throw new HttpError(422, 'Alasan penolakan wajib');
  return db.transaction(async tx => {
    const initial = requireValue((await tx.select().from(s.payments).where(eq(s.payments.id, id)))[0]);
    await lockStudent(tx, initial.studentId);
    const payment = requireValue((await tx.select().from(s.payments).where(eq(s.payments.id, id)).for('update'))[0]);
    if (payment.status !== 'PENDING_VERIFICATION') throw new HttpError(409, 'Pembayaran sudah diproses');
    const items = await tx.select().from(s.paymentInvoiceItems).where(eq(s.paymentInvoiceItems.paymentId, id));
    const invoices = await tx.select().from(s.invoices).where(inArray(s.invoices.id, items.map(i => i.invoiceId))).orderBy(s.invoices.id).for('update');
    if (!invoices.length || invoices.some(i => i.status !== 'PENDING_VERIFICATION')) throw new HttpError(409, 'Status invoice tidak konsisten');
    const [updated] = await tx.update(s.payments).set({ status: approve ? 'APPROVED' : 'REJECTED', reviewedBy: ctx.actor.id, reviewReason: reason, updatedAt: new Date() }).where(eq(s.payments.id, id)).returning();
    await tx.update(s.invoices).set({ status: approve ? 'PAID' : 'UNPAID', updatedAt: new Date() }).where(inArray(s.invoices.id, items.map(i => i.invoiceId)));
    await recalculate(tx, payment.studentId);
    await audit(tx, ctx, approve ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED', 'payments', id, payment, updated);
    return updated;
  });
}
export async function generateInvoices(db: Database, ctx: Context, input: unknown) {
  allow(ctx.actor, 'finance');
  const data = z.object({ academicYearId: uuid, month }).strict().parse(input);
  return db.transaction(async tx => {
    const year = requireValue((await tx.select().from(s.academicYears).where(eq(s.academicYears.id, data.academicYearId)))[0]);
    if (data.month < year.startDate.slice(0, 7) + '-01' || data.month > year.endDate) throw new HttpError(422, 'Bulan di luar tahun ajaran');
    const config = requireValue((await tx.select().from(s.sppConfigs).where(eq(s.sppConfigs.academicYearId, year.id)))[0], 'Master SPP belum diatur');
    const roster = await tx.select({ student: s.students }).from(s.students).innerJoin(s.classes, eq(s.classes.id, s.students.classId)).where(and(eq(s.classes.academicYearId, year.id), eq(s.students.active, true))).orderBy(s.students.id);
    let created = 0;
    for (const { student } of roster) {
      await lockStudent(tx, student.id);
      if (student.enrolledOn.slice(0, 7) > data.month.slice(0, 7)) continue;
      const rows = await tx.insert(s.invoices).values({ studentId: student.id, academicYearId: year.id, month: data.month, dueDate: data.month.slice(0, 8) + String(config.dueDay).padStart(2, '0'), amount: config.amount }).onConflictDoNothing().returning();
      created += rows.length;
      await recalculate(tx, student.id);
    }
    await audit(tx, ctx, 'CREATE', 'invoices', undefined, undefined, { ...data, created });
    return { created };
  });
}
export async function createDispensation(db: Database, ctx: Context, input: unknown) {
  if (!isGuardian(ctx.actor)) allow(ctx.actor, 'finance');
  const data = z.object({ studentId: uuid, examPeriodId: uuid, reason: z.string().trim().min(5).max(3000), amount: z.number().int().min(0).max(100000000), promisedOn: date }).strict().parse(input);
  if (data.promisedOn < today()) throw new HttpError(422, 'Janji bayar tidak boleh di masa lalu');
  return db.transaction(async tx => {
    await ownStudent(tx, ctx.actor, data.studentId); await lockStudent(tx, data.studentId);
    await recalculate(tx, data.studentId, data.examPeriodId);
    const [dispensation] = await tx.insert(s.dispensations).values({ studentId: data.studentId, examPeriodId: data.examPeriodId, reason: data.reason, requestedBy: ctx.actor.id }).returning();
    await tx.insert(s.paymentPromises).values({ dispensationId: dispensation.id, amount: data.amount, promisedOn: data.promisedOn });
    await audit(tx, ctx, 'DISPENSATION_CREATED', 'dispensations', dispensation.id, undefined, data);
    return dispensation;
  });
}
export async function reviewDispensation(db: Database, ctx: Context, id: string, action: string, notes: string) {
  allow(ctx.actor, action === 'review' ? 'finance' : 'principal');
  if (notes.trim().length < 3) throw new HttpError(422, 'Catatan review wajib');
  return db.transaction(async tx => {
    const initial = requireValue((await tx.select().from(s.dispensations).where(eq(s.dispensations.id, id)))[0]);
    await lockStudent(tx, initial.studentId);
    const old = requireValue((await tx.select().from(s.dispensations).where(eq(s.dispensations.id, id)).for('update'))[0]);
    if ((action === 'review' && old.status !== 'SUBMITTED') || (action !== 'review' && old.status !== 'REVIEWED')) throw new HttpError(409, 'Tahap review tidak sesuai; keputusan final memerlukan review TU');
    const status = action === 'review' ? 'REVIEWED' : action === 'approve' ? 'APPROVED' : 'REJECTED';
    const [updated] = await tx.update(s.dispensations).set({ status, updatedAt: new Date() }).where(eq(s.dispensations.id, id)).returning();
    await tx.insert(s.dispensationReviews).values({ dispensationId: id, reviewerId: ctx.actor.id, action: status, notes });
    await recalculate(tx, old.studentId, old.examPeriodId);
    await audit(tx, ctx, `DISPENSATION_${status}`, 'dispensations', id, old, updated);
    return updated;
  });
}
export function normalizePhone(value: string) { let phone = value.replace(/[\s()+.-]/g, ''); if (phone.startsWith('0')) phone = '62' + phone.slice(1); if (!/^62[1-9]\d{7,12}$/.test(phone)) throw new HttpError(422, 'Nomor WhatsApp Indonesia tidak valid'); return phone; }
export async function overdue(db: Database) { await db.update(s.invoices).set({ status: 'OVERDUE', updatedAt: new Date() }).where(and(eq(s.invoices.status, 'UNPAID'), sql`${s.invoices.dueDate} < (now() at time zone 'Asia/Jakarta')::date`)); }
