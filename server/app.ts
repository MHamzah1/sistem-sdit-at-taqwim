import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../src/db/client";
import * as s from "../src/db/schema";
import {
  actorFor,
  allow,
  audit,
  authenticate,
  csrf,
  hashPassword,
  HttpError,
  isGuardian,
  limitLogin,
  ownStudent,
  requireValue,
  sessionCookie,
  tokenHash,
  verifyPassword,
  type Context,
} from "./security";
import {
  createDispensation,
  createPayment,
  generateInvoices,
  lockStudent,
  normalizePhone,
  overdue,
  recalculate,
  reviewDispensation,
  reviewPayment,
  today,
  uuid,
} from "./business";
import { createUser, isResource, mutateResource } from "./resources";
import { readState } from "./state";
import { downloadProof, registerProof, uploadToken } from "./files";
const json = (value: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
async function payload(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(400, "Content-Type harus application/json");
  const text = await request.text();
  if (text.length > 100000) throw new HttpError(413, "Payload terlalu besar");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, "JSON tidak valid");
  }
}
export async function handle(
  request: Request,
  db: Database,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
    const method = request.method;
    if (path === "health" && method === "GET") {
      try {
        await db.execute(sql`select 1`);
        await db.select({ id: s.users.id }).from(s.users).limit(1);
        return json({ status: "ok", database: "connected" });
      } catch {
        return json({ status: "error", database: "unavailable" }, 503);
      }
    }
    if (path === "files/upload" && method === "POST")
      return json(await uploadToken(db, request));
    csrf(request);
    if (path === "auth/login" && method === "POST") {
      const data = z
        .object({
          email: z.email().toLowerCase(),
          password: z.string().min(1).max(128),
        })
        .strict()
        .parse(await payload(request));
      const ip =
        request.headers.get("x-vercel-forwarded-for")?.split(",")[0] || "local";
      await limitLogin(db, data.email, ip);
      const user = (
        await db.select().from(s.users).where(eq(s.users.email, data.email))
      )[0];
      // Same expensive KDF even when the email does not exist.
      const dummy =
        "scrypt:00000000000000000000000000000000:" + "00".repeat(64);
      const valid = await verifyPassword(
        data.password,
        user?.passwordHash || dummy,
      );
      if (!user?.active || !valid)
        throw new HttpError(401, "Email atau password salah");
      const actor = await actorFor(db, user.id);
      const token = randomBytes(32).toString("hex");
      await db.transaction(async (tx) => {
        await tx
          .insert(s.sessions)
          .values({
            userId: actor.id,
            tokenHash: tokenHash(token),
            expiresAt: new Date(Date.now() + 8 * 3600000),
          });
        await audit(
          tx,
          {
            actor,
            ip,
            userAgent: request.headers.get("user-agent") || undefined,
          },
          "LOGIN",
          "users",
          actor.id,
        );
      });
      return json({ actor }, 200, { "Set-Cookie": sessionCookie(token) });
    }
    const actor = await authenticate(db, request);
    const ctx: Context = {
      actor,
      ip: request.headers.get("x-vercel-forwarded-for")?.split(",")[0],
      userAgent: request.headers.get("user-agent") || undefined,
    };
    if (path === "auth/me" && method === "GET") return json({ actor });
    if (path === "auth/logout" && method === "POST") {
      const token = request.headers
        .get("cookie")
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("taqwim_session="))
        ?.slice(15);
      if (token)
        await db
          .delete(s.sessions)
          .where(eq(s.sessions.tokenHash, tokenHash(token)));
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
    }
    if (path === "auth/password" && method === "POST") {
      const data = z
        .object({
          currentPassword: z.string().max(128),
          newPassword: z.string().min(12).max(128),
        })
        .strict()
        .parse(await payload(request));
      const user = requireValue(
        (await db.select().from(s.users).where(eq(s.users.id, actor.id)))[0],
      );
      if (!(await verifyPassword(data.currentPassword, user.passwordHash)))
        throw new HttpError(401, "Password saat ini salah");
      const passwordHash = await hashPassword(data.newPassword);
      await db.transaction(async (tx) => {
        await tx
          .update(s.users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(s.users.id, actor.id));
        await tx.delete(s.sessions).where(eq(s.sessions.userId, actor.id));
        await audit(tx, ctx, "UPDATE", "users", actor.id, undefined, {
          passwordChanged: true,
        });
      });
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
    }
    if (path === "state" && method === "GET") {
      await overdue(db);
      return json(await readState(db, actor));
    }
    if (path === "users" && method === "POST")
      return json(await createUser(db, ctx, await payload(request)), 201);
    const resourcePath = path.startsWith("spp/config")
      ? "spp/config"
      : path.split("/")[0];
    const resourceId = path.slice(resourcePath.length + 1) || undefined;
    if (
      isResource(resourcePath) &&
      ["POST", "PATCH", "DELETE"].includes(method) &&
      (!resourceId || z.uuid().safeParse(resourceId).success)
    ) {
      if (
        (method !== "POST" && !resourceId) ||
        (method === "POST" && resourceId)
      )
        throw new HttpError(400, "URL resource tidak sesuai");
      return json(
        await mutateResource(
          db,
          ctx,
          resourcePath,
          method,
          method === "DELETE" ? {} : await payload(request),
          resourceId,
        ),
        method === "POST" ? 201 : 200,
      );
    }
    if (path === "guardian-students" && ["POST", "DELETE"].includes(method)) {
      allow(actor, "master");
      const data = z
        .object({ guardianId: uuid, studentId: uuid })
        .strict()
        .parse(await payload(request));
      await db.transaction(async (tx) => {
        if (method === "POST")
          await tx
            .insert(s.guardianStudents)
            .values(data)
            .onConflictDoNothing();
        else
          await tx
            .delete(s.guardianStudents)
            .where(
              and(
                eq(s.guardianStudents.guardianId, data.guardianId),
                eq(s.guardianStudents.studentId, data.studentId),
              ),
            );
        await audit(
          tx,
          ctx,
          method === "POST" ? "CREATE" : "DELETE",
          "guardian_students",
          data.studentId,
          undefined,
          data,
        );
      });
      return json({ ok: true });
    }
    if (path === "invoices/generate" && method === "POST")
      return json(await generateInvoices(db, ctx, await payload(request)), 201);
    if (path === "payments" && method === "POST")
      return json(await createPayment(db, ctx, await payload(request)), 201);
    let match = /^payments\/([^/]+)\/(approve|reject)$/.exec(path);
    if (match && method === "POST") {
      const data = z
        .object({ reason: z.string().max(2000).default("") })
        .strict()
        .parse(await payload(request));
      return json(
        await reviewPayment(
          db,
          ctx,
          uuid.parse(match[1]),
          match[2] === "approve",
          data.reason,
        ),
      );
    }
    if (path === "dispensations" && method === "POST")
      return json(
        await createDispensation(db, ctx, await payload(request)),
        201,
      );
    match = /^dispensations\/([^/]+)\/(review|approve|reject)$/.exec(path);
    if (match && method === "POST") {
      const data = z
        .object({ notes: z.string().trim().min(3).max(2000) })
        .strict()
        .parse(await payload(request));
      return json(
        await reviewDispensation(
          db,
          ctx,
          uuid.parse(match[1]),
          match[2],
          data.notes,
        ),
      );
    }
    match = /^exams\/([^/]+)\/eligibility$/.exec(path);
    if (match && method === "POST") {
      const examId = uuid.parse(match[1]);
      const data = z
        .object({ studentId: uuid })
        .strict()
        .parse(await payload(request));
      await ownStudent(db, actor, data.studentId);
      return json(
        await db.transaction(async (tx) => {
          await lockStudent(tx, data.studentId);
          return recalculate(tx, data.studentId, examId);
        }),
      );
    }
    if (path === "exam-cards" && method === "POST") {
      const data = z
        .object({ studentId: uuid, examPeriodId: uuid })
        .strict()
        .parse(await payload(request));
      return json(
        await db.transaction(async (tx) => {
          await ownStudent(tx, actor, data.studentId);
          await lockStudent(tx, data.studentId);
          const exam = requireValue(
            (
              await tx
                .select()
                .from(s.examPeriods)
                .where(eq(s.examPeriods.id, data.examPeriodId))
            )[0],
          );
          if (isGuardian(actor) && !exam.guardianDownload)
            throw new HttpError(
              403,
              "Unduh kartu wali belum diizinkan sekolah",
            );
          const [eligibility] = await recalculate(tx, data.studentId, exam.id);
          if (
            !eligibility ||
            !["ELIGIBLE", "ELIGIBLE_DISPENSATION"].includes(eligibility.status)
          )
            throw new HttpError(
              409,
              "Siswa belum layak mendapatkan kartu ujian",
            );
          await tx
            .insert(s.examCards)
            .values({ ...data, createdBy: actor.id })
            .onConflictDoNothing();
          const card = requireValue(
            (
              await tx
                .select()
                .from(s.examCards)
                .where(
                  and(
                    eq(s.examCards.studentId, data.studentId),
                    eq(s.examCards.examPeriodId, exam.id),
                  ),
                )
            )[0],
          );
          await audit(tx, ctx, "EXAM_CARD_CREATED", "exam_cards", card.id);
          return { ...card, exam, eligibility };
        }),
        201,
      );
    }
    match = /^exam-cards\/([^/]+)\/validate$/.exec(path);
    if (match && method === "GET") {
      allow(actor, "read");
      const card = requireValue(
        (
          await db
            .select()
            .from(s.examCards)
            .where(eq(s.examCards.verificationCode, uuid.parse(match[1])))
        )[0],
      );
      return json(
        await db.transaction(async (tx) => {
          await lockStudent(tx, card.studentId);
          const [eligibility] = await recalculate(
            tx,
            card.studentId,
            card.examPeriodId,
          );
          return {
            card,
            eligibility,
            valid:
              !!eligibility &&
              ["ELIGIBLE", "ELIGIBLE_DISPENSATION"].includes(
                eligibility.status,
              ),
          };
        }),
      );
    }
    if (path === "files" && method === "POST")
      return json(await registerProof(db, ctx, await payload(request)), 201);
    match = /^files\/([^/]+)$/.exec(path);
    if (match && method === "GET")
      return downloadProof(db, ctx, uuid.parse(match[1]), request);
    if (path === "settings" && method === "POST") {
      allow(actor, "settings");
      const data = z
        .object({
          schoolName: z.string().trim().min(1).max(200),
          phone: z.string().transform(normalizePhone),
        })
        .strict()
        .parse(await payload(request));
      await db.transaction(async (tx) => {
        const old = (
          await tx
            .select()
            .from(s.systemSettings)
            .where(eq(s.systemSettings.key, "school"))
        )[0];
        await tx
          .insert(s.systemSettings)
          .values({ key: "school", value: data })
          .onConflictDoUpdate({
            target: s.systemSettings.key,
            set: { value: data, updatedAt: new Date() },
          });
        await audit(
          tx,
          ctx,
          "SETTING_CHANGED",
          "system_settings",
          "school",
          old?.value,
          data,
        );
      });
      return json(data);
    }
    if (path === "forms" && method === "POST") {
      allow(actor, "master");
      const data = z
        .object({
          name: z.string().trim().min(1).max(200),
          deadline: z.iso.date(),
          fields: z
            .array(
              z
                .object({
                  label: z.string().trim().min(1).max(300),
                  required: z.boolean(),
                })
                .strict(),
            )
            .min(1)
            .max(30),
        })
        .strict()
        .parse(await payload(request));
      return json(
        await db.transaction(async (tx) => {
          const [template] = await tx
            .insert(s.characteristicFormTemplates)
            .values({ name: data.name, deadline: data.deadline })
            .returning();
          await tx
            .insert(s.characteristicFormFields)
            .values(
              data.fields.map((field, position) => ({
                ...field,
                position,
                templateId: template.id,
              })),
            );
          await audit(
            tx,
            ctx,
            "CREATE",
            "characteristic_form_templates",
            template.id,
            undefined,
            data,
          );
          return template;
        }),
        201,
      );
    }
    if (path === "form-submissions" && method === "POST") {
      const data = z
        .object({
          templateId: uuid,
          studentId: uuid,
          answers: z
            .array(
              z
                .object({ fieldId: uuid, value: z.string().trim().max(2000) })
                .strict(),
            )
            .max(30),
        })
        .strict()
        .parse(await payload(request));
      await ownStudent(db, actor, data.studentId);
      return json(
        await db.transaction(async (tx) => {
          const template = requireValue(
            (
              await tx
                .select()
                .from(s.characteristicFormTemplates)
                .where(eq(s.characteristicFormTemplates.id, data.templateId))
            )[0],
          );
          if (!template.active || template.deadline < today())
            throw new HttpError(409, "Form sudah ditutup");
          const fields = await tx
            .select()
            .from(s.characteristicFormFields)
            .where(eq(s.characteristicFormFields.templateId, data.templateId));
          if (
            new Set(data.answers.map((a) => a.fieldId)).size !==
              data.answers.length ||
            data.answers.some((a) => !fields.some((f) => f.id === a.fieldId)) ||
            fields.some(
              (f) =>
                f.required &&
                !data.answers.some((a) => a.fieldId === f.id && a.value),
            )
          )
            throw new HttpError(
              422,
              "Jawaban wajib belum lengkap atau field tidak valid",
            );
          const [submission] = await tx
            .insert(s.characteristicSubmissions)
            .values({
              templateId: data.templateId,
              studentId: data.studentId,
              submittedBy: actor.id,
            })
            .returning();
          if (data.answers.length)
            await tx
              .insert(s.characteristicAnswers)
              .values(
                data.answers.map((a) => ({
                  ...a,
                  submissionId: submission.id,
                })),
              );
          await audit(
            tx,
            ctx,
            "CREATE",
            "characteristic_submissions",
            submission.id,
          );
          return submission;
        }),
        201,
      );
    }
    match = /^students\/([^/]+)\/reminder$/.exec(path);
    if (match && method === "GET") {
      allow(actor, "finance");
      const state = await readState(db, actor);
      const student = requireValue(
        state.students.find((s) => s.id === uuid.parse(match![1])),
      );
      const exam = requireValue(
        state.exams.find((e) => e.id === url.searchParams.get("examId")),
        "Pilih periode ujian",
      );
      const classroom = requireValue(
        state.classes.find((c) => c.id === student.classId),
      );
      const guardian = requireValue(
        state.guardians.find((g) =>
          state.guardianStudents.some(
            (l) => l.studentId === student.id && l.guardianId === g.id,
          ),
        ),
        "Wali belum dihubungkan",
      );
      const amount = state.invoices
        .filter((i) => i.studentId === student.id && i.status !== "PAID")
        .reduce((sum, i) => sum + i.amount, 0);
      const message = `Assalamu’alaikum ${guardian.name}, tunggakan SPP ananda ${student.name}, kelas ${classroom.name}, sebesar Rp${amount.toLocaleString("id-ID")}. Mohon pelunasan sebelum ${exam.administrativeDeadline} untuk administrasi ${exam.name}. Terima kasih. SDIT AT-TAQWIM.`;
      await audit(db, ctx, "CREATE", "whatsapp_reminder", student.id);
      return json({
        url: `https://wa.me/${normalizePhone(guardian.phone)}?text=${encodeURIComponent(message)}`,
      });
    }
    if (path === "audit-logs" && method === "GET") {
      allow(actor, "audit");
      const page = z.coerce
        .number()
        .int()
        .min(1)
        .max(100000)
        .parse(url.searchParams.get("page") || 1);
      return json(
        await db
          .select()
          .from(s.auditLogs)
          .orderBy(desc(s.auditLogs.createdAt))
          .limit(50)
          .offset((page - 1) * 50),
      );
    }
    const collections: Record<string, string> = {
      students: "students",
      guardians: "guardians",
      classes: "classes",
      "academic-years": "academicYears",
      "spp/config": "sppConfigs",
      invoices: "invoices",
      payments: "payments",
      exams: "exams",
      dispensations: "dispensations",
      "reports/spp": "invoices",
      "reports/payments": "payments",
      "reports/eligibility": "eligibilities",
    };
    if (collections[path] && method === "GET") {
      const state = await readState(db, actor);
      const key = collections[path] as keyof typeof state;
      const rows = state[key] as unknown[];
      const page = z.coerce
        .number()
        .int()
        .min(1)
        .max(100000)
        .parse(url.searchParams.get("page") || 1);
      return json({
        data: rows.slice((page - 1) * 50, page * 50),
        total: rows.length,
        page,
      });
    }
    throw new HttpError(404, "Endpoint tidak ditemukan");
  } catch (error) {
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return json(
        {
          error: "Data tidak valid",
          details: error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        422,
      );
    const code =
      (error as { code?: string; cause?: { code?: string } }).code ||
      (error as { cause?: { code?: string } }).cause?.code;
    if (code === "23505")
      return json({ error: "Data sudah ada; duplikasi tidak diizinkan" }, 409);
    if (code === "23503")
      return json(
        { error: "Data masih digunakan atau relasi tidak ditemukan" },
        409,
      );
    if (code === "23514" || code === "22P02")
      return json({ error: "Data tidak memenuhi aturan database" }, 422);
    console.error("API request failed", {
      type: error instanceof Error ? error.name : "Unknown",
      code,
    });
    return json({ error: "Layanan belum tersedia. Silakan coba kembali" }, 503);
  }
}
