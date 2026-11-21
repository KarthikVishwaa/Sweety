import NumberFlow from '@number-flow/react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Reading } from '../types';
import { GlucoseBadge } from './GlucoseBadge';
import { ReadingActions } from './ReadingActions';
import { SLOT_CARD_HEIGHT } from './slotCard.constants';

interface FilledSlotProps {
  reading: Reading;
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

export function FilledSlot({ reading, onEdit, onDelete }: FilledSlotProps) {
  return (
    <Card className={`h-full ${SLOT_CARD_HEIGHT}`}>
      <CardHeader>
        <CardTitle className="text-base">{reading.slotLabel}</CardTitle>
        <CardAction>
          <ReadingActions reading={reading} onEdit={onEdit} onDelete={onDelete} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <p className="flex items-baseline gap-1.5">
          <NumberFlow value={reading.value} className="text-4xl font-semibold tabular-nums" />
          <span className="text-sm text-muted-foreground">mg/dl</span>
        </p>
        <GlucoseBadge value={reading.value} />
      </CardContent>
    </Card>
  );
}
