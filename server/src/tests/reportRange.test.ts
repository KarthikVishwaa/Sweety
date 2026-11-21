import { describe, expect, it } from 'vitest';
import { reportRange } from '../modules/reports/reports.dateRange.js';

describe('reportRange', () => {
  it('daily is just the selected date', () => {
    expect(reportRange('daily', '2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' });
  });

  it('mtd runs from the first of the month to the selected date', () => {
    expect(reportRange('mtd', '2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });

  it('mtd on the 1st of a month is a single day', () => {
    expect(reportRange('mtd', '2026-10-01')).toEqual({ from: '2026-10-01', to: '2026-10-01' });
  });

  it('monthly is the whole previous calendar month', () => {
    expect(reportRange('monthly', '2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });

  it('monthly on 31 October still gives all of September', () => {
    expect(reportRange('monthly', '2026-10-31')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });

  it('monthly in January goes back to December of the previous year', () => {
    expect(reportRange('monthly', '2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('monthly on 1 March of a leap year ends on 29 February', () => {
    expect(reportRange('monthly', '2028-03-01')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('monthly on 1 March of a common year ends on 28 February', () => {
    expect(reportRange('monthly', '2027-03-01')).toEqual({ from: '2027-02-01', to: '2027-02-28' });
  });

  it('monthly in a 31-day previous month ends on the 31st', () => {
    expect(reportRange('monthly', '2026-11-05')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });
});
