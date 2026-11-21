import type { Reading, ReadingSlot } from '../types';
import { useReadingsByDate } from '../useReadings';
import { ReadingsError } from './ReadingsError';
import { ReadingsSkeleton } from './ReadingsSkeleton';
import { SlotChecklist } from './SlotChecklist';

interface ReadingsSectionProps {
  date: string;
  onAdd: (slot: ReadingSlot) => void;
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

export function ReadingsSection({ date, onAdd, onEdit, onDelete }: ReadingsSectionProps) {
  const { data: readings, isPending, isError, error, refetch } = useReadingsByDate(date);

  if (isPending) return <ReadingsSkeleton />;
  if (isError) return <ReadingsError message={error.message} onRetry={() => void refetch()} />;
  return <SlotChecklist readings={readings} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />;
}
