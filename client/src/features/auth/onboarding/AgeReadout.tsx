import { motion, useReducedMotion } from 'motion/react';
import { useWatch, type Control, type Path } from 'react-hook-form';
import { calculateAge, formatAge } from '@/lib/age';
import { todayInIST, yearsAgo } from '@/lib/date';
import { DURATION, EASE_OUT } from '@/lib/motion';
import { MAX_AGE_YEARS } from '../auth.schemas';

interface WithDateOfBirth {
  dateOfBirth: string;
}

export function AgeReadout<Values extends WithDateOfBirth>({
  control,
}: {
  control: Control<Values>;
}) {
  const dateOfBirth = useWatch({
    control,
    name: 'dateOfBirth' as Path<Values>,
  }) as unknown as string;
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
