import { addDays } from '../../utils/date.js';

/**
 * The run of consecutive logged days that ends on `endDate`, or on the day before it when `endDate` itself
 * has no reading yet (today is not over, so it does not break the streak). 0 when neither day was logged.
 */
export function currentStreak(loggedDays: ReadonlySet<string>, endDate: string): number {
  let day = loggedDays.has(endDate) ? endDate : addDays(endDate, -1);
  let streak = 0;
  while (loggedDays.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** The longest run of consecutive logged days. */
export function longestStreak(loggedDays: readonly string[]): number {
  const sorted = [...new Set(loggedDays)].sort();
  let longest = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of sorted) {
    run = previous !== undefined && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return longest;
}
