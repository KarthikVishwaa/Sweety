import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as reportsApi from './reportsApi';
import type { ReportType } from './types';

export function useReport(type: ReportType, date: string) {
  return useQuery({
    queryKey: ['reports', type, date],
    queryFn: () => reportsApi.getReport(type, date),
    placeholderData: keepPreviousData,
  });
}
