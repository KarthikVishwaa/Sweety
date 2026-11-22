import type { UseFormReturn } from 'react-hook-form';
import { PasswordField } from '@/components/form/PasswordField';
import { SubmitButton } from '@/components/form/SubmitButton';
import { TextField } from '@/components/form/TextField';
import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import type { ACCOUNT_FIELDS, SignupInput } from '../auth.schemas';
import { StepHeading } from './StepHeading';

interface AccountStepProps {
  form: UseFormReturn<SignupInput>;
  onContinue: () => void;
  focusHeading: boolean;
  focusField?: (typeof ACCOUNT_FIELDS)[number];
}

export function AccountStep({ form, onContinue, focusHeading, focusField }: AccountStepProps) {
  const {
    register,
    formState: { errors },
  } = form;

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
            focusOnMount={focusHeading && !focusField}
            description="Let's get you set up. It only takes a minute."
          >
            Create your account
          </StepHeading>
        </StaggerItem>
        <StaggerItem>
          <TextField
            id="name"
            label="Name"
            autoComplete="name"
            autoFocus={focusField === 'name'}
            error={errors.name?.message}
            {...register('name')}
          />
        </StaggerItem>
        <StaggerItem>
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus={focusField === 'email'}
            error={errors.email?.message}
            {...register('email')}
          />
        </StaggerItem>
        <StaggerItem>
          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            autoFocus={focusField === 'password'}
            hint="At least 8 characters, with a letter and a number."
            error={errors.password?.message}
            {...register('password')}
          />
        </StaggerItem>
        <StaggerItem>
          <SubmitButton pending={false}>Continue</SubmitButton>
        </StaggerItem>
      </StaggerGroup>
    </form>
  );
}
