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
import { useLogout } from '@/features/auth/useAuth';

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Asks before signing out, so a stray click on the menu does not end the session.
export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const logout = useLogout();

  const handleOpenChange = (next: boolean) => {
    if (logout.isPending) return;
    if (!next) logout.reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log out</DialogTitle>
          <DialogDescription>
            Are you sure you want to log out? You will need to sign in again to see your readings.
          </DialogDescription>
        </DialogHeader>
        <FormError
          message={logout.error?.message}
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={logout.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button variant="destructive" disabled={logout.isPending} onClick={() => logout.mutate()}>
            {logout.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            Log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
