import NumberFlow from '@number-flow/react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlucoseBadge } from '@/features/readings/components/GlucoseBadge';

interface StatCardProps {
  label: string;
  children: ReactNode;
}

function StatCard({ label, children }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function GlucoseStat({
  label,
  value,
  decimals = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
}) {
  return (
    <StatCard label={label}>
      <p className="flex items-baseline gap-1.5">
        <NumberFlow
          value={value}
          format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
          className="text-3xl font-semibold tabular-nums"
        />
        <span className="text-xs text-muted-foreground">mg/dl</span>
      </p>
      <GlucoseBadge value={value} />
    </StatCard>
  );
}

interface StatCardsProps {
  highest: number;
  lowest: number;
  average: number;
  count: number;
}

export function StatCards({ highest, lowest, average, count }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <GlucoseStat label="Highest" value={highest} />
      <GlucoseStat label="Lowest" value={lowest} />
      <GlucoseStat label="Average" value={average} decimals={1} />
      <StatCard label="Readings">
        <NumberFlow value={count} className="text-3xl font-semibold tabular-nums" />
      </StatCard>
    </div>
  );
}
