import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, sql } from "drizzle-orm";
import type { Database, Transaction } from "../src/db/client";
import * as s from "../src/db/schema";
const scrypt = promisify(scryptCallback);
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireValue<T>(
  value: T | undefined | null,
  message = "Data tidak ditemukan",
): T {
  if (value == null) throw new HttpError(404, message);
  return value;
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [, salt, hash] = encoded.split(":");
  if (!salt || !hash) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
export function tokenHash(token: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret).update(token).digest("hex");
}
export type Actor = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};
export type Context = { actor: Actor; ip?: string; userAgent?: string };
export const roleGrants: Record<string, string[]> = {
  SUPER_ADMIN: [
    "read",
    "finance",
    "master",
    "principal",
    "settings",
    "audit",
    "users",
    "guardian",
  ],
  TU_KEUANGAN: ["read", "finance", "master", "audit"],
  KEPALA_SEKOLAH: ["read", "principal", "audit"],
  WALI_MURID: ["guardian"],
};
export function allow(actor: Actor, permission: string) {
  if (!actor.permissions.includes(permission))
    throw new HttpError(403, "Akses tidak diizinkan");
}
export function isGuardian(actor: Actor) {
  return (
    !actor.permissions.includes("read") &&
    actor.permissions.includes("guardian")
  );
}
const SENSITIVE_AUDIT_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "tokenhash",
  "authsecret",
  "secret",
  "nik",
  "familycardnumber",
  "birthcertificatenumber",
  "phone",
  "email",
  "monthlyincomerange",
  "medicalhistory",
  "foodallergies",
  "drugallergies",
  "routinemedication",
  "emergencyhandlingnotes",
  "assistanceneeds",
  "specialneedstypes",
]);

export function sanitizeForAudit(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForAudit(item));
  }
  const obj = data as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_AUDIT_KEYS.has(lowerKey)) {
      result[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      result[key] = sanitizeForAudit(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function canAccessSensitiveStudentData(actor: Actor): boolean {
  return actor.permissions.includes("master");
}

export async function audit(
  db: Database | Transaction,
  ctx: Context,
  action: string,
  entity: string,
  entityId?: string,
  before?: unknown,
  after?: unknown,
) {
  await db
    .insert(s.auditLogs)
    .values({
      userId: ctx.actor.id,
      action,
      entity,
      entityId,
      before: sanitizeForAudit(before),
      after: sanitizeForAudit(after),
      ip: ctx.ip,
      userAgent: ctx.userAgent?.slice(0, 500),
    });
}
export async function actorFor(
  db: Database | Transaction,
  userId: string,
): Promise<Actor> {
  const user = requireValue(
    (
      await db
        .select({ id: s.users.id, name: s.users.name, email: s.users.email })
        .from(s.users)
        .where(and(eq(s.users.id, userId), eq(s.users.active, true)))
    )[0],
  );
  const grants = await db
    .select({ role: s.roles.code, permission: s.permissions.code })
    .from(s.userRoles)
    .innerJoin(s.roles, eq(s.roles.id, s.userRoles.roleId))
    .innerJoin(s.rolePermissions, eq(s.rolePermissions.roleId, s.roles.id))
    .innerJoin(
      s.permissions,
      eq(s.permissions.id, s.rolePermissions.permissionId),
    )
    .where(eq(s.userRoles.userId, userId));
  return {
    ...user,
    roles: [...new Set(grants.map((g) => g.role))],
    permissions: [...new Set(grants.map((g) => g.permission))],
  };
}
export async function authenticate(db: Database, request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("taqwim_session="))
    ?.slice(15);
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new HttpError(401, "Silakan masuk");
  const session = (
    await db
      .select()
      .from(s.sessions)
      .where(
        and(
          eq(s.sessions.tokenHash, tokenHash(token)),
          gt(s.sessions.expiresAt, new Date()),
        ),
      )
  )[0];
  if (!session)
    throw new HttpError(401, "Sesi berakhir. Silakan masuk kembali");
  return actorFor(db, session.userId);
}
export function csrf(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (
    !origin ||
    origin !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "Origin permintaan tidak diizinkan");
}
export function sessionCookie(token: string, maxAge = 28800) {
  return `taqwim_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" || process.env.VERCEL ? "; Secure" : ""}`;
}
export async function limitLogin(db: Database, email: string, ip: string) {
  // Durable limits for both source IP and account, shared by every Function instance.
  for (const key of [tokenHash(`ip:${ip}`), tokenHash(`email:${email}`)]) {
    const result = await db
      .insert(s.loginAttempts)
      .values({ key, count: 1, resetAt: new Date(Date.now() + 900000) })
      .onConflictDoUpdate({
        target: s.loginAttempts.key,
        set: {
          count: sql`case when ${s.loginAttempts.resetAt} < now() then 1 else ${s.loginAttempts.count} + 1 end`,
          resetAt: sql`case when ${s.loginAttempts.resetAt} < now() then now() + interval '15 minutes' else ${s.loginAttempts.resetAt} end`,
        },
      })
      .returning();
    if (result[0].count > 20)
      throw new HttpError(
        429,
        "Terlalu banyak percobaan. Coba kembali setelah 15 menit",
      );
  }
}
export async function ownStudent(
  db: Database | Transaction,
  actor: Actor,
  studentId: string,
) {
  if (!isGuardian(actor)) {
    allow(actor, "read");
    return;
  }
  const rows = await db
    .select({ id: s.guardianStudents.studentId })
    .from(s.guardianStudents)
    .innerJoin(s.guardians, eq(s.guardians.id, s.guardianStudents.guardianId))
    .where(
      and(
        eq(s.guardians.userId, actor.id),
        eq(s.guardianStudents.studentId, studentId),
      ),
    );
  if (!rows.length)
    throw new HttpError(403, "Siswa tidak terhubung ke akun wali");
}
