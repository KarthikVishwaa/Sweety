import type { Transition, Variants } from 'motion/react';

export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 26 };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const errorReveal: Variants = {
  hidden: { opacity: 0, height: 0, y: -4 },
  visible: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.2 } },
};

export const shake: Variants = {
  idle: { x: 0 },
  shake: { x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.4 } },
};
