import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { FormError } from './FormError';

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

export function FieldShell({ id, label, error, hint, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FormError id={`${id}-error`} message={error} className="text-sm text-destructive" />
    </div>
  );
}
