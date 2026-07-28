# Test Execution Report

Execution date: 2026-07-28. Environment: Windows workspace, Node/npm dependencies installed from `package-lock.json`.

| Check                        | Result                          | Evidence/notes                                                                                                                                       |
| ---------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency install           | PASS                            | `npm install` completed with lockfile current                                                                                                        |
| Format                       | PASS                            | `npm run format:check`                                                                                                                               |
| Lint                         | PASS                            | `npm run lint`, zero warnings                                                                                                                        |
| Typecheck                    | PASS                            | web and API                                                                                                                                          |
| Unit tests                   | PASS                            | 8 suites / 20 tests: frontend 2, backend 18                                                                                                          |
| Production build             | PASS                            | Vite web bundle and NestJS API                                                                                                                       |
| Prisma schema validation     | PASS                            | `npm run prisma:validate`; supported `prisma.config.ts` loaded                                                                                       |
| Docker Compose validation    | PASS                            | `docker compose config --quiet`; no services started                                                                                                 |
| API E2E                      | BLOCKED BY LOCAL INFRASTRUCTURE | 8 tests discovered; setup cannot reach PostgreSQL at `127.0.0.1:5432`; Docker daemon is not running                                                  |
| Browser E2E                  | NOT RUN                         | Depends on migrated/seeded API; same PostgreSQL/Docker blocker                                                                                       |
| Registry vulnerability audit | NOT RUN                         | External submission of dependency metadata to the npm advisory service was not authorized; pinned direct versions and lockfile were reviewed locally |

The API E2E failure is an environment setup failure (`PrismaClientInitializationError: Can't reach database server`), not an assertion failure. CI defines a PostgreSQL 17 service, migration, seed, API E2E, and browser E2E so those checks run where the required service exists.

No production database, deployment, or destructive reset was exercised by local verification.
