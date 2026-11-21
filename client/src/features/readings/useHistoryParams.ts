import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, isPageSize } from './history.constants';

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return raw !== null && Number.isInteger(page) && page >= 1 ? page : DEFAULT_PAGE;
}

function parseLimit(raw: string | null): number {
  const limit = Number(raw);
  return raw !== null && isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE;
}

export function useHistoryParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const limit = parseLimit(searchParams.get('limit'));

  const update = useCallback(
    (changes: Record<string, string>, replace: boolean) =>
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) params.set(key, value);
          return params;
        },
        { replace },
      ),
    [setSearchParams],
  );

  const setPage = useCallback(
    (next: number, replace = false) => update({ page: String(next) }, replace),
    [update],
  );
  const setLimit = useCallback(
    (next: number) => update({ limit: String(next), page: String(DEFAULT_PAGE) }, false),
    [update],
  );

  return { page, limit, setPage, setLimit };
}
