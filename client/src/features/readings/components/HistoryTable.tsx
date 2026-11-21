import { useAutoAnimate } from '@formkit/auto-animate/react';
import { formatDisplayDate } from '@/lib/date';
import type { Reading } from '../types';
import { GlucoseBadge } from './GlucoseBadge';
import { ReadingActions } from './ReadingActions';

interface HistoryListProps {
  readings: Reading[];
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

export function HistoryTable({ readings, onEdit, onDelete }: HistoryListProps) {
  const [bodyRef] = useAutoAnimate<HTMLTableSectionElement>();

  return (
    <table className="hidden w-full text-sm md:table">
      <caption className="sr-only">Reading history, newest first</caption>
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th scope="col" className="px-3 py-2 font-medium">
            Date
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Time slot
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Value
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Status
          </th>
          <th scope="col" className="px-3 py-2 text-right font-medium">
            Actions
          </th>
        </tr>
      </thead>
      <tbody ref={bodyRef}>
        {readings.map((reading) => (
          <tr key={reading.id} className="border-b last:border-b-0">
            <td className="px-3 py-2">{formatDisplayDate(reading.date)}</td>
            <td className="px-3 py-2">{reading.slotLabel}</td>
            <td className="px-3 py-2 tabular-nums">
              <span className="font-semibold">{reading.value}</span>{' '}
              <span className="text-xs text-muted-foreground">mg/dl</span>
            </td>
            <td className="px-3 py-2">
              <GlucoseBadge value={reading.value} />
            </td>
            <td className="px-3 py-1">
              <div className="flex justify-end">
                <ReadingActions reading={reading} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
