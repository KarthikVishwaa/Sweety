import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from './FormError';

interface AuthFieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  endAdornment?: ReactNode;
}

export function AuthField({ id, label, error, hint, endAdornment, ...inputProps }: AuthFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={endAdornment ? 'pr-10' : undefined}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{endAdornment}</div>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FormError id={errorId} message={error} className="text-sm text-destructive" />
    </div>
  );
}
