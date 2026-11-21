import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReadingForm } from './ReadingForm';
import type { ReadingEditor } from './readingEditor';

interface ReadingDialogProps {
  editor?: ReadingEditor;
  defaultDate: string;
  onClose: () => void;
}

export function ReadingDialog({ editor, defaultDate, onClose }: ReadingDialogProps) {
  const isEdit = editor?.mode === 'edit';

  return (
    <Dialog open={editor !== undefined} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit reading' : 'Add reading'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the value, date or time slot.'
              : 'Record a blood glucose reading in mg/dl.'}
          </DialogDescription>
        </DialogHeader>
        {editor && (
          <ReadingForm
            key={editor.mode === 'edit' ? editor.reading.id : (editor.slot ?? 'new')}
            editor={editor}
            defaultDate={defaultDate}
            onDone={onClose}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
