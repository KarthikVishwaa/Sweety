import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { describedBy, FieldShell } from './FieldShell';

interface TextFieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  endAdornment?: ReactNode;
}

export function TextField({ id, label, error, hint, endAdornment, ...inputProps }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={endAdornment ? 'pr-10' : undefined}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{endAdornment}</div>
        )}
      </div>
    </FieldShell>
  );
}
