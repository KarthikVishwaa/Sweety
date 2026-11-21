import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_REPORT_TYPE, isReportType } from './reports.constants';
import type { ReportType } from './types';

export function useReportType() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('report');
  const type = isReportType(requested) ? requested : DEFAULT_REPORT_TYPE;

  const setType = useCallback(
    (next: ReportType) =>
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.set('report', next);
        return params;
      }),
    [setSearchParams],
  );

  return [type, setType] as const;
}
