import { SLOT_LABELS } from '../readings/readings.constants.js';
import { reportRange } from './reports.dateRange.js';
import * as reportsRepository from './reports.repository.js';
import type { Report, ReportType } from './reports.types.js';

export async function buildReport(userId: string, type: ReportType, date: string): Promise<Report> {
  const range = reportRange(type, date);
  const stats = await reportsRepository.aggregateStats(userId, range);
  const report: Report = { type, ...range, ...stats };

  if (type === 'daily') {
    const readings = await reportsRepository.listDayReadings(userId, date);
    report.readings = readings.map((reading) => ({
      ...reading,
      slotLabel: SLOT_LABELS[reading.slot],
    }));
  } else {
    report.days = await reportsRepository.summariseDays(userId, range);
  }
  return report;
}
