import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDisplayDate } from '@/lib/date';
import type { Reading } from '../types';
import { GlucoseBadge } from './GlucoseBadge';
import { ReadingActions } from './ReadingActions';

interface HistoryCardsProps {
  readings: Reading[];
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

export function HistoryCards({ readings, onEdit, onDelete }: HistoryCardsProps) {
  const [listRef] = useAutoAnimate<HTMLUListElement>();

  return (
    <ul ref={listRef} className="space-y-3 md:hidden" aria-label="Reading history, newest first">
      {readings.map((reading) => (
        <li key={reading.id}>
          <Card>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{formatDisplayDate(reading.date)}</p>
                <p className="font-medium">{reading.slotLabel}</p>
                <p className="flex items-center gap-2">
                  <span className="text-2xl font-semibold tabular-nums">{reading.value}</span>
                  <span className="text-xs text-muted-foreground">mg/dl</span>
                  <GlucoseBadge value={reading.value} />
                </p>
              </div>
              <ReadingActions reading={reading} onEdit={onEdit} onDelete={onDelete} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
