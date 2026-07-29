# Deployment

## Container topology

`docker-compose.yml` defines PostgreSQL, a one-shot migration service, the NestJS API, and an Nginx web service. The API image runs as the unprivileged `node` user. Nginx serves the SPA and proxies `/api/` so production cookies remain same-site.

## Required environment

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `DATABASE_URL` (constructed by Compose; inject directly on managed platforms)
- `JWT_ACCESS_SECRET` (random, 32+ characters; longer is preferred)
- `ACCESS_TOKEN_TTL_SECONDS` (60–3600, baseline 900)
- `REFRESH_TOKEN_TTL_DAYS` (1–30, baseline 7)
- `COOKIE_SECURE=true` behind HTTPS
- `CORS_ORIGINS` exact public origin(s)
- optional `COOKIE_DOMAIN`, `PORT`, and log/platform settings

Do not set `SEED_DEMO_PASSWORD` or run `db:seed` in production.

## Release sequence

1. Back up the database and confirm restore health.
2. Build immutable images from the reviewed commit and scan them.
3. Review migration SQL for locks, runtime, and backward compatibility.
4. Run `prisma migrate deploy` as a one-shot job with migration credentials.
5. Deploy API replicas and wait for `/api/v1/health/ready`.
6. Deploy the web image and smoke-test login, role scope, one read, and one reversible workflow in a non-production account.
7. Monitor error rate, latency, login failures, token reuse, and database saturation.

The supplied Compose file is suitable for development/staging and a single-host demonstration. Institutional production should use managed secrets, managed PostgreSQL with HA/PITR, TLS ingress, centralized logs, image registry/signing, resource limits, and independent backup storage.

## Rollback

Prefer forward-compatible expand/migrate/contract schema changes. Roll back application images only while the deployed schema remains compatible. Never reverse a data migration by editing migration history. If an irreversible migration corrupts data, stop writes and restore/replay according to `BACKUP_AND_RESTORE.md`.

## CI

GitHub Actions provisions PostgreSQL 17, installs from the npm lockfile, generates Prisma Client, validates/deploys migrations, seeds test data, runs static/unit/API tests, builds both applications, installs Chromium, and runs the browser smoke test. Failure diagnostics are uploaded as artifacts.
