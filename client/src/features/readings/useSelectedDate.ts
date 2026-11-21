import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isRealDate, todayInIST } from '@/lib/date';

export function useSelectedDate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayInIST();
  const requested = searchParams.get('date');
  const date = requested && isRealDate(requested) && requested <= today ? requested : today;

  const setDate = useCallback(
    (next: string) =>
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.set('date', next);
        return params;
      }),
    [setSearchParams],
  );

  return [date, setDate] as const;
}
