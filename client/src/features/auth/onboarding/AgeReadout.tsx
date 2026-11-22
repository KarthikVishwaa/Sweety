import { motion, useReducedMotion } from 'motion/react';
import { useWatch, type Control } from 'react-hook-form';
import { calculateAge, formatAge } from '@/lib/age';
import { todayInIST, yearsAgo } from '@/lib/date';
import { DURATION, EASE_OUT } from '@/lib/motion';
import { MAX_AGE_YEARS, type SignupInput } from '../auth.schemas';

export function AgeReadout({ control }: { control: Control<SignupInput> }) {
  const dateOfBirth = useWatch({ control, name: 'dateOfBirth' });
  const reducedMotion = useReducedMotion();
  const today = todayInIST();
  const age =
    dateOfBirth >= yearsAgo(today, MAX_AGE_YEARS) ? calculateAge(dateOfBirth, today) : null;
  const text = age ? formatAge(age) : '';

  return (
    <p aria-live="polite" className="min-h-5 text-sm font-medium text-teal-800">
      {text && (
        <motion.span
          key={text}
          className="inline-block"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
        >
          {text}
        </motion.span>
      )}
    </p>
  );
}
