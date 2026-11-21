import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';
import { createAuthenticatedAgent } from './helpers/auth.js';
import { resetDatabase } from './helpers/db.js';

const MESSAGE = 'Please choose a body model.';
const valid = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  password: 'sweet1234',
  dateOfBirth: '1990-05-15',
};

const register = (bodyModel?: unknown) =>
  request(app)
    .post('/api/auth/register')
    .send({ ...valid, bodyModel });
const bodyModelInDatabase = async (email: string) =>
  (await pool.query('SELECT body_model FROM users WHERE email = $1', [email])).rows[0]?.body_model;

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('body model at registration', () => {
  it('stores it and returns it from register, login and /me', async () => {
    const agent = request.agent(app);
    const created = await agent.post('/api/auth/register').send({ ...valid, bodyModel: 'female' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: valid.email, password: valid.password });
    const me = await agent.get('/api/auth/me');

    expect(created.status).toBe(201);
    for (const response of [created, login, me]) {
      expect(response.body.user.bodyModel).toBe('female');
    }
    expect(await bodyModelInDatabase(valid.email)).toBe('female');
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['not a known model', 'robot'],
    ['the wrong case', 'Male'],
    ['a number', 1],
    ['null', null],
  ])('rejects a body model that is %s', async (_label, value) => {
    const response = await register(value);

    expect(response.status).toBe(400);
    expect(response.body.error.details.bodyModel).toBe(MESSAGE);
    expect((await pool.query('SELECT 1 FROM users')).rowCount).toBe(0);
  });
});

describe('accounts that existed before the body model', () => {
  it('default to male and can still log in', async () => {
    const passwordHash = await bcrypt.hash(valid.password, 4);
    await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)', [
      'Old Account',
      'old@example.com',
      passwordHash,
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'old@example.com', password: valid.password });

    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ bodyModel: 'male', dateOfBirth: null });
  });
});

describe('PATCH /api/users/me', () => {
  it('changes the body model, persists it and returns the updated user', async () => {
    const agent = await createAuthenticatedAgent();

    const response = await agent.patch('/api/users/me').send({ bodyModel: 'female' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: 'asha@example.com', bodyModel: 'female' });
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);
    expect((await agent.get('/api/auth/me')).body.user.bodyModel).toBe('female');
    expect(await bodyModelInDatabase('asha@example.com')).toBe('female');
  });

  it('can switch back', async () => {
    const agent = await createAuthenticatedAgent();
    await agent.patch('/api/users/me').send({ bodyModel: 'female' });

    const response = await agent.patch('/api/users/me').send({ bodyModel: 'male' });

    expect(response.body.user.bodyModel).toBe('male');
  });

  it.each([
    ['missing', {}],
    ['unknown', { bodyModel: 'robot' }],
    ['not a string', { bodyModel: 7 }],
  ])('rejects a body model that is %s and changes nothing', async (_label, body) => {
    const agent = await createAuthenticatedAgent();

    const response = await agent.patch('/api/users/me').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details.bodyModel).toBe(MESSAGE);
    expect(await bodyModelInDatabase('asha@example.com')).toBe('male');
  });

  it('requires authentication', async () => {
    const response = await request(app).patch('/api/users/me').send({ bodyModel: 'female' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('only ever changes the logged-in user’s own row', async () => {
    const asha = await createAuthenticatedAgent('asha@example.com');
    await createAuthenticatedAgent('ben@example.com');

    await asha.patch('/api/users/me').send({ bodyModel: 'female' });

    expect(await bodyModelInDatabase('asha@example.com')).toBe('female');
    expect(await bodyModelInDatabase('ben@example.com')).toBe('male');
  });

  it('ignores any other field, such as a role or an id', async () => {
    const agent = await createAuthenticatedAgent();
    const { body: before } = await agent.get('/api/auth/me');

    const response = await agent
      .patch('/api/users/me')
      .send({ bodyModel: 'female', role: 'doctor', email: 'evil@example.com', id: 'x' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: before.user.id,
      email: 'asha@example.com',
      role: 'patient',
    });
  });
});
