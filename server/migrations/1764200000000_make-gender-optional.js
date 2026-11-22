// The earlier 'male' values were system defaults, not choices, so existing accounts go back to "not chosen".
export const up = (pgm) => {
  pgm.alterColumn('users', 'gender', { default: null, notNull: false });
  pgm.sql('UPDATE users SET gender = NULL');
};

export const down = (pgm) => {
  pgm.sql("UPDATE users SET gender = 'male' WHERE gender IS NULL");
  pgm.alterColumn('users', 'gender', { default: 'male', notNull: true });
};
