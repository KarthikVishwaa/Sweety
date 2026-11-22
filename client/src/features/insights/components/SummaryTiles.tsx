import NumberFlow from '@number-flow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Insights } from '../types';

interface TileProps {
  label: string;
  value: number | null;
  unit?: string;
  decimals?: number;
}

function Tile({ label, value, unit, decimals = 0 }: TileProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="flex items-baseline gap-1.5">
          {value === null ? (
            <span className="text-3xl font-semibold">–</span>
          ) : (
            <NumberFlow
              value={value}
              format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
              className="text-3xl font-semibold tabular-nums"
            />
          )}
          {unit && value !== null && <span className="text-xs text-muted-foreground">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

export function SummaryTiles({ insights }: { insights: Insights }) {
  const { average, bands, count, consistency } = insights;

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Tile label="Average" value={average} unit="mg/dl" decimals={1} />
      <Tile label="In range" value={count === 0 ? null : bands.percentages.inRange} unit="%" />
      <Tile label="Readings" value={count} />
      <Tile label="Days logged" value={consistency.daysLogged} />
    </div>
  );
}
