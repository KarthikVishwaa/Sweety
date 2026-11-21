import { LoaderCircle } from 'lucide-react';
import { FormError } from '@/components/form/FormError';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Reading } from '../types';
import { useDeleteReading } from '../useReadings';

interface DeleteReadingDialogProps {
  reading?: Reading;
  onClose: () => void;
}

export function DeleteReadingDialog({ reading, onClose }: DeleteReadingDialogProps) {
  const deleteReading = useDeleteReading();

  const handleOpenChange = (open: boolean) => {
    if (open || deleteReading.isPending) return;
    deleteReading.reset();
    onClose();
  };

  return (
    <Dialog open={reading !== undefined} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete reading</DialogTitle>
          <DialogDescription>
            {reading && `Delete the ${reading.slotLabel} reading of ${reading.value} mg/dl?`}
          </DialogDescription>
        </DialogHeader>
        <FormError
          message={deleteReading.error?.message}
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={deleteReading.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteReading.isPending}
            onClick={() => reading && deleteReading.mutate(reading.id, { onSuccess: onClose })}
          >
            {deleteReading.isPending && (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
