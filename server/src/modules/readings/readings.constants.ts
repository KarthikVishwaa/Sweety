export const SLOT_KEYS = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
] as const;

export const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
} as const satisfies Record<(typeof SLOT_KEYS)[number], string>;

export const SLOT_ARTICLES = {
  morning_fasting: 'a',
  after_breakfast: 'an',
  after_lunch: 'an',
  after_dinner: 'an',
} as const satisfies Record<(typeof SLOT_KEYS)[number], 'a' | 'an'>;

export const MAX_READINGS_PER_DAY = SLOT_KEYS.length;
export const MIN_GLUCOSE_VALUE = 40;
export const MAX_GLUCOSE_VALUE = 600;

export const READING_MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueOutOfRange: `Value must be between ${MIN_GLUCOSE_VALUE} and ${MAX_GLUCOSE_VALUE} mg/dl.`,
  dateInvalid: 'Please choose a valid date.',
  slotInvalid: 'Please choose a time slot.',
  dateInFuture: 'Date cannot be in the future.',
  dailyLimit: `You can add only ${MAX_READINGS_PER_DAY} readings per day.`,
  notFound: 'Reading not found.',
} as const;
