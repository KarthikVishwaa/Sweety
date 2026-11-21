import { fileURLToPath } from 'node:url';
import { runner } from 'node-pg-migrate';
import pg from 'pg';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations', import.meta.url));

async function ensureDatabaseExists(databaseUrl: URL) {
  const databaseName = databaseUrl.pathname.slice(1);
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  const client = new pg.Client({ connectionString: adminUrl.href });
  await client.connect();
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseName,
    ]);
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${databaseName.replaceAll('"', '""')}"`);
    }
  } finally {
    await client.end();
  }
}

export default async function setup() {
  const databaseUrl = new URL(process.env.TEST_DATABASE_URL as string);

  await ensureDatabaseExists(databaseUrl);
  await runner({
    databaseUrl: databaseUrl.href,
    dir: MIGRATIONS_DIR,
    direction: 'up',
    migrationsTable: 'pgmigrations',
    log: () => undefined,
  });
}
