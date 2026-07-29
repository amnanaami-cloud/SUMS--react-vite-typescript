import { Prisma, StandingCode, TermType } from '@prisma/client';

export interface RegularLoadPolicy {
  minimum: number;
  standardMaximum: number;
  highGpaMaximum: number;
  highGpaThreshold: number;
  warningProbationMaximum: number;
}

export interface SummerLoadPolicy {
  maximum: number;
  probationMaximum: number;
}

export interface RegistrationLoadInput {
  termType: TermType;
  standing: StandingCode;
  cumulativeGpa: Prisma.Decimal;
  currentRegisteredCredits: number;
  requestedCredits: number;
  waitlistedCredits: number;
  finalTerm: boolean;
  regular: RegularLoadPolicy;
  summer: SummerLoadPolicy;
}

export interface RegistrationLoadResult {
  directCredits: number;
  projectedRegisteredCredits: number;
  maximumCredits: number;
  minimumCredits: number;
}

export function evaluateRegistrationLoad(input: RegistrationLoadInput): RegistrationLoadResult {
  const directCredits = Math.max(0, input.requestedCredits - input.waitlistedCredits);
  const projectedRegisteredCredits = input.currentRegisteredCredits + directCredits;
  const summer = input.termType === TermType.SUMMER;
  const maximumCredits = summer
    ? input.standing === StandingCode.PROBATION
      ? input.summer.probationMaximum
      : input.summer.maximum
    : input.standing !== StandingCode.GOOD_STANDING
      ? input.regular.warningProbationMaximum
      : input.cumulativeGpa.gte(input.regular.highGpaThreshold)
        ? input.regular.highGpaMaximum
        : input.regular.standardMaximum;
  const minimumCredits = summer || input.finalTerm ? 0 : input.regular.minimum;

  if (projectedRegisteredCredits > maximumCredits) throw new Error('CREDIT_LIMIT_EXCEEDED');
  if (input.currentRegisteredCredits + input.requestedCredits < minimumCredits) {
    throw new Error('MINIMUM_CREDIT_LOAD_NOT_MET');
  }
  return { directCredits, projectedRegisteredCredits, maximumCredits, minimumCredits };
}

export function parsePolicyObject<T extends object>(value: Prisma.JsonValue, requiredKeys: Array<keyof T>): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('ACADEMIC_POLICY_INVALID');
  for (const key of requiredKeys) {
    if (typeof (value as Record<string, unknown>)[String(key)] !== 'number') throw new Error('ACADEMIC_POLICY_INVALID');
  }
  return value as T;
}
