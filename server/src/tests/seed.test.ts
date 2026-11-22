import bcrypt from 'bcrypt';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../db/pool.js';
import { DEMO_USER, seedDemoData } from '../seed/demoSeed.js';
import { createAuthenticatedAgent } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';

const NOW = new Date('2026-11-21T06:00:00Z');

interface StoredReading {
  date: string;
  slot: string;
  value: number;
}

async function demoReadings(): Promise<StoredReading[]> {
  const result = await pool.query<StoredReading>(
    `SELECT r.reading_date AS date, r.slot, r.value
     FROM readings r JOIN users u ON u.id = r.user_id
     WHERE lower(u.email) = $1
     ORDER BY r.reading_date, r.slot`,
    [DEMO_USER.email],
  );
  return result.rows;
}

beforeEach(async () => {
  await resetDatabase();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

afterAll(async () => {
  await pool.end();
});

describe('seedDemoData', () => {
  it('is idempotent: running twice leaves identical data and a single demo user', async () => {
    await seedDemoData(NOW);
    const first = await demoReadings();
    await seedDemoData(NOW);
    const second = await demoReadings();

    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
    const users = await pool.query('SELECT 1 FROM users WHERE lower(email) = $1', [
      DEMO_USER.email,
    ]);
    expect(users.rowCount).toBe(1);
  });

  it('creates a patient whose password is the documented demo credential, hashed', async () => {
    await seedDemoData(NOW);

    const { rows } = await pool.query(
      'SELECT name, role, gender, password_hash FROM users WHERE lower(email) = $1',
      [DEMO_USER.email],
    );

    expect(rows[0]).toMatchObject({ name: 'Ramesh Kumar', role: 'patient', gender: 'male' });
    expect(rows[0].password_hash).not.toBe(DEMO_USER.password);
    expect(await bcrypt.compare(DEMO_USER.password, rows[0].password_hash)).toBe(true);
  });

  it('only generates valid readings within the previous month up to today', async () => {
    const summary = await seedDemoData(NOW);
    const readings = await demoReadings();

    expect(summary).toMatchObject({
      email: 'demo@sweety.app',
      from: '2026-10-01',
      to: '2026-11-21',
    });
    expect(summary.readingCount).toBe(readings.length);
    expect(readings.every((r) => r.value >= 40 && r.value <= 600)).toBe(true);
    expect(readings.every((r) => r.date >= '2026-10-01' && r.date <= '2026-11-21')).toBe(true);
    expect(new Set(readings.map((r) => `${r.date}:${r.slot}`)).size).toBe(readings.length);
  });

  it('has data in both the previous and the current month, with a realistic mix', async () => {
    await seedDemoData(NOW);
    const readings = await demoReadings();
    const values = readings.map((r) => r.value);

    expect(readings.some((r) => r.date.startsWith('2026-10'))).toBe(true);
    expect(readings.some((r) => r.date.startsWith('2026-11'))).toBe(true);
    expect(readings.some((r) => r.date === '2026-11-21')).toBe(true);
    expect(values.some((value) => value < 70)).toBe(true);
    expect(values.some((value) => value > 180)).toBe(true);
    expect(
      values.filter((value) => value >= 70 && value <= 180).length / values.length,
    ).toBeGreaterThan(0.7);
  });

  it('leaves some days incomplete or empty', async () => {
    await seedDemoData(NOW);
    const readings = await demoReadings();
    const perDay = new Map<string, number>();
    for (const { date } of readings) perDay.set(date, (perDay.get(date) ?? 0) + 1);

    expect([...perDay.values()].some((count) => count < 4)).toBe(true);
    expect(perDay.size).toBeLessThan(52);
  });

  it('never touches other users', async () => {
    const other = await createAuthenticatedAgent('ben@example.com');
    await other.post('/api/readings').send({ date: '2026-10-05', slot: 'after_lunch', value: 123 });

    await seedDemoData(NOW);
    await seedDemoData(NOW);

    const { rows } = await pool.query(
      `SELECT r.value FROM readings r JOIN users u ON u.id = r.user_id WHERE u.email = 'ben@example.com'`,
    );
    expect(rows).toEqual([{ value: 123 }]);
  });

  it('refuses to run in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { seedDemoData: productionSeed } = await import('../seed/demoSeed.js');

    await expect(productionSeed(NOW)).rejects.toThrow('NODE_ENV=production');
    const users = await pool.query('SELECT 1 FROM users');
    expect(users.rowCount).toBe(0);
  });

  it('runs in production only when ALLOW_DEMO_SEED=true is set explicitly', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_DEMO_SEED', 'true');
    vi.resetModules();
    const { seedDemoData: productionSeed } = await import('../seed/demoSeed.js');

    const summary = await productionSeed(NOW);

    expect(summary.readingCount).toBeGreaterThan(0);
  });
});
