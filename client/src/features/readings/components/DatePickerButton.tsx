import { CalendarIcon } from 'lucide-react';
import { useState, type ComponentProps, type Ref } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDisplayDate, parseISODate, toISODate, todayInIST } from '@/lib/date';
import { cn } from '@/lib/utils';

interface DatePickerButtonProps {
  id: string;
  value: string;
  onChange: (date: string) => void;
  ref?: Ref<HTMLButtonElement>;
  className?: string;
  'aria-invalid'?: ComponentProps<'button'>['aria-invalid'];
  'aria-describedby'?: string;
}

export function DatePickerButton({
  id,
  value,
  onChange,
  ref,
  className,
  ...ariaProps
}: DatePickerButtonProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        ref={ref}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'justify-start font-normal',
          className,
        )}
        {...ariaProps}
      >
        <CalendarIcon aria-hidden="true" />
        {formatDisplayDate(value)}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={{ after: parseISODate(todayInIST()) }}
          onSelect={(date) => {
            if (!date) return;
            onChange(toISODate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
