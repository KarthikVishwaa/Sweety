import { useMe } from '@/features/auth/useAuth';
import { NEUTRAL_GENDER } from './bodyProportions';
import { useReadingsByDate } from '@/features/readings/useReadings';
import { BodyGlucoseGauge } from './BodyGlucoseGauge';
import { bodyCaption, latestReadingOfDay } from './latestReading';

// The figure for the selected day: it fills to the latest reading and follows every change to the data.
// Which figure is shown follows the account's gender (the neutral one until a gender is chosen).
export function BodyPanel({ date }: { date: string }) {
  const { data: user } = useMe();
  const { data: readings, isPending } = useReadingsByDate(date);
  const latest = readings ? latestReadingOfDay(readings) : undefined;

  if (!user) return null;

  return (
    <section
      aria-label="Your glucose at a glance"
      className="flex flex-col items-center gap-3 rounded-xl border bg-card p-4 lg:h-[calc(100dvh-9.5rem)] lg:max-h-[64rem] lg:min-h-[32rem]"
    >
      <div className="h-[17.5rem] w-full lg:h-auto lg:min-h-0 lg:flex-1">
        <BodyGlucoseGauge model={user.gender ?? NEUTRAL_GENDER} value={latest?.value ?? null} />
      </div>
      <p aria-live="polite" className="min-h-5 text-center text-sm font-medium">
        {isPending ? 'Loading readings…' : bodyCaption(latest)}
      </p>
    </section>
  );
}
