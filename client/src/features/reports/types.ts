import type { ReadingSlot } from '@/features/readings/types';

export type ReportType = 'daily' | 'mtd' | 'monthly';

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

export interface Report {
  type: ReportType;
  from: string;
  to: string;
  count: number;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  readings?: DayReading[];
  days?: DaySummary[];
}
