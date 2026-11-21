import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as readingsApi from './readingsApi';
import type { ReadingInput } from './types';

const READINGS_KEY = ['readings'] as const;
const REPORTS_KEY = ['reports'] as const;

export function useReadingsByDate(date: string) {
  return useQuery({
    queryKey: [...READINGS_KEY, date],
    queryFn: () => readingsApi.listReadings(date),
  });
}

function useRefreshReadingData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: READINGS_KEY }),
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY }),
    ]);
}

export function useCreateReading() {
  const refresh = useRefreshReadingData();

  return useMutation({
    mutationFn: (input: ReadingInput) => readingsApi.createReading(input),
    onSuccess: async () => {
      await refresh();
      toast.success('Reading saved');
    },
  });
}

export function useUpdateReading() {
  const refresh = useRefreshReadingData();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReadingInput }) =>
      readingsApi.updateReading(id, input),
    onSuccess: async () => {
      await refresh();
      toast.success('Reading updated');
    },
  });
}

export function useDeleteReading() {
  const refresh = useRefreshReadingData();

  return useMutation({
    mutationFn: (id: string) => readingsApi.deleteReading(id),
    onSuccess: async () => {
      await refresh();
      toast.success('Reading deleted');
    },
  });
}
