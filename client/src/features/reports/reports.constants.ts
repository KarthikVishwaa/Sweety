import type { ReportType } from './types';

export const REPORT_TYPES = ['daily', 'mtd', 'monthly'] as const satisfies readonly ReportType[];

export const REPORT_LABELS: Record<ReportType, string> = {
  daily: 'Daily',
  mtd: 'Month to date',
  monthly: 'Previous month',
};

export const DEFAULT_REPORT_TYPE: ReportType = 'daily';

export function isReportType(value: unknown): value is ReportType {
  return REPORT_TYPES.some((type) => type === value);
}
