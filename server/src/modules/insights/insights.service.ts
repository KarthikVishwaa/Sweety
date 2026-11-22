import { todayInTimeZone } from '../../utils/date.js';
import { MAX_READINGS_PER_DAY, SLOT_KEYS, SLOT_LABELS } from '../readings/readings.constants.js';
import * as reportsRepository from '../reports/reports.repository.js';
import { compare } from './insights.comparison.js';
import { daysInPeriod, monthOf, monthRange, previousMonth } from './insights.month.js';
import * as insightsRepository from './insights.repository.js';
import type { ExtremeReading, MonthStats, SlotAverage } from './insights.repository.js';
import { percentages } from './insights.rounding.js';
import { currentStreak, longestStreak } from './insights.streaks.js';
import type { Bands, Highlight, Insights, SlotInsight } from './insights.types.js';

function bandsOf({ count, low, high }: MonthStats): { counts: Bands; percentages: Bands } {
  const counts = { low, inRange: count - low - high, high };
  const [lowPercent = 0, inRangePercent = 0, highPercent = 0] = percentages([
    counts.low,
    counts.inRange,
    counts.high,
  ]);
  return { counts, percentages: { low: lowPercent, inRange: inRangePercent, high: highPercent } };
}

function slotInsights(rows: SlotAverage[]): SlotInsight[] {
  return SLOT_KEYS.map((slot) => {
    const row = rows.find((candidate) => candidate.slot === slot);
    return {
      slot,
      slotLabel: SLOT_LABELS[slot],
      average: row?.average ?? null,
      count: row?.count ?? 0,
    };
  });
}

// The first slot of the day wins a tie.
function highestSlotOf(slots: SlotInsight[]) {
  let best: SlotInsight | undefined;
  for (const slot of slots) {
    if (slot.average !== null && (best === undefined || slot.average > (best.average as number))) {
      best = slot;
    }
  }
  return best?.slot ?? null;
}

function highlightOf(rows: ExtremeReading[], kind: ExtremeReading['kind']): Highlight | null {
  const row = rows.find((candidate) => candidate.kind === kind);
  return row
    ? { value: row.value, date: row.date, slot: row.slot, slotLabel: SLOT_LABELS[row.slot] }
    : null;
}

/** Everything the profile page shows for one month. `now` is injectable so the month rules are testable. */
export async function buildInsights(
  userId: string,
  requestedMonth?: string,
  now: Date = new Date(),
): Promise<Insights> {
  const today = todayInTimeZone(now);
  const month = requestedMonth ?? monthOf(today);
  const range = monthRange(month, today);
  const previousRange = monthRange(previousMonth(month), today);

  const [stats, previousStats, slotRows, days, extremes, recent, lifetime] = await Promise.all([
    insightsRepository.monthStats(userId, range),
    insightsRepository.monthStats(userId, previousRange),
    insightsRepository.slotAverages(userId, range),
    reportsRepository.summariseDays(userId, range),
    insightsRepository.extremeReadings(userId, range),
    insightsRepository.recentReadings(userId),
    insightsRepository.lifetime(userId),
  ]);

  const bands = bandsOf(stats);
  const previousBands = bandsOf(previousStats);
  const bySlot = slotInsights(slotRows);
  const loggedDays = days.map((day) => day.date);
  const period = daysInPeriod(range);

  return {
    month,
    range,
    count: stats.count,
    average: stats.average,
    highest: stats.highest,
    lowest: stats.lowest,
    bands,
    bySlot,
    highestSlot: highestSlotOf(bySlot),
    days,
    consistency: {
      daysLogged: days.length,
      daysInPeriod: period,
      currentStreak: currentStreak(new Set(loggedDays), range.to),
      longestStreak: longestStreak(loggedDays),
      completionPercent: Math.round((stats.count / (period * MAX_READINGS_PER_DAY)) * 100),
    },
    highlights: {
      highest: highlightOf(extremes, 'highest'),
      lowest: highlightOf(extremes, 'lowest'),
    },
    comparison: compare(
      { count: stats.count, average: stats.average, inRangePercent: bands.percentages.inRange },
      {
        count: previousStats.count,
        average: previousStats.average,
        inRangePercent: previousBands.percentages.inRange,
      },
    ),
    recent: recent.map((reading) => ({ ...reading, slotLabel: SLOT_LABELS[reading.slot] })),
    lifetime,
  };
}
