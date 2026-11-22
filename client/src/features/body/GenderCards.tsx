import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GENDERS, type Gender } from './bodyProportions';

export const GENDER_HELP =
  'We use this to show a figure that feels like you. It is only used for the picture, and you can change it any time.';

const LABELS: Record<Gender, string> = { male: 'Male', female: 'Female', other: 'Other' };

interface GenderCardsProps {
  /** Null or undefined means nothing is chosen yet; there is never a default. */
  value: Gender | null | undefined;
  onChange: (gender: Gender) => void;
  name: string;
  disabled?: boolean;
  className?: string;
}

// Three large cards with native radio semantics: arrow keys move between them and focus is visible.
export function GenderCards({
  value,
  onChange,
  name,
  disabled = false,
  className,
}: GenderCardsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Gender"
      className={cn('grid grid-cols-3 gap-2 sm:gap-3', className)}
    >
      {GENDERS.map((gender) => (
        <label
          key={gender}
          className={cn(
            'relative flex min-h-20 cursor-pointer items-center justify-center rounded-xl border-2 bg-card p-4 text-base font-medium transition-colors lg:min-h-28 lg:text-lg',
            'hover:border-teal-300 has-[:checked]:border-primary has-[:checked]:bg-teal-50',
            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <input
            type="radio"
            name={name}
            value={gender}
            checked={value === gender}
            disabled={disabled}
            onChange={() => onChange(gender)}
            className="sr-only"
          />
          {LABELS[gender]}
          <Check
            aria-hidden="true"
            className={cn(
              'absolute top-2 right-2 size-4 text-primary transition-opacity',
              value === gender ? 'opacity-100' : 'opacity-0',
            )}
          />
        </label>
      ))}
    </div>
  );
}
