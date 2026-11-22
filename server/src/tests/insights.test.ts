import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';
import { createAuthenticatedAgent } from './helpers/auth.js';
import { insertReadings, resetDatabase, type ReadingFixture } from './helpers/db.js';

type Agent = Awaited<ReturnType<typeof createAuthenticatedAgent>>;

const EMAIL = 'asha@example.com';
const MORNING = 'morning_fasting';
const BREAKFAST = 'after_breakfast';
const LUNCH = 'after_lunch';
const DINNER = 'after_dinner';

// Today is 25 October 2026 (Asia/Kolkata): the month in progress.
const NOW = new Date('2026-10-25T06:00:00Z');

// The example dataset: day 1 has 100 and 150, day 2 has 200, day 4 has 65.
const OCTOBER: ReadingFixture[] = [
  { date: '2026-10-01', slot: MORNING, value: 100 },
  { date: '2026-10-01', slot: BREAKFAST, value: 150 },
  { date: '2026-10-02', slot: MORNING, value: 200 },
  { date: '2026-10-04', slot: MORNING, value: 65 },
];

let agent: Agent;

const insights = (query: Record<string, string> = {}, as: Agent = agent) =>
  as.get('/api/insights').query(query);

function setNow(date: Date) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(date);
}

beforeEach(async () => {
  await resetDatabase();
  agent = await createAuthenticatedAgent(EMAIL);
  setNow(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await pool.end();
});

describe('the example month', () => {
  beforeEach(async () => {
    await insertReadings(EMAIL, OCTOBER);
  });

  it('summarises the readings', async () => {
    const { status, body } = await insights({ month: '2026-10' });

    expect(status).toBe(200);
    expect(body).toMatchObject({
      month: '2026-10',
      range: { from: '2026-10-01', to: '2026-10-25' },
      count: 4,
      average: 128.8,
      highest: 200,
      lowest: 65,
    });
  });

  it('splits the readings into low, in range and high with percentages that add up to 100', async () => {
    const { body } = await insights({ month: '2026-10' });

    expect(body.bands).toEqual({
      counts: { low: 1, inRange: 2, high: 1 },
      percentages: { low: 25, inRange: 50, high: 25 },
    });
  });

  it('uses 70 and 180 as inclusive edges of the range', async () => {
    await resetDatabase();
    agent = await createAuthenticatedAgent(EMAIL);
    await insertReadings(EMAIL, [
      { date: '2026-10-01', slot: MORNING, value: 69 },
      { date: '2026-10-01', slot: BREAKFAST, value: 70 },
      { date: '2026-10-01', slot: LUNCH, value: 180 },
      { date: '2026-10-01', slot: DINNER, value: 181 },
    ]);

    const { body } = await insights({ month: '2026-10' });

    expect(body.bands.counts).toEqual({ low: 1, inRange: 2, high: 1 });
  });

  it('reports consistency, with the streak ending yesterday-or-today rule', async () => {
    const { body } = await insights({ month: '2026-10' });

    expect(body.consistency).toEqual({
      daysLogged: 3,
      daysInPeriod: 25,
      currentStreak: 0,
      longestStreak: 2,
      completionPercent: 4,
    });
  });

  it('points the highlights at the right dates and slots', async () => {
    const { body } = await insights({ month: '2026-10' });

    expect(body.highlights).toEqual({
      highest: { value: 200, date: '2026-10-02', slot: MORNING, slotLabel: 'Morning (fasting)' },
      lowest: { value: 65, date: '2026-10-04', slot: MORNING, slotLabel: 'Morning (fasting)' },
    });
  });

  it('breaks the readings down by slot and finds the highest one', async () => {
    const { body } = await insights({ month: '2026-10' });

    expect(body.bySlot).toEqual([
      { slot: MORNING, slotLabel: 'Morning (fasting)', average: 121.7, count: 3 },
      { slot: BREAKFAST, slotLabel: 'After breakfast', average: 150, count: 1 },
      { slot: LUNCH, slotLabel: 'After lunch', average: null, count: 0 },
      { slot: DINNER, slotLabel: 'After dinner', average: null, count: 0 },
    ]);
    expect(body.highestSlot).toBe(BREAKFAST);
  });

  it('lists the days that have readings, for the chart', async () => {
    const { body } = await insights({ month: '2026-10' });

    expect(body.days).toEqual([
      { date: '2026-10-01', average: 125, lowest: 100, highest: 150, count: 2 },
      { date: '2026-10-02', average: 200, lowest: 200, highest: 200, count: 1 },
      { date: '2026-10-04', average: 65, lowest: 65, highest: 65, count: 1 },
    ]);
  });

  it('returns numbers, not strings', async () => {
    const { body } = await insights({ month: '2026-10' });

    for (const value of [body.count, body.average, body.highest, body.lowest]) {
      expect(typeof value).toBe('number');
    }
    expect(typeof body.bands.percentages.low).toBe('number');
    expect(typeof body.consistency.completionPercent).toBe('number');
    expect(typeof body.lifetime.totalReadings).toBe('number');
  });

  it('defaults to the current month in Asia/Kolkata', async () => {
    const { body } = await insights();

    expect(body.month).toBe('2026-10');
    expect(body.count).toBe(4);
  });

  it('uses the Kolkata date, not UTC, to decide which month it is', async () => {
    setNow(new Date('2026-10-31T19:00:00Z'));

    expect((await insights()).body.month).toBe('2026-11');
  });
});

describe('an empty month', () => {
  it('has nulls and zeros, never NaN', async () => {
    const { status, body } = await insights({ month: '2026-10' });

    expect(status).toBe(200);
    expect(body).toMatchObject({
      count: 0,
      average: null,
      highest: null,
      lowest: null,
      highestSlot: null,
      days: [],
      bands: {
        counts: { low: 0, inRange: 0, high: 0 },
        percentages: { low: 0, inRange: 0, high: 0 },
      },
      consistency: {
        daysLogged: 0,
        daysInPeriod: 25,
        currentStreak: 0,
        longestStreak: 0,
        completionPercent: 0,
      },
      highlights: { highest: null, lowest: null },
      comparison: {
        previousAverage: null,
        previousInRangePercent: null,
        averageChange: null,
        inRangeChange: null,
      },
      recent: [],
      lifetime: { totalReadings: 0, firstReadingDate: null },
    });
    for (const slot of body.bySlot) expect(slot).toMatchObject({ average: null, count: 0 });
    expect(JSON.stringify(body)).not.toMatch(/NaN|Infinity/);
  });
});

describe('month boundaries', () => {
  it('leaves out the last day of the previous month and the first day of the next', async () => {
    setNow(new Date('2026-11-20T06:00:00Z'));
    await insertReadings(EMAIL, [
      { date: '2026-09-30', slot: MORNING, value: 300 },
      { date: '2026-10-01', slot: MORNING, value: 100 },
      { date: '2026-10-31', slot: MORNING, value: 120 },
      { date: '2026-11-01', slot: MORNING, value: 400 },
    ]);

    const { body } = await insights({ month: '2026-10' });

    expect(body).toMatchObject({
      range: { from: '2026-10-01', to: '2026-10-31' },
      count: 2,
      average: 110,
      highest: 120,
      lowest: 100,
    });
    expect(body.days.map((day: { date: string }) => day.date)).toEqual([
      '2026-10-01',
      '2026-10-31',
    ]);
  });

  it('uses the whole month for a past month, but only up to today for this one', async () => {
    setNow(new Date('2026-11-20T06:00:00Z'));

    const past = (await insights({ month: '2026-10' })).body;
    const current = (await insights({ month: '2026-11' })).body;

    expect(past.consistency.daysInPeriod).toBe(31);
    expect(current.consistency.daysInPeriod).toBe(20);
    expect(current.range.to).toBe('2026-11-20');
  });
});

describe('the current streak', () => {
  it('counts back from today when today has a reading', async () => {
    await insertReadings(EMAIL, [
      { date: '2026-10-23', slot: MORNING, value: 100 },
      { date: '2026-10-24', slot: MORNING, value: 100 },
      { date: '2026-10-25', slot: MORNING, value: 100 },
    ]);

    expect((await insights()).body.consistency).toMatchObject({
      currentStreak: 3,
      longestStreak: 3,
    });
  });

  it('keeps counting from yesterday when today has no reading yet', async () => {
    await insertReadings(EMAIL, [
      { date: '2026-10-23', slot: MORNING, value: 100 },
      { date: '2026-10-24', slot: MORNING, value: 100 },
    ]);

    expect((await insights()).body.consistency.currentStreak).toBe(2);
  });

  it('is 0 when neither today nor yesterday has a reading', async () => {
    await insertReadings(EMAIL, [
      { date: '2026-10-22', slot: MORNING, value: 100 },
      { date: '2026-10-23', slot: MORNING, value: 100 },
    ]);

    const { consistency } = (await insights()).body;

    expect(consistency.currentStreak).toBe(0);
    expect(consistency.longestStreak).toBe(2);
  });

  it('ends on the last day of a past month', async () => {
    setNow(new Date('2026-11-20T06:00:00Z'));
    await insertReadings(EMAIL, [
      { date: '2026-10-29', slot: MORNING, value: 100 },
      { date: '2026-10-30', slot: MORNING, value: 100 },
      { date: '2026-10-31', slot: MORNING, value: 100 },
    ]);

    expect((await insights({ month: '2026-10' })).body.consistency.currentStreak).toBe(3);
  });
});

describe('completion', () => {
  it('is readings over days in the period times four, as a whole number', async () => {
    await insertReadings(EMAIL, [
      { date: '2026-10-24', slot: MORNING, value: 100 },
      { date: '2026-10-24', slot: BREAKFAST, value: 100 },
      { date: '2026-10-25', slot: MORNING, value: 100 },
    ]);

    // 3 readings in 25 days: 3 / 100 = 3 per cent.
    expect((await insights()).body.consistency.completionPercent).toBe(3);
  });

  it('reaches 100 when every slot of every day is filled', async () => {
    setNow(new Date('2026-10-02T06:00:00Z'));
    await insertReadings(
      EMAIL,
      ['2026-10-01', '2026-10-02'].flatMap((date) =>
        [MORNING, BREAKFAST, LUNCH, DINNER].map((slot) => ({ date, slot, value: 110 })),
      ),
    );

    expect((await insights()).body.consistency).toMatchObject({
      daysInPeriod: 2,
      completionPercent: 100,
    });
  });
});

describe('comparison with the previous month', () => {
  it('reports the changes when both months have readings', async () => {
    await insertReadings(EMAIL, [
      ...OCTOBER,
      { date: '2026-09-10', slot: MORNING, value: 120 },
      { date: '2026-09-10', slot: BREAKFAST, value: 130 },
    ]);

    const { comparison } = (await insights({ month: '2026-10' })).body;

    expect(comparison).toEqual({
      previousAverage: 125,
      previousInRangePercent: 100,
      averageChange: 3.8,
      inRangeChange: -50,
    });
  });

  it('is null without previous-month readings', async () => {
    await insertReadings(EMAIL, OCTOBER);

    expect((await insights({ month: '2026-10' })).body.comparison).toEqual({
      previousAverage: null,
      previousInRangePercent: null,
      averageChange: null,
      inRangeChange: null,
    });
  });

  it('compares against the previous FULL month, whatever day it is today', async () => {
    await insertReadings(EMAIL, [
      ...OCTOBER,
      { date: '2026-09-02', slot: MORNING, value: 100 },
      { date: '2026-09-29', slot: MORNING, value: 140 },
    ]);

    expect((await insights({ month: '2026-10' })).body.comparison.previousAverage).toBe(120);
  });
});

describe('recent readings and lifetime figures', () => {
  it('lists the last five readings overall, newest first, whatever month is chosen', async () => {
    await insertReadings(EMAIL, [
      { date: '2026-08-15', slot: MORNING, value: 111 },
      { date: '2026-09-01', slot: MORNING, value: 112 },
      ...OCTOBER,
      { date: '2026-10-04', slot: DINNER, value: 99 },
    ]);

    const { body } = await insights({ month: '2026-09' });

    expect(body.recent.map((reading: { value: number }) => reading.value)).toEqual([
      99, 65, 200, 150, 100,
    ]);
    expect(body.recent[0]).toMatchObject({
      date: '2026-10-04',
      slot: DINNER,
      slotLabel: 'After dinner',
      id: expect.any(String),
    });
  });

  it('counts every reading and finds the first one', async () => {
    await insertReadings(EMAIL, [{ date: '2026-08-15', slot: MORNING, value: 111 }, ...OCTOBER]);

    expect((await insights({ month: '2026-10' })).body.lifetime).toEqual({
      totalReadings: 5,
      firstReadingDate: '2026-08-15',
    });
  });
});

describe('isolation and access', () => {
  it('only ever uses the logged-in user’s readings', async () => {
    const ben = await createAuthenticatedAgent('ben@example.com');
    await insertReadings(EMAIL, OCTOBER);
    await insertReadings('ben@example.com', [
      { date: '2026-10-03', slot: MORNING, value: 500 },
      { date: '2026-09-03', slot: MORNING, value: 500 },
    ]);

    const asha = (await insights({ month: '2026-10' })).body;
    const benBody = (await insights({ month: '2026-10' }, ben)).body;

    expect(asha).toMatchObject({ count: 4, highest: 200 });
    expect(asha.comparison.previousAverage).toBeNull();
    expect(asha.lifetime.totalReadings).toBe(4);
    expect(benBody).toMatchObject({ count: 1, average: 500 });
  });

  it('requires a session', async () => {
    const response = await request(app).get('/api/insights').query({ month: '2026-10' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('month validation', () => {
  it.each(['abc', '2026-13', '2026-00', '2026-1', '2026-10-01', '26-10', ''])(
    'rejects %j as an invalid month',
    async (month) => {
      const response = await insights({ month });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Please choose a valid month.');
    },
  );

  it('rejects a month after the current one', async () => {
    const response = await insights({ month: '2026-11' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Month cannot be in the future.');
  });

  it('accepts the current month and any earlier one', async () => {
    expect((await insights({ month: '2026-10' })).status).toBe(200);
    expect((await insights({ month: '2019-01' })).status).toBe(200);
  });
});
