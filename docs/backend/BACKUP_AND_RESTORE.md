# Backup and Restore

## Policy prerequisites

Institutional owners must approve RPO, RTO, retention, encryption keys, backup region, legal holds, and restore authorization. Until then, use conservative encrypted daily backups plus PostgreSQL point-in-time recovery where the platform supports it.

## Backup scope

- PostgreSQL database, roles/grants, migration history, and policy/audit/document metadata.
- Deployment manifests and image digests.
- Future object-storage documents and signing keys through their native encrypted backup procedures.
- Secrets are backed up only by the secret-management platform, never inside a database dump or Git.

## Logical backup example

Run from a controlled operator host with a least-privilege backup credential:

```powershell
pg_dump --format=custom --no-owner --no-privileges --file=sums-YYYYMMDD-HHMM.dump $env:SUMS_BACKUP_DATABASE_URL
```

Encrypt and transfer the dump to independent, access-controlled storage. Record checksum, size, PostgreSQL version, migration version, encryption key reference, and retention expiry. Do not place real dumps in this repository.

## Restore drill

1. Provision an isolated PostgreSQL instance at a compatible version.
2. Verify the backup checksum and decrypt through the approved key service.
3. Create an empty database and restore with `pg_restore --clean --if-exists --no-owner` only against the explicitly verified drill database.
4. Run `prisma migrate status`, then start one API instance against the restored database.
5. Verify readiness, row counts, a known scoped report, login with a drill account, audit immutability, and grade/registration referential integrity.
6. Record actual restore time and data recovery point; destroy the drill environment through the approved process.

## Production recovery

Declare an incident, stop or isolate writers, preserve evidence, choose the recovery point, restore into a new database where possible, validate before redirecting traffic, and communicate the exact data-loss window. Never overwrite the only production database with an unverified restore.

## Minimum verification queries

Check migration history; counts for users/students/enrollments/final grades/audit; no sections where `enrolledCount` differs from active registered enrollments; no duplicate active waitlist positions; and no orphaned role/scope/profile relations. Application smoke tests must still prove cross-role denials.
