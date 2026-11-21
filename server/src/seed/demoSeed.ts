import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { BCRYPT_COST } from '../modules/auth/auth.service.js';
import { reportRange } from '../modules/reports/reports.dateRange.js';
import { todayInTimeZone } from '../utils/date.js';
import { generateDemoReadings } from './generateDemoReadings.js';

export const DEMO_USER = {
  name: 'Ramesh Kumar',
  email: 'demo@sweety.app',
  password: 'Demo@1234',
} as const;

export interface SeedSummary {
  email: string;
  readingCount: number;
  from: string;
  to: string;
}

export async function seedDemoData(now: Date = new Date()): Promise<SeedSummary> {
  if (env.NODE_ENV === 'production' && !env.ALLOW_DEMO_SEED) {
    throw new Error(
      'Refusing to seed demo data while NODE_ENV=production. Set ALLOW_DEMO_SEED=true only for a throwaway demo stack.',
    );
  }

  const to = todayInTimeZone(now);
  const { from } = reportRange('monthly', to);
  const readings = generateDemoReadings(from, to);
  const passwordHash = await bcrypt.hash(DEMO_USER.password, BCRYPT_COST);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'patient')
       ON CONFLICT (lower(email))
       DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'patient'
       RETURNING id`,
      [DEMO_USER.name, DEMO_USER.email, passwordHash],
    );
    const userId = (user.rows[0] as { id: string }).id;

    await client.query('DELETE FROM readings WHERE user_id = $1', [userId]);
    await client.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       SELECT $1, reading_date, slot, value
       FROM unnest($2::date[], $3::text[], $4::int[]) AS seed(reading_date, slot, value)`,
      [
        userId,
        readings.map((reading) => reading.date),
        readings.map((reading) => reading.slot),
        readings.map((reading) => reading.value),
      ],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { email: DEMO_USER.email, readingCount: readings.length, from, to };
}
