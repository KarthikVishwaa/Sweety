import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { currentMonth, isMonth } from './month';

// The month lives in the URL (?month=YYYY-MM). Anything that is not a month, or is in the future, means
// the current month.
export function useMonthParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('month');
  const latest = currentMonth();
  const month = isMonth(requested) && requested <= latest ? requested : latest;

  const setMonth = useCallback(
    (next: string) =>
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.set('month', next);
        return params;
      }),
    [setSearchParams],
  );

  return { month, setMonth, isCurrent: month === latest };
}
