import "dotenv/config";
import { sql } from "drizzle-orm";
import { head, put, del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { getDb } from "../src/db/client";
const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "APP_ORIGIN",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error("Missing environment variables: " + missing.join(", "));
  process.exitCode = 1;
} else if (process.env.AUTH_SECRET!.length < 32) {
  console.error("AUTH_SECRET requires at least 32 characters");
  process.exitCode = 1;
} else {
  let connection: ReturnType<typeof getDb> | undefined;
  let pathname: string | undefined;
  try {
    const url = new URL(process.env.DATABASE_URL!);
    if (!url.hostname.endsWith(".neon.tech"))
      throw new Error("Expected a Neon PostgreSQL database");
    connection = getDb();
    await connection.db.execute(sql`select 1 from users limit 1`);
    console.log("Database connected; users schema present");
    const blob = await put(
      `health/${randomUUID()}.txt`,
      "storage health check",
      { access: "private", contentType: "text/plain" },
    );
    pathname = blob.pathname;
    const metadata = await head(pathname);
    if (
      !new URL(metadata.url).hostname.endsWith(
        ".private.blob.vercel-storage.com",
      )
    )
      throw new Error("Expected a private Blob store");
    console.log("Private Blob write/read successful");
    console.log(
      "Infrastructure preflight passed; production browser smoke test is still required",
    );
  } catch (error) {
    console.error(
      "Preflight failed:",
      error instanceof Error && error.message.startsWith("Expected")
        ? error.message
        : "Database or private Blob access failed",
    );
    process.exitCode = 1;
  } finally {
    if (pathname)
      await del(pathname).catch(() =>
        console.error("Temporary Blob cleanup failed"),
      );
    await connection?.close();
  }
}
