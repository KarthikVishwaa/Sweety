import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SLOT_CARD_HEIGHT } from './slotCard.constants';

interface EmptySlotProps {
  label: string;
  onAdd: () => void;
}

export function EmptySlot({ label, onAdd }: EmptySlotProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col justify-between gap-4 rounded-xl border-2 border-dashed border-border p-4',
        SLOT_CARD_HEIGHT,
      )}
    >
      <div>
        <h3 className="text-base font-medium">{label}</h3>
        <p className="text-sm text-muted-foreground">No reading yet</p>
      </div>
      <Button
        variant="outline"
        className="self-start"
        onClick={onAdd}
        aria-label={`Add ${label} reading`}
      >
        <Plus aria-hidden="true" />
        Add
      </Button>
    </div>
  );
}
