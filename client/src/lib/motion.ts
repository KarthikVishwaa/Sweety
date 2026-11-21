import type { Transition, Variants } from 'motion/react';

export const DURATION = { fast: 0.15, base: 0.2, slow: 0.35 } as const;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const STAGGER = 0.06;

export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 26 };
export const floatTransition: Transition = { duration: 3, repeat: Infinity, ease: 'easeInOut' };

export const floatAnimation = { y: [0, -8, 0] };

export const TAP_SCALE = { scale: 0.97 } as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const errorReveal: Variants = {
  hidden: { opacity: 0, height: 0, y: -4 },
  visible: { opacity: 1, height: 'auto', y: 0, transition: { duration: DURATION.base } },
};

export const shake: Variants = {
  idle: { x: 0 },
  shake: { x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: DURATION.slow } },
};
