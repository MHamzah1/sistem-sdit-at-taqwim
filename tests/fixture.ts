import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "../src/db/client";
import * as schema from "../src/db/schema";
import { initialize } from "../server/resources";
import { handle } from "../server/app";
export async function fixture() {
  const pg = new PGlite();
  const nativeDb = drizzle(pg, { schema });
  await migrate(nativeDb, { migrationsFolder: "./migrations/postgres" });
  const db = nativeDb as unknown as Database;
  process.env.AUTH_SECRET ||= randomBytes(32).toString("hex");
  process.env.APP_ORIGIN = "http://localhost:3000";
  const password = randomBytes(24).toString("base64url");
  const email = "admin@example.test";
  await initialize(db, email, password);
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    cookie = "",
  ) {
    return handle(
      new Request(`http://localhost:3000/api/${path}`, {
        method,
        headers: {
          origin: "http://localhost:3000",
          cookie,
          "content-type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      db,
    );
  }
  const login = await request("auth/login", "POST", { email, password });
  if (login.status !== 200)
    throw new Error("Fixture login failed: " + (await login.text()));
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  return { pg, db, request, cookie, password, email };
}
