import 'dotenv/config';
import { getDb } from '../src/db/client';
import { initialize } from '../server/resources';
const connection = getDb();
try { await initialize(connection.db, process.env.INITIAL_ADMIN_EMAIL || '', process.env.INITIAL_ADMIN_PASSWORD || ''); console.log('Production initialization completed; no dummy data inserted'); }
finally { await connection.close(); }
