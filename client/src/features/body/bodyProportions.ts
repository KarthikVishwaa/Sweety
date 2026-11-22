export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

/** The figure shown to someone who has not chosen one. */
export const NEUTRAL_GENDER: Gender = 'other';

// Every length is a fraction of the stature S unless a name says otherwise. Adult, about 7.5 heads tall.
export interface BodyProportions {
  /** Stature in scene units (metres). */
  stature: number;
  shoulderWidth: number;
  waistWidth: number;
  hipWidth: number;
  chestDepth: number;
  neckWidth: number;
  crotchHeight: number;
  /** Height of the shoulder line, the widest part of the chest, the waist and the hip bone. */
  shoulderY: number;
  chestY: number;
  waistY: number;
  hipY: number;
  kneeY: number;
  ankleY: number;
  /** Head height as a fraction of S (one head in 7.5). */
  headHeight: number;
  /** Angle of the arms away from the torso, in degrees. */
  armAngle: number;
  /** Radii of the shoulder ball, upper arm, elbow, wrist and thigh at the knee. */
  shoulderRadius: number;
  upperArmRadius: number;
  elbowRadius: number;
  wristRadius: number;
  kneeRadius: number;
  /** Size of the gluteal curve and the chest contour (0 is none). */
  gluteSize: number;
  bust: number;
}

const MALE_STATURE = 1.78;
const FEMALE_TO_MALE_STATURE = 0.93;

const MALE: BodyProportions = {
  stature: MALE_STATURE,
  shoulderWidth: 0.26,
  waistWidth: 0.18,
  hipWidth: 0.19,
  chestDepth: 0.12,
  neckWidth: 0.055,
  crotchHeight: 0.47,
  shoulderY: 0.815,
  chestY: 0.725,
  waistY: 0.6,
  hipY: 0.53,
  kneeY: 0.285,
  ankleY: 0.045,
  headHeight: 1 / 7.5,
  armAngle: 13,
  shoulderRadius: 0.038,
  upperArmRadius: 0.036,
  elbowRadius: 0.029,
  wristRadius: 0.019,
  kneeRadius: 0.04,
  gluteSize: 1,
  bust: 0,
};

const FEMALE: BodyProportions = {
  stature: MALE_STATURE * FEMALE_TO_MALE_STATURE,
  shoulderWidth: 0.235,
  waistWidth: 0.155,
  hipWidth: 0.215,
  chestDepth: 0.11,
  neckWidth: 0.045,
  crotchHeight: 0.45,
  shoulderY: 0.815,
  chestY: 0.725,
  waistY: 0.625,
  hipY: 0.525,
  kneeY: 0.285,
  ankleY: 0.045,
  headHeight: 1 / 7.5,
  armAngle: 13,
  shoulderRadius: 0.034,
  upperArmRadius: 0.031,
  elbowRadius: 0.025,
  wristRadius: 0.016,
  kneeRadius: 0.037,
  gluteSize: 1.15,
  bust: 1,
};

// The neutral figure sits halfway between the two, measurement by measurement.
function average(first: BodyProportions, second: BodyProportions): BodyProportions {
  const entries = Object.keys(first).map((key) => {
    const name = key as keyof BodyProportions;
    return [name, (first[name] + second[name]) / 2];
  });
  return Object.fromEntries(entries) as unknown as BodyProportions;
}

export const BODY_PROPORTIONS: Record<Gender, BodyProportions> = {
  male: MALE,
  female: FEMALE,
  other: average(MALE, FEMALE),
};

export const MESH_TRIANGLE_BUDGET = 60_000;
