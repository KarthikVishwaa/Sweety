import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as readingsApi from './readingsApi';
import type { ReadingInput } from './types';

const READINGS_KEY = ['readings'] as const;

export function useReadingsByDate(date: string) {
  return useQuery({
    queryKey: [...READINGS_KEY, date],
    queryFn: () => readingsApi.listReadings(date),
  });
}

function useRefreshReadings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: READINGS_KEY });
}

export function useCreateReading() {
  const refresh = useRefreshReadings();

  return useMutation({
    mutationFn: (input: ReadingInput) => readingsApi.createReading(input),
    onSuccess: async () => {
      await refresh();
      toast.success('Reading saved');
    },
  });
}

export function useUpdateReading() {
  const refresh = useRefreshReadings();

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
  const refresh = useRefreshReadings();

  return useMutation({
    mutationFn: (id: string) => readingsApi.deleteReading(id),
    onSuccess: async () => {
      await refresh();
      toast.success('Reading deleted');
    },
  });
}
