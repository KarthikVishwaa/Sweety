import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Reading } from '../types';

interface ReadingActionsProps {
  reading: Reading;
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

export function ReadingActions({ reading, onEdit, onDelete }: ReadingActionsProps) {
  const description = `${reading.slotLabel} reading`;

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${description}`}
        onClick={() => onEdit(reading)}
      >
        <Pencil aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${description}`}
        onClick={() => onDelete(reading)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}
