import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => vi.fn());

vi.mock('../db/pool.js', () => ({ pool: { query } }));

const { app } = await import('../app.js');

describe('GET /api/health', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('reports ok when the database responds', async () => {
    query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', db: 'up' });
  });

  it('reports degraded with 503 when the database is unreachable', async () => {
    query.mockRejectedValue(new Error('connection refused'));

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'degraded', db: 'down' });
  });

  it('returns the central error shape for unknown routes', async () => {
    const response = await request(app).get('/api/nope');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('does not advertise the framework', async () => {
    query.mockResolvedValue({ rows: [] });

    const response = await request(app).get('/api/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
