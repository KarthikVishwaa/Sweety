export const up = (pgm) => {
  pgm.addColumn('users', {
    body_model: {
      type: 'text',
      notNull: true,
      default: 'male',
      check: "body_model IN ('male', 'female')",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('users', 'body_model');
};
