import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PrimaryButton } from './PrimaryButton';

interface SubmitButtonProps {
  pending: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function SubmitButton({ pending, fullWidth = true, children }: SubmitButtonProps) {
  return (
    <PrimaryButton type="submit" size="lg" className={cn(fullWidth && 'w-full')} disabled={pending}>
      {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </PrimaryButton>
  );
}
