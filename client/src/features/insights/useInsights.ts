import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as insightsApi from './insightsApi';

export function useInsights(month: string) {
  return useQuery({
    queryKey: ['insights', month],
    queryFn: () => insightsApi.getInsights(month),
    placeholderData: keepPreviousData,
  });
}
