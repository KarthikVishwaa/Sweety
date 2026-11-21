import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      CLIENT_URL: 'http://localhost:5173',
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      JWT_EXPIRES_IN: '15m',
      TZ: 'Asia/Kolkata',
    },
  },
});
