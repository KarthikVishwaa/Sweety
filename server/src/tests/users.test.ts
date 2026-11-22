import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';
import { createAuthenticatedAgent } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';

const MESSAGE = 'Please choose a gender.';
const valid = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  password: 'sweet1234',
  dateOfBirth: '1990-05-15',
};

const register = (gender?: unknown) =>
  request(app)
    .post('/api/auth/register')
    .send({ ...valid, gender });
const genderInDatabase = async (email: string) =>
  (await pool.query('SELECT gender FROM users WHERE email = $1', [email])).rows[0]?.gender;

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('gender at registration', () => {
  it('stores it and returns it from register, login and /me', async () => {
    const agent = request.agent(app);
    const created = await agent.post('/api/auth/register').send({ ...valid, gender: 'female' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: valid.email, password: valid.password });
    const me = await agent.get('/api/auth/me');

    expect(created.status).toBe(201);
    for (const response of [created, login, me]) {
      expect(response.body.user.gender).toBe('female');
    }
    expect(await genderInDatabase(valid.email)).toBe('female');
  });

  it('registers with other and returns it everywhere', async () => {
    const agent = request.agent(app);
    const created = await agent.post('/api/auth/register').send({ ...valid, gender: 'other' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: valid.email, password: valid.password });

    expect(created.body.user.gender).toBe('other');
    expect(login.body.user.gender).toBe('other');
    expect(await genderInDatabase(valid.email)).toBe('other');
  });

  it('is enforced by the database as well as the API', async () => {
    await register('male');

    await expect(
      pool.query("UPDATE users SET gender = 'robot' WHERE email = $1", [valid.email]),
    ).rejects.toThrow(/users_gender_check/);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['not a known model', 'robot'],
    ['the wrong case', 'Male'],
    ['a number', 1],
    ['null', null],
  ])('rejects a gender that is %s', async (_label, value) => {
    const response = await register(value);

    expect(response.status).toBe(400);
    expect(response.body.error.details.gender).toBe(MESSAGE);
    expect((await pool.query('SELECT 1 FROM users')).rowCount).toBe(0);
  });
});

describe('accounts that existed before gender', () => {
  const insertOldAccount = async () => {
    const passwordHash = await bcrypt.hash(valid.password, 4);
    await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)', [
      'Old Account',
      'old@example.com',
      passwordHash,
    ]);
  };

  it('have no gender, not a default one, and can still log in', async () => {
    await insertOldAccount();
    const agent = request.agent(app);

    const login = await agent
      .post('/api/auth/login')
      .send({ email: 'old@example.com', password: valid.password });
    const me = await agent.get('/api/auth/me');

    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ gender: null, dateOfBirth: null });
    expect(me.body.user.gender).toBeNull();
    expect(await genderInDatabase('old@example.com')).toBeNull();
  });

  it('can choose a gender later', async () => {
    await insertOldAccount();
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'old@example.com', password: valid.password });

    const response = await agent.patch('/api/users/me').send({ gender: 'other' });

    expect(response.status).toBe(200);
    expect(response.body.user.gender).toBe('other');
  });
});

describe('PATCH /api/users/me', () => {
  it('changes the gender, persists it and returns the updated user', async () => {
    const agent = await createAuthenticatedAgent();

    const response = await agent.patch('/api/users/me').send({ gender: 'female' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: 'asha@example.com', gender: 'female' });
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);
    expect((await agent.get('/api/auth/me')).body.user.gender).toBe('female');
    expect(await genderInDatabase('asha@example.com')).toBe('female');
  });

  it('accepts other, as a full option', async () => {
    const agent = await createAuthenticatedAgent();

    const response = await agent.patch('/api/users/me').send({ gender: 'other' });

    expect(response.status).toBe(200);
    expect(response.body.user.gender).toBe('other');
    expect(await genderInDatabase('asha@example.com')).toBe('other');
  });

  it('can switch back', async () => {
    const agent = await createAuthenticatedAgent();
    await agent.patch('/api/users/me').send({ gender: 'female' });

    const response = await agent.patch('/api/users/me').send({ gender: 'male' });

    expect(response.body.user.gender).toBe('male');
  });

  it.each([
    ['unknown', { gender: 'robot' }],
    ['not a string', { gender: 7 }],
    ['null', { gender: null }],
    ['the wrong case', { gender: 'Female' }],
  ])('rejects a gender that is %s and changes nothing', async (_label, body) => {
    const agent = await createAuthenticatedAgent();

    const response = await agent.patch('/api/users/me').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details.gender).toBe(MESSAGE);
    expect(await genderInDatabase('asha@example.com')).toBe('male');
  });

  it('requires authentication', async () => {
    const response = await request(app).patch('/api/users/me').send({ gender: 'female' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('only ever changes the logged-in user’s own row', async () => {
    const asha = await createAuthenticatedAgent('asha@example.com');
    await createAuthenticatedAgent('ben@example.com');

    await asha.patch('/api/users/me').send({ gender: 'female' });

    expect(await genderInDatabase('asha@example.com')).toBe('female');
    expect(await genderInDatabase('ben@example.com')).toBe('male');
  });

  it('ignores any other field, such as a role or an id', async () => {
    const agent = await createAuthenticatedAgent();
    const { body: before } = await agent.get('/api/auth/me');

    const response = await agent
      .patch('/api/users/me')
      .send({ gender: 'female', role: 'doctor', email: 'evil@example.com', id: 'x' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: before.user.id,
      email: 'asha@example.com',
      role: 'patient',
    });
  });
});

describe('PATCH /api/users/me profile fields', () => {
  const patch = (body: unknown) =>
    createAuthenticatedAgent().then((agent) => agent.patch('/api/users/me').send(body));
  const rowOf = async (email: string) =>
    (
      await pool.query(
        'SELECT name, gender, date_of_birth::text AS "dateOfBirth" FROM users WHERE email = $1',
        [email],
      )
    ).rows[0];

  afterEach(() => {
    vi.useRealTimers();
  });

  it('changes the name, trimmed, and leaves everything else alone', async () => {
    const response = await patch({ name: '  Asha Rao  ' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ name: 'Asha Rao', gender: 'male' });
    expect(await rowOf('asha@example.com')).toEqual({
      name: 'Asha Rao',
      gender: 'male',
      dateOfBirth: '1990-05-15',
    });
  });

  it('changes the date of birth', async () => {
    const response = await patch({ dateOfBirth: '1985-02-03' });

    expect(response.status).toBe(200);
    expect(response.body.user.dateOfBirth).toBe('1985-02-03');
    expect((await rowOf('asha@example.com')).dateOfBirth).toBe('1985-02-03');
  });

  it('changes several fields at once', async () => {
    const response = await patch({ name: 'Asha K', gender: 'female', dateOfBirth: '1991-01-01' });

    expect(response.body.user).toMatchObject({
      name: 'Asha K',
      gender: 'female',
      dateOfBirth: '1991-01-01',
    });
  });

  it('needs at least one field', async () => {
    const response = await patch({});

    expect(response.status).toBe(400);
    expect(response.body.error.details.changes).toBe('Please change at least one field.');
  });

  it.each([
    ['a name that is too short', { name: 'A' }, 'name', 'Name must be at least 2 characters'],
    [
      'a name that is too long',
      { name: 'x'.repeat(61) },
      'name',
      'Name must be at most 60 characters',
    ],
    ['a blank name', { name: '   ' }, 'name', 'Name must be at least 2 characters'],
    [
      'a date of birth that is not a date',
      { dateOfBirth: '1990-02-31' },
      'dateOfBirth',
      'Please enter a valid date of birth.',
    ],
    [
      'a date of birth in the future',
      { dateOfBirth: '2999-01-01' },
      'dateOfBirth',
      'Date of birth cannot be in the future.',
    ],
    [
      'a date of birth more than 120 years ago',
      { dateOfBirth: '1800-01-01' },
      'dateOfBirth',
      'Please enter a valid date of birth.',
    ],
  ])('rejects %s and changes nothing', async (_label, body, field, message) => {
    const response = await patch(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details[field]).toBe(message);
    expect(await rowOf('asha@example.com')).toEqual({
      name: 'Test User',
      gender: 'male',
      dateOfBirth: '1990-05-15',
    });
  });

  it('rejects a date of birth that is later than today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-25T06:00:00Z'));

    const response = await patch({ dateOfBirth: '2026-10-26' });

    expect(response.status).toBe(400);
    expect(response.body.error.details.dateOfBirth).toBe('Date of birth cannot be in the future.');
  });

  it('does not change the email or the password', async () => {
    const agent = await createAuthenticatedAgent();

    await agent
      .patch('/api/users/me')
      .send({ name: 'Asha K', email: 'evil@example.com', password: 'hacked1234' });

    expect((await agent.get('/api/auth/me')).body.user.email).toBe('asha@example.com');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@example.com', password: 'sweet1234' });
    expect(login.status).toBe(200);
  });

  it('only changes the logged-in user’s own row', async () => {
    const asha = await createAuthenticatedAgent('asha@example.com');
    await createAuthenticatedAgent('ben@example.com');

    await asha.patch('/api/users/me').send({ name: 'Asha K', dateOfBirth: '1980-01-01' });

    expect(await rowOf('ben@example.com')).toEqual({
      name: 'Test User',
      gender: 'male',
      dateOfBirth: '1990-05-15',
    });
  });

  it('requires authentication', async () => {
    const response = await request(app).patch('/api/users/me').send({ name: 'Asha K' });

    expect(response.status).toBe(401);
  });
});

describe('createdAt on the user', () => {
  it('is an ISO timestamp from register, login, /me and PATCH', async () => {
    const agent = request.agent(app);
    const created = await agent.post('/api/auth/register').send({ ...valid, gender: 'male' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: valid.email, password: valid.password });
    const me = await agent.get('/api/auth/me');
    const patched = await agent.patch('/api/users/me').send({ name: 'Asha K' });

    for (const response of [created, login, me, patched]) {
      expect(response.body.user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
    }
    expect(me.body.user.createdAt).toBe(created.body.user.createdAt);
  });
});
