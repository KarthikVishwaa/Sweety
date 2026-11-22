import { BODY_MODELS, type BodyModel } from './bodyProportions';
import { cn } from '@/lib/utils';

const LABELS: Record<BodyModel, string> = { male: 'Male', female: 'Female' };

interface BodyModelSwitchProps {
  value: BodyModel;
  onChange: (model: BodyModel) => void;
}

// A small segmented control. Native radios give it arrow-key movement and a visible focus ring.
export function BodyModelSwitch({ value, onChange }: BodyModelSwitchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Body model"
      className="inline-flex rounded-full border bg-muted p-0.5 text-sm"
    >
      {BODY_MODELS.map((model) => (
        <label
          key={model}
          className={cn(
            'cursor-pointer rounded-full px-4 py-1.5 font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
            value === model
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <input
            type="radio"
            name="bodyModel"
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
