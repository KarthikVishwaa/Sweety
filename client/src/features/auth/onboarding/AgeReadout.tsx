import { useWatch, type Control } from 'react-hook-form';
import { calculateAge, formatAge } from '@/lib/age';
import { todayInIST, yearsAgo } from '@/lib/date';
import { MAX_AGE_YEARS, type SignupInput } from '../auth.schemas';

export function AgeReadout({ control }: { control: Control<SignupInput> }) {
  const dateOfBirth = useWatch({ control, name: 'dateOfBirth' });
  const today = todayInIST();
  const age =
    dateOfBirth >= yearsAgo(today, MAX_AGE_YEARS) ? calculateAge(dateOfBirth, today) : null;

  return (
    <p aria-live="polite" className="min-h-5 text-sm font-medium text-teal-800">
      {age ? formatAge(age) : ''}
    </p>
  );
}
