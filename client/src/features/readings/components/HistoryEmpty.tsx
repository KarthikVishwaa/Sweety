import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';

export function HistoryEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center lg:min-h-[50dvh] lg:justify-center lg:gap-4">
      <p className="text-lg font-medium lg:text-2xl">No readings yet</p>
      <p className="text-sm text-muted-foreground lg:text-base">
        Add your first reading on the dashboard and it will appear here.
      </p>
      <Link to="/" className={buttonVariants()}>
        Go to the dashboard
      </Link>
    </div>
  );
}
