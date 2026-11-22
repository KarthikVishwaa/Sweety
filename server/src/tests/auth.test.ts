import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';

const validUser = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  password: 'sweet1234',
  dateOfBirth: '1990-05-15',
  gender: 'male',
};
const INVALID_CREDENTIALS = 'Invalid email or password.';

const register = (body: object = validUser) => request(app).post('/api/auth/register').send(body);
const login = (body: object) => request(app).post('/api/auth/login').send(body);

function getAuthCookie(response: request.Response): string | undefined {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((cookie) => cookie.startsWith('sweety_token='));
}

beforeEach(async () => {
  await pool.query('TRUNCATE users CASCADE');
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('creates the account, sets the auth cookie and hides the hash', async () => {
    const response = await register();

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: 'Asha Rao',
      email: 'asha@example.com',
      role: 'patient',
      dateOfBirth: '1990-05-15',
      gender: 'male',
    });
    expect(response.body.user.id).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);

    const cookie = getAuthCookie(response);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=900');
  });

  it('stores the password as a bcrypt hash', async () => {
    await register();

    const { rows } = await pool.query('SELECT password_hash FROM users');

    expect(rows[0].password_hash).not.toBe(validUser.password);
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('normalises the email and trims the name', async () => {
    const response = await register({
      ...validUser,
      name: '  Asha Rao  ',
      email: ' ASHA@Example.com ',
    });

    expect(response.body.user).toMatchObject({ name: 'Asha Rao', email: 'asha@example.com' });
  });

  it('rejects a duplicate email, including with different letter case', async () => {
    await register();

    const same = await register();
    const differentCase = await register({ ...validUser, email: 'ASHA@EXAMPLE.COM' });

    for (const response of [same, differentCase]) {
      expect(response.status).toBe(409);
      expect(response.body.error.message).toBe('An account with this email already exists.');
    }
  });

  it('returns field errors for invalid payloads', async () => {
    const response = await register({ email: 'not-an-email', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual({
      name: 'Name is required',
      email: 'Enter a valid email address',
      password: 'Password must be at least 8 characters',
      dateOfBirth: 'Please enter your date of birth.',
      gender: 'Please choose a gender.',
    });
  });

  it.each([
    ['letters only', 'onlyletters', 'Password must contain at least one number'],
    ['numbers only', '12345678', 'Password must contain at least one letter'],
    ['over 72 characters', `a1${'x'.repeat(71)}`, 'Password must be at most 72 characters'],
  ])('rejects a password with %s', async (_label, password, message) => {
    const response = await register({ ...validUser, password });

    expect(response.status).toBe(400);
    expect(response.body.error.details.password).toBe(message);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register();
  });

  it('logs in with valid credentials and sets the cookie', async () => {
    const response = await login({ email: 'ASHA@example.com', password: validUser.password });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('asha@example.com');
    expect(getAuthCookie(response)).toBeDefined();
  });

  it('gives the identical 401 for a wrong password and an unknown email', async () => {
    const wrongPassword = await login({ email: validUser.email, password: 'wrongpass1' });
    const unknownEmail = await login({ email: 'nobody@example.com', password: 'wrongpass1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.message).toBe(INVALID_CREDENTIALS);
    expect(getAuthCookie(wrongPassword)).toBeUndefined();
  });

  it('returns field errors when the payload is incomplete', async () => {
    const response = await login({});

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    });
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user when the cookie is present', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(validUser);

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: 'asha@example.com', role: 'patient' });
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);
  });

  it('returns 401 without a cookie', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for a tampered token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'sweety_token=not.a.valid.token');

    expect(response.status).toBe(401);
  });

  it('returns 401 when the user no longer exists', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(validUser);
    await pool.query('TRUNCATE users CASCADE');

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie and ends the session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(validUser);

    const response = await agent.post('/api/auth/logout');

    expect(response.status).toBe(204);
    expect(getAuthCookie(response)).toMatch(/^sweety_token=;.*Expires=Thu, 01 Jan 1970/);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});
