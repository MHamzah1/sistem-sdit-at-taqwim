import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database, Transaction } from "../src/db/client";
import * as s from "../src/db/schema";
import {
  allow,
  audit,
  hashPassword,
  HttpError,
  requireValue,
  type Context,
} from "./security";
import { date, month, normalizePhone, uuid } from "./business";
const name = z.string().trim().min(1).max(200);
const amount = z.number().int().positive().max(100000000);
const definitions = {
  "academic-years": {
    table: "academic_years",
    schema: z
      .object({
        name,
        startDate: date,
        endDate: date,
        active: z.boolean().default(true),
      })
      .strict(),
  },
  classes: {
    table: "classes",
    schema: z.object({ name, academicYearId: uuid }).strict(),
  },
  students: {
    table: "students",
    schema: z
      .object({
        name,
        nis: z.string().trim().min(1).max(50),
        classId: uuid,
        enrolledOn: date,
        active: z.boolean().default(true),
      })
      .strict(),
  },
  guardians: {
    table: "guardians",
    schema: z
      .object({
        name,
        phone: z.string().transform(normalizePhone),
        userId: uuid.nullable().optional(),
      })
      .strict(),
  },
  "spp/config": {
    table: "spp_configs",
    schema: z
      .object({
        academicYearId: uuid,
        amount,
        dueDay: z.number().int().min(1).max(28),
      })
      .strict(),
  },
  "exam-types": { table: "exam_types", schema: z.object({ name }).strict() },
  exams: {
    table: "exam_periods",
    schema: z
      .object({
        name,
        academicYearId: uuid,
        examTypeId: uuid,
        semester: z.number().int().min(1).max(2),
        startDate: date,
        endDate: date,
        administrativeDeadline: date,
        requiredUntilMonth: month,
        guardianDownload: z.boolean().default(false),
      })
      .strict(),
  },
};
export type Resource = keyof typeof definitions;
export function isResource(value: string): value is Resource {
  return value in definitions;
}
const snake = (value: string) =>
  value.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const camel = (record: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      value,
    ]),
  );
async function validateRelations(
  tx: Transaction,
  resource: Resource,
  data: Record<string, unknown>,
  old?: Record<string, unknown>,
) {
  if (
    resource === "academic-years" &&
    String(data.endDate) < String(data.startDate)
  )
    throw new HttpError(422, "Tanggal akhir harus setelah tanggal mulai");
  if (
    resource === "academic-years" &&
    old &&
    (old.start_date !== data.startDate || old.end_date !== data.endDate)
  ) {
    const existing = await tx
      .select()
      .from(s.invoices)
      .where(eq(s.invoices.academicYearId, String(old.id)))
      .limit(1);
    if (existing.length)
      throw new HttpError(
        409,
        "Tanggal tahun ajaran yang sudah ditagihkan tidak dapat diubah",
      );
  }
  if (resource === "guardians" && data.userId) {
    const roles = await tx
      .select({ code: s.roles.code })
      .from(s.userRoles)
      .innerJoin(s.roles, eq(s.roles.id, s.userRoles.roleId))
      .where(eq(s.userRoles.userId, String(data.userId)));
    if (!roles.some((r) => r.code === "WALI_MURID"))
      throw new HttpError(422, "Akun harus memiliki role WALI_MURID");
  }
  if (resource === "students") {
    requireValue(
      (
        await tx
          .select()
          .from(s.classes)
          .where(eq(s.classes.id, String(data.classId)))
      )[0],
      "Kelas tidak ditemukan",
    );
    if (
      old &&
      (old.class_id !== data.classId || old.enrolled_on !== data.enrolledOn)
    ) {
      const invoices = await tx
        .select()
        .from(s.invoices)
        .where(eq(s.invoices.studentId, String(old.id)))
        .limit(1);
      if (invoices.length)
        throw new HttpError(
          409,
          "Perubahan kelas/tanggal masuk siswa bertagihan memerlukan proses mutasi terpisah",
        );
    }
  }
  if (
    resource === "classes" &&
    old &&
    old.academic_year_id !== data.academicYearId
  )
    throw new HttpError(409, "Tahun ajaran kelas tidak dapat dipindahkan");
  if (resource === "exams") {
    const year = requireValue(
      (
        await tx
          .select()
          .from(s.academicYears)
          .where(eq(s.academicYears.id, String(data.academicYearId)))
      )[0],
    );
    if (
      String(data.startDate) < year.startDate ||
      String(data.endDate) > year.endDate ||
      String(data.endDate) < String(data.startDate) ||
      String(data.administrativeDeadline) > String(data.startDate) ||
      String(data.requiredUntilMonth) < year.startDate.slice(0, 7) + "-01" ||
      String(data.requiredUntilMonth) > String(data.startDate)
    )
      throw new HttpError(
        422,
        "Tanggal ujian, deadline, atau bulan wajib tidak sesuai tahun ajaran",
      );
    if (old) {
      const immutable = ["academicYearId", "requiredUntilMonth"];
      if (immutable.some((k) => old[snake(k)] !== data[k]))
        throw new HttpError(
          409,
          "Tahun ajaran dan bulan wajib periode tidak dapat diubah; buat periode yang benar",
        );
    }
  }
}
export async function mutateResource(
  db: Database,
  ctx: Context,
  resource: Resource,
  method: string,
  input: unknown,
  id?: string,
) {
  allow(ctx.actor, resource === "spp/config" ? "finance" : "master");
  const definition = definitions[resource];
  if (id) uuid.parse(id);
  const data: Record<string, unknown> =
    method === "DELETE" ? {} : definition.schema.parse(input);
  return db.transaction(async (tx) => {
    const table = sql.identifier(definition.table);
    const old = id
      ? requireValue(
          (
            await tx.execute(
              sql`select * from ${table} where id = ${id} for update`,
            )
          ).rows[0],
        )
      : undefined;
    if (method === "DELETE") {
      await tx.execute(sql`delete from ${table} where id = ${id}`);
      await audit(tx, ctx, "DELETE", definition.table, id, old);
      return { deleted: true };
    }
    await validateRelations(tx, resource, data, old);
    const entries = Object.entries(data);
    const result = id
      ? await tx.execute(
          sql`update ${table} set ${sql.join(
            entries.map(
              ([key, value]) => sql`${sql.identifier(snake(key))} = ${value}`,
            ),
            sql`, `,
          )}, updated_at = now() where id = ${id} returning *`,
        )
      : await tx.execute(
          sql`insert into ${table} (${sql.join(
            entries.map(([key]) => sql.identifier(snake(key))),
            sql`, `,
          )}) values (${sql.join(
            entries.map(([, value]) => sql`${value}`),
            sql`, `,
          )}) returning *`,
        );
    const row = result.rows[0];
    await audit(
      tx,
      ctx,
      id ? "UPDATE" : "CREATE",
      definition.table,
      String(row.id),
      old,
      row,
    );
    return camel(row);
  });
}
export async function createUser(db: Database, ctx: Context, input: unknown) {
  allow(ctx.actor, "users");
  const data = z
    .object({
      name,
      email: z.email().toLowerCase(),
      password: z.string().min(12).max(128),
      role: z.enum([
        "SUPER_ADMIN",
        "TU_KEUANGAN",
        "KEPALA_SEKOLAH",
        "WALI_MURID",
      ]),
    })
    .strict()
    .parse(input);
  const passwordHash = await hashPassword(data.password);
  return db.transaction(async (tx) => {
    const role = requireValue(
      (await tx.select().from(s.roles).where(eq(s.roles.code, data.role)))[0],
    );
    const [user] = await tx
      .insert(s.users)
      .values({ name: data.name, email: data.email, passwordHash })
      .returning({ id: s.users.id, name: s.users.name, email: s.users.email });
    await tx.insert(s.userRoles).values({ userId: user.id, roleId: role.id });
    await audit(tx, ctx, "CREATE", "users", user.id, undefined, {
      ...user,
      role: data.role,
    });
    return user;
  });
}
export async function initialize(
  db: Database,
  email: string,
  password: string,
) {
  z.email().parse(email);
  z.string().min(12).max(128).parse(password);
  const { roleGrants } = await import("./security");
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(752901)`);
    for (const [code, grants] of Object.entries(roleGrants)) {
      await tx.insert(s.roles).values({ code }).onConflictDoNothing();
      const role = requireValue(
        (await tx.select().from(s.roles).where(eq(s.roles.code, code)))[0],
      );
      for (const code of grants) {
        await tx.insert(s.permissions).values({ code }).onConflictDoNothing();
        const permission = requireValue(
          (
            await tx
              .select()
              .from(s.permissions)
              .where(eq(s.permissions.code, code))
          )[0],
        );
        await tx
          .insert(s.rolePermissions)
          .values({ roleId: role.id, permissionId: permission.id })
          .onConflictDoNothing();
      }
    }
    const existing = await tx.select({ id: s.users.id }).from(s.users).limit(1);
    if (existing.length) return; // Initialization never resets or replaces an existing password.
    const [user] = await tx
      .insert(s.users)
      .values({
        name: "Administrator",
        email: email.toLowerCase(),
        passwordHash,
      })
      .returning();
    const role = requireValue(
      (
        await tx.select().from(s.roles).where(eq(s.roles.code, "SUPER_ADMIN"))
      )[0],
    );
    await tx.insert(s.userRoles).values({ userId: user.id, roleId: role.id });
    await tx
      .insert(s.auditLogs)
      .values({
        userId: user.id,
        action: "CREATE",
        entity: "users",
        entityId: user.id,
        after: { initialization: true, email: user.email },
      });
  });
}
