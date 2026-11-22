import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { fadeIn } from '@/lib/motion';

export function InsightsEmpty({ monthLabel }: { monthLabel: string }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-1">
        <p className="text-lg font-medium">No readings in {monthLabel}</p>
        <p className="text-sm text-muted-foreground">
          Once you log readings, the averages, time in range and trends for the month show up here.
        </p>
      </div>
      <Link to="/" className={buttonVariants()}>
        Go to the dashboard
      </Link>
    </motion.div>
  );
}
