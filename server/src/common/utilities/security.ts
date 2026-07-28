import { createHash, randomBytes } from 'node:crypto';

export const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
export const secureToken = (): string => randomBytes(48).toString('base64url');

export function sanitizeAuditValue(value: unknown): unknown {
  const blocked = /password|hash|token|secret|authorization|cookie/i;
  if (Array.isArray(value)) return value.map(sanitizeAuditValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !blocked.test(key))
        .map(([key, nested]) => [key, sanitizeAuditValue(nested)]),
    );
  }
  return value;
}
