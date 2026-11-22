import { Check } from 'lucide-react';
import type { FormEvent } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { FormError } from '@/components/form/FormError';
import { SubmitButton } from '@/components/form/SubmitButton';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import { Button } from '@/components/ui/button';
import { GENDERS } from '@/features/body/bodyProportions';
import { cn } from '@/lib/utils';
import type { SignupInput } from '../auth.schemas';
import { StepHeading } from './StepHeading';

const LABELS = { male: 'Male', female: 'Female', other: 'Other' } as const;
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
    register,
    control,
    formState: { errors },
  } = form;
  const selected = useWatch({ control, name: 'gender' });

  return (
    <form noValidate onSubmit={onSubmit}>
      <StaggerGroup className="space-y-4">
        <StaggerItem>
          <StepHeading
            focusOnMount={focusHeading}
            description="We use this to show a figure that feels like you. It is only used for the picture, and you can change it any time."
          >
            Gender
          </StepHeading>
        </StaggerItem>
        <FormError
          message={serverError}
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        />
        <StaggerItem>
          <div role="radiogroup" aria-label="Gender" className="grid grid-cols-3 gap-2 sm:gap-3">
            {GENDERS.map((model) => (
              <label
                key={model}
                className={cn(
                  'relative flex min-h-20 cursor-pointer items-center justify-center rounded-xl border-2 bg-card p-4 text-base font-medium transition-colors',
                  'hover:border-teal-300 has-[:checked]:border-primary has-[:checked]:bg-teal-50',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
                  pending && 'pointer-events-none opacity-60',
                )}
              >
                <input
                  type="radio"
                  value={model}
                  disabled={pending}
                  className="sr-only"
                  {...register('gender')}
                />
                {LABELS[model]}
                <Check
                  aria-hidden="true"
                  className={cn(
                    'absolute right-2 top-2 size-4 text-primary transition-opacity',
                    selected === model ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </label>
            ))}
          </div>
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
