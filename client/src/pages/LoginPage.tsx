import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { applyApiError } from '@/features/auth/applyApiError';
import { AuthField } from '@/features/auth/AuthField';
import { loginSchema, type LoginInput } from '@/features/auth/auth.schemas';
import { FormError } from '@/features/auth/FormError';
import { PasswordField } from '@/features/auth/PasswordField';
import { SubmitButton } from '@/features/auth/SubmitButton';
import { useLogin } from '@/features/auth/useAuth';
import { useShakeOnError } from '@/hooks/useShakeOnError';
import { shake as shakeVariants } from '@/lib/motion';

const FIELDS = ['email', 'password'] as const;

export function LoginPage() {
  const login = useLogin();
  const { controls, shake } = useShakeOnError();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    login.mutate(values, {
      onError: (error) => {
        setServerError(applyApiError(error, FIELDS, setError));
        shake();
      },
    });
  });

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your Sweety account."
      footer={
        <>
          New to Sweety?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
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
        <AuthField
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <SubmitButton pending={login.isPending}>Sign in</SubmitButton>
      </motion.form>
    </AuthLayout>
  );
}
