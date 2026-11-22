import { useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppShell } from '@/components/layout/AppShell';
import { PaginationControls } from '@/components/layout/PaginationControls';
import { HistoryCards } from '@/features/readings/components/HistoryCards';
import { HistoryEmpty } from '@/features/readings/components/HistoryEmpty';
import { HistorySkeleton } from '@/features/readings/components/HistorySkeleton';
import { HistoryTable } from '@/features/readings/components/HistoryTable';
import { ReadingDialogs } from '@/features/readings/components/ReadingDialogs';
import { ReadingsError } from '@/features/readings/components/ReadingsError';
import { PAGE_SIZE_OPTIONS } from '@/features/readings/history.constants';
import { useHistoryParams } from '@/features/readings/useHistoryParams';
import { useReadingDialogs } from '@/features/readings/useReadingDialogs';
import { useReadingHistory } from '@/features/readings/useReadings';
import { todayInIST } from '@/lib/date';
import { cn } from '@/lib/utils';

export function HistoryPage() {
  const { page, limit, setPage, setLimit } = useHistoryParams();
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useReadingHistory(
    page,
    limit,
  );
  const dialogs = useReadingDialogs();

  const lastPage = data?.meta.totalPages ?? 0;
  useEffect(() => {
    if (!isPlaceholderData && lastPage >= 1 && page > lastPage) setPage(lastPage, true);
  }, [isPlaceholderData, lastPage, page, setPage]);

  return (
    <AppShell>
      <AppHeader heading="Reading history" />
      <main className="space-y-4">
        {isPending && <HistorySkeleton rows={limit} />}
        {isError && <ReadingsError message={error.message} onRetry={() => void refetch()} />}
        {data && data.meta.total === 0 && <HistoryEmpty />}
        {data && data.meta.total > 0 && (
          <div
            className={cn('space-y-4', isPlaceholderData && 'opacity-60 transition-opacity')}
            aria-busy={isPlaceholderData}
          >
            <HistoryTable
              readings={data.data}
              onEdit={dialogs.openEdit}
              onDelete={dialogs.openDelete}
            />
            <HistoryCards
              readings={data.data}
              onEdit={dialogs.openEdit}
              onDelete={dialogs.openDelete}
            />
            <PaginationControls
              page={page}
              limit={limit}
              total={data.meta.total}
              totalPages={data.meta.totalPages}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </div>
        )}
      </main>
      <ReadingDialogs dialogs={dialogs} defaultDate={todayInIST()} />
    </AppShell>
  );
}
