# Test Strategy

## Test layers

| Layer           | Tool                                          | Focus                                                                                                                                                                   |
| --------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static          | TypeScript, ESLint, Prisma validate, Prettier | contracts, unsafe types, hooks, schema integrity, formatting                                                                                                            |
| Unit            | Jest, Vitest                                  | GPA truncation, absolute/relative grades, registration load/waitlist credit rules, password DTOs, guards, audit redaction, resource authorization, API refresh behavior |
| API integration | Jest + Supertest + PostgreSQL                 | health, login/me, generic invalid login, forbidden route, student IDOR, instructor section scope, refresh rotation/reuse, logout revocation                             |
| Browser         | Playwright                                    | seeded login, authenticated shell, refresh-cookie restoration after reload                                                                                              |
| Build/deploy    | Vite/Nest builds, Docker Compose config       | production compilation and deployment topology                                                                                                                          |

## Required security regressions

- Valid/invalid login; account lock and unlock; access expiry; refresh rotation, replay, inactivity, logout, and role revocation.
- Permission denial and BOLA/IDOR denial for student, advisor, instructor, program, department, and faculty resources.
- Unknown DTO fields, malformed UUIDs, boundary dates, duplicate sections, and invalid enum transitions.
- Audit secret redaction and database rejection of update/delete.
- Report scope and export audit.

## Required business regressions

- Prerequisite/corequisite, active hold, duplicate course, repeat limit, and schedule collision.
- Regular/summer/probation/high-GPA/final-term loads and waitlisted-credit exclusion from maximum.
- Concurrent finalization at one remaining seat; exactly one direct enrollment and remaining FIFO waitlist positions.
- Drop inside add/drop promotes first eligible waitlist entry without overbooking; withdrawal outside add/drop does not promote.
- Attendance edit window, three-late conversion, 75% threshold, assigned-instructor restriction, and department adjustment decision.
- Absolute grading thresholds; relative small-population and zero-variance fallback; raw-score floor; Decimal GPA truncation; submit/return/publish workflow; appeal deadline.

## Data approach

The deterministic seed provides all nine roles, one organization hierarchy, current/prior terms, curricula, sections, prerequisite history, enrollments, attendance, grades, policies, and announcements. CI provisions a disposable PostgreSQL database, deploys migrations, and seeds it before integration tests. Unit tests use isolated mocks and never require production data.

## Quality gates

A releasable build requires format, lint, typecheck, unit tests, database-backed API tests, production builds, and browser E2E to pass in CI. Migration review, backup/restore rehearsal, dependency/container scanning, and security review are release controls even when not fully automated locally.
