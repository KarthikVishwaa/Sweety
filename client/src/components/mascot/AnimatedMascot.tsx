import { useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  MASCOT_ASPECT_RATIO,
  MASCOT_LOOPS,
  MASCOT_SOURCES,
  type MascotVariant,
} from './mascot.assets';
import { useMascotPlayback } from './useMascotPlayback';

function MascotVideo({ variant }: { variant: MascotVariant }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const { webm, mp4, poster } = MASCOT_SOURCES[variant];

  useMascotPlayback(videoRef, !reducedMotion);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 size-full mix-blend-multiply dark:mix-blend-normal"
      poster={poster}
      autoPlay={!reducedMotion}
      preload={reducedMotion ? 'none' : 'auto'}
      loop={MASCOT_LOOPS[variant]}
      muted
      playsInline
      disablePictureInPicture
      tabIndex={-1}
    >
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  );
}

interface AnimatedMascotProps {
  variant: MascotVariant;
  className?: string;
}

export function AnimatedMascot({ variant, className }: AnimatedMascotProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative w-32 shrink-0 sm:w-40 lg:w-72 xl:w-96 3xl:w-[30rem] dark:overflow-hidden dark:rounded-3xl dark:bg-white',
        className,
      )}
      style={{ aspectRatio: MASCOT_ASPECT_RATIO }}
    >
      <MascotVideo key={variant} variant={variant} />
    </div>
  );
}
