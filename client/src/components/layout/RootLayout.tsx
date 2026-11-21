import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';
import { pageTransition } from '@/lib/motion';

export function RootLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return outlet;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
