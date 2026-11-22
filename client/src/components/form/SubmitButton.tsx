import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PrimaryButton } from './PrimaryButton';

interface SubmitButtonProps {
  pending: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  describedBy?: string;
  children: ReactNode;
}

export function SubmitButton({
  pending,
  fullWidth = true,
  disabled = false,
  describedBy,
  children,
}: SubmitButtonProps) {
  return (
    <PrimaryButton
      type="submit"
      size="lg"
      className={cn(fullWidth && 'w-full')}
      disabled={pending || disabled}
      aria-describedby={describedBy}
    >
      {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </PrimaryButton>
  );
}
