import { GENDERS, type Gender } from './bodyProportions';
import { cn } from '@/lib/utils';

const LABELS: Record<Gender, string> = { male: 'Male', female: 'Female', other: 'Other' };

interface GenderSwitchProps {
  value: Gender | null;
  onChange: (model: Gender) => void;
}

// A small segmented control. Native radios give it arrow-key movement and a visible focus ring.
export function GenderSwitch({ value, onChange }: GenderSwitchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Gender"
      className="inline-flex rounded-full border bg-muted p-0.5 text-sm"
    >
      {GENDERS.map((model) => (
        <label
          key={model}
          className={cn(
            'cursor-pointer rounded-full px-3.5 py-1.5 font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
            value === model
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <input
            type="radio"
            name="gender"
            value={model}
            checked={value === model}
            onChange={() => onChange(model)}
            className="sr-only"
          />
          {LABELS[model]}
        </label>
      ))}
    </div>
  );
}
