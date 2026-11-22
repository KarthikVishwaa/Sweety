import { useId, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function InsightCard({ title, children, className }: InsightCardProps) {
  const headingId = useId();

  return (
    <Card role="region" aria-labelledby={headingId} className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle>
          <h2 id={headingId}>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}
