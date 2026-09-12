import "dotenv/config";
import { createServer } from "node:http";
import { getDb } from "../src/db/client";
import { handle } from "./app";
createServer(async (req, res) => {
  let connection: ReturnType<typeof getDb> | undefined;
  try {
    connection = getDb();
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 100000) {
        res.writeHead(413).end();
        return;
      }
      chunks.push(chunk);
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers))
      if (value)
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    const request = new Request(`http://localhost:3001${req.url}`, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method || "")
        ? undefined
        : Buffer.concat(chunks),
    });
    const response = await handle(request, connection.db);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Database belum dikonfigurasi" }));
  } finally {
    await connection?.close();
  }
}).listen(3001, "127.0.0.1", () =>
  console.log("API listening on http://localhost:3001"),
);
