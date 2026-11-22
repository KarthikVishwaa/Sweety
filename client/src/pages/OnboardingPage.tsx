import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import type { StageContent } from '@/components/layout/AuthStage';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import type { MascotVariant } from '@/components/mascot/mascot.assets';
import { usePreloadMascot } from '@/components/mascot/preloadMascot';
import { GENDERS, NEUTRAL_GENDER, type Gender } from '@/features/body/bodyProportions';
import { usePreloadBody } from '@/features/body/usePreloadBody';
import {
  ACCOUNT_FIELDS,
  SIGNUP_FIELDS,
  signupSchema,
  type SignupInput,
} from '@/features/auth/auth.schemas';
import { AboutYouStep } from '@/features/auth/onboarding/AboutYouStep';
import { AccountStep } from '@/features/auth/onboarding/AccountStep';
import { GenderStep } from '@/features/auth/onboarding/GenderStep';
import {
  OnboardingProgress,
  type ProgressStep,
} from '@/features/auth/onboarding/OnboardingProgress';
import { WelcomeStep } from '@/features/auth/onboarding/WelcomeStep';
import { useMe, useRegister } from '@/features/auth/useAuth';
import { ApiError } from '@/lib/api';
import { applyApiError } from '@/lib/applyApiError';
import { stepFade, stepSlide } from '@/lib/motion';

type Step = 'account' | 'about' | 'gender' | 'welcome';
type AccountField = (typeof ACCOUNT_FIELDS)[number];

const PROGRESS_BY_STEP: Record<Exclude<Step, 'welcome'>, ProgressStep> = {
  account: 1,
  about: 2,
  gender: 3,
};
const NEXT_MASCOT: Partial<Record<Step, MascotVariant>> = {
  account: 'waving',
  gender: 'bouncing',
};
const TAGLINE_BY_STEP: Record<Step, string> = {
  account: "Let's get you set up. It only takes a minute.",
  about: 'Nice to meet you!',
  gender: 'Pick the figure that feels right for you.',
  welcome: "You're all set!",
};
// An in-range reading, shown once on the gender step so the chosen figure visibly fills.
const DEMO_GLUCOSE_VALUE = 110;
// The neutral glass figure is fetched while the date of birth is entered; the other two on the gender step.
const PRELOAD_BY_STEP: Record<Step, readonly Gender[]> = {
  account: [],
  about: [NEUTRAL_GENDER],
  gender: GENDERS,
  welcome: [],
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
  const gender = useWatch({ control: form.control, name: 'gender' });
  const registerAccount = useRegister({ onRegistered: () => goTo('welcome', 1) });
  usePreloadMascot(NEXT_MASCOT[step]);
  usePreloadBody(PRELOAD_BY_STEP[step]);

  function goTo(next: Step, nextDirection: 1 | -1) {
    setDirection(nextDirection);
    setHasNavigated(true);
    setStep(next);
  }

  async function continueToAbout() {
    setFocusField(undefined);
    if (await form.trigger(ACCOUNT_FIELDS, { shouldFocus: true })) goTo('about', 1);
  }

  async function continueToBody() {
    if (await form.trigger('dateOfBirth', { shouldFocus: true })) goTo('gender', 1);
  }

  function handleRegistrationError(error: Error) {
    setServerError(
      applyApiError(error, SIGNUP_FIELDS, (name, fieldError) => form.setError(name, fieldError)),
    );

    const fieldErrors = error instanceof ApiError ? error.fieldErrors : undefined;
    const failingAccountField = ACCOUNT_FIELDS.find((field) => fieldErrors?.[field]);
    if (failingAccountField) {
      setFocusField(failingAccountField);
      goTo('account', -1);
    } else if (fieldErrors?.dateOfBirth) {
      goTo('about', -1);
    }
  }

  const submit = form.handleSubmit(
    (values) => {
      setServerError(undefined);
      registerAccount.mutate(values, { onError: handleRegistrationError });
    },
    (errors) => {
      if (ACCOUNT_FIELDS.some((field) => errors[field])) goTo('account', -1);
      else if (errors.dateOfBirth) goTo('about', -1);
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
        onContinue={() => void continueToBody()}
        focusHeading
      />
    ) : step === 'gender' ? (
      <GenderStep
        form={form}
        onBack={() => goTo('about', -1)}
        onSubmit={(event) => void submit(event)}
        pending={registerAccount.isPending}
        serverError={serverError}
        focusHeading
      />
    ) : (
      <WelcomeStep firstName={firstName} />
    );

  // On the gender step the stage starts as an empty, neutral glass figure; choosing a card cross-fades
  // to that figure, which then fills once.
  const stage: StageContent =
    step === 'gender'
      ? { kind: 'body', model: gender ?? NEUTRAL_GENDER, value: gender ? DEMO_GLUCOSE_VALUE : null }
      : {
          kind: 'mascot',
          variant: step === 'account' ? 'floating' : step === 'welcome' ? 'bouncing' : 'waving',
        };

  return (
    <AuthLayout
      stage={stage}
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
        {step !== 'welcome' && <OnboardingProgress step={PROGRESS_BY_STEP[step]} />}
        {reducedMotion ? (
          <motion.div key={step} variants={stepFade} initial="enter" animate="center">
            {content}
          </motion.div>
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
