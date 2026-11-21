export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export function isPageSize(value: number): value is (typeof PAGE_SIZE_OPTIONS)[number] {
  return PAGE_SIZE_OPTIONS.some((option) => option === value);
}
