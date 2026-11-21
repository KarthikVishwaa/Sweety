import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { applyApiError } from '@/lib/applyApiError';
import { TextField } from '@/components/form/TextField';
import { signupSchema, type SignupInput } from '@/features/auth/auth.schemas';
import { FormError } from '@/components/form/FormError';
import { PasswordField } from '@/components/form/PasswordField';
import { SubmitButton } from '@/components/form/SubmitButton';
import { useRegister } from '@/features/auth/useAuth';
import { useShakeOnError } from '@/hooks/useShakeOnError';
import { shake as shakeVariants } from '@/lib/motion';

const FIELDS = ['name', 'email', 'password'] as const;

export function SignupPage() {
  const registerAccount = useRegister();
  const { controls, shake } = useShakeOnError();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    registerAccount.mutate(values, {
      onError: (error) => {
        setServerError(applyApiError(error, FIELDS, setError));
        shake();
      },
    });
  });

  return (
    <AuthLayout
      title="Create your account"
      description="Start tracking your blood glucose."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <motion.form
        onSubmit={onSubmit}
        noValidate
        className="space-y-4"
        variants={shakeVariants}
        animate={controls}
      >
        <FormError
          message={serverError}
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        />
        <TextField
          id="name"
          label="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />
        <SubmitButton pending={registerAccount.isPending}>Create account</SubmitButton>
      </motion.form>
    </AuthLayout>
  );
}
