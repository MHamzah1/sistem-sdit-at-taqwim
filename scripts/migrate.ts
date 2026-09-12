import 'dotenv/config';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { getDb } from '../src/db/client';
const connection = getDb();
try { await migrate(connection.db, { migrationsFolder: './migrations/postgres' }); console.log('PostgreSQL migrations completed'); }
finally { await connection.close(); }
