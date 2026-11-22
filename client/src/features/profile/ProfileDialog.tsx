import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMe } from '@/features/auth/useAuth';
import { GENDER_HELP, GenderCards } from '@/features/body/GenderCards';
import { useUpdateGender } from '@/features/body/useUpdateGender';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The account at a glance, and the one setting a person can change here: the figure's gender.
// A change is shown at once and saved in the background; a failed save is undone with a message.
export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: user } = useMe();
  const updateGender = useUpdateGender();
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            {user.name} · {user.email}
          </DialogDescription>
        </DialogHeader>
        <section aria-labelledby="profile-gender" className="space-y-3">
          <div className="space-y-1">
            <h3 id="profile-gender" className="font-medium">
              Gender
            </h3>
            <p className="text-sm text-muted-foreground">{GENDER_HELP}</p>
          </div>
          <GenderCards
            name="profile-gender"
            value={user.gender}
            onChange={(gender) => updateGender.mutate(gender)}
          />
        </section>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
