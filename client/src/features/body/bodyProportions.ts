export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const NEUTRAL_GENDER: Gender = 'other';

/**
 * One adult figure. Every length is a fraction of the stature S (approximate Drillis and Contini
 * landmark heights), every angle is in degrees. The figures are generated at unit height and scaled
 * to `stature` (metres) when shown.
 */
export interface BodyProportions {
  stature: number;

  headHeight: number;
  chinY: number;
  shoulderY: number;
  chestY: number;
  elbowY: number;
  navelY: number;
  wristY: number;
  hipJointY: number;
  crotchY: number;
  fingertipY: number;
  kneeY: number;
  ankleY: number;

  shoulderWidth: number;
  chestWidth: number;
  waistWidth: number;
  hipWidth: number;
  chestDepth: number;
  waistDepth: number;
  hipDepth: number;
  neckWidth: number;
  neckLength: number;

  thighWidth: number;
  kneeWidth: number;
  calfWidth: number;
  ankleWidth: number;
  upperArmWidth: number;
  forearmWidth: number;
  wristDepth: number;

  footLength: number;
  ballWidth: number;
  heelWidth: number;
  archHeight: number;
  heelSpacing: number;
  toeOut: number;
  palmWidth: number;
  thumbAngle: number;

  armAngle: number;
  elbowBend: number;
  /** Angle of the trapezius line from the neck to the shoulder, below horizontal. */
  trapeziusSlope: number;

  /** Size of the gluteal curve (1 is typical) and of the chest contour (0 is a flat male chest). */
  gluteSize: number;
  chestContour: number;
}

const MALE_STATURE = 1.78;
const FEMALE_TO_MALE_STATURE = 0.93;

const MALE: BodyProportions = {
  stature: MALE_STATURE,

  headHeight: 0.13,
  chinY: 0.87,
  shoulderY: 0.818,
  chestY: 0.72,
  elbowY: 0.63,
  navelY: 0.6,
  wristY: 0.485,
  hipJointY: 0.53,
  crotchY: 0.47,
  fingertipY: 0.377,
  kneeY: 0.285,
  ankleY: 0.039,

  shoulderWidth: 0.259,
  chestWidth: 0.186,
  waistWidth: 0.18,
  hipWidth: 0.191,
  chestDepth: 0.12,
  waistDepth: 0.106,
  hipDepth: 0.118,
  neckWidth: 0.055,
  neckLength: 0.05,

  thighWidth: 0.1,
  kneeWidth: 0.07,
  calfWidth: 0.072,
  ankleWidth: 0.04,
  upperArmWidth: 0.062,
  forearmWidth: 0.053,
  wristDepth: 0.034,

  footLength: 0.152,
  ballWidth: 0.058,
  heelWidth: 0.038,
  archHeight: 0.009,
  heelSpacing: 0.1,
  toeOut: 10,
  palmWidth: 0.046,
  thumbAngle: 30,

  armAngle: 14,
  elbowBend: 12,
  trapeziusSlope: 20,

  gluteSize: 1,
  chestContour: 0,
};

const FEMALE: BodyProportions = {
  stature: MALE_STATURE * FEMALE_TO_MALE_STATURE,

  headHeight: 0.13,
  chinY: 0.87,
  shoulderY: 0.818,
  chestY: 0.715,
  elbowY: 0.63,
  navelY: 0.6,
  wristY: 0.485,
  hipJointY: 0.53,
  crotchY: 0.466,
  fingertipY: 0.377,
  kneeY: 0.285,
  ankleY: 0.039,

  shoulderWidth: 0.235,
  chestWidth: 0.165,
  waistWidth: 0.155,
  hipWidth: 0.215,
  chestDepth: 0.11,
  waistDepth: 0.094,
  hipDepth: 0.124,
  neckWidth: 0.045,
  neckLength: 0.05,

  thighWidth: 0.106,
  kneeWidth: 0.066,
  calfWidth: 0.069,
  ankleWidth: 0.037,
  upperArmWidth: 0.055,
  forearmWidth: 0.046,
  wristDepth: 0.03,

  footLength: 0.148,
  ballWidth: 0.054,
  heelWidth: 0.035,
  archHeight: 0.009,
  heelSpacing: 0.095,
  toeOut: 10,
  palmWidth: 0.042,
  thumbAngle: 30,

  armAngle: 15,
  elbowBend: 12,
  trapeziusSlope: 25,

  gluteSize: 1.15,
  chestContour: 1,
};

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
