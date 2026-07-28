# RBAC Matrix

RBAC is deny-by-default. The active role is fixed in the server-side session; a client may request only a role already assigned to the user. Endpoint permission and resource scope must both pass.

Legend: O = own record, A = assigned students/sections, P = program, D = department, F = faculty, I = institution, — = denied.

| Capability                     | Student | Instructor | Advisor | Reg. staff | Dept. head | Coordinator | Dean | Uni registrar | Admin       |
| ------------------------------ | ------- | ---------- | ------- | ---------- | ---------- | ----------- | ---- | ------------- | ----------- |
| Dashboard                      | O       | A          | A       | I          | D          | P           | F    | I             | I           |
| Profile read/update            | O       | O          | O       | O          | —          | O           | —    | O             | O           |
| Courses/schedule read          | O       | A          | Read    | I          | D          | Read        | —    | I             | —           |
| Course/section manage          | —       | —          | —       | I          | D          | —           | —    | I             | —           |
| Terms read/manage              | —       | —          | —       | I/I        | D/—        | —           | F/—  | I/I           | —           |
| Students read/manage           | —       | —          | A/—     | I/I        | D/—        | P/—         | —    | I/I           | —           |
| Registration own submit        | O       | —          | —       | —          | —          | —           | —    | —             | —           |
| Registration review            | —       | —          | A       | I          | D          | —           | —    | I             | —           |
| Registration finalize          | —       | —          | —       | I          | —          | —           | —    | I             | —           |
| Attendance read                | O       | A          | A       | I          | D          | —           | —    | I             | —           |
| Attendance entry               | —       | A          | —       | —          | —          | —           | —    | —             | —           |
| Attendance correction approval | —       | —          | —       | —          | D          | —           | —    | —             | —           |
| Grade entry/submission         | —       | A          | —       | —          | —          | —           | —    | —             | —           |
| Grade publish/return           | —       | —          | —       | —          | D          | —           | —    | —             | —           |
| Transcript/progress            | O       | —          | A       | I          | D          | P           | —    | I             | —           |
| Grade appeal                   | O       | —          | —       | —          | —          | —           | —    | —             | —           |
| Curriculum read                | —       | —          | —       | —          | D          | P           | —    | I             | —           |
| Staff read                     | —       | —          | —       | —          | D          | —           | F    | —             | —           |
| Reports/export                 | —       | A          | A       | I          | D          | P           | F    | I             | —           |
| Announcement read              | O       | A          | A       | I          | D          | P           | F    | I             | I           |
| Announcement publish           | —       | A sections | —       | —          | D          | —           | —    | —             | —           |
| Users/status manage            | —       | —          | —       | —          | —          | —           | —    | —             | I           |
| Roles manage                   | —       | —          | —       | —          | —          | —           | —    | —             | I, not self |
| Audit read                     | —       | —          | —       | —          | D actors   | —           | —    | I             | I           |
| System settings                | —       | —          | —       | —          | —          | —           | —    | —             | I           |
| Academic policies              | —       | —          | —       | —          | —          | —           | —    | I read/manage | Read only   |

## Scope rules

- Students cannot supply another student ID to transcript, attendance, progress, registration, or appeal workflows.
- Instructors must have an active `InstructorSectionAssignment` for every roster, attendance, assessment, score, and submission operation.
- Advisors must have an active `AdvisorAssignment` for target students.
- Coordinators, department heads, and deans must match the target program/department/faculty carried by their `UserRole` scope.
- Department heads can publish or return grades only for sections owned by their department.
- Announcement targets are independently checked: instructors can target assigned sections; department heads can target their department or its sections.
- Reports reconstruct the scope on the server and never trust client-provided scope filters.
- Administrators cannot replace their own roles. Administrative account creation cannot bypass the atomic student-profile workflow.

The executable permission grants are in `server/prisma/seed.ts`; route annotations are in each module controller. Changes require an approved access-control review and a new audit-visible assignment reason.
