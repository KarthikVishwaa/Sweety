export type ReadingSlot = 'morning_fasting' | 'after_breakfast' | 'after_lunch' | 'after_dinner';

export interface Reading {
  id: string;
  date: string;
  slot: ReadingSlot;
  slotLabel: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingInput {
  date: string;
  slot: ReadingSlot;
  value: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReadingsPage {
  data: Reading[];
  meta: PageMeta;
}
