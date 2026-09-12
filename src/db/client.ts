import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema.js";
neonConfig.webSocketConstructor = ws;
export function getDb() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}
export type Database = ReturnType<typeof getDb>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
