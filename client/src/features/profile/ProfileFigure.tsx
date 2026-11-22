import { BodyGlucoseGauge } from '@/features/body/BodyGlucoseGauge';
import { NEUTRAL_GENDER, type Gender } from '@/features/body/bodyProportions';
import { figureCaption } from '@/features/insights/observations';

interface ProfileFigureProps {
  gender: Gender | null;
  /** The month's average, or null when it has no readings. */
  average: number | null;
  pending: boolean;
  /** For example "this month" or "in October 2026". */
  period: string;
}

export function ProfileFigure({ gender, average, pending, period }: ProfileFigureProps) {
  return (
    <section
      aria-label="Your month at a glance"
      className="flex flex-col items-center gap-3 rounded-xl border bg-card p-4 lg:h-[calc(100dvh-9.5rem)] lg:max-h-[64rem] lg:min-h-[32rem]"
    >
      <div className="h-60 w-full sm:h-72 lg:h-auto lg:min-h-0 lg:flex-1">
        <BodyGlucoseGauge model={gender ?? NEUTRAL_GENDER} value={average} />
      </div>
      <p aria-live="polite" className="min-h-5 text-center text-sm font-medium">
        {pending ? 'Loading…' : figureCaption(average, period)}
      </p>
    </section>
  );
}
