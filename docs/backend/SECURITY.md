# Security

## Implemented controls

- Argon2id password hashes; plaintext passwords are never persisted or logged.
- Password DTO policy: at least 8 characters with upper, lower, number, and special character.
- Generic login failure, three-failure lockout, 15-minute lock, and manual administrator unlock through account activation.
- 15-minute signed access JWTs plus opaque 256-bit refresh tokens stored only as SHA-256 hashes.
- Refresh cookie is HttpOnly, SameSite=Strict, path-scoped to `/api/v1/auth`, and Secure in production.
- Refresh rotation, family reuse detection, session revocation, role-revocation checks, and 30-minute inactivity timeout.
- Global authentication and permission guards; every protected request reloads live session, active role, permissions, and scope.
- DTO whitelisting, unknown-field rejection, strict UUID/date/time validation, Prisma parameterization, and database constraints.
- Helmet headers, credentialed CORS allowlist, global throttling, request IDs, and production-safe exception responses.
- Append-only `AuditLog` enforced by a PostgreSQL trigger. Sensitive keys are recursively redacted from audit before/after/metadata payloads.
- Report export authorization and audit; no direct object-store links or unsanitized filenames.
- Environment validation for PostgreSQL URL, JWT secret length, and token TTL bounds.

## Secret handling

Only examples with placeholders are committed. Production should inject `DATABASE_URL`, `JWT_ACCESS_SECRET`, cookie configuration, and mail credentials through the platform secret store. Rotate a leaked JWT secret by forcing all sessions to be revoked and replacing the secret during a coordinated deployment.

The demo seed password is one environment-supplied value for local/test use. Seeding refuses `NODE_ENV=production` and must not be included in production images or runbooks.

## CSRF and XSS posture

The bearer access token is not stored in a cookie, which limits CSRF exposure for normal mutations. Refresh is cookie-authenticated but uses SameSite=Strict and a narrow path; deployments that require cross-site clients must add an explicit synchronizer/double-submit CSRF design before loosening SameSite. React escapes rendered text, CSP is enabled in production by Helmet, and API content is never injected as HTML.

## Logging and privacy

HTTP logs omit query strings and bodies. Audit redaction covers password, token, authorization, cookie, and secret-like keys. Do not enable ORM query-value logging in production. Restrict database/audit access, encrypt disks/backups, and align retention with the university privacy policy.

## Production hardening checklist

- Terminate TLS 1.2+ at a trusted reverse proxy and set `COOKIE_SECURE=true`.
- Set the exact public origin in `CORS_ORIGINS`; never use `*` with credentials.
- Use a high-entropy secret manager value and managed PostgreSQL credentials with least privilege.
- Put distributed rate limiting/WAF protection in front of horizontally scaled replicas.
- Configure trusted proxy handling only for known proxies; validate forwarded headers.
- Integrate institutional email/SMS for password reset and alerts; never log raw reset tokens.
- Add centralized security monitoring for login failures, lockouts, token reuse, role changes, policy changes, exports, and audit-write failures.
- Run dependency and container scans in CI and patch on a documented cadence.
- Complete penetration, privacy, accessibility, and disaster-recovery exercises before institutional production use.

## Responsible limitations

This repository is production-oriented, not a certification. It does not claim SSO/MFA, a mail adapter, SIEM delivery, malware scanning for uploads, official transcript signing, or an external secrets manager. Those integrations need institutional infrastructure and approved policies.
