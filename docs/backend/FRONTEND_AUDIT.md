# Frontend Audit

## Scope and result

The existing visual structure, responsive shell, role menus, dark administrator theme, and Arabic/English direction switching were preserved. All 46 registered role screens were traced to their data reads, mutations, and authorization requirements. Academic mock arrays were removed from `src/data.ts`; that file now contains navigation and visual configuration only.

## State and data flow

- `StoreProvider` owns authentication state, selected role, language, navigation, registration-cart IDs, modal state, and transient toasts.
- The access token exists only in module memory. The refresh token is an HttpOnly, SameSite=Strict cookie.
- Startup calls the refresh endpoint, then restores the authenticated shell. Login explicitly calls `GET /auth/me` before rendering protected screens.
- TanStack Query owns server state, cache invalidation, loading states, empty states, and request errors.
- API errors use a stable code and request ID; the client retries a failed protected request once after refreshing.

## Screen inventory

| Role                 | Screens                                                                   | Live capabilities                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Student              | dashboard, registration, courses, grades, attendance, transcript, profile | statistics, schedule, announcements, course search/cart/submit, waitlist display, drop, published grades, grade appeal, attendance summary, print/save unofficial transcript, password change |
| Instructor           | dashboard, attendance, grades, classes, schedule, announcements, profile  | assigned sections, roster/session/attendance entry, assessments and scores, grade calculation/submission, schedule, scoped publishing, password change                                        |
| Advisor              | dashboard, advisees, approvals, reports, profile                          | assigned advisee list, registration approve/return/reject, scoped report view/export, password change                                                                                         |
| Registration staff   | dashboard, students, courses, monitoring, reports, profile                | scoped student/section lists, approved-request finalization, reports, password change                                                                                                         |
| Department head      | dashboard, approvals, schedule, staff, reports                            | department grade publish/return, department schedule/staff, scoped reports                                                                                                                    |
| Coordinator          | dashboard, curriculum, progress, students, reports, profile               | program curriculum, program student progress/list, scoped reports, password change                                                                                                            |
| Dean                 | dashboard, analytics, planning, settings                                  | faculty-scoped metrics and staff overview; governance settings are deliberately read-only                                                                                                     |
| University registrar | dashboard, students, terms, reports, profile                              | institution student/term views, scoped reports, password change                                                                                                                               |
| Administrator        | dashboard, users, roles, audit, settings, profile                         | user/audit views, system setting updates, password change; role counts are derived from live users                                                                                            |

## Visible-action audit

Every visible enabled mutation calls a real API endpoint and exposes pending/error feedback. The following controls remain visible but intentionally disabled with a bilingual explanation because their full form, storage, or governance contract is not approved:

- profile edit form;
- syllabus upload;
- registrar/coordinator student creation wizard;
- course and section creation wizard;
- university-registrar term creation wizard;
- administrator user creation and role-assignment wizard;
- immutable audit-log export.

The corresponding backend primitives exist for users, students, courses, terms, sections, roles, profile updates, and policy settings where approved. They are not silently simulated in the UI.

## UX and accessibility notes

- Loading, empty, and error states are consistent through `AsyncState`.
- Destructive or workflow-changing controls are disabled while a mutation is pending.
- Registration, attendance, and grade queries are invalidated after successful mutations.
- The interface preserves responsive tables/cards and document direction on language changes.
- Authentication errors intentionally remain generic. Server validation details are not rendered as trusted HTML.

## Remaining non-blocking UX work

- Add approved create/edit wizards for the disabled administration controls.
- Add an email-backed reset-password landing page.
- Replace browser print-to-PDF for the student transcript with an institution-signed transcript endpoint after the authenticity policy is approved.
- Add WCAG keyboard/screen-reader regression coverage beyond the current semantic labels and roles.
