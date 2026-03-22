import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbName = process.env.POSTGRES_DB ?? 'mic_platform';
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
  throw new Error('POSTGRES_DB contains invalid characters.');
}
const pgConfig = {
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? '1234',
};

async function ensureDatabase() {
  const adminClient = new Client({ ...pgConfig, database: 'postgres' });
  await adminClient.connect();

  try {
    const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database created: ${dbName}`);
    } else {
      console.log(`Database already exists: ${dbName}`);
    }
  } finally {
    await adminClient.end();
  }
}

async function applySchema() {
  const schemaPath = path.resolve(__dirname, '../src/db/schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');

  const dbClient = new Client({ ...pgConfig, database: dbName });
  await dbClient.connect();

  try {
    await dbClient.query(schemaSql);
    console.log('Schema applied successfully.');
  } finally {
    await dbClient.end();
  }
}

await ensureDatabase();
await applySchema();
console.log('Database initialization completed.');
