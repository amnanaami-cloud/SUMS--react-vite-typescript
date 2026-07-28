import { Prisma } from '@prisma/client';
import { absoluteLetterGrade, calculateGpa, relativeLetterGrade, truncatePositiveDecimal } from './grade-calculation';

describe('approved grade calculations', () => {
  it('truncates GPA to two places without rounding', () => {
    expect(truncatePositiveDecimal(new Prisma.Decimal('3.999')).toFixed(2)).toBe('3.99');
    expect(calculateGpa(new Prisma.Decimal('11.999'), new Prisma.Decimal('3')).toFixed(2)).toBe('3.99');
  });

  it('preserves an exact two-place GPA', () => {
    expect(truncatePositiveDecimal(new Prisma.Decimal('3.70')).toFixed(2)).toBe('3.70');
  });

  it('applies approved absolute boundaries', () => {
    expect(absoluteLetterGrade(new Prisma.Decimal('89.99'))).toBe('A-');
    expect(absoluteLetterGrade(new Prisma.Decimal('45'))).toBe('D');
    expect(absoluteLetterGrade(new Prisma.Decimal('44.99'))).toBe('F');
  });

  it('enforces the raw fail floor in relative grading', () => {
    expect(relativeLetterGrade(new Prisma.Decimal('44.99'), new Prisma.Decimal('80'))).toBe('F');
  });
});
