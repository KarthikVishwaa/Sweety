import { useMe } from '@/features/auth/useAuth';
import { NEUTRAL_GENDER } from './bodyProportions';
import { useReadingsByDate } from '@/features/readings/useReadings';
import { BodyGlucoseGauge } from './BodyGlucoseGauge';
import { GenderSwitch } from './GenderSwitch';
import { bodyCaption, latestReadingOfDay } from './latestReading';
import { useUpdateGender } from './useUpdateGender';

// The figure for the selected day: it fills to the latest reading and follows every change to the data.
export function BodyPanel({ date }: { date: string }) {
  const { data: user } = useMe();
  const { data: readings, isPending } = useReadingsByDate(date);
  const updateGender = useUpdateGender();
  const latest = readings ? latestReadingOfDay(readings) : undefined;

  if (!user) return null;

  return (
    <section
      aria-label="Your glucose at a glance"
      className="flex flex-col items-center gap-3 rounded-xl border bg-card p-4"
    >
      <div className="h-[280px] w-full lg:h-[min(72vh,620px)] xl:h-[min(76vh,720px)]">
        <BodyGlucoseGauge model={user.gender ?? NEUTRAL_GENDER} value={latest?.value ?? null} />
      </div>
      <p aria-live="polite" className="min-h-5 text-center text-sm font-medium">
        {isPending ? 'Loading readings…' : bodyCaption(latest)}
      </p>
      <GenderSwitch value={user.gender} onChange={(model) => updateGender.mutate(model)} />
      {!user.gender && <p className="text-sm text-muted-foreground">Choose a figure</p>}
    </section>
  );
}
