export const up = (pgm) => {
  pgm.renameColumn('users', 'body_model', 'gender');
  pgm.dropConstraint('users', 'users_body_model_check');
  pgm.addConstraint('users', 'users_gender_check', {
    check: "gender IN ('male', 'female', 'other')",
  });
};

export const down = (pgm) => {
  // 'other' did not exist before this migration, so those accounts go back to the old default.
  pgm.sql("UPDATE users SET gender = 'male' WHERE gender = 'other'");
  pgm.dropConstraint('users', 'users_gender_check');
  pgm.addConstraint('users', 'users_body_model_check', {
    check: "gender IN ('male', 'female')",
  });
  pgm.renameColumn('users', 'gender', 'body_model');
};
