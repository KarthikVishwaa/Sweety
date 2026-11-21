import { Button } from '@/components/ui/button';

interface ReadingsErrorProps {
  message: string;
  onRetry: () => void;
}

export function ReadingsError({ message, onRetry }: ReadingsErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
    >
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
