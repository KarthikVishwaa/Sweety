import { Check } from 'lucide-react';
import type { FormEvent } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { FormError } from '@/components/form/FormError';
import { SubmitButton } from '@/components/form/SubmitButton';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import { Button } from '@/components/ui/button';
import { BODY_MODELS } from '@/features/body/bodyProportions';
import { cn } from '@/lib/utils';
import type { SignupInput } from '../auth.schemas';
import { StepHeading } from './StepHeading';

const LABELS = { male: 'Male', female: 'Female' } as const;
const HINT_ID = 'body-model-hint';

interface BodyModelStepProps {
  form: UseFormReturn<SignupInput>;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  serverError?: string;
  focusHeading: boolean;
}

export function BodyModelStep({
  form,
  onBack,
  onSubmit,
  pending,
  serverError,
  focusHeading,
}: BodyModelStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const selected = useWatch({ control, name: 'bodyModel' });

  return (
    <form noValidate onSubmit={onSubmit}>
      <StaggerGroup className="space-y-4">
        <StaggerItem>
          <StepHeading
            focusOnMount={focusHeading}
            description="This only changes the figure you see in the app. You can change it any time."
          >
            Choose your body model
          </StepHeading>
        </StaggerItem>
        <FormError
          message={serverError}
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        />
        <StaggerItem>
          <div role="radiogroup" aria-label="Body model" className="grid grid-cols-2 gap-3">
            {BODY_MODELS.map((model) => (
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
                  {...register('bodyModel')}
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
          {errors.bodyModel && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {errors.bodyModel.message}
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
            {selected ? '' : 'Choose Male or Female to create your account.'}
          </p>
        </StaggerItem>
      </StaggerGroup>
    </form>
  );
}
