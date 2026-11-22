import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { User } from '@/features/auth/types';
import { GENDER_LABELS } from '@/features/body/GenderCards';
import type { Insights } from '@/features/insights/types';
import { calculateAge, formatAgeShort } from '@/lib/age';
import { formatDisplayDate, todayInIST } from '@/lib/date';
import { initials } from './initials';

interface PersonalCardProps {
  user: User;
  /** Counts from every month; not known until the first insights arrive. */
  lifetime: Insights['lifetime'] | undefined;
  onEdit: () => void;
}

function ageLine(dateOfBirth: string | null): string {
  if (!dateOfBirth) return 'Not set';
  const age = calculateAge(dateOfBirth, todayInIST());
  return age
    ? `${formatAgeShort(age)} (born ${formatDisplayDate(dateOfBirth)})`
    : formatDisplayDate(dateOfBirth);
}

export function PersonalCard({ user, lifetime, onEdit }: PersonalCardProps) {
  const rows = [
    ['Age', ageLine(user.dateOfBirth)],
    ['Gender', user.gender ? GENDER_LABELS[user.gender] : 'Not chosen'],
    ['Member since', formatDisplayDate(todayInIST(new Date(user.createdAt)))],
    ['Total readings', lifetime ? String(lifetime.totalReadings) : '–'],
    [
      'Tracking since',
      lifetime
        ? lifetime.firstReadingDate
          ? formatDisplayDate(lifetime.firstReadingDate)
          : 'No readings yet'
        : '–',
    ],
  ] as const;

  return (
    <Card role="region" aria-label="Personal details">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-lg font-semibold text-teal-900"
          >
            {initials(user.name)}
          </div>
          <div className="min-w-40 flex-1">
            <h2 className="text-xl font-semibold break-words">{user.name}</h2>
            <p className="text-sm break-all text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={onEdit}>
            <Pencil aria-hidden="true" />
            Edit profile
          </Button>
        </div>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
