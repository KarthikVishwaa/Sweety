import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../db/pool.js';
import { createAuthenticatedAgent } from './helpers/auth.js';
import { insertReadings, resetDatabase, type ReadingFixture } from './helpers/db.js';

type Agent = Awaited<ReturnType<typeof createAuthenticatedAgent>>;

const SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'] as const;
const PAGE_MESSAGE = 'Page must be a whole number of 1 or more.';
const LIMIT_MESSAGE = 'Limit must be a whole number between 1 and 100.';

interface Item {
  date: string;
  slot: string;
}

let agent: Agent;

function daysOfReadings(firstDay: number, lastDay: number): ReadingFixture[] {
  const readings: ReadingFixture[] = [];
  for (let day = firstDay; day <= lastDay; day++) {
    for (const slot of SLOTS) {
      readings.push({ date: `2026-01-${String(day).padStart(2, '0')}`, slot, value: 100 + day });
    }
  }
  return readings;
}

beforeEach(async () => {
  await resetDatabase();
  agent = await createAuthenticatedAgent();
  await insertReadings('asha@example.com', daysOfReadings(1, 7));
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/readings pagination', () => {
  it('defaults to page 1 with 20 items, newest date first then slot order', async () => {
    const { status, body } = await agent.get('/api/readings');

    expect(status).toBe(200);
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 28, totalPages: 2 });
    expect(body.data).toHaveLength(20);
    expect(body.data.slice(0, 4).map((r: Item) => [r.date, r.slot])).toEqual([
      ['2026-01-07', 'morning_fasting'],
      ['2026-01-07', 'after_breakfast'],
      ['2026-01-07', 'after_lunch'],
      ['2026-01-07', 'after_dinner'],
    ]);
    expect(body.data[4]).toMatchObject({ date: '2026-01-06', slot: 'morning_fasting' });
    expect(body.data[0]).toMatchObject({ slotLabel: 'Morning (fasting)', value: 107 });
  });

  it('returns the remaining items on the second page', async () => {
    const { body } = await agent.get('/api/readings?page=2');

    expect(body.meta).toEqual({ page: 2, limit: 20, total: 28, totalPages: 2 });
    expect(body.data).toHaveLength(8);
    expect(body.data.at(-1)).toMatchObject({ date: '2026-01-01', slot: 'after_dinner' });
  });

  it('honours a custom limit and keeps the ordering across pages', async () => {
    const { body } = await agent.get('/api/readings?limit=5&page=2');

    expect(body.meta).toEqual({ page: 2, limit: 5, total: 28, totalPages: 6 });
    expect(body.data.map((r: Item) => [r.date, r.slot])).toEqual([
      ['2026-01-06', 'after_breakfast'],
      ['2026-01-06', 'after_lunch'],
      ['2026-01-06', 'after_dinner'],
      ['2026-01-05', 'morning_fasting'],
      ['2026-01-05', 'after_breakfast'],
    ]);
  });

  it('returns an empty page with correct meta beyond the last page', async () => {
    const { status, body } = await agent.get('/api/readings?page=99');

    expect(status).toBe(200);
    expect(body).toEqual({ data: [], meta: { page: 99, limit: 20, total: 28, totalPages: 2 } });
  });

  it('accepts the limit boundaries 1 and 100', async () => {
    expect((await agent.get('/api/readings?limit=1')).body.data).toHaveLength(1);
    expect((await agent.get('/api/readings?limit=100')).body.data).toHaveLength(28);
  });

  it.each(['0', '-1', '1.5', 'abc', ''])('rejects page=%s', async (page) => {
    const { status, body } = await agent.get(`/api/readings?page=${page}`);

    expect(status).toBe(400);
    expect(body.error.message).toBe(PAGE_MESSAGE);
    expect(body.error.details).toEqual({ page: PAGE_MESSAGE });
  });

  it.each(['0', '101', '-5', '2.5', 'abc', ''])('rejects limit=%s', async (limit) => {
    const { status, body } = await agent.get(`/api/readings?limit=${limit}`);

    expect(status).toBe(400);
    expect(body.error.message).toBe(LIMIT_MESSAGE);
    expect(body.error.details).toEqual({ limit: LIMIT_MESSAGE });
  });

  it('still filters by date and paginates within that date', async () => {
    const firstPage = await agent.get('/api/readings?date=2026-01-05&limit=3');
    const secondPage = await agent.get('/api/readings?date=2026-01-05&limit=3&page=2');

    expect(firstPage.body.meta).toEqual({ page: 1, limit: 3, total: 4, totalPages: 2 });
    expect(firstPage.body.data.every((r: Item) => r.date === '2026-01-05')).toBe(true);
    expect(secondPage.body.data.map((r: Item) => r.slot)).toEqual(['after_dinner']);
  });

  it('never leaks another user’s rows or counts', async () => {
    const other = await createAuthenticatedAgent('ben@example.com');
    await other.post('/api/readings').send({ date: '2026-02-01', slot: 'after_lunch', value: 321 });

    const mine = await agent.get('/api/readings?limit=100');
    const theirs = await other.get('/api/readings');

    expect(mine.body.meta.total).toBe(28);
    expect(mine.body.data.some((r: { value: number }) => r.value === 321)).toBe(false);
    expect(theirs.body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(theirs.body.data).toHaveLength(1);
    expect(theirs.body.data[0].value).toBe(321);
  });
});
