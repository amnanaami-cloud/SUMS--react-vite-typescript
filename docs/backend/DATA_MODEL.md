# Data Model

The Prisma schema is the canonical application model; the committed SQL migration adds database-level checks, indexes, foreign keys, and an append-only audit trigger.

## Identity and access

- `User` stores institutional identifiers, bilingual names, Argon2id hash, lifecycle state, login failure counters, and lock time.
- `Role`, `Permission`, `UserRole`, and `RolePermission` implement active-role RBAC. `UserRole.scopeType/scopeId` carries program, department, or faculty scope.
- `UserSession` is the revocable server-side session. `RefreshToken` stores only SHA-256 token hashes and family/replacement links.
- `PasswordResetToken` stores only a hash, expiry, and consumption time. `LoginAttempt` provides security evidence.

## Organization and people

`Faculty → Department → AcademicProgram` is the organizational hierarchy. `StudentProfile` and `EmployeeProfile` extend `User`; `AdvisorAssignment`, status history, and standing history retain time-bounded academic relationships.

University IDs are 10 digits: gender prefix + four-digit admission year + five-digit sequence. The migration enforces format checks and uniqueness.

## Academic catalog

`AcademicYear → AcademicTerm`; `Course`, prerequisite/corequisite relations, versioned `Curriculum` and `CurriculumCourse`; `CourseSection`, `SectionMeeting`, `Room`, and `InstructorSectionAssignment` model offerings and timetables.

## Registration

`RegistrationHold`, `RegistrationRequest`, and `RegistrationItem` capture requested work and decisions. `ApprovalDecision` is an immutable decision history. `Enrollment` is the authoritative student/section relationship; `WaitlistEntry` provides section-local FIFO ordering. `AddDropRequest` records controlled post-registration changes.

Critical uniqueness includes one registration request per student/term, one registration item per request/section, one enrollment per student/section, and one waitlist row per enrollment.

## Attendance

`AttendanceSession` identifies a class occurrence, `AttendanceRecord` identifies one student's mark, and `AttendanceAdjustment` records a reasoned correction workflow. The section/session/student uniqueness keys prevent duplicate records.

## Grades

`GradingPolicy` versions absolute/relative thresholds. `Assessment` and `AssessmentGrade` hold instructor input. `GradeSubmission` is the submit/review workflow; `FinalGrade` is the one authoritative result per enrollment. `GradeChangeRequest` and `GradeAppeal` preserve correction/appeal history.

Raw and GPA values use PostgreSQL numeric/Prisma Decimal. GPA is calculated with exact decimal arithmetic and truncated to two decimal places.

## Communication, evidence, and documents

`Announcement` plus audiences supports all/role/faculty/department/program/section targeting. `SystemNotification` is user-specific delivery state. `AuditLog` is append-only. `ReportExport`, `TranscriptIssue`, and `DegreeProgressSnapshot` retain issuance/evidence metadata.

## Policy and configuration

`AcademicPolicy` is versioned, optionally term-specific, effective-dated, and linked to a baseline source reference. `SystemSetting` holds non-secret runtime-visible configuration. Secrets never belong in either table.

## Deletion and retention

Academic and audit history should be status-transitioned, not physically deleted. Production retention durations require institutional approval. Hard deletion of identity/academic records is intentionally not exposed by the API.
