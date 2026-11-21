import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';
import { resetDatabase } from './helpers/db.js';

const NOW = new Date('2026-11-21T06:00:00Z');
const valid = { name: 'Asha Rao', email: 'asha@example.com', password: 'sweet1234' };

const register = (dateOfBirth?: unknown) =>
  request(app)
    .post('/api/auth/register')
    .send({ ...valid, dateOfBirth });

beforeEach(async () => {
  await resetDatabase();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await pool.end();
});

describe('registering with a date of birth', () => {
  it('stores it and returns it from register, login and /me', async () => {
    const agent = request.agent(app);
    const created = await agent
      .post('/api/auth/register')
      .send({ ...valid, dateOfBirth: '1990-05-15' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: valid.email, password: valid.password });
    const me = await agent.get('/api/auth/me');

    expect(created.status).toBe(201);
    for (const response of [created, login, me]) {
      expect(response.body.user.dateOfBirth).toBe('1990-05-15');
    }
    const { rows } = await pool.query('SELECT date_of_birth FROM users');
    expect(rows).toEqual([{ date_of_birth: '1990-05-15' }]);
  });

  it('does not return an age', async () => {
    const response = await register('1990-05-15');

    expect(response.body.user).not.toHaveProperty('age');
  });

  it('still lets an account created without a date of birth log in', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ ...valid, dateOfBirth: '1990-05-15' });
    await pool.query('UPDATE users SET date_of_birth = NULL');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: valid.email, password: valid.password });
    const me = await agent.get('/api/auth/me');

    expect(login.status).toBe(200);
    expect(login.body.user.dateOfBirth).toBeNull();
    expect(me.status).toBe(200);
    expect(me.body.user.dateOfBirth).toBeNull();
  });
});

describe('date of birth validation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  it.each([
    ['missing', undefined, 'Please enter your date of birth.'],
    ['empty', '', 'Please enter your date of birth.'],
    ['blank', '   ', 'Please enter your date of birth.'],
    ['not a date', 'abc', 'Please enter a valid date of birth.'],
    ['not a real date', '1990-02-30', 'Please enter a valid date of birth.'],
    ['badly formatted', '15/05/1990', 'Please enter a valid date of birth.'],
    ['a number', 19900515, 'Please enter your date of birth.'],
    ['tomorrow', '2026-11-22', 'Date of birth cannot be in the future.'],
    ['in the distant future', '2999-01-01', 'Date of birth cannot be in the future.'],
    ['more than 120 years ago', '1906-11-20', 'Please enter a valid date of birth.'],
    ['year 1', '0001-01-01', 'Please enter a valid date of birth.'],
  ])('rejects a date of birth that is %s', async (_label, value, message) => {
    const response = await register(value);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.dateOfBirth).toBe(message);
    const { rowCount } = await pool.query('SELECT 1 FROM users');
    expect(rowCount).toBe(0);
  });

  it.each([
    ['today', '2026-11-21'],
    ['yesterday', '2026-11-20'],
    ['exactly 120 years ago', '1906-11-21'],
    ['a newborn’s birthday', '2026-11-01'],
  ])('accepts %s', async (_label, value) => {
    expect((await register(value)).status).toBe(201);
  });

  it('judges "today" in Asia/Kolkata, so 00:30 IST counts as the new day', async () => {
    vi.setSystemTime(new Date('2026-11-20T19:00:00Z'));

    expect((await register('2026-11-21')).status).toBe(201);
    const tomorrow = await register('2026-11-22');
    expect(tomorrow.body.error.details.dateOfBirth).toBe('Date of birth cannot be in the future.');
  });

  it('reports every invalid field, with the date of birth under its own key', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: 'nope' });

    expect(response.body.error.details).toEqual({
      name: 'Name is required',
      email: 'Enter a valid email address',
      password: 'Password is required',
      dateOfBirth: 'Please enter your date of birth.',
    });
  });
});

describe('duplicate email', () => {
  it('attaches the 409 message to the email field', async () => {
    await register('1990-05-15');

    const response = await register('1991-06-16');

    expect(response.status).toBe(409);
    expect(response.body.error.details).toEqual({
      email: 'An account with this email already exists.',
    });
  });
});
