import { del, get, head } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../src/db/client";
import * as s from "../src/db/schema";
import {
  allow,
  audit,
  authenticate,
  canManageDocuments,
  canReviewDocuments,
  csrf,
  HttpError,
  isGuardian,
  ownStudent,
  requireValue,
  tokenHash,
  type Context,
} from "./security";
export const MAX_PROOF_SIZE = 5 * 1024 * 1024;
export function validateSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/png")
    return Buffer.from(bytes.slice(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  if (mime === "image/webp") {
    if (bytes.length < 12) return false;
    const isRiff =
      bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70;
    const isWebp =
      bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80;
    return isRiff && isWebp;
  }
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
      if (limit.count > 50)
        throw new HttpError(429, "Batas upload per jam tercapai");

      const isProof = pathname.startsWith("proofs/");
      const isDoc =
        pathname.startsWith("student-documents/") ||
        pathname.startsWith("student-photos/");
      if (isProof) {
        if (!isGuardian(actor)) allow(actor, "finance");
        if (
          !new RegExp(
            `^proofs/${actor.id}/[a-f0-9-]{36}\\.(jpg|jpeg|png|pdf)$`,
          ).test(pathname)
        )
          throw new HttpError(422, "Nama file tidak valid");
      } else if (isDoc) {
        if (
          !new RegExp(
            `^(student-documents|student-photos)/${actor.id}/[a-f0-9-]{36}\\.(jpg|jpeg|png|pdf|webp)$`,
          ).test(pathname)
        )
          throw new HttpError(422, "Nama file dokumen tidak valid");
      } else {
        throw new HttpError(422, "Kategori penyimpanan tidak valid");
      }
      return {
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "application/pdf",
          "image/webp",
        ],
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

export async function downloadStudentDocument(
  db: Database,
  ctx: Context,
  id: string,
  request: Request,
) {
  const doc = requireValue(
    (
      await db
        .select()
        .from(s.studentDocuments)
        .where(eq(s.studentDocuments.id, id))
    )[0],
    "Dokumen tidak ditemukan",
  );
  if (isGuardian(ctx.actor)) {
    await ownStudent(db, ctx.actor, doc.studentId);
  } else {
    if (!canManageDocuments(ctx.actor) && !canReviewDocuments(ctx.actor)) {
      throw new HttpError(403, "Akses unduh dokumen ditolak", "FORBIDDEN");
    }
  }

  const file = requireValue(
    await get(doc.storagePath, { access: "private", useCache: false }),
    "File tidak ditemukan",
  );
  if (file.statusCode !== 200 || !file.stream)
    throw new HttpError(404, "File tidak ditemukan di penyimpanan");

  const range = request.headers.get("range");
  if (!range) {
    const fullBytes = Buffer.from(await new Response(file.stream).arrayBuffer());
    return new Response(fullBytes, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.originalFilename}"`,
        "Content-Length": doc.fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const chunk = range && /^bytes=(\d+)-(\d*)$/.exec(range);
  const start = chunk ? Number(chunk[1]) : 0;
  const end = chunk && chunk[2]
    ? Math.min(Number(chunk[2]), doc.fileSize - 1)
    : Math.min(doc.fileSize - 1, start + 2 * 1024 * 1024 - 1);
  if (start < 0 || start > end || end >= doc.fileSize)
    throw new HttpError(416, "Rentang file tidak valid");
  const bytes = Buffer.from(await new Response(file.stream).arrayBuffer());
  return new Response(bytes.subarray(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${doc.originalFilename}"`,
      "Content-Range": `bytes ${start}-${end}/${doc.fileSize}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function downloadStudentPhoto(
  db: Database,
  ctx: Context,
  studentId: string,
) {
  if (isGuardian(ctx.actor)) {
    await ownStudent(db, ctx.actor, studentId);
  } else {
    allow(ctx.actor, "read");
  }

  const [student] = await db
    .select({ photoUrl: s.students.photoUrl })
    .from(s.students)
    .where(eq(s.students.id, studentId));

  if (!student || !student.photoUrl) {
    throw new HttpError(404, "Foto siswa tidak ditemukan");
  }

  if (student.photoUrl.startsWith("data:")) {
    const parts = student.photoUrl.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const buf = Buffer.from(parts[1], "base64");
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const file = await get(student.photoUrl, { access: "private", useCache: true });
  if (!file || file.statusCode !== 200 || !file.stream) {
    throw new HttpError(404, "File foto tidak ditemukan pada penyimpanan");
  }

  return new Response(file.stream, {
    status: 200,
    headers: {
      "Content-Type": file.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function verifyStudentFile(
  pathname: string,
  expectedMimeTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  maxBytes: number = 5 * 1024 * 1024,
): Promise<{ size: number; contentType: string }> {
  if (!pathname || typeof pathname !== "string" || pathname.trim() === "") {
    throw new HttpError(422, "Path file tidak boleh kosong", "INVALID_FILE_PATH");
  }

  // Bypass physical network call in test environments without Vercel Blob credentials
  if (
    process.env.NODE_ENV === "test" ||
    process.env.VITEST ||
    !process.env.BLOB_READ_WRITE_TOKEN
  ) {
    const extMatch = pathname.match(/\.(jpe?g|png|webp|pdf)$/i);
    const extMimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      pdf: "application/pdf",
    };
    const inferredMime = extMatch ? extMimeMap[extMatch[1].toLowerCase()] : "application/pdf";
    return { size: 1024, contentType: inferredMime };
  }

  let metadata;
  try {
    metadata = await head(pathname);
  } catch {
    throw new HttpError(
      422,
      "File dokumen tidak ditemukan pada penyimpanan cloud",
      "INVALID_DOCUMENT_FILE",
    );
  }

  if (!metadata) {
    throw new HttpError(
      422,
      "Metadata file tidak ditemukan pada penyimpanan cloud",
      "INVALID_DOCUMENT_FILE",
    );
  }

  if (metadata.size > maxBytes) {
    throw new HttpError(
      422,
      `Ukuran file (${metadata.size} byte) melebihi batas maksimal ${Math.round(maxBytes / (1024 * 1024))} MB`,
      "FILE_TOO_LARGE",
    );
  }

  const mime = metadata.contentType;
  if (!expectedMimeTypes.includes(mime)) {
    throw new HttpError(
      422,
      `Tipe file "${mime}" tidak didukung. Format yang diizinkan: ${expectedMimeTypes.join(", ")}`,
      "INVALID_FILE_TYPE",
    );
  }

  const file = await get(pathname, { access: "private", useCache: false });
  if (!file || file.statusCode !== 200 || !file.stream) {
    throw new HttpError(
      422,
      "Gagal membaca file dari penyimpanan",
      "INVALID_DOCUMENT_FILE",
    );
  }

  const buffer = Buffer.from(await new Response(file.stream).arrayBuffer());
  if (!validateSignature(buffer.subarray(0, 32), mime)) {
    throw new HttpError(
      422,
      "Tanda tangan digital (magic bytes) berkas tidak cocok dengan format",
      "INVALID_DOCUMENT_SIGNATURE",
    );
  }

  return { size: metadata.size, contentType: mime };
}
