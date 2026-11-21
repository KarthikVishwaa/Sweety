import { SLOT_KEYS } from '../modules/readings/readings.constants.js';
import type { ReadingSlot } from '../modules/readings/readings.types.js';
import { addDays } from '../utils/date.js';
import { createRng } from './prng.js';

export interface SeedReading {
  date: string;
  slot: ReadingSlot;
  value: number;
}

const DEMO_SEED = 20261121;
const EMPTY_DAY_CHANCE = 0.06;
const FULL_DAY_CHANCE = 0.6;
const HIGH_CHANCE = 0.08;
const LOW_CHANCE = 0.04;

const SLOT_PROFILE: Record<ReadingSlot, { mean: number; spread: number }> = {
  morning_fasting: { mean: 98, spread: 9 },
  after_breakfast: { mean: 142, spread: 15 },
  after_lunch: { mean: 138, spread: 15 },
  after_dinner: { mean: 152, spread: 17 },
};

const IN_RANGE_LIMITS = { min: 72, max: 178 };

function normal(rng: () => number, mean: number, spread: number): number {
  const radius = Math.sqrt(-2 * Math.log(1 - rng()));
  return mean + spread * radius * Math.cos(2 * Math.PI * rng());
}

function pickSlots(rng: () => number): ReadingSlot[] {
  if (rng() < FULL_DAY_CHANCE) return [...SLOT_KEYS];

  const shuffled = [...SLOT_KEYS];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapWith = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapWith]] = [
      shuffled[swapWith] as ReadingSlot,
      shuffled[index] as ReadingSlot,
    ];
  }
  const count = 1 + Math.floor(rng() * 3);
  return SLOT_KEYS.filter((slot) => shuffled.slice(0, count).includes(slot));
}

function pickValue(rng: () => number, slot: ReadingSlot): number {
  const roll = rng();
  if (roll < HIGH_CHANCE) return 181 + Math.floor(rng() * 80);
  if (roll < HIGH_CHANCE + LOW_CHANCE) return 55 + Math.floor(rng() * 15);

  const { mean, spread } = SLOT_PROFILE[slot];
  const value = Math.round(normal(rng, mean, spread));
  return Math.min(IN_RANGE_LIMITS.max, Math.max(IN_RANGE_LIMITS.min, value));
}

export function generateDemoReadings(from: string, to: string): SeedReading[] {
  const rng = createRng(DEMO_SEED);
  const readings: SeedReading[] = [];

  for (let date = from; date <= to; date = addDays(date, 1)) {
    const skipDay = rng() < EMPTY_DAY_CHANCE && date !== to;
    const slots = pickSlots(rng);
    if (skipDay) continue;

    for (const slot of slots) readings.push({ date, slot, value: pickValue(rng, slot) });
  }
  return readings;
}
