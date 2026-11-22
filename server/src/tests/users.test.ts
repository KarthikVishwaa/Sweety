import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
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
    ['missing', {}],
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
