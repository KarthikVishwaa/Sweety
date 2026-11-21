import type { FormEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FormError } from '@/components/form/FormError';
import { SubmitButton } from '@/components/form/SubmitButton';
import { TextField } from '@/components/form/TextField';
import { Button } from '@/components/ui/button';
import { todayInIST, yearsAgo } from '@/lib/date';
import { MAX_AGE_YEARS, type SignupInput } from '../auth.schemas';
import { AgeReadout } from './AgeReadout';
import { StepHeading } from './StepHeading';

interface AboutYouStepProps {
  form: UseFormReturn<SignupInput>;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  serverError?: string;
}

export function AboutYouStep({ form, onBack, onSubmit, pending, serverError }: AboutYouStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const today = todayInIST();

  return (
    <form noValidate className="space-y-4" onSubmit={onSubmit}>
      <StepHeading focusOnMount description="Just one thing, so we can say hello properly.">
        A little about you
      </StepHeading>
      <FormError
        message={serverError}
        className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      />
      <TextField
        id="dateOfBirth"
        label="Date of birth"
        type="date"
        autoComplete="bday"
        min={yearsAgo(today, MAX_AGE_YEARS)}
        max={today}
        hint="We use this to personalise your experience."
        error={errors.dateOfBirth?.message}
        {...register('dateOfBirth')}
      />
      <AgeReadout control={control} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={pending}>
          Back
        </Button>
        <SubmitButton pending={pending}>Create my account</SubmitButton>
      </div>
    </form>
  );
}
