import type { UseFormReturn } from 'react-hook-form';
import { SubmitButton } from '@/components/form/SubmitButton';
import { TextField } from '@/components/form/TextField';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import { Button } from '@/components/ui/button';
import { todayInIST, yearsAgo } from '@/lib/date';
import { MAX_AGE_YEARS, type SignupInput } from '../auth.schemas';
import { AgeReadout } from './AgeReadout';
import { StepHeading } from './StepHeading';

interface AboutYouStepProps {
  form: UseFormReturn<SignupInput>;
  onBack: () => void;
  onContinue: () => void;
  focusHeading: boolean;
}

export function AboutYouStep({ form, onBack, onContinue, focusHeading }: AboutYouStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const today = todayInIST();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <StaggerGroup className="space-y-4">
        <StaggerItem>
          <StepHeading
            focusOnMount={focusHeading}
            description="Just one thing, so we can say hello properly."
          >
            A little about you
          </StepHeading>
        </StaggerItem>
        <StaggerItem>
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
        </StaggerItem>
        <StaggerItem>
          <AgeReadout control={control} />
        </StaggerItem>
        <StaggerItem className="flex gap-2">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <SubmitButton pending={false}>Continue</SubmitButton>
          </div>
        </StaggerItem>
      </StaggerGroup>
    </form>
  );
}
