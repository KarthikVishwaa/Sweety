import { Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xl font-semibold', className)}>
      <Droplet className="size-6 fill-current" aria-hidden="true" />
      Sweety
    </span>
  );
}
