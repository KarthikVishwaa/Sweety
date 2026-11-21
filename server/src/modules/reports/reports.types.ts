import type { ReadingSlot } from '../readings/readings.types.js';

export const REPORT_TYPES = ['daily', 'mtd', 'monthly'] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export interface DateRange {
  from: string;
  to: string;
}

export interface ReportStats {
  count: number;
  highest: number | null;
  lowest: number | null;
  average: number | null;
}

export interface DayReading {
  id: string;
  slot: ReadingSlot;
  slotLabel: string;
  value: number;
  date: string;
}

export interface DaySummary {
  date: string;
  average: number;
  lowest: number;
  highest: number;
  count: number;
}

export interface Report extends ReportStats, DateRange {
  type: ReportType;
  readings?: DayReading[];
  days?: DaySummary[];
}
