import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function PaginationControls({
  page,
  limit,
  total,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const firstShown = Math.min((page - 1) * limit + 1, total);
  const lastShown = Math.min(page * limit, total);
  const lastPage = Math.max(totalPages, 1);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Showing {firstShown}–{lastShown} of {total} readings
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-sm">
            Rows per page
          </Label>
          <Select
            items={pageSizeOptions.map((option) => ({
              value: String(option),
              label: String(option),
            }))}
            value={String(limit)}
            onValueChange={(value) => value && onLimitChange(Number(value))}
          >
            <SelectTrigger id="page-size" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <span aria-current="page" className="px-1 text-sm font-medium tabular-nums">
            Page {page} of {lastPage}
          </span>
          <Button
            variant="outline"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </nav>
  );
}
