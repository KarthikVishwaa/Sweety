import { describe, expect, it } from 'vitest';
import type { Reading, ReadingSlot } from '@/features/readings/types';
import { EMPTY_BODY_CAPTION, bodyCaption, latestReadingOfDay } from './latestReading';

function reading(slot: ReadingSlot, value: number): Reading {
  return {
    id: slot,
    date: '2026-11-21',
    slot,
    slotLabel: slot,
    value,
    createdAt: '',
    updatedAt: '',
  };
}

describe('latestReadingOfDay', () => {
  it('prefers after dinner, then lunch, breakfast and the morning', () => {
    const morning = reading('morning_fasting', 90);
    const breakfast = reading('after_breakfast', 120);
    const lunch = reading('after_lunch', 182);
    const dinner = reading('after_dinner', 140);

    expect(latestReadingOfDay([morning, breakfast, lunch, dinner])).toBe(dinner);
    expect(latestReadingOfDay([dinner, lunch, morning])).toBe(dinner);
    expect(latestReadingOfDay([breakfast, morning, lunch])).toBe(lunch);
    expect(latestReadingOfDay([morning, breakfast])).toBe(breakfast);
    expect(latestReadingOfDay([morning])).toBe(morning);
  });

  it('finds nothing on an empty day', () => {
    expect(latestReadingOfDay([])).toBeUndefined();
  });
});

describe('bodyCaption', () => {
  it.each([
    [reading('after_lunch', 182), 'After lunch, 182 mg/dl, High'],
    [reading('morning_fasting', 69), 'Morning (fasting), 69 mg/dl, Low'],
    [reading('after_dinner', 110), 'After dinner, 110 mg/dl, In range'],
  ])('describes %j', (input, expected) => {
    expect(bodyCaption(input)).toBe(expected);
  });

  it('invites the first reading when there is none', () => {
    expect(bodyCaption(undefined)).toBe(EMPTY_BODY_CAPTION);
  });
});
