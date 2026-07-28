# Assumptions and Open Questions

## Baseline interpretation

The approved Course Knowledge, Scope/Elicitation, and SRS PDFs in `docs/baseline/` are authoritative. The implementation uses the SRS business-rule and decision identifiers in policy `sourceRef` fields. Where the PDFs specify a rule but not an operational interface, the rule is implemented in the service/database and the unapproved UI is disabled.

## Recorded assumptions

- The active registration term is an explicit request input and must be `REGISTRATION_OPEN` and inside its configured window.
- A student is considered in the final term when earned credits plus current and requested credits reach the program requirement. That removes the regular minimum but never raises the maximum.
- Waitlisted credits do not count toward the maximum because they are not registered credits; they do count when deciding whether an otherwise valid request meets the regular-semester minimum.
- A section that is full can be requested. Finalization atomically creates a `WAITLISTED` enrollment and FIFO entry. A drop during add/drop promotes the first currently eligible candidate after rechecking state, holds, prerequisites/corequisites, attempts, conflicts, and load.
- Waitlist promotion is not performed for a withdrawal after add/drop; this avoids late roster changes without an approved exception workflow.
- Prerequisite minimum grade is C and cannot be overridden. Corequisites must be completed, already registered in the same term, or included in the request.
- Repeat attempts default to three through `registration.repeat`; the value is versioned and may be changed only by the university registrar policy workflow.
- GPA is based only on effective final grades and uses Decimal arithmetic, a 4.0 scale, and truncation to two places (`DEC-156`).
- Relative grading uses the population standard deviation, minimum population 10, raw-score floor 45, T-score thresholds from the grading policy, and absolute fallback for small or zero-variance populations.
- Three late marks equal one effective absence; attendance threshold is 75%; normal instructor edits are allowed for seven days. All are effective-policy values.
- Department-head audit visibility is conservatively restricted to events whose actor belongs to the department. Entity-based cross-department derivation is not inferred from opaque audit payloads.
- Generated report PDFs and browser-printed transcripts are unofficial. Official numbering, signature, QR verification, and revocation require an approved issuance policy.
- The nine English role keys are stable API/database identifiers; bilingual display names are content.
- Seed identities and academic records are fictional development/test data only.

## Open institutional decisions

1. Official transcript signing, verification URL/QR scheme, issuer authority, fees, and revocation rules.
2. Notification delivery channels, templates, localization approval, retry policy, and retention.
3. Password reset mail/SMS provider and public reset-page URL.
4. MFA/SSO/identity-provider requirements and recovery policy.
5. Exact data retention, archival, legal-hold, privacy-export, and deletion rules.
6. Two-person approval for privileged role changes and policy changes.
7. Waitlist expiry, student notification/acceptance window, and behavior after add/drop.
8. Rules for incomplete, pass/fail, withdrawn, repeated, transfer, and forgiven grades in GPA/transcript calculations beyond the current enumerated model.
9. Accessibility certification target and supported browser/device matrix.
10. Production scale/SLA/RPO/RTO targets, which determine queueing, replicas, and backup topology.

These are documented as gaps rather than invented defaults. None should be enabled through a cosmetic UI control before an approved rule and acceptance test exist.
