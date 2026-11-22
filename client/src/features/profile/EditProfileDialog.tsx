import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormError } from '@/components/form/FormError';
import { SubmitButton } from '@/components/form/SubmitButton';
import { TextField } from '@/components/form/TextField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MAX_AGE_YEARS } from '@/features/auth/auth.schemas';
import { AgeReadout } from '@/features/auth/onboarding/AgeReadout';
import type { User } from '@/features/auth/types';
import { useMe } from '@/features/auth/useAuth';
import { GENDER_HELP, GenderCards } from '@/features/body/GenderCards';
import { todayInIST, yearsAgo } from '@/lib/date';
import { editProfileSchema, type EditProfileInput } from './profile.schemas';
import type { ProfileChanges } from './profileApi';
import { useUpdateProfile } from './useUpdateProfile';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Only what changed is sent. The dialog closes at once: the page shows the change straight away and puts
// it back with a message if the server says no.
function EditProfileForm({ user, onDone }: { user: User; onDone: () => void }) {
  const updateProfile = useUpdateProfile();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user.name,
      dateOfBirth: user.dateOfBirth ?? '',
      gender: user.gender ?? undefined,
    },
  });
  const today = todayInIST();

  const submit = (values: EditProfileInput) => {
    const changes: ProfileChanges = {};
    if (values.name !== user.name) changes.name = values.name;
    if (values.gender !== user.gender) changes.gender = values.gender;
    if (values.dateOfBirth !== user.dateOfBirth) changes.dateOfBirth = values.dateOfBirth;
    if (Object.keys(changes).length > 0) updateProfile.mutate(changes);
    onDone();
  };

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
      <TextField
        id="profile-name"
        label="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="space-y-1">
        <TextField
          id="profile-date-of-birth"
          label="Date of birth"
          type="date"
          autoComplete="bday"
          min={yearsAgo(today, MAX_AGE_YEARS)}
          max={today}
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />
        <AgeReadout control={control} />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Gender</legend>
        <p className="text-sm text-muted-foreground">{GENDER_HELP}</p>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <GenderCards name="edit-profile-gender" value={field.value} onChange={field.onChange} />
          )}
        />
        <FormError message={errors.gender?.message} className="text-sm text-destructive" />
      </fieldset>
      <DialogFooter>
        <Button type="button" variant="outline" size="lg" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton pending={false} fullWidth={false}>
          Save
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { data: user } = useMe();
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Your email and password are not changed here.</DialogDescription>
        </DialogHeader>
        <EditProfileForm user={user} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
