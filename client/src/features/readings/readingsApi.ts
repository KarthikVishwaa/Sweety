import { api } from '@/lib/api';
import type { Reading, ReadingInput } from './types';

export async function listReadings(date: string): Promise<Reading[]> {
  const { data } = await api.get<{ readings: Reading[] }>('/readings', { params: { date } });
  return data.readings;
}

export async function createReading(input: ReadingInput): Promise<Reading> {
  const { data } = await api.post<{ reading: Reading }>('/readings', input);
  return data.reading;
}

export async function updateReading(id: string, input: ReadingInput): Promise<Reading> {
  const { data } = await api.put<{ reading: Reading }>(`/readings/${id}`, input);
  return data.reading;
}

export async function deleteReading(id: string): Promise<void> {
  await api.delete(`/readings/${id}`);
}
