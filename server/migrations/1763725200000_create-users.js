export const up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    email: { type: 'text', notNull: true },
    password_hash: { type: 'text', notNull: true },
    role: {
      type: 'text',
      notNull: true,
      default: 'patient',
      check: "role IN ('patient', 'doctor')",
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('users', 'lower(email)', { name: 'users_email_lower_unique', unique: true });
};

export const down = (pgm) => {
  pgm.dropTable('users');
};
