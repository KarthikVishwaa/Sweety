import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-6" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
