# Operations Runbook

## Health and first response

- Liveness: `GET /api/v1/health`
- Readiness: `GET /api/v1/health/ready`
- Web health: `GET /healthz`

If readiness fails, check database reachability, credentials, connection saturation, and migration status before restarting API replicas. Correlate user reports with `X-Request-Id`; application logs intentionally omit request bodies and query strings.

## Common incidents

### Elevated login failures or lockouts

Check `LoginAttempt` and audit actions for source/user patterns. Validate no credential stuffing is underway before unlocking accounts. Administrators unlock by setting the account back to `ACTIVE`, which also clears the counter and lock time. Never reveal whether an identifier exists.

### Refresh-token reuse alert

The affected token family and session are already revoked. Treat this as possible theft: contact the user, revoke all sessions, rotate credentials if indicated, and inspect request metadata/audit evidence.

### Registration over-capacity report

Pause finalization, capture request IDs, and query the section, enrollments, waitlist, and audit trail. Do not manually decrement counts before reconciling authoritative enrollment rows. The normal path uses serializable transactions and row locks; investigate direct database writes or migration drift.

### Grade/attendance dispute

Use the submission/adjustment/appeal histories and append-only audit log. Do not edit a published final grade or old attendance row directly. Follow the approved return/change/appeal workflow.

### Database outage

Stop mutation traffic if writes are uncertain, preserve logs, fail over only through the database platform procedure, verify migrations, then restore API traffic after readiness and a scoped read/write smoke test.

### Suspected secret leak

Revoke sessions, rotate `JWT_ACCESS_SECRET` and affected database/provider credentials, redeploy, and review access/audit logs. A JWT secret rotation invalidates all access tokens; persisted sessions should also be revoked.

## Routine operations

- Daily: review health, errors, login abuse, token reuse, privileged changes, export volume, backup success.
- Weekly: review dependency/security findings, database growth, slow queries, locks, and capacity.
- Per release: back up, review migration, run quality gates, deploy migrations then app, smoke test, monitor.
- Quarterly or policy cadence: restore drill, access review, privileged-role review, incident exercise.

## Safe database commands

Production migration: `npm run db:migrate`. Schema generation: `npm run db:generate`. Never run `db:reset:dev` or `prisma migrate dev` in production. Never repair migration history without a reviewed recovery plan.
