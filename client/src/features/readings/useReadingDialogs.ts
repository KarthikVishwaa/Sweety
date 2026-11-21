import { useState } from 'react';
import type { ReadingEditor } from './components/readingEditor';
import type { Reading, ReadingSlot } from './types';

export function useReadingDialogs() {
  const [editor, setEditor] = useState<ReadingEditor>();
  const [deleting, setDeleting] = useState<Reading>();

  return {
    editor,
    deleting,
    openAdd: (slot?: ReadingSlot) => setEditor({ mode: 'add', slot }),
    openEdit: (reading: Reading) => setEditor({ mode: 'edit', reading }),
    openDelete: (reading: Reading) => setDeleting(reading),
    closeEditor: () => setEditor(undefined),
    closeDelete: () => setDeleting(undefined),
  };
}

export type ReadingDialogsState = ReturnType<typeof useReadingDialogs>;
