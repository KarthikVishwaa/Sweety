import { api } from '@/lib/api';
import type { Insights } from './types';

export async function getInsights(month: string): Promise<Insights> {
  const { data } = await api.get<Insights>('/insights', { params: { month } });
  return data;
}
