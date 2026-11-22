import type { ReadingSlot } from '@/features/readings/types';

/** Short names for the places where the full slot label would not fit, such as a chart axis. */
export const SLOT_SHORT_LABELS: Record<ReadingSlot, string> = {
  morning_fasting: 'Fasting',
  after_breakfast: 'Breakfast',
  after_lunch: 'Lunch',
  after_dinner: 'Dinner',
};
