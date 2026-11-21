import { motion } from 'motion/react';
import { fadeUp, staggerChildren } from '@/lib/motion';
import { SLOTS } from '../readings.constants';
import type { Reading, ReadingSlot } from '../types';
import { ReadingsProgress } from './ReadingsProgress';
import { SlotCard } from './SlotCard';

interface SlotChecklistProps {
  readings: Reading[];
  onAdd: (slot: ReadingSlot) => void;
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

export function SlotChecklist({ readings, onAdd, onEdit, onDelete }: SlotChecklistProps) {
  return (
    <section className="space-y-4" aria-label="Readings for the selected date">
      <ReadingsProgress count={readings.length} />
      <motion.ul
        className="grid gap-4 md:grid-cols-2"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        {SLOTS.map(({ key, label }) => (
          <motion.li key={key} variants={fadeUp}>
            <SlotCard
              slot={key}
              label={label}
              reading={readings.find((reading) => reading.slot === key)}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
