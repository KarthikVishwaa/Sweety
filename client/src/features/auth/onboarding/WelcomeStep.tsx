import { motion, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { fadeIn, popIn } from '@/lib/motion';
import { StepHeading } from './StepHeading';

export function WelcomeStep({ firstName }: { firstName: string }) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-5 lg:space-y-8 lg:[&_button]:h-14! lg:[&_button]:text-lg! lg:[&_h2]:text-3xl lg:[&_p]:text-lg lg:[&_p]:leading-relaxed"
      variants={reducedMotion ? fadeIn : popIn}
      initial="hidden"
      animate="visible"
    >
      <StepHeading
        focusOnMount
        description="Your account is ready. Log your first reading whenever you like, and Sweety will keep track of the rest."
      >
        Welcome to Sweety, {firstName}!
      </StepHeading>
      <PrimaryButton size="lg" className="w-full" onClick={() => navigate('/')}>
        Go to my dashboard
      </PrimaryButton>
    </motion.div>
  );
}
