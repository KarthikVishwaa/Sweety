import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { fadeIn, floatAnimation, floatTransition } from '@/lib/motion';

interface ReportEmptyProps {
  onAddReading?: () => void;
}

export function ReportEmpty({ onAddReading }: ReportEmptyProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <motion.svg
        width="72"
        height="88"
        viewBox="0 0 72 88"
        fill="none"
        aria-hidden="true"
        animate={floatAnimation}
        transition={floatTransition}
      >
        <path
          d="M36 4C36 4 6 38 6 58a30 30 0 0 0 60 0C66 38 36 4 36 4Z"
          className="fill-teal-100 stroke-teal-600"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M20 58a16 16 0 0 0 12 15"
          className="stroke-teal-600"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse cx="36" cy="84" rx="16" ry="3" className="fill-teal-900/10" />
      </motion.svg>
      <div className="space-y-1">
        <p className="text-lg font-medium">No readings in this period yet</p>
        <p className="text-sm text-muted-foreground">
          {onAddReading
            ? 'Add a reading to see your numbers here.'
            : 'Readings you log will show up here.'}
        </p>
      </div>
      {onAddReading && (
        <PrimaryButton onClick={onAddReading}>
          <Plus aria-hidden="true" />
          Add a reading
        </PrimaryButton>
      )}
    </motion.div>
  );
}
