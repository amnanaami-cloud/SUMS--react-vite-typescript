# Threat Model

## Assets and trust boundaries

High-value assets are credentials, sessions, personal records, registration decisions, attendance, grades, transcripts, policy versions, reports, and audit evidence. Trust boundaries exist between browser/API, reverse proxy/API, API/database, deployment/secrets systems, and future mail/object-storage providers.

| Threat                  | Example                         | Implemented mitigation                                                                           | Residual action                                          |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Credential stuffing     | automated password attempts     | global throttling, generic errors, failure counter, timed lockout, Argon2id                      | edge/WAF rate limits, breach-password screening, MFA/SSO |
| Account/session theft   | stolen JWT or refresh cookie    | short access TTL, HttpOnly refresh, strict cookie, rotation, inactivity, revocation              | TLS/HSTS at edge, device alerts, MFA                     |
| Refresh replay          | old token reused                | single-use replacement chain; reuse revokes family/session                                       | alert SOC on `REFRESH_TOKEN_REUSE`                       |
| Privilege escalation    | client selects admin role       | server verifies assigned active role; permissions reloaded per request; self-role change blocked | two-person role approval workflow                        |
| IDOR/BOLA               | student supplies another UUID   | service-level own/assignment/org scope checks                                                    | keep negative integration tests for every new endpoint   |
| Race/overbooking        | concurrent finalization         | serializable transaction, deterministic row locks, conditional seat increment, FIFO waitlist     | load/concurrency tests on target PostgreSQL              |
| Grade tampering         | instructor publishes own grades | separate instructor submit and department publish/return states; audit                           | institutional dual-control/signature policy              |
| Audit alteration        | administrator edits history     | no update/delete API and DB trigger rejects update/delete                                        | WORM export/remote audit sink                            |
| Injection               | crafted body/query              | DTO allowlist/validation and parameterized Prisma queries                                        | SAST/DAST and review any future raw SQL                  |
| XSS                     | malicious announcement text     | React escaping, no HTML rendering, production CSP                                                | sanitize if rich text is later introduced                |
| CSRF                    | cross-site refresh/mutation     | bearer mutations, SameSite=Strict narrow refresh cookie                                          | explicit CSRF tokens before cross-site cookie support    |
| Data exfiltration       | broad report/audit query        | server-rebuilt scope, row cap, export audit, department audit filtering                          | DLP, watermarking, anomaly alerts                        |
| Sensitive logging       | password/token in audit         | recursive redaction, body-free HTTP logs, production-safe errors                                 | centralized log access control and retention             |
| Supply-chain compromise | malicious dependency/image      | pinned direct versions, lockfile, CI verification, non-root API image                            | Dependabot/SBOM/signing and image scanning               |
| Availability loss       | DB outage or expensive export   | readiness probe, container restart, capped synchronous reports                                   | HA DB, queues, quotas, DR drills                         |
| Seed misuse             | demo account in production      | production seed refusal, no auto-seed in Compose                                                 | release control verifying no demo identities             |

## Abuse cases that must remain tested

- invalid login cannot disclose whether an identifier exists;
- a student cannot read another student's transcript or attendance;
- an advisor cannot access an unassigned student;
- an instructor cannot access an unassigned section;
- a department role cannot cross departments;
- a stale/replayed refresh token cannot create a new session;
- concurrent seat allocation cannot exceed capacity;
- audit writes cannot contain credentials or be modified afterward.
