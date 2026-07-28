# API Reference

Base path: `/api/v1`. Interactive OpenAPI: `/api/docs`; JSON: `/api/docs-json`.

Successful JSON responses use `{ "data": ... }`. Validation and application errors use `{ statusCode, code, message, details, requestId, timestamp }`. Send an optional `X-Request-Id` of at most 100 characters to correlate a request. Protected endpoints require `Authorization: Bearer <access-token>`; refresh uses the `sums_refresh` HttpOnly cookie.

## Authentication and health

| Method | Path                    | Access               | Purpose                                                                                                   |
| ------ | ----------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| GET    | `/health`               | Public               | Liveness                                                                                                  |
| GET    | `/health/ready`         | Public               | PostgreSQL readiness                                                                                      |
| POST   | `/auth/login`           | Public, rate-limited | Authenticate by email/university ID/employee ID; body: `identifier`, `password`, optional `requestedRole` |
| POST   | `/auth/refresh`         | Refresh cookie       | Rotate refresh token and issue access token                                                               |
| POST   | `/auth/logout`          | Bearer               | Revoke current session, 204                                                                               |
| POST   | `/auth/logout-all`      | Bearer               | Revoke all user sessions, 204                                                                             |
| GET    | `/auth/me`              | Bearer               | Current user, active role, permissions, profile                                                           |
| GET    | `/auth/sessions`        | Bearer               | Active sessions                                                                                           |
| POST   | `/auth/forgot-password` | Public, rate-limited | Enumeration-safe reset request, 202                                                                       |
| POST   | `/auth/reset-password`  | Public               | Consume one-time reset token, 204                                                                         |
| POST   | `/auth/change-password` | Bearer               | Verify current password, change hash, revoke sessions, 204                                                |

## Users and organization

| Method | Path                                | Permission        | Purpose                                                     |
| ------ | ----------------------------------- | ----------------- | ----------------------------------------------------------- |
| GET    | `/users?page=&pageSize=&search=`    | `users.read`      | Paginated user administration list                          |
| POST   | `/users`                            | `users.manage`    | Create non-student identity/account                         |
| PATCH  | `/users/{uuid}/status`              | `users.manage`    | Activate, suspend, or lock; activation clears lock counters |
| PUT    | `/users/{uuid}/roles`               | `roles.manage`    | Replace role assignments and scopes; self-change forbidden  |
| PATCH  | `/profile`                          | `profile.update`  | Update approved own-profile fields                          |
| GET    | `/students?page=&pageSize=&search=` | `students.read`   | Scope-filtered students                                     |
| POST   | `/students`                         | `students.manage` | Atomically create user, role, and student profile           |
| GET    | `/staff`                            | `staff.read`      | Department/faculty-scoped employee list                     |

## Academic catalog and schedule

| Method | Path                          | Permission        | Purpose                                                             |
| ------ | ----------------------------- | ----------------- | ------------------------------------------------------------------- |
| GET    | `/dashboard`                  | `dashboard.read`  | Active-role/scope statistics                                        |
| GET    | `/courses?search=&termId=`    | `courses.read`    | Offered sections; instructor and org scopes enforced                |
| GET    | `/courses/mine`               | `courses.read`    | Student enrollments or instructor assignments                       |
| POST   | `/courses`                    | `courses.manage`  | Create course                                                       |
| GET    | `/terms`                      | `terms.read`      | Academic terms                                                      |
| POST   | `/terms`                      | `terms.manage`    | Create term with registration/add-drop/withdrawal dates             |
| POST   | `/sections`                   | `sections.manage` | Create course section                                               |
| GET    | `/schedule`                   | `courses.read`    | Student, assigned-instructor, or department-head schedule           |
| GET    | `/curriculum?programId=`      | `curriculum.read` | Program curriculum under role scope                                 |
| GET    | `/degree-progress?studentId=` | `progress.read`   | Student progress under own/advisor/program/department/faculty scope |
| GET    | `/analytics`                  | `reports.read`    | Scope-filtered aggregate counts                                     |

## Registration

| Method | Path                                     | Permission                 | Purpose                                                          |
| ------ | ---------------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| GET    | `/registrations/mine`                    | `registrations.own.read`   | Student request history                                          |
| GET    | `/registrations/pending`                 | `registrations.review`     | Pending requests under advisor/department/registrar scope        |
| POST   | `/registrations`                         | `registrations.own.submit` | Submit a term and unique section IDs for policy validation       |
| PATCH  | `/registrations/{uuid}/decision`         | `registrations.review`     | `APPROVED`, `RETURNED`, or `REJECTED` with reason where required |
| POST   | `/registrations/{uuid}/finalize`         | `registrations.finalize`   | Transactionally enroll or FIFO-waitlist approved items           |
| POST   | `/registrations/enrollments/{uuid}/drop` | `registrations.own.submit` | Student-owned add/drop-window drop with reason                   |

## Attendance

| Method | Path                                      | Permission                      | Purpose                                                |
| ------ | ----------------------------------------- | ------------------------------- | ------------------------------------------------------ |
| GET    | `/attendance/sections`                    | `attendance.manage.assigned`    | Instructor-assigned sections                           |
| GET    | `/attendance/sections/{uuid}/roster`      | `attendance.manage.assigned`    | Assigned-section roster and sessions                   |
| POST   | `/attendance/sessions`                    | `attendance.manage.assigned`    | Create an assigned-section class session               |
| POST   | `/attendance/sessions/{uuid}/records`     | `attendance.manage.assigned`    | Bulk upsert marks inside the edit policy window        |
| POST   | `/attendance/adjustments`                 | `attendance.manage.assigned`    | Request a reasoned late correction                     |
| PATCH  | `/attendance/adjustments/{uuid}/decision` | `attendance.approve.department` | Department decision                                    |
| GET    | `/attendance/summary?studentId=`          | `attendance.read`               | Own/advisor/org-scoped summary with effective absences |

## Grades

| Method | Path                                | Permission                  | Purpose                                              |
| ------ | ----------------------------------- | --------------------------- | ---------------------------------------------------- |
| GET    | `/grades/submissions/pending`       | `grades.publish.department` | Department pending grade submissions                 |
| GET    | `/grades/sections/{uuid}`           | `grades.manage.assigned`    | Assigned-section gradebook                           |
| POST   | `/grades/assessments`               | `grades.manage.assigned`    | Create assessment                                    |
| POST   | `/grades/assessments/{uuid}/scores` | `grades.manage.assigned`    | Bulk upsert Decimal scores                           |
| POST   | `/grades/sections/{uuid}/submit`    | `grades.manage.assigned`    | Calculate final grades from active policy and submit |
| POST   | `/grades/sections/{uuid}/publish`   | `grades.publish.department` | Publish department submission                        |
| POST   | `/grades/sections/{uuid}/return`    | `grades.publish.department` | Return submission with reason                        |
| GET    | `/grades/transcript?studentId=`     | `transcript.read`           | Published transcript under resource scope            |
| POST   | `/grades/appeals`                   | `grades.appeal.own`         | Appeal own published grade before term deadline      |

## Announcements, reports, audit, and settings

| Method | Path                                                 | Permission              | Purpose                                                                      |
| ------ | ---------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------- | ---------------- | ---------------- |
| GET    | `/announcements`                                     | `notifications.read`    | Audience-filtered published announcements                                    |
| POST   | `/announcements`                                     | `announcements.publish` | Publish within instructor section or department scope                        |
| GET    | `/reports`                                           | `reports.read`          | Report catalog                                                               |
| GET    | `/reports/{key}`                                     | `reports.read`          | Scope-filtered JSON report                                                   |
| GET    | `/reports/{key}/export?format=PDF                    | XLSX                    | CSV`                                                                         | `reports.export` | Audited download |
| GET    | `/audit?page=&pageSize=&action=&entityType=&result=` | `audit.read`            | Paginated immutable audit entries; department heads are actor-scope filtered |
| GET    | `/settings`                                          | `settings.read`         | Non-secret system settings                                                   |
| PUT    | `/settings/{key}`                                    | `settings.manage`       | Update approved setting with reason                                          |
| GET    | `/academic-policies`                                 | `policies.read`         | Versioned policy records                                                     |
| PUT    | `/academic-policies/{key}`                           | `policies.manage`       | Deactivate current version and create effective policy version               |

## Pagination and validation

`page` starts at 1 and `pageSize` is bounded by the shared pagination DTO. Unknown body fields are rejected. Identifiers in resource paths are UUID v4. Dates use ISO 8601 and class times use `HH:mm:ss`. Database conflicts return a stable 409 code; scope failures return 403.
