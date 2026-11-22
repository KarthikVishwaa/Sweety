import { useMe } from '@/features/auth/useAuth';
import { useReadingsByDate } from '@/features/readings/useReadings';
import { BodyGlucoseGauge } from './BodyGlucoseGauge';
import { BodyModelSwitch } from './BodyModelSwitch';
import { bodyCaption, latestReadingOfDay } from './latestReading';
import { useUpdateBodyModel } from './useUpdateBodyModel';

// The figure for the selected day: it fills to the latest reading and follows every change to the data.
export function BodyPanel({ date }: { date: string }) {
  const { data: user } = useMe();
  const { data: readings, isPending } = useReadingsByDate(date);
  const updateBodyModel = useUpdateBodyModel();
  const latest = readings ? latestReadingOfDay(readings) : undefined;

  if (!user) return null;

  return (
    <section
      aria-label="Your glucose at a glance"
      className="flex flex-col items-center gap-3 rounded-xl border bg-card p-4"
    >
      <div className="h-[280px] w-full lg:h-[min(70vh,560px)]">
        <BodyGlucoseGauge model={user.bodyModel} value={latest?.value ?? null} />
      </div>
      <p aria-live="polite" className="min-h-5 text-center text-sm font-medium">
        {isPending ? 'Loading readings…' : bodyCaption(latest)}
      </p>
      <BodyModelSwitch value={user.bodyModel} onChange={(model) => updateBodyModel.mutate(model)} />
    </section>
  );
}
