import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../src/db/client';
import { handle } from '../server/app';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let connection: ReturnType<typeof getDb> | undefined;
  try {
    connection = getDb();
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    const origin = process.env.APP_ORIGIN || `https://${req.headers.host}`;
    const url = new URL(req.url || '/api', origin);
    if (typeof req.query.__route === 'string') url.pathname = '/api/' + req.query.__route;
    url.searchParams.delete('__route');
    const request = new Request(url, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : typeof req.body === 'string' ? req.body : JSON.stringify(req.body) });
    const response = await handle(request, connection.db);
    res.status(response.status); response.headers.forEach((value, key) => res.setHeader(key, value)); res.send(Buffer.from(await response.arrayBuffer()));
  } catch { res.status(503).json({ status: 'error', database: 'unavailable', error: 'Konfigurasi layanan belum tersedia' }); }
  finally { await connection?.close(); }
}
