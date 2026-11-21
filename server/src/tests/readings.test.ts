import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';
import { todayInTimeZone } from '../utils/date.js';
import { createAuthenticatedAgent } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';

type Agent = Awaited<ReturnType<typeof createAuthenticatedAgent>>;

const PAST_DATE = '2026-01-15';
const SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'] as const;

function addDays(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

const reading = (overrides: object = {}) => ({
  date: PAST_DATE,
  slot: 'morning_fasting',
  value: 110,
  ...overrides,
});

let agent: Agent;

const create = (body: object = reading(), as: Agent = agent) => as.post('/api/readings').send(body);

async function fillDay(date: string) {
  for (const slot of SLOTS) await create(reading({ date, slot }));
}

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

describe('POST /api/readings', () => {
  it('creates a reading and returns it with its slot label', async () => {
    const response = await create();

    expect(response.status).toBe(201);
    expect(response.body.reading).toMatchObject({
      date: PAST_DATE,
      slot: 'morning_fasting',
      slotLabel: 'Morning (fasting)',
      value: 110,
    });
    expect(response.body.reading.id).toEqual(expect.any(String));
    expect(response.body.reading.createdAt).toEqual(expect.any(String));
    expect(response.body.reading.updatedAt).toEqual(expect.any(String));
  });

  it.each([40, 600])('accepts the boundary value %i', async (value) => {
    expect((await create(reading({ value }))).status).toBe(201);
  });

  it.each([
    ['missing', undefined, 'Please enter a glucose value.'],
    ['empty', '', 'Please enter a glucose value.'],
    ['39', 39, 'Value must be between 40 and 600 mg/dl.'],
    ['601', 601, 'Value must be between 40 and 600 mg/dl.'],
    ['a decimal', 120.5, 'Value must be between 40 and 600 mg/dl.'],
    ['text', 'abc', 'Value must be between 40 and 600 mg/dl.'],
  ])('rejects a %s value', async (_label, value, message) => {
    const response = await create(reading({ value }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(message);
    expect(response.body.error.details).toEqual({ value: message });
  });

  it.each([
    ['missing', undefined],
    ['not a real calendar date', '2026-02-30'],
    ['badly formatted', '15/01/2026'],
  ])('rejects a date that is %s', async (_label, date) => {
    const response = await create(reading({ date }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Please choose a valid date.');
    expect(response.body.error.details).toEqual({ date: 'Please choose a valid date.' });
  });

  it.each([undefined, 'brunch'])('rejects the slot %s', async (slot) => {
    const response = await create(reading({ slot }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Please choose a time slot.');
    expect(response.body.error.details).toEqual({ slot: 'Please choose a time slot.' });
  });

  it('rejects a future date', async () => {
    const tomorrow = addDays(todayInTimeZone(), 1);

    const response = await create(reading({ date: tomorrow }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Date cannot be in the future.');
    expect(response.body.error.details).toEqual({ date: 'Date cannot be in the future.' });
  });

  it('accepts today in Asia/Kolkata', async () => {
    expect((await create(reading({ date: todayInTimeZone() }))).status).toBe(201);
  });

  it('accepts the IST date at 00:30 IST even though UTC is still the previous day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T19:00:00Z'));

    const istToday = await create(reading({ date: '2026-11-21' }));
    const istTomorrow = await create(reading({ date: '2026-11-22', slot: 'after_lunch' }));

    expect(istToday.status).toBe(201);
    expect(istTomorrow.status).toBe(400);
    expect(istTomorrow.body.error.message).toBe('Date cannot be in the future.');
  });

  it('reports only the first failing rule, in the documented order', async () => {
    const response = await create({ value: 5, date: 'nope', slot: 'nope' });

    expect(response.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
    expect(response.body.error.details).toEqual({
      value: 'Value must be between 40 and 600 mg/dl.',
    });

    const dateBeforeSlot = await create({ value: 100, date: 'nope', slot: 'nope' });
    expect(dateBeforeSlot.body.error.message).toBe('Please choose a valid date.');

    const slotBeforeFuture = await create({
      value: 100,
      date: addDays(todayInTimeZone(), 1),
      slot: 'nope',
    });
    expect(slotBeforeFuture.body.error.message).toBe('Please choose a time slot.');
  });

  it('rejects a duplicate slot on the same date with the slot label', async () => {
    await create(reading({ slot: 'after_lunch' }));

    const response = await create(reading({ slot: 'after_lunch', value: 150 }));

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe(
      'You already have an After lunch reading for this date.',
    );
    expect(response.body.error.details.slot).toBe(response.body.error.message);
  });

  it.each([
    ['morning_fasting', 'You already have a Morning (fasting) reading for this date.'],
    ['after_breakfast', 'You already have an After breakfast reading for this date.'],
    ['after_lunch', 'You already have an After lunch reading for this date.'],
    ['after_dinner', 'You already have an After dinner reading for this date.'],
  ])('words the duplicate message naturally for %s', async (slot, message) => {
    await create(reading({ slot }));

    const response = await create(reading({ slot, value: 120 }));

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe(message);
  });

  it('checks the 4-per-day limit before the duplicate-slot rule', async () => {
    await fillDay(PAST_DATE);

    const response = await create(reading({ slot: 'after_lunch' }));

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('You can add only 4 readings per day.');
  });

  it('allows the same slot on a different date', async () => {
    await create(reading());

    expect((await create(reading({ date: '2026-01-16' }))).status).toBe(201);
  });
});

describe('GET /api/readings', () => {
  it('returns only the requested date, ordered by slot', async () => {
    await create(reading({ slot: 'after_dinner', value: 140 }));
    await create(reading({ slot: 'morning_fasting', value: 100 }));
    await create(reading({ slot: 'after_lunch', value: 160 }));
    await create(reading({ date: '2026-01-16', slot: 'after_breakfast', value: 200 }));

    const response = await agent.get(`/api/readings?date=${PAST_DATE}`);

    expect(response.status).toBe(200);
    expect(response.body.data.map((r: { slot: string }) => r.slot)).toEqual([
      'morning_fasting',
      'after_lunch',
      'after_dinner',
    ]);
    expect(response.body.data.every((r: { date: string }) => r.date === PAST_DATE)).toBe(true);
  });

  it('returns an empty list for a date with no readings', async () => {
    const response = await agent.get('/api/readings?date=2026-01-01');

    expect(response.body).toEqual({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it.each(['?date=2026-02-30', '?date=abc', '?date='])(
    'rejects an invalid date query "%s"',
    async (query) => {
      const response = await agent.get(`/api/readings${query}`);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Please choose a valid date.');
    },
  );
});

describe('PUT /api/readings/:id', () => {
  it('changes only the value without a false conflict, even on a full day', async () => {
    await fillDay(PAST_DATE);
    const { body } = await agent.get(`/api/readings?date=${PAST_DATE}`);
    const lunch = body.data.find((r: { slot: string }) => r.slot === 'after_lunch');

    const response = await agent
      .put(`/api/readings/${lunch.id}`)
      .send(reading({ slot: 'after_lunch', value: 190 }));

    expect(response.status).toBe(200);
    expect(response.body.reading).toMatchObject({ id: lunch.id, value: 190, slot: 'after_lunch' });
  });

  it('moves a reading to a free slot', async () => {
    const { body } = await create();

    const response = await agent
      .put(`/api/readings/${body.reading.id}`)
      .send(reading({ slot: 'after_dinner' }));

    expect(response.status).toBe(200);
    expect(response.body.reading.slot).toBe('after_dinner');
    expect(response.body.reading.slotLabel).toBe('After dinner');
  });

  it('rejects moving a reading to a slot that is taken', async () => {
    await create(reading({ slot: 'after_lunch' }));
    const { body } = await create();

    const response = await agent
      .put(`/api/readings/${body.reading.id}`)
      .send(reading({ slot: 'after_lunch' }));

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe(
      'You already have an After lunch reading for this date.',
    );
  });

  it('rejects moving a reading to a date that already has 4 readings', async () => {
    await fillDay('2026-01-16');
    const { body } = await create();

    const response = await agent
      .put(`/api/readings/${body.reading.id}`)
      .send(reading({ date: '2026-01-16' }));

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('You can add only 4 readings per day.');
  });

  it('applies the same validation as create', async () => {
    const { body } = await create();

    const response = await agent
      .put(`/api/readings/${body.reading.id}`)
      .send(reading({ value: 601 }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('returns 404 for an unknown or malformed id', async () => {
    const unknown = await agent
      .put('/api/readings/6f1c1a3e-0b8e-4d57-9d57-2f6c9b1a1111')
      .send(reading());
    const malformed = await agent.put('/api/readings/not-a-uuid').send(reading());

    for (const response of [unknown, malformed]) {
      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Reading not found.');
    }
  });
});

describe('DELETE /api/readings/:id', () => {
  it('deletes the reading and it is gone afterwards', async () => {
    const { body } = await create();

    const response = await agent.delete(`/api/readings/${body.reading.id}`);
    const list = await agent.get(`/api/readings?date=${PAST_DATE}`);

    expect(response.status).toBe(204);
    expect(list.body.data).toEqual([]);
    expect((await agent.delete(`/api/readings/${body.reading.id}`)).status).toBe(404);
  });
});

describe('isolation between users', () => {
  let other: Agent;
  let readingId: string;

  beforeEach(async () => {
    other = await createAuthenticatedAgent('ben@example.com');
    readingId = (await create()).body.reading.id;
  });

  it('never lists another user’s readings', async () => {
    const response = await other.get(`/api/readings?date=${PAST_DATE}`);

    expect(response.body.data).toEqual([]);
    expect(response.body.meta.total).toBe(0);
  });

  it('returns 404 when another user updates or deletes the reading', async () => {
    const update = await other.put(`/api/readings/${readingId}`).send(reading({ value: 300 }));
    const remove = await other.delete(`/api/readings/${readingId}`);

    for (const response of [update, remove]) {
      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Reading not found.');
    }
    const own = await agent.get(`/api/readings?date=${PAST_DATE}`);
    expect(own.body.data).toHaveLength(1);
    expect(own.body.data[0].value).toBe(110);
  });

  it('does not count another user’s readings towards the daily limit or slot', async () => {
    const response = await create(reading(), other);

    expect(response.status).toBe(201);
  });
});

describe('authentication', () => {
  it.each([
    ['get', '/api/readings?date=2026-01-15'],
    ['post', '/api/readings'],
    ['put', '/api/readings/6f1c1a3e-0b8e-4d57-9d57-2f6c9b1a1111'],
    ['delete', '/api/readings/6f1c1a3e-0b8e-4d57-9d57-2f6c9b1a1111'],
  ] as const)('returns 401 for unauthenticated %s %s', async (method, url) => {
    const response = await request(app)[method](url).send(reading());

    expect(response.status).toBe(401);
  });
});
