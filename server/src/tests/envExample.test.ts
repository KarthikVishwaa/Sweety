import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ENV_KEYS } from '../config/env.js';

const example = readFileSync(
  fileURLToPath(new URL('../../../.env.example', import.meta.url)),
  'utf8',
);
const lines = example.split('\n');
const assignments = lines.filter((line) => /^[A-Z_]+=/.test(line));
const keys = assignments.map((line) => line.split('=')[0]);

describe('.env.example', () => {
  it('lists every variable the server reads, and nothing else', () => {
    expect([...keys].sort()).toEqual([...ENV_KEYS].sort());
  });

  it('documents every variable with a comment line directly above it', () => {
    for (const key of keys) {
      const index = lines.findIndex((line) => line.startsWith(`${key}=`));
      expect(lines[index - 1]?.startsWith('#'), `${key} needs a comment`).toBe(true);
    }
  });

  it('ships no secret: JWT_SECRET is empty so the server refuses to boot until it is set', () => {
    expect(assignments).toContain('JWT_SECRET=');
  });
});
