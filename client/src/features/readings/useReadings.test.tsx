import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as readingsApi from './readingsApi';
import type { Reading, ReadingInput } from './types';
import { useCreateReading, useDeleteReading, useUpdateReading } from './useReadings';

vi.mock('./readingsApi');

const input: ReadingInput = { date: '2026-10-15', slot: 'after_lunch', value: 150 };
const reading: Reading = {
  id: '1',
  ...input,
  slotLabel: 'After lunch',
  createdAt: '',
  updatedAt: '',
};

const REPORT_KEY = ['reports', 'daily', '2026-10-15'];
const READINGS_KEY = ['readings', '2026-10-15'];

function setup() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(REPORT_KEY, { count: 1 });
  queryClient.setQueryData(READINGS_KEY, []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('reading mutations keep derived data fresh', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(readingsApi.createReading).mockResolvedValue(reading);
    vi.mocked(readingsApi.updateReading).mockResolvedValue(reading);
    vi.mocked(readingsApi.deleteReading).mockResolvedValue();
  });

  it('invalidates the reports and readings queries after adding a reading', async () => {
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useCreateReading(), { wrapper });

    result.current.mutate(input);

    await waitFor(() => expect(queryClient.getQueryState(REPORT_KEY)?.isInvalidated).toBe(true));
    expect(queryClient.getQueryState(READINGS_KEY)?.isInvalidated).toBe(true);
  });

  it('invalidates the reports query after updating a reading', async () => {
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useUpdateReading(), { wrapper });

    result.current.mutate({ id: '1', input });

    await waitFor(() => expect(queryClient.getQueryState(REPORT_KEY)?.isInvalidated).toBe(true));
  });

  it('invalidates the reports query after deleting a reading', async () => {
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useDeleteReading(), { wrapper });

    result.current.mutate('1');

    await waitFor(() => expect(queryClient.getQueryState(REPORT_KEY)?.isInvalidated).toBe(true));
  });
});
