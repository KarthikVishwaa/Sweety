import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { AuthLayout } from '@/components/layout/AuthLayout';
import type { MascotVariant } from '@/components/mascot/mascot.assets';
import { usePreloadMascot } from '@/components/mascot/preloadMascot';
import {
  ACCOUNT_FIELDS,
  SIGNUP_FIELDS,
  signupSchema,
  type SignupInput,
} from '@/features/auth/auth.schemas';
import { AboutYouStep } from '@/features/auth/onboarding/AboutYouStep';
import { AccountStep } from '@/features/auth/onboarding/AccountStep';
import { OnboardingProgress } from '@/features/auth/onboarding/OnboardingProgress';
import { WelcomeStep } from '@/features/auth/onboarding/WelcomeStep';
import { useMe, useRegister } from '@/features/auth/useAuth';
import { ApiError } from '@/lib/api';
import { applyApiError } from '@/lib/applyApiError';
import { stepSlide } from '@/lib/motion';

type Step = 'account' | 'about' | 'welcome';
type AccountField = (typeof ACCOUNT_FIELDS)[number];

const MASCOT_BY_STEP: Record<Step, MascotVariant> = {
  account: 'floating',
  about: 'waving',
  welcome: 'bouncing',
};
const NEXT_MASCOT: Partial<Record<Step, MascotVariant>> = { account: 'waving', about: 'bouncing' };
const TAGLINE_BY_STEP: Record<Step, string> = {
  account: "Let's get you set up. It only takes a minute.",
  about: 'Nice to meet you!',
  welcome: "You're all set!",
};

export function OnboardingPage() {
  const { data: user, isPending } = useMe();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('account');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [focusField, setFocusField] = useState<AccountField>();
  const [serverError, setServerError] = useState<string>();
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', dateOfBirth: '' },
  });
  const registerAccount = useRegister({ onRegistered: () => goTo('welcome', 1) });
  usePreloadMascot(NEXT_MASCOT[step]);

  function goTo(next: Step, nextDirection: 1 | -1) {
    setDirection(nextDirection);
    setHasNavigated(true);
    setStep(next);
  }

  async function continueToAbout() {
    setFocusField(undefined);
    if (await form.trigger(ACCOUNT_FIELDS, { shouldFocus: true })) goTo('about', 1);
  }

  function handleRegistrationError(error: Error) {
    setServerError(
      applyApiError(error, SIGNUP_FIELDS, (name, fieldError) => form.setError(name, fieldError)),
    );

    const failingAccountField =
      error instanceof ApiError
        ? ACCOUNT_FIELDS.find((field) => error.fieldErrors?.[field])
        : undefined;
    if (failingAccountField) {
      setFocusField(failingAccountField);
      goTo('account', -1);
    } else {
      form.setFocus('dateOfBirth');
    }
  }

  const submit = form.handleSubmit(
    (values) => {
      setServerError(undefined);
      registerAccount.mutate(values, { onError: handleRegistrationError });
    },
    (errors) => {
      if (ACCOUNT_FIELDS.some((field) => errors[field])) goTo('account', -1);
    },
  );

  if (isPending) return <PageSkeleton />;
  if (user && step !== 'welcome') return <Navigate to="/" replace />;

  const firstName = form.getValues('name').trim().split(/\s+/)[0] ?? '';
  const content =
    step === 'account' ? (
      <AccountStep
        form={form}
        onContinue={() => void continueToAbout()}
        focusHeading={hasNavigated}
        focusField={focusField}
      />
    ) : step === 'about' ? (
      <AboutYouStep
        form={form}
        onBack={() => goTo('account', -1)}
        onSubmit={(event) => void submit(event)}
        pending={registerAccount.isPending}
        serverError={serverError}
      />
    ) : (
      <WelcomeStep firstName={firstName} />
    );

  return (
    <AuthLayout
      mascot={MASCOT_BY_STEP[step]}
      tagline={TAGLINE_BY_STEP[step]}
      footer={
        step === 'welcome' ? undefined : (
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        )
      }
    >
      <div className="space-y-5">
        {step !== 'welcome' && <OnboardingProgress step={step === 'account' ? 1 : 2} />}
        {reducedMotion ? (
          content
        ) : (
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepSlide}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {content}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AuthLayout>
  );
}
