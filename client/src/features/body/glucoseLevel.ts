import {
  GLUCOSE_THRESHOLDS,
  MIN_GLUCOSE_VALUE,
  getGlucoseBand,
  type GlucoseBandKey,
} from '@/features/readings/readings.constants';

/** The body is empty at the lowest value the app accepts and full at this value or above. */
export const GLUCOSE_FULL_VALUE = 400;

export const BAND_COLORS: Record<GlucoseBandKey | 'none', string> = {
  low: '#f59e0b',
  'in-range': '#10b981',
  high: '#ef4444',
  none: '#94a3b8',
};

/** How full the body is, from 0 (empty) to 1 (liquid at the top of the head). */
export function glucoseToFill(value: number | null): number {
  if (value === null) return 0;
  const fraction = (value - MIN_GLUCOSE_VALUE) / (GLUCOSE_FULL_VALUE - MIN_GLUCOSE_VALUE);
  return Math.min(Math.max(fraction, 0), 1);
}

export function glucoseBandColor(value: number | null): string {
  return BAND_COLORS[value === null ? 'none' : getGlucoseBand(value).key];
}

/** Where the thin rings marking the edges of the target range sit on the body. */
export const RING_FILLS = {
  low: glucoseToFill(GLUCOSE_THRESHOLDS.low),
  high: glucoseToFill(GLUCOSE_THRESHOLDS.high),
} as const;
