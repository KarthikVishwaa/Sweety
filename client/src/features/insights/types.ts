import type { ReadingSlot } from '@/features/readings/types';
import type { DaySummary } from '@/features/reports/types';

export interface Bands {
  low: number;
  inRange: number;
  high: number;
}

export interface SlotInsight {
  slot: ReadingSlot;
  slotLabel: string;
  average: number | null;
  count: number;
}

export interface Highlight {
  value: number;
  date: string;
  slot: ReadingSlot;
  slotLabel: string;
}

export interface Comparison {
  previousAverage: number | null;
  previousInRangePercent: number | null;
  averageChange: number | null;
  inRangeChange: number | null;
}

export interface Consistency {
  daysLogged: number;
  daysInPeriod: number;
  currentStreak: number;
  longestStreak: number;
  completionPercent: number;
}

export interface RecentReading {
  id: string;
  date: string;
  slot: ReadingSlot;
  slotLabel: string;
  value: number;
}

export interface Insights {
  month: string;
  range: { from: string; to: string };
  count: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  bands: { counts: Bands; percentages: Bands };
  bySlot: SlotInsight[];
  highestSlot: ReadingSlot | null;
  days: DaySummary[];
  consistency: Consistency;
  highlights: { highest: Highlight | null; lowest: Highlight | null };
  comparison: Comparison;
  recent: RecentReading[];
  lifetime: { totalReadings: number; firstReadingDate: string | null };
}
