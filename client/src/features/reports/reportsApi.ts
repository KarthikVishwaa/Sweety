import { api } from '@/lib/api';
import type { Report, ReportType } from './types';

export async function getReport(type: ReportType, date: string): Promise<Report> {
  const { data } = await api.get<Report>('/reports', { params: { type, date } });
  return data;
}
