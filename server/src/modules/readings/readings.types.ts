import type { SLOT_KEYS } from './readings.constants.js';

export type ReadingSlot = (typeof SLOT_KEYS)[number];

export interface ReadingInput {
  date: string;
  slot: ReadingSlot;
  value: number;
}

export interface ReadingRecord extends ReadingInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reading extends ReadingRecord {
  slotLabel: string;
}
