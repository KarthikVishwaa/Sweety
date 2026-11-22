import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMonth, shiftMonth } from '../month';

interface MonthPickerProps {
  month: string;
  onChange: (month: string) => void;
  /** The current month cannot be passed: there is nothing to see in the future. */
  isCurrent: boolean;
}

export function MonthPicker({ month, onChange, isCurrent }: MonthPickerProps) {
  return (
    <div className="flex items-center justify-between gap-2" role="group" aria-label="Month">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <p aria-live="polite" className="text-lg font-semibold">
        {formatMonth(month)}
      </p>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next month"
        disabled={isCurrent}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
