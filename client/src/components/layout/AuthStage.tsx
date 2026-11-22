import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AnimatedMascot } from '@/components/mascot/AnimatedMascot';
import type { MascotVariant } from '@/components/mascot/mascot.assets';
import { BodyGlucoseGauge } from '@/features/body/BodyGlucoseGauge';
import type { BodyModel } from '@/features/body/bodyProportions';
import { stageFade, stageSwap } from '@/lib/motion';

export type StageContent =
  | { kind: 'mascot'; variant: MascotVariant }
  | { kind: 'body'; model: BodyModel; value: number | null };

// A fixed size at every breakpoint, so swapping a video for the 3D figure never moves the page.
export function AuthStage({ content }: { content: StageContent }) {
  const reducedMotion = useReducedMotion();
  const key = content.kind === 'mascot' ? `mascot-${content.variant}` : 'body';

  return (
    <div
      aria-hidden="true"
      className="relative h-40 w-44 shrink-0 sm:h-48 sm:w-56 lg:h-[22rem] lg:w-80 xl:h-[26rem]"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={key}
          className="absolute inset-0 flex items-center justify-center"
          variants={reducedMotion ? stageFade : stageSwap}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {content.kind === 'mascot' ? (
            <AnimatedMascot variant={content.variant} />
          ) : (
            <BodyGlucoseGauge model={content.model} value={content.value} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
