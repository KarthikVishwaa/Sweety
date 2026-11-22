import { useState } from 'react';
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
import { useUpdateProfile } from '@/features/profile/useUpdateProfile';
import type { Gender } from './bodyProportions';
import { GENDER_HELP, GenderCards } from './GenderCards';

// Accounts dismissed in this page session. It is kept in memory only, so the prompt may come back after
// a reload or the next login, but never once a gender has been saved.
const dismissed = new Set<string>();

// A one-time prompt for accounts made before gender existed, which otherwise see the neutral figure.
export function ChooseFigureDialog() {
  const { data: user } = useMe();
  const updateProfile = useUpdateProfile();
  const [choice, setChoice] = useState<Gender>();
  const [closed, setClosed] = useState(false);

  if (!user || user.gender !== null || closed || dismissed.has(user.id)) return null;

  const dismiss = () => {
    dismissed.add(user.id);
    setClosed(true);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose a figure</DialogTitle>
          <DialogDescription>{GENDER_HELP}</DialogDescription>
        </DialogHeader>
        <GenderCards name="choose-figure" value={choice} onChange={setChoice} />
        <DialogFooter>
          <Button variant="outline" onClick={dismiss}>
            Not now
          </Button>
          <Button
            disabled={!choice}
            onClick={() =>
              choice &&
              updateProfile.mutate({ gender: choice }, { onSuccess: () => setClosed(true) })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
