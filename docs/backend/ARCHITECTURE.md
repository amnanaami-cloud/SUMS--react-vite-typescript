# Architecture

## Context

SUMS is a modular monolith with a separately deployed single-page web client. This shape keeps academic transactions in one consistency boundary while leaving clear module seams for later extraction.

```text
Browser
  └─ React/Vite SPA
       └─ HTTPS /api/v1
            └─ NestJS API
                 ├─ global rate limit, authentication, permission guard
                 ├─ Auth / Users / Academic / Registration
                 ├─ Attendance / Grades / Reports / Announcements
                 ├─ Settings / Audit / Health
                 └─ Prisma transaction layer
                      └─ PostgreSQL
```

Nginx serves immutable web assets and reverse-proxies `/api/` to the API. API containers are stateless; session, refresh-token, policy, workflow, and audit state are persisted in PostgreSQL.

## Layering

1. Controllers define versioned REST routes, DTO validation, permission requirements, and response envelopes.
2. Services enforce resource ownership/scope and business rules. A permission match alone never establishes object access.
3. Prisma provides typed persistence and explicit transactions. Registration finalization uses a serializable transaction and row locks for seat allocation.
4. Database constraints and triggers protect invariant formats, relationships, uniqueness, and audit immutability.

## Authentication request flow

1. Login accepts email, university ID, or employee ID plus a requested role.
2. The server verifies Argon2id credentials, account state, lock state, and actual role assignment.
3. It creates a persisted session, returns a 15-minute access JWT, and sets a rotated opaque refresh token in an HttpOnly cookie.
4. Every protected request verifies the JWT and live session, then rebuilds active-role permissions and organizational scope from the database.
5. Refresh rotates the token. Reuse revokes the whole token family/session. Logout and password changes revoke sessions.

## Business consistency

- Registration request submission validates holds, windows, prerequisites, corequisites, repeats, collisions, and policy-based credit limits.
- Finalization locks target sections in deterministic order, rechecks the request, allocates available seats atomically, and creates ordered waitlist entries for full sections.
- Attendance writes require an assigned instructor; the edit window, threshold, and late conversion come from an effective policy.
- Grade calculations use versioned grading policies. Instructor submission and department publish/return are separate workflow transitions.
- Report queries apply the same student/program/department/faculty/advisor scope as interactive screens and record each export.

## Configuration

Secrets and runtime connection data are environment variables. Mutable institution display, localization, maintenance settings, and academic rules live in versioned database records with source references. All setting and policy changes are audited.

## Observability

Each request has an incoming or generated `X-Request-Id`. Structured HTTP logs include method, path without query parameters, response status, duration, actor ID, and request ID. Error responses include the request ID without exposing stack traces in production. `/health` is liveness; `/health/ready` checks database readiness.

## Scaling boundaries

- Add API replicas behind a load balancer; no sticky sessions are required.
- Use a managed PostgreSQL primary plus backups/read replicas; all writes remain on the primary.
- Export generation is synchronous and capped. Move large exports to a queue/object store when volume requires it.
- Add Redis only when distributed rate limiting, shared response caching, or background jobs justify the extra operational dependency.
