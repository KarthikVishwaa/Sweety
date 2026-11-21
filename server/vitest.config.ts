import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

const testDatabaseUrl = new URL(
  process.env.DATABASE_URL ?? 'postgres://sweety:sweety_dev_password@localhost:5434/sweety',
);
testDatabaseUrl.pathname = '/sweety_test';
process.env.TEST_DATABASE_URL = testDatabaseUrl.href;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    globalSetup: ['./src/tests/globalSetup.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      CLIENT_URL: 'http://localhost:5173',
      DATABASE_URL: testDatabaseUrl.href,
      REDIS_URL: 'redis://localhost:6380',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      JWT_EXPIRES_IN: '15m',
      TZ: 'Asia/Kolkata',
    },
  },
});
