import { Prisma, StandingCode, TermType } from '@prisma/client';
import { evaluateRegistrationLoad } from './registration-policy';

const regular = {
  minimum: 18,
  standardMaximum: 18,
  highGpaMaximum: 21,
  highGpaThreshold: 3,
  warningProbationMaximum: 12,
};
const summer = { maximum: 9, probationMaximum: 6 };

describe('registration load policy', () => {
  it('allows the configured high-GPA maximum', () => {
    expect(
      evaluateRegistrationLoad({
        termType: TermType.FIRST,
        standing: StandingCode.GOOD_STANDING,
        cumulativeGpa: new Prisma.Decimal('3.00'),
        currentRegisteredCredits: 0,
        requestedCredits: 21,
        waitlistedCredits: 0,
        finalTerm: false,
        regular,
        summer,
      }).maximumCredits,
    ).toBe(21);
  });

  it('does not count waitlisted credits against the maximum', () => {
    expect(
      evaluateRegistrationLoad({
        termType: TermType.FIRST,
        standing: StandingCode.GOOD_STANDING,
        cumulativeGpa: new Prisma.Decimal('2.50'),
        currentRegisteredCredits: 15,
        requestedCredits: 6,
        waitlistedCredits: 3,
        finalTerm: false,
        regular,
        summer,
      }).projectedRegisteredCredits,
    ).toBe(18);
  });

  it('enforces the configured probation summer maximum', () => {
    expect(() =>
      evaluateRegistrationLoad({
        termType: TermType.SUMMER,
        standing: StandingCode.PROBATION,
        cumulativeGpa: new Prisma.Decimal('1.20'),
        currentRegisteredCredits: 0,
        requestedCredits: 9,
        waitlistedCredits: 0,
        finalTerm: false,
        regular,
        summer,
      }),
    ).toThrow('CREDIT_LIMIT_EXCEEDED');
  });

  it('permits a lower regular load only in the final term', () => {
    expect(() =>
      evaluateRegistrationLoad({
        termType: TermType.FIRST,
        standing: StandingCode.GOOD_STANDING,
        cumulativeGpa: new Prisma.Decimal('3.20'),
        currentRegisteredCredits: 0,
        requestedCredits: 12,
        waitlistedCredits: 0,
        finalTerm: false,
        regular,
        summer,
      }),
    ).toThrow('MINIMUM_CREDIT_LOAD_NOT_MET');
    expect(
      evaluateRegistrationLoad({
        termType: TermType.FIRST,
        standing: StandingCode.GOOD_STANDING,
        cumulativeGpa: new Prisma.Decimal('3.20'),
        currentRegisteredCredits: 0,
        requestedCredits: 12,
        waitlistedCredits: 0,
        finalTerm: true,
        regular,
        summer,
      }).minimumCredits,
    ).toBe(0);
  });
});
