import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const STEPS = ['Account', 'About you', 'Gender'] as const;

export type ProgressStep = 1 | 2 | 3;

export function OnboardingProgress({ step }: { step: ProgressStep }) {
  const reducedMotion = useReducedMotion();
  const label = STEPS[step - 1];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-teal-800">
        Step {step} of {STEPS.length}
        <span className="sm:hidden">: {label}</span>
      </p>
      <ol aria-label="Sign-up steps" className="hidden gap-4 text-sm sm:flex lg:text-base">
        {STEPS.map((name, index) => (
          <li
            key={name}
            aria-current={index + 1 === step ? 'step' : undefined}
            className={cn(
              index + 1 === step ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {index + 1}. {name}
          </li>
        ))}
      </ol>
      <div className="h-1.5 overflow-hidden rounded-full bg-teal-100" aria-hidden="true">
        <motion.div
          className="h-full origin-left rounded-full bg-primary"
          initial={false}
          animate={{ scaleX: step / STEPS.length }}
          transition={{ duration: reducedMotion ? 0 : DURATION.slow, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
}
