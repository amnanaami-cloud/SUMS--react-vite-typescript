import { Prisma } from '@prisma/client';

export type LetterGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';
export type GradeThresholds = Record<LetterGrade, Prisma.Decimal.Value>;

export const ABSOLUTE_THRESHOLDS: GradeThresholds = {
  A: 90,
  'A-': 85,
  'B+': 80,
  B: 75,
  'B-': 70,
  'C+': 65,
  C: 60,
  'C-': 55,
  'D+': 50,
  D: 45,
  F: 0,
};
export const RELATIVE_THRESHOLDS: GradeThresholds = {
  A: 65,
  'A-': 60,
  'B+': 55,
  B: 50,
  'B-': 45,
  'C+': 40,
  C: 35,
  'C-': 30,
  'D+': 25,
  D: 20,
  F: 0,
};
const LETTER_ORDER: LetterGrade[] = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

export const GRADE_POINTS: Record<LetterGrade, Prisma.Decimal> = {
  A: new Prisma.Decimal(4),
  'A-': new Prisma.Decimal(3.7),
  'B+': new Prisma.Decimal(3.3),
  B: new Prisma.Decimal(3),
  'B-': new Prisma.Decimal(2.7),
  'C+': new Prisma.Decimal(2.3),
  C: new Prisma.Decimal(2),
  'C-': new Prisma.Decimal(1.7),
  'D+': new Prisma.Decimal(1.3),
  D: new Prisma.Decimal(1),
  F: new Prisma.Decimal(0),
};

export function truncatePositiveDecimal(value: Prisma.Decimal, places = 2): Prisma.Decimal {
  if (value.isNegative()) throw new RangeError('Only positive decimal values can be truncated');
  const factor = new Prisma.Decimal(10).pow(places);
  return value.mul(factor).floor().div(factor).toDecimalPlaces(places, Prisma.Decimal.ROUND_DOWN);
}

export function calculateGpa(weightedPoints: Prisma.Decimal, attemptedCredits: Prisma.Decimal): Prisma.Decimal {
  if (attemptedCredits.lte(0)) return new Prisma.Decimal(0).toDecimalPlaces(2);
  return truncatePositiveDecimal(weightedPoints.div(attemptedCredits), 2);
}

function gradeFromThresholds(score: Prisma.Decimal, thresholds: GradeThresholds): LetterGrade {
  return LETTER_ORDER.find((letter) => score.gte(new Prisma.Decimal(thresholds[letter]))) ?? 'F';
}

export function absoluteLetterGrade(
  raw: Prisma.Decimal,
  thresholds: GradeThresholds = ABSOLUTE_THRESHOLDS,
): LetterGrade {
  return gradeFromThresholds(raw, thresholds);
}

export function relativeLetterGrade(
  raw: Prisma.Decimal,
  tScore: Prisma.Decimal,
  failFloor: Prisma.Decimal.Value = 45,
  thresholds: GradeThresholds = RELATIVE_THRESHOLDS,
): LetterGrade {
  if (raw.lt(new Prisma.Decimal(failFloor))) return 'F';
  return gradeFromThresholds(tScore, thresholds);
}

export function relativeScores(
  rawScores: Prisma.Decimal[],
  policy: {
    minPopulation?: number;
    failFloor?: Prisma.Decimal.Value;
    relativeThresholds?: GradeThresholds;
    absoluteThresholds?: GradeThresholds;
  } = {},
): Array<{ raw: Prisma.Decimal; tScore: Prisma.Decimal; letter: LetterGrade }> {
  const minPopulation = policy.minPopulation ?? 10;
  if (rawScores.length < minPopulation)
    return rawScores.map((raw) => ({ raw, tScore: raw, letter: absoluteLetterGrade(raw, policy.absoluteThresholds) }));
  const mean = rawScores.reduce((sum, score) => sum.add(score), new Prisma.Decimal(0)).div(rawScores.length);
  const variance = rawScores
    .reduce((sum, score) => sum.add(score.sub(mean).pow(2)), new Prisma.Decimal(0))
    .div(rawScores.length);
  const standardDeviation = variance.sqrt();
  if (standardDeviation.eq(0))
    return rawScores.map((raw) => ({ raw, tScore: raw, letter: absoluteLetterGrade(raw, policy.absoluteThresholds) }));
  return rawScores.map((raw) => {
    const tScore = new Prisma.Decimal(50).add(raw.sub(mean).div(standardDeviation).mul(10));
    return { raw, tScore, letter: relativeLetterGrade(raw, tScore, policy.failFloor, policy.relativeThresholds) };
  });
}
