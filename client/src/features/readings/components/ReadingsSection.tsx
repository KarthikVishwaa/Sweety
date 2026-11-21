import { useState } from 'react';
import type { Reading } from '../types';
import { useReadingsByDate } from '../useReadings';
import { DeleteReadingDialog } from './DeleteReadingDialog';
import { ReadingDialog } from './ReadingDialog';
import type { ReadingEditor } from './readingEditor';
import { ReadingsError } from './ReadingsError';
import { ReadingsSkeleton } from './ReadingsSkeleton';
import { SlotChecklist } from './SlotChecklist';

export function ReadingsSection({ date }: { date: string }) {
  const { data: readings, isPending, isError, error, refetch } = useReadingsByDate(date);
  const [editor, setEditor] = useState<ReadingEditor>();
  const [deleting, setDeleting] = useState<Reading>();

  return (
    <>
      {isPending && <ReadingsSkeleton />}
      {isError && <ReadingsError message={error.message} onRetry={() => void refetch()} />}
      {readings && (
        <SlotChecklist
          readings={readings}
          onAdd={(slot) => setEditor({ mode: 'add', slot })}
          onEdit={(reading) => setEditor({ mode: 'edit', reading })}
          onDelete={setDeleting}
        />
      )}
      <ReadingDialog editor={editor} defaultDate={date} onClose={() => setEditor(undefined)} />
      <DeleteReadingDialog reading={deleting} onClose={() => setDeleting(undefined)} />
    </>
  );
}
