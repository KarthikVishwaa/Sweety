import type { ReadingSlot } from './types';

export const SLOT_KEYS = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
] as const satisfies readonly ReadingSlot[];

export const SLOT_LABELS: Record<ReadingSlot, string> = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

export const SLOTS = SLOT_KEYS.map((key) => ({ key, label: SLOT_LABELS[key] }));

export const MAX_READINGS_PER_DAY = SLOT_KEYS.length;
export const MIN_GLUCOSE_VALUE = 40;
export const MAX_GLUCOSE_VALUE = 600;

export const GLUCOSE_THRESHOLDS = { low: 70, high: 180 } as const;

export type GlucoseBandKey = 'low' | 'in-range' | 'high';

export function getGlucoseBand(value: number): { key: GlucoseBandKey; label: string } {
  if (value < GLUCOSE_THRESHOLDS.low) return { key: 'low', label: 'Low' };
  if (value > GLUCOSE_THRESHOLDS.high) return { key: 'high', label: 'High' };
  return { key: 'in-range', label: 'In range' };
}
