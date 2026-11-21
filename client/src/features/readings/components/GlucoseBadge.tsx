import { cn } from '@/lib/utils';
import { getGlucoseBand, type GlucoseBandKey } from '../readings.constants';

const BAND_STYLES: Record<GlucoseBandKey, string> = {
  low: 'border-amber-300 bg-amber-100 text-amber-900',
  'in-range': 'border-emerald-300 bg-emerald-100 text-emerald-900',
  high: 'border-red-300 bg-red-100 text-red-900',
};

export function GlucoseBadge({ value }: { value: number }) {
  const band = getGlucoseBand(value);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        BAND_STYLES[band.key],
      )}
    >
      {band.label}
    </span>
  );
}
