import NumberFlow from '@number-flow/react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Reading } from '../types';
import { GlucoseBadge } from './GlucoseBadge';

interface FilledSlotProps {
  reading: Reading;
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

export function FilledSlot({ reading, onEdit, onDelete }: FilledSlotProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{reading.slotLabel}</CardTitle>
        <CardAction className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${reading.slotLabel} reading`}
            onClick={() => onEdit(reading)}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${reading.slotLabel} reading`}
            onClick={() => onDelete(reading)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
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
