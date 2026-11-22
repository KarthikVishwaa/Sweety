import { SLOT_KEYS, SLOT_LABELS, getGlucoseBand } from '@/features/readings/readings.constants';
import type { Reading } from '@/features/readings/types';

/** The filled slot that comes latest in the day: after dinner, then lunch, breakfast, morning. */
export function latestReadingOfDay(readings: readonly Reading[]): Reading | undefined {
  for (const slot of [...SLOT_KEYS].reverse()) {
    const reading = readings.find((candidate) => candidate.slot === slot);
    if (reading) return reading;
  }
  return undefined;
}

export const EMPTY_BODY_CAPTION = 'Add your first reading for this day';

/** For example "After lunch, 182 mg/dl, High". */
export function bodyCaption(reading: Reading | undefined): string {
  if (!reading) return EMPTY_BODY_CAPTION;
  return `${SLOT_LABELS[reading.slot]}, ${reading.value} mg/dl, ${getGlucoseBand(reading.value).label}`;
}
