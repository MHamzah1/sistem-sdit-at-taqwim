import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { fixture } from './fixture';
import { handle } from '../server/app';
const f = await fixture();
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost:3000');
    if (url.pathname.startsWith('/api/')) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const headers = new Headers(); for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      const result = await handle(new Request(url, { headers, method: req.method, body: req.method === 'GET' ? undefined : Buffer.concat(chunks) }), f.db);
      res.writeHead(result.status, Object.fromEntries(result.headers)); res.end(Buffer.from(await result.arrayBuffer())); return;
    }
    const root = resolve('dist'); const path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!path.startsWith(root + '\\') && path !== root) { res.writeHead(403).end(); return; }
    const file = extname(path) ? path : resolve(root, 'index.html');
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }); res.end(await readFile(file));
  } catch { res.writeHead(500).end(); }
});
await new Promise<void>(r => server.listen(3000, '127.0.0.1', r));
const browser = await chromium.launch(); const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); const page = await context.newPage();
const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`); });
try {
  await page.goto('http://localhost:3000/dashboard'); await page.getByLabel('Email', { exact: true }).fill(f.email); await page.getByLabel('Password', { exact: true }).fill(f.password); await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Selamat datang, Administrator' })).toBeVisible();
  await page.getByRole('button', { name: 'Kelas & Tahun Ajaran', exact: true }).click(); await page.getByRole('button', { name: 'Tambah tahun ajaran', exact: true }).click();
  let modal = page.getByRole('dialog'); const year = new Date().getFullYear();
  await modal.getByLabel('Nama tahun ajaran').fill(`Tahun UI ${year}`); await modal.getByLabel('Mulai', { exact: true }).fill(`${year}-01-01`); await modal.getByLabel('Selesai', { exact: true }).fill(`${year}-12-31`); await modal.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(modal).toHaveCount(0);
  await page.getByRole('button', { name: 'Tambah kelas', exact: true }).click(); modal = page.getByRole('dialog'); await modal.getByLabel('Nama kelas').fill('Kelas UI'); await modal.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(modal).toHaveCount(0);
  await page.getByRole('button', { name: 'Siswa', exact: true }).click(); await page.getByRole('button', { name: 'Tambah siswa', exact: true }).click(); modal = page.getByRole('dialog'); await modal.getByLabel('NIS', { exact: true }).fill('UI-001'); await modal.getByLabel('Nama siswa').fill('Siswa Browser'); await modal.getByLabel('Kelas', { exact: true }).selectOption({ label: `Kelas UI · Tahun UI ${year}` }); await modal.getByLabel('Tanggal masuk').fill(`${year}-01-01`); await modal.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(modal).toHaveCount(0); await expect(page.getByText('Siswa Browser', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Master SPP', exact: true }).click(); await page.getByRole('button', { name: 'Tambah Master SPP', exact: true }).click(); modal = page.getByRole('dialog'); await modal.getByLabel('Nominal SPP').fill('150000'); await modal.getByLabel('Tanggal jatuh tempo').fill('10'); await modal.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(modal).toHaveCount(0);
  await page.getByRole('button', { name: 'Tagihan SPP', exact: true }).click(); await page.getByRole('button', { name: 'Generate tagihan', exact: true }).click(); modal = page.getByRole('dialog'); await modal.getByLabel('Bulan tagihan').fill(`${year}-01`); await modal.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(modal).toHaveCount(0); await expect(page.getByText('Rp150.000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bayar', exact: true }).click(); modal = page.getByRole('dialog'); await modal.locator('input[type=checkbox]').check(); await modal.getByRole('button', { name: 'Simpan pembayaran', exact: true }).click(); await expect(modal).toHaveCount(0); await expect(page.getByText('Lunas', { exact: true })).toBeVisible();
  await page.goto('http://localhost:3000/master/siswa'); await expect(page.getByText('Siswa Browser', { exact: true })).toBeVisible();
  const localKeys = await page.evaluate(() => Object.keys(localStorage)); expect(localKeys).toEqual([]);
  await page.goto('http://localhost:3000/dashboard'); await expect(page.getByRole('heading', { name: 'Selamat datang, Administrator' })).toBeVisible(); await mkdir('test-results', { recursive: true }); await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Buka navigasi' }).click(); await page.getByRole('button', { name: 'Keluar', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Masuk ke akun sekolah' })).toBeVisible();
  expect(errors).toEqual([]); console.log('PASS: browser login, dashboard, year/class/student creation, SPP config, invoice generation, cash payment, direct SPA refresh, empty localStorage, responsive viewport, logout; no page errors or HTTP 5xx.');
} finally { await context.close(); await browser.close(); await new Promise<void>(r => server.close(() => r())); await f.pg.close(); }
