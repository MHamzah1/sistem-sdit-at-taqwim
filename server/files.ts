import { del, get, head } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../src/db/client.js";
import * as s from "../src/db/schema.js";
import {
  allow,
  audit,
  authenticate,
  csrf,
  HttpError,
  isGuardian,
  ownStudent,
  requireValue,
  tokenHash,
  type Context,
} from "./security.js";
export const MAX_PROOF_SIZE = 5 * 1024 * 1024;
export function validateSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/png")
    return Buffer.from(bytes.slice(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  if (mime === "application/pdf")
    return Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-";
  return false;
}
export async function uploadToken(db: Database, request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  // handleUpload verifies the signed Blob callback; only token generation uses a user session.
  return handleUpload({
    request,
    body,
    onBeforeGenerateToken: async (pathname) => {
      csrf(request);
      const actor = await authenticate(db, request);
      if (!isGuardian(actor)) allow(actor, "finance");
      const key = tokenHash(`upload:${actor.id}`);
      const [limit] = await db
        .insert(s.loginAttempts)
        .values({ key, count: 1, resetAt: new Date(Date.now() + 3600000) })
        .onConflictDoUpdate({
          target: s.loginAttempts.key,
          set: {
            count: sql`case when ${s.loginAttempts.resetAt} < now() then 1 else ${s.loginAttempts.count} + 1 end`,
            resetAt: sql`case when ${s.loginAttempts.resetAt} < now() then now() + interval '1 hour' else ${s.loginAttempts.resetAt} end`,
          },
        })
        .returning();
      if (limit.count > 20)
        throw new HttpError(429, "Batas 20 upload per jam tercapai");
      if (
        !new RegExp(
          `^proofs/${actor.id}/[a-f0-9-]{36}\\.(jpg|jpeg|png|pdf)$`,
        ).test(pathname)
      )
        throw new HttpError(422, "Nama file tidak valid");
      return {
        allowedContentTypes: ["image/jpeg", "image/png", "application/pdf"],
        maximumSizeInBytes: MAX_PROOF_SIZE,
        validUntil: Date.now() + 5 * 60 * 1000,
        addRandomSuffix: true,
        allowOverwrite: false,
      };
    },
    onUploadCompleted: async () => {
      /* Metadata is recorded only after authenticated signature validation. */
    },
  });
}
export async function registerProof(
  db: Database,
  ctx: Context,
  input: unknown,
) {
  if (!isGuardian(ctx.actor)) allow(ctx.actor, "finance");
  const { pathname } = z
    .object({ pathname: z.string().max(300) })
    .strict()
    .parse(input);
  if (
    !new RegExp(
      `^proofs/${ctx.actor.id}/[a-f0-9-]{36}(?:-[A-Za-z0-9]+)?\\.(jpg|jpeg|png|pdf)$`,
    ).test(pathname)
  )
    throw new HttpError(403, "File bukan milik akun ini");
  const existing = (
    await db
      .select()
      .from(s.paymentProofs)
      .where(eq(s.paymentProofs.pathname, pathname))
  )[0];
  if (existing) return { id: existing.id };
  const metadata = await head(pathname);
  if (
    !new URL(metadata.url).hostname.endsWith(".private.blob.vercel-storage.com")
  )
    throw new HttpError(503, "Blob store harus Private");
  if (
    metadata.size <= 0 ||
    metadata.size > MAX_PROOF_SIZE ||
    !["image/jpeg", "image/png", "application/pdf"].includes(
      metadata.contentType,
    )
  ) {
    await del(pathname);
    throw new HttpError(422, "File harus JPG, PNG, PDF maksimal 5 MB");
  }
  const file = requireValue(
    await get(pathname, { access: "private", useCache: false }),
  );
  if (file.statusCode !== 200 || !file.stream)
    throw new HttpError(422, "File tidak dapat divalidasi");
  const bytes = new Uint8Array(await new Response(file.stream).arrayBuffer());
  if (
    bytes.length !== metadata.size ||
    !validateSignature(bytes, metadata.contentType)
  ) {
    await del(pathname);
    throw new HttpError(422, "Isi file tidak sesuai format");
  }
  return db.transaction(async (tx) => {
    const [proof] = await tx
      .insert(s.paymentProofs)
      .values({
        url: metadata.url,
        pathname,
        filename: pathname.split("/").at(-1)!,
        mimeType: metadata.contentType,
        size: metadata.size,
        uploaderId: ctx.actor.id,
      })
      .returning();
    await audit(tx, ctx, "CREATE", "payment_proofs", proof.id, undefined, {
      filename: proof.filename,
      size: proof.size,
    });
    return { id: proof.id };
  });
}
export async function downloadProof(
  db: Database,
  ctx: Context,
  id: string,
  request: Request,
) {
  const proof = requireValue(
    (
      await db.select().from(s.paymentProofs).where(eq(s.paymentProofs.id, id))
    )[0],
  );
  if (isGuardian(ctx.actor)) {
    if (proof.paymentId) {
      const payment = requireValue(
        (
          await db
            .select()
            .from(s.payments)
            .where(eq(s.payments.id, proof.paymentId))
        )[0],
      );
      await ownStudent(db, ctx.actor, payment.studentId);
    } else if (proof.uploaderId !== ctx.actor.id)
      throw new HttpError(403, "Akses file ditolak");
  } else allow(ctx.actor, "finance");
  // Range chunks keep every Function response below Vercel's response size limit.
  const range = request.headers.get("range");
  const chunk = range && /^bytes=(\d+)-(\d+)$/.exec(range);
  const start = chunk ? Number(chunk[1]) : 0;
  const end = chunk
    ? Math.min(Number(chunk[2]), proof.size - 1)
    : Math.min(proof.size - 1, 2 * 1024 * 1024 - 1);
  if (start < 0 || start > end || end - start + 1 > 2 * 1024 * 1024)
    throw new HttpError(416, "Rentang file tidak valid");
  const file = requireValue(
    await get(proof.pathname, { access: "private", useCache: false }),
  );
  if (file.statusCode !== 200 || !file.stream)
    throw new HttpError(404, "File tidak ditemukan");
  const bytes = Buffer.from(await new Response(file.stream).arrayBuffer());
  return new Response(bytes.subarray(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": proof.mimeType,
      "Content-Disposition": `attachment; filename="${proof.filename}"`,
      "Content-Range": `bytes ${start}-${end}/${proof.size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
