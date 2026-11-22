import type { FormEvent } from 'react';
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { FormError } from '@/components/form/FormError';
import { SubmitButton } from '@/components/form/SubmitButton';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import { Button } from '@/components/ui/button';
import { GENDER_HELP, GenderCards } from '@/features/body/GenderCards';
import type { SignupInput } from '../auth.schemas';
import { StepHeading } from './StepHeading';

const HINT_ID = 'gender-hint';

interface GenderStepProps {
  form: UseFormReturn<SignupInput>;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  serverError?: string;
  focusHeading: boolean;
}

export function GenderStep({
  form,
  onBack,
  onSubmit,
  pending,
  serverError,
  focusHeading,
}: GenderStepProps) {
  const {
    control,
    formState: { errors },
  } = form;
  const selected = useWatch({ control, name: 'gender' });

  return (
    <form noValidate onSubmit={onSubmit}>
      <StaggerGroup className="space-y-4">
        <StaggerItem>
          <StepHeading focusOnMount={focusHeading} description={GENDER_HELP}>
            Gender
          </StepHeading>
        </StaggerItem>
        <FormError
          message={serverError}
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        />
        <StaggerItem>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <GenderCards
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                disabled={pending}
              />
            )}
          />
          {errors.gender && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {errors.gender.message}
            </p>
          )}
        </StaggerItem>
        <StaggerItem className="space-y-2">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={pending}>
              Back
            </Button>
            <div className="min-w-0 flex-1">
              <SubmitButton pending={pending} disabled={!selected} describedBy={HINT_ID}>
                Create my account
              </SubmitButton>
            </div>
          </div>
          <p id={HINT_ID} className="min-h-5 text-center text-sm text-muted-foreground">
            {selected ? '' : 'Choose a gender to create your account.'}
          </p>
        </StaggerItem>
      </StaggerGroup>
    </form>
  );
}
