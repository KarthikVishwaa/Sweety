import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';
import { createAuthenticatedAgent } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';

type Agent = Awaited<ReturnType<typeof createAuthenticatedAgent>>;

const SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'] as const;
const REPORT_TYPES = ['daily', 'mtd', 'monthly'] as const;
const NOW_AFTER_ALL_FIXTURES = new Date('2026-10-25T06:00:00Z');

let agent: Agent;

async function seed(date: string, values: number[], as: Agent = agent) {
  for (const [index, value] of values.entries()) {
    const response = await as.post('/api/readings').send({ date, slot: SLOTS[index], value });
    expect(response.status).toBe(201);
  }
}

const report = (type: string, date: string, as: Agent = agent) =>
  as.get('/api/reports').query({ type, date });

beforeEach(async () => {
  await resetDatabase();
  agent = await createAuthenticatedAgent();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await pool.end();
});

describe('statistics', () => {
  it('computes highest, lowest, average and count', async () => {
    await seed('2026-10-15', [100, 150, 200]);

    const response = await report('daily', '2026-10-15');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      type: 'daily',
      from: '2026-10-15',
      to: '2026-10-15',
      count: 3,
      highest: 200,
      lowest: 100,
      average: 150,
    });
  });

  it.each([
    [[97, 98, 98], 97.7],
    [[100, 100, 101], 100.3],
    [[101, 102], 101.5],
  ])('rounds the average of %j to %d', async (values, expected) => {
    await seed('2026-10-15', values);

    const response = await report('daily', '2026-10-15');

    expect(response.body.average).toBe(expected);
    expect(typeof response.body.average).toBe('number');
    expect(typeof response.body.highest).toBe('number');
    expect(typeof response.body.lowest).toBe('number');
    expect(typeof response.body.count).toBe('number');
  });
});

describe('date ranges', () => {
  beforeEach(async () => {
    await seed('2026-09-30', [110]);
    await seed('2026-10-01', [120]);
    await seed('2026-10-10', [140]);
    await seed('2026-10-15', [160]);
    await seed('2026-10-20', [300]);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW_AFTER_ALL_FIXTURES);
  });

  it('daily includes only the selected day', async () => {
    const { body } = await report('daily', '2026-10-15');

    expect(body).toMatchObject({ from: '2026-10-15', to: '2026-10-15', count: 1, highest: 160 });
    expect(body.readings).toHaveLength(1);
  });

  it('mtd includes the 1st through the selected date, not later or earlier', async () => {
    const { body } = await report('mtd', '2026-10-15');

    expect(body).toMatchObject({
      from: '2026-10-01',
      to: '2026-10-15',
      count: 3,
      highest: 160,
      lowest: 120,
      average: 140,
    });
    expect(body.days.map((day: { date: string }) => day.date)).toEqual([
      '2026-10-01',
      '2026-10-10',
      '2026-10-15',
    ]);
  });

  it('monthly is the whole previous month, including the 30th and excluding the 1st', async () => {
    const { body } = await report('monthly', '2026-10-15');

    expect(body).toMatchObject({
      from: '2026-09-01',
      to: '2026-09-30',
      count: 1,
      highest: 110,
      lowest: 110,
      average: 110,
    });
    expect(body.days.map((day: { date: string }) => day.date)).toEqual(['2026-09-30']);
  });
});

describe('empty state', () => {
  it.each(REPORT_TYPES)('returns a zero count and null stats for %s', async (type) => {
    const response = await report(type, '2026-10-15');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ count: 0, highest: null, lowest: null, average: null });
  });

  it('returns empty collections', async () => {
    expect((await report('daily', '2026-10-15')).body.readings).toEqual([]);
    expect((await report('mtd', '2026-10-15')).body.days).toEqual([]);
    expect((await report('monthly', '2026-10-15')).body.days).toEqual([]);
  });
});

describe('breakdowns', () => {
  it('daily lists readings with slot labels in slot order', async () => {
    await agent
      .post('/api/readings')
      .send({ date: '2026-10-15', slot: 'after_dinner', value: 140 });
    await agent
      .post('/api/readings')
      .send({ date: '2026-10-15', slot: 'morning_fasting', value: 90 });
    await agent.post('/api/readings').send({ date: '2026-10-15', slot: 'after_lunch', value: 170 });

    const { body } = await report('daily', '2026-10-15');

    expect(body.days).toBeUndefined();
    expect(
      body.readings.map((r: { slot: string; slotLabel: string; value: number; date: string }) => [
        r.slot,
        r.slotLabel,
        r.value,
        r.date,
      ]),
    ).toEqual([
      ['morning_fasting', 'Morning (fasting)', 90, '2026-10-15'],
      ['after_lunch', 'After lunch', 170, '2026-10-15'],
      ['after_dinner', 'After dinner', 140, '2026-10-15'],
    ]);
    expect(body.readings[0].id).toEqual(expect.any(String));
  });

  it('mtd returns per-day aggregates ordered by date', async () => {
    await seed('2026-10-03', [200]);
    await seed('2026-10-01', [100, 111]);

    const { body } = await report('mtd', '2026-10-05');

    expect(body.readings).toBeUndefined();
    expect(body.days).toEqual([
      { date: '2026-10-01', average: 105.5, lowest: 100, highest: 111, count: 2 },
      { date: '2026-10-03', average: 200, lowest: 200, highest: 200, count: 1 },
    ]);
  });
});

describe('isolation', () => {
  it('never includes another user’s readings', async () => {
    await seed('2026-10-15', [100, 200]);
    const other = await createAuthenticatedAgent('ben@example.com');
    await seed('2026-10-15', [300], other);

    const mine = (await report('daily', '2026-10-15')).body;
    const theirs = (await report('mtd', '2026-10-15', other)).body;

    expect(mine).toMatchObject({ count: 2, highest: 200, average: 150 });
    expect(theirs).toMatchObject({ count: 1, highest: 300 });
    expect(mine.readings.every((r: { value: number }) => r.value !== 300)).toBe(true);
  });
});

describe('authentication and validation', () => {
  it('returns 401 when not logged in', async () => {
    const response = await request(app).get('/api/reports?type=daily&date=2026-10-15');

    expect(response.status).toBe(401);
  });

  it.each([
    [
      'an invalid type',
      { type: 'weekly', date: '2026-10-15' },
      'Please choose a valid report type.',
    ],
    ['a missing type', { date: '2026-10-15' }, 'Please choose a valid report type.'],
    ['a non-existent date', { type: 'daily', date: '2026-02-30' }, 'Please choose a valid date.'],
    ['a malformed date', { type: 'daily', date: 'abc' }, 'Please choose a valid date.'],
    ['a missing date', { type: 'daily' }, 'Please choose a valid date.'],
  ])('rejects %s with the exact message', async (_label, query, message) => {
    const response = await agent.get('/api/reports').query(query);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(message);
  });

  it('rejects a future date in Asia/Kolkata', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T19:00:00Z'));

    const today = await report('daily', '2026-10-15');
    const tomorrow = await report('daily', '2026-10-16');

    expect(today.status).toBe(200);
    expect(tomorrow.status).toBe(400);
    expect(tomorrow.body.error.message).toBe('Date cannot be in the future.');
  });
});
