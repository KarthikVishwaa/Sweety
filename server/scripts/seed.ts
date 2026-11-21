import { pool } from '../src/db/pool.js';
import { seedDemoData } from '../src/seed/demoSeed.js';

try {
  const { email, readingCount, from, to } = await seedDemoData();
  console.log(`Seeded ${email}: ${readingCount} readings from ${from} to ${to}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
