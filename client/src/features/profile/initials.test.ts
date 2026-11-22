import { describe, expect, it } from 'vitest';
import { initials } from './initials';

describe('initials', () => {
  it.each([
    ['Asha Rao', 'AR'],
    ['asha rao', 'AR'],
    ['Asha', 'A'],
    ['  Asha   K  Rao ', 'AR'],
    ['', ''],
    ['   ', ''],
  ])('turns %j into %j', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
