import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { fadeIn, riseIn, staggerChildren } from '@/lib/motion';

interface StaggerProps {
  className?: string;
  children: ReactNode;
}

export function StaggerGroup({ className, children }: StaggerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reducedMotion ? { hidden: {}, visible: {} } : staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ className, children }: StaggerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div className={className} variants={reducedMotion ? fadeIn : riseIn}>
      {children}
    </motion.div>
  );
}
