import { useAutoAnimate } from '@formkit/auto-animate/react';
import type { Reading, ReadingSlot } from '../types';
import { EmptySlot } from './EmptySlot';
import { FilledSlot } from './FilledSlot';

interface SlotCardProps {
  slot: ReadingSlot;
  label: string;
  reading?: Reading;
  onAdd: (slot: ReadingSlot) => void;
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

export function SlotCard({ slot, label, reading, onAdd, onEdit, onDelete }: SlotCardProps) {
  const [animateRef] = useAutoAnimate<HTMLDivElement>();

  return (
    <div ref={animateRef} className="h-full">
      {reading ? (
        <FilledSlot key={reading.id} reading={reading} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <EmptySlot key="empty" label={label} onAdd={() => onAdd(slot)} />
      )}
    </div>
  );
}
