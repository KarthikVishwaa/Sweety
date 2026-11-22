/** Below `low` is low, above `high` is high, and everything from `low` to `high` is in range. */
export const GLUCOSE_THRESHOLDS = { low: 70, high: 180 } as const;

export const RECENT_READINGS = 5;

export const INSIGHTS_MESSAGES = {
  monthInvalid: 'Please choose a valid month.',
  monthInFuture: 'Month cannot be in the future.',
} as const;
