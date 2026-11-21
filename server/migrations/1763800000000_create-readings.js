export const up = (pgm) => {
  pgm.createTable('readings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    reading_date: { type: 'date', notNull: true },
    slot: {
      type: 'text',
      notNull: true,
      check: "slot IN ('morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner')",
    },
    value: { type: 'integer', notNull: true, check: 'value BETWEEN 40 AND 600' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('readings', 'readings_user_date_slot_unique', {
    unique: ['user_id', 'reading_date', 'slot'],
  });
  pgm.createIndex('readings', ['user_id', 'reading_date']);
};

export const down = (pgm) => {
  pgm.dropTable('readings');
};
