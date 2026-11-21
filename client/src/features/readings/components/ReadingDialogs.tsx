import type { ReadingDialogsState } from '../useReadingDialogs';
import { DeleteReadingDialog } from './DeleteReadingDialog';
import { ReadingDialog } from './ReadingDialog';

interface ReadingDialogsProps {
  dialogs: ReadingDialogsState;
  defaultDate: string;
}

export function ReadingDialogs({ dialogs, defaultDate }: ReadingDialogsProps) {
  return (
    <>
      <ReadingDialog
        editor={dialogs.editor}
        defaultDate={defaultDate}
        onClose={dialogs.closeEditor}
      />
      <DeleteReadingDialog reading={dialogs.deleting} onClose={dialogs.closeDelete} />
    </>
  );
}
