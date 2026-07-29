# Run SUMS on another device

This guide uses Docker Desktop. It runs the web client, API, PostgreSQL database, and migrations without requiring a separate Node.js or PostgreSQL installation.

## 1. Requirements

Install:

- Git
- Docker Desktop with Docker Compose

Ensure port `8080` is available and Docker Desktop is running.

## 2. Clone and configure

Open PowerShell:

```powershell
git clone https://github.com/amnanaami-cloud/SUMS--react-vite-typescript.git
cd SUMS-repo
Copy-Item .env.example .env
notepad .env
```

Set every placeholder in `.env`. Use a local database password, a random JWT secret of at least 32 characters, and a development-only demo password. Never commit `.env`.

To generate a 64-character JWT secret in PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$jwtSecret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
$jwtSecret
$rng.Dispose()
```

Copy the printed value into `JWT_ACCESS_SECRET` in `.env`.

Example local configuration keys:

```dotenv
VITE_API_BASE_URL=/api/v1
POSTGRES_DB=sums
POSTGRES_USER=sums
POSTGRES_PASSWORD=<LOCAL_DATABASE_PASSWORD>
JWT_ACCESS_SECRET=<64_CHARACTER_RANDOM_VALUE>
SEED_DEMO_PASSWORD=<DEVELOPMENT_ONLY_PASSWORD>
WEB_PORT=8080
```

## 3. Build, migrate, and start

```powershell
docker compose up --build -d
docker compose ps
```

The `migrate` container applies the committed Prisma migrations automatically. It is normal for that container to show `Exited (0)` after it finishes. PostgreSQL and the API should become healthy, and the web container should be running.

## 4. Create fictional development data

Docker does not seed automatically. Set the same development-only password that you placed in `.env`, then run the seed once:

```powershell
$env:SEED_DEMO_PASSWORD = SumsDemo!2026
docker compose run --rm -e NODE_ENV=development -e SEED_DEMO_PASSWORD migrate ./node_modules/.bin/tsx server/prisma/seed.ts
Remove-Item Env:SEED_DEMO_PASSWORD
```

The seed is idempotent and can be run again to restore the configured demo passwords and development records. Never seed a production database.

## 5. Open and sign in

Open:

```text
http://localhost:8080/
```

Student demo account:

```text
Role: Student
Email: student@up.edu.ps
University ID: 2202100054
Password: SumsDemo!2026
```

The browser page is `/`. The `/api/v1/auth/login` address is a POST-only API endpoint and cannot be opened as a normal page.

## 6. Verify the installation

```powershell
(Invoke-WebRequest -UseBasicParsing http://localhost:8080/healthz).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:8080/api/v1/health/ready).StatusCode
docker compose ps
```

Both health requests should return `200`.

For logs:

```powershell
docker compose logs api migrate postgres web --tail=200
```

## 7. Stop or restart

Stop the application while preserving database data:

```powershell
docker compose down
```

Start it again:

```powershell
docker compose up -d
```

Delete all local Docker database data and start clean only when intentionally resetting development:

```powershell
docker compose down -v
docker compose up --build -d
```

The `-v` command permanently deletes the local SUMS PostgreSQL volume. Run the seed again after a reset.

## 8. Database sources

- Standalone PostgreSQL schema: `database/SUMS_schema.sql`
- Prisma data model: `server/prisma/schema.prisma`
- Prisma migration: `server/prisma/migrations/20260728190000_initial/migration.sql`
- Fictional development data: `server/prisma/seed.ts`
- Live Docker data: volume `sums-repo_sums_postgres_data`

For a normal installation, use Docker migrations and the Prisma seed. Do not import `SUMS_schema.sql` into the same database before running migrations, because both create the same schema.

## 9. GitHub safety

Before pushing, verify that `.env`, database dumps containing runtime data, and dependencies are not included:

```powershell
git status
git check-ignore .env
git ls-files node_modules
```

If `git ls-files node_modules` prints files, remove them from Git tracking without deleting local copies:

```powershell
git rm -r --cached node_modules
git status
```

Do not commit `.env`, password values, JWT secrets, tokens, PostgreSQL Docker volumes, or full database backups. The schema-only SQL file is safe to commit.
