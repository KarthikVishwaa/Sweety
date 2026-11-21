import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, todayInIST } from '@/lib/date';
import { DatePickerButton } from './DatePickerButton';

interface DateNavigatorProps {
  date: string;
  onChange: (date: string) => void;
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const isToday = date >= todayInIST();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous day"
        onClick={() => onChange(addDays(date, -1))}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <DatePickerButton id="selected-date" value={date} onChange={onChange} />
      <Button
        variant="outline"
        size="icon"
        aria-label="Next day"
        disabled={isToday}
        onClick={() => onChange(addDays(date, 1))}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
