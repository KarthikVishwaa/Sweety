import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT } from '@/lib/motion';

const STEPS = ['Account', 'About you'] as const;

export function OnboardingProgress({ step }: { step: 1 | 2 }) {
  const reducedMotion = useReducedMotion();
  const label = STEPS[step - 1];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-teal-800">
        Step {step} of {STEPS.length}
        <span className="sm:hidden">: {label}</span>
      </p>
      <ol aria-label="Sign-up steps" className="hidden gap-4 text-sm sm:flex">
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
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${(step / STEPS.length) * 100}%` }}
          transition={{ duration: reducedMotion ? 0 : DURATION.slow, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
}
