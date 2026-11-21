import type { Reading, ReadingSlot } from '../types';

export type ReadingEditor =
  { mode: 'add'; slot?: ReadingSlot } | { mode: 'edit'; reading: Reading };
