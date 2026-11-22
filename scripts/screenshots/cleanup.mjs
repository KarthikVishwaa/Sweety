import pg from 'pg';

export const THROWAWAY_PATTERN = 'shots+%@example.com';

// The database is only ever opened to remove the accounts this script made. Their readings go with them.
export async function deleteThrowawayUsers() {
  try {
    process.loadEnvFile('.env');
  } catch {
    // The variable may already be set in the environment.
  }
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set: the throwaway accounts were not removed.');
    return;
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query('DELETE FROM users WHERE email LIKE $1', [THROWAWAY_PATTERN]);
    console.log(`Removed ${result.rowCount} throwaway account(s).`);
  } finally {
    await client.end();
  }
}
