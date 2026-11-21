export const up = (pgm) => {
  pgm.addColumn('users', { date_of_birth: { type: 'date' } });
};

export const down = (pgm) => {
  pgm.dropColumn('users', 'date_of_birth');
};
