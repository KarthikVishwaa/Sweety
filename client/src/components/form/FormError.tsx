import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { errorReveal, fadeIn } from '@/lib/motion';

interface FormErrorProps {
  message?: string;
  id?: string;
  className?: string;
}

export function FormError({ message, id, className }: FormErrorProps) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          id={id}
          role="alert"
          className="overflow-hidden"
          variants={reducedMotion ? fadeIn : errorReveal}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <p className={className}>{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
