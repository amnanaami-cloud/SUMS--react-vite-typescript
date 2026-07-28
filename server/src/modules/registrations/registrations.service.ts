import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalOutcome,
  EnrollmentStatus,
  Prisma,
  RegistrationStatus,
  RoleKey,
  StudentStatus,
  TermStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { DropEnrollmentDto, RegistrationDecisionDto, SubmitRegistrationDto } from './dto/registrations.dto';
import {
  evaluateRegistrationLoad,
  parsePolicyObject,
  RegularLoadPolicy,
  SummerLoadPolicy,
} from './registration-policy';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  mine(user: AuthenticatedUser) {
    if (!user.studentProfileId) throw new ForbiddenException('STUDENT_PROFILE_REQUIRED');
    return this.prisma.registrationRequest.findMany({
      where: { studentId: user.studentProfileId },
      include: {
        term: true,
        items: { include: { section: { include: { course: true, meetings: { include: { room: true } } } } } },
        decisions: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pending(user: AuthenticatedUser) {
    const where: Prisma.RegistrationRequestWhereInput = {
      status: { in: [RegistrationStatus.PENDING_ADVISOR, RegistrationStatus.APPROVED] },
    };
    if (user.activeRole === RoleKey.advisor)
      where.student = {
        advisorAssignments: { some: { advisorId: user.employeeProfileId ?? '__none__', active: true } },
      };
    if (user.activeRole === RoleKey.depthead) {
      const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
      where.student = { program: { departmentId: departmentId ?? '__none__' } };
    }
    return this.prisma.registrationRequest.findMany({
      where,
      include: {
        student: { include: { user: true, program: true } },
        term: true,
        items: { include: { section: { include: { course: true } } } },
        decisions: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async submit(user: AuthenticatedUser, dto: SubmitRegistrationDto, requestId?: string) {
    if (!user.studentProfileId) throw new ForbiddenException('STUDENT_PROFILE_REQUIRED');
    const sectionIds = [...new Set(dto.sectionIds)];
    if (sectionIds.length !== dto.sectionIds.length) throw new BadRequestException('DUPLICATE_SECTION');
    return this.prisma.$transaction(
      async (tx) => {
        const validation = await this.validate(tx, user.studentProfileId!, dto.termId, sectionIds);
        const existing = await tx.registrationRequest.findUnique({
          where: { studentId_termId: { studentId: user.studentProfileId!, termId: dto.termId } },
        });
        const editableStatuses: RegistrationStatus[] = [
          RegistrationStatus.DRAFT,
          RegistrationStatus.RETURNED,
          RegistrationStatus.REJECTED,
        ];
        if (existing && !editableStatuses.includes(existing.status)) {
          throw new ConflictException('REGISTRATION_ALREADY_SUBMITTED');
        }
        const registration = existing
          ? await tx.registrationRequest.update({
              where: { id: existing.id },
              data: {
                status: RegistrationStatus.PENDING_ADVISOR,
                totalCredits: validation.totalCredits,
                submittedAt: new Date(),
                version: { increment: 1 },
                items: {
                  deleteMany: {},
                  create: sectionIds.map((sectionId) => ({
                    sectionId,
                    validation: validation.bySection[sectionId] as Prisma.InputJsonValue,
                  })),
                },
              },
              include: { items: true },
            })
          : await tx.registrationRequest.create({
              data: {
                studentId: user.studentProfileId!,
                termId: dto.termId,
                status: RegistrationStatus.PENDING_ADVISOR,
                totalCredits: validation.totalCredits,
                submittedAt: new Date(),
                items: {
                  create: sectionIds.map((sectionId) => ({
                    sectionId,
                    validation: validation.bySection[sectionId] as Prisma.InputJsonValue,
                  })),
                },
              },
              include: { items: true },
            });
        await this.audit.record(
          {
            actorUserId: user.id,
            actorRole: user.activeRole,
            action: 'REGISTRATION_SUBMITTED',
            entityType: 'RegistrationRequest',
            entityId: registration.id,
            requestId,
            afterData: { termId: dto.termId, sectionIds, totalCredits: validation.totalCredits },
          },
          tx,
        );
        return registration;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async decide(user: AuthenticatedUser, id: string, dto: RegistrationDecisionDto, requestId?: string) {
    if (
      ![
        ApprovalOutcome.APPROVED,
        ApprovalOutcome.REJECTED,
        ApprovalOutcome.RETURNED,
        ApprovalOutcome.ESCALATED,
      ].includes(dto.outcome)
    )
      throw new BadRequestException('INVALID_DECISION');
    return this.prisma.$transaction(
      async (tx) => {
        const request = await tx.registrationRequest.findUnique({
          where: { id },
          include: { student: { include: { advisorAssignments: true } }, items: true },
        });
        if (!request) throw new NotFoundException('REGISTRATION_NOT_FOUND');
        if (request.status !== RegistrationStatus.PENDING_ADVISOR)
          throw new ConflictException('REGISTRATION_NOT_PENDING');
        if (
          user.activeRole === RoleKey.advisor &&
          !request.student.advisorAssignments.some(
            (assignment) => assignment.active && assignment.advisorId === user.employeeProfileId,
          )
        )
          throw new ForbiddenException('ADVISEE_SCOPE_DENIED');
        if (user.activeRole === RoleKey.depthead) {
          const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
          const student = await tx.studentProfile.findUniqueOrThrow({
            where: { id: request.studentId },
            select: { program: { select: { departmentId: true } } },
          });
          if (!departmentId || student.program.departmentId !== departmentId)
            throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
        }
        const nextStatus =
          dto.outcome === ApprovalOutcome.APPROVED
            ? RegistrationStatus.APPROVED
            : dto.outcome === ApprovalOutcome.REJECTED
              ? RegistrationStatus.REJECTED
              : RegistrationStatus.RETURNED;
        const updated = await tx.registrationRequest.update({
          where: { id },
          data: { status: nextStatus, version: { increment: 1 } },
        });
        await tx.approvalDecision.create({
          data: {
            registrationRequestId: id,
            actorUserId: user.id,
            actorRole: user.activeRole,
            outcome: dto.outcome,
            reason: dto.reason,
          },
        });
        await this.audit.record(
          {
            actorUserId: user.id,
            actorRole: user.activeRole,
            action: `REGISTRATION_${dto.outcome}`,
            entityType: 'RegistrationRequest',
            entityId: id,
            requestId,
            beforeData: { status: request.status },
            afterData: { status: nextStatus },
            metadata: { reason: dto.reason },
          },
          tx,
        );
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async finalize(user: AuthenticatedUser, id: string, requestId?: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const request = await tx.registrationRequest.findUnique({ where: { id }, include: { items: true } });
        if (!request) throw new NotFoundException('REGISTRATION_NOT_FOUND');
        if (request.status !== RegistrationStatus.APPROVED) throw new ConflictException('REGISTRATION_NOT_APPROVED');
        const orderedItems = [...request.items].sort((a, b) => a.sectionId.localeCompare(b.sectionId));
        for (const item of orderedItems) {
          await tx.$queryRaw`SELECT "id" FROM "CourseSection" WHERE "id" = ${item.sectionId}::uuid FOR UPDATE`;
        }
        await this.validate(
          tx,
          request.studentId,
          request.termId,
          orderedItems.map((item) => item.sectionId),
        );
        let registeredCount = 0;
        let waitlistedCount = 0;
        for (const item of orderedItems) {
          const updated = await tx.$executeRaw`
          UPDATE "CourseSection"
          SET "enrolledCount" = "enrolledCount" + 1, "updatedAt" = NOW(), "version" = "version" + 1
          WHERE "id" = ${item.sectionId}::uuid
            AND "status" = 'OPEN'::"SectionStatus"
            AND "enrolledCount" < "capacity"
        `;
          if (updated === 1) {
            await tx.enrollment.create({
              data: { studentId: request.studentId, sectionId: item.sectionId, status: EnrollmentStatus.REGISTERED },
            });
            await tx.registrationItem.update({ where: { id: item.id }, data: { status: 'REGISTERED' } });
            registeredCount += 1;
          } else {
            const last = await tx.waitlistEntry.aggregate({
              where: { sectionId: item.sectionId, removedAt: null },
              _max: { position: true },
            });
            await tx.enrollment.create({
              data: { studentId: request.studentId, sectionId: item.sectionId, status: EnrollmentStatus.WAITLISTED },
            });
            await tx.waitlistEntry.create({
              data: {
                studentId: request.studentId,
                sectionId: item.sectionId,
                position: (last._max.position ?? 0) + 1,
              },
            });
            await tx.registrationItem.update({ where: { id: item.id }, data: { status: 'WAITLISTED' } });
            waitlistedCount += 1;
          }
        }
        const finalized = await tx.registrationRequest.update({
          where: { id },
          data: { status: RegistrationStatus.FINALIZED, finalizedAt: new Date(), version: { increment: 1 } },
        });
        await this.audit.record(
          {
            actorUserId: user.id,
            actorRole: user.activeRole,
            action: 'REGISTRATION_FINALIZED',
            entityType: 'RegistrationRequest',
            entityId: id,
            requestId,
            afterData: { registeredCount, waitlistedCount },
          },
          tx,
        );
        return finalized;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async drop(user: AuthenticatedUser, enrollmentId: string, dto: DropEnrollmentDto, requestId?: string) {
    if (!user.studentProfileId) throw new ForbiddenException('STUDENT_PROFILE_REQUIRED');
    return this.prisma.$transaction(
      async (tx) => {
        const enrollment = await tx.enrollment.findUnique({
          where: { id: enrollmentId },
          include: { section: { include: { term: true } } },
        });
        if (!enrollment || enrollment.studentId !== user.studentProfileId)
          throw new NotFoundException('ENROLLMENT_NOT_FOUND');
        if (enrollment.status !== EnrollmentStatus.REGISTERED) throw new ConflictException('ENROLLMENT_NOT_ACTIVE');
        const now = new Date();
        if (now > enrollment.section.term.withdrawalEndsAt) throw new ConflictException('WITHDRAWAL_WINDOW_CLOSED');
        const duringAddDrop = now <= enrollment.section.term.addDropEndsAt;
        await tx.$queryRaw`SELECT "id" FROM "CourseSection" WHERE "id" = ${enrollment.sectionId}::uuid FOR UPDATE`;
        const status = duringAddDrop ? EnrollmentStatus.DROPPED : EnrollmentStatus.WITHDRAWN;
        const updated = await tx.enrollment.update({
          where: { id: enrollmentId },
          data: {
            status,
            droppedAt: duringAddDrop ? now : undefined,
            withdrawalAt: duringAddDrop ? undefined : now,
            version: { increment: 1 },
          },
        });
        await tx.courseSection.update({
          where: { id: enrollment.sectionId },
          data: { enrolledCount: { decrement: 1 }, version: { increment: 1 } },
        });
        await tx.addDropRequest.create({
          data: {
            studentId: user.studentProfileId!,
            enrollmentId,
            action: duringAddDrop ? 'DROP' : 'WITHDRAW',
            reason: dto.reason,
            status: 'APPROVED',
            decidedAt: now,
          },
        });
        await this.audit.record(
          {
            actorUserId: user.id,
            actorRole: user.activeRole,
            action: duringAddDrop ? 'ENROLLMENT_DROPPED' : 'ENROLLMENT_WITHDRAWN',
            entityType: 'Enrollment',
            entityId: enrollmentId,
            requestId,
            beforeData: { status: enrollment.status },
            afterData: { status },
            metadata: { reason: dto.reason },
          },
          tx,
        );
        if (duringAddDrop) await this.promoteFirstEligible(tx, enrollment.sectionId, user, requestId);
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async promoteFirstEligible(
    tx: Prisma.TransactionClient,
    sectionId: string,
    actor: AuthenticatedUser,
    requestId?: string,
  ) {
    const section = await tx.courseSection.findUniqueOrThrow({
      where: { id: sectionId },
      include: { course: { include: { prerequisites: true } }, term: true, meetings: true },
    });
    const candidates = await tx.waitlistEntry.findMany({
      where: { sectionId, promotedAt: null, removedAt: null },
      include: {
        student: {
          include: {
            holds: { where: { active: true } },
            program: true,
            enrollments: {
              where: { status: { in: [EnrollmentStatus.REGISTERED, EnrollmentStatus.COMPLETED] } },
              include: { section: { include: { course: true, meetings: true, term: true } }, finalGrade: true },
            },
          },
        },
      },
      orderBy: [{ position: 'asc' }, { joinedAt: 'asc' }],
    });
    const policyKeys = ['registration.regular_load', 'registration.summer_load', 'registration.repeat'];
    const policies = await tx.academicPolicy.findMany({
      where: { key: { in: policyKeys }, active: true, OR: [{ termId: section.termId }, { termId: null }] },
      orderBy: [{ termId: 'desc' }, { version: 'desc' }],
    });
    const policy = (key: string) =>
      policies.find((entry) => entry.key === key && entry.termId === section.termId) ??
      policies.find((entry) => entry.key === key);
    const regularPolicy = policy('registration.regular_load');
    const summerPolicy = policy('registration.summer_load');
    if (!regularPolicy || !summerPolicy) throw new ConflictException('ACADEMIC_POLICY_MISSING');
    let regular: RegularLoadPolicy;
    let summer: SummerLoadPolicy;
    try {
      regular = parsePolicyObject<RegularLoadPolicy>(regularPolicy.value, [
        'minimum',
        'standardMaximum',
        'highGpaMaximum',
        'highGpaThreshold',
        'warningProbationMaximum',
      ]);
      summer = parsePolicyObject<SummerLoadPolicy>(summerPolicy.value, ['maximum', 'probationMaximum']);
    } catch {
      throw new ConflictException('ACADEMIC_POLICY_INVALID');
    }
    const repeatValue = policy('registration.repeat')?.value;
    const maxAttempts =
      repeatValue &&
      typeof repeatValue === 'object' &&
      !Array.isArray(repeatValue) &&
      typeof (repeatValue as Record<string, unknown>).maxAttempts === 'number'
        ? Number((repeatValue as Record<string, unknown>).maxAttempts)
        : 3;
    const gradeRank: Record<string, number> = {
      F: 0,
      D: 1,
      'D+': 2,
      'C-': 3,
      C: 4,
      'C+': 5,
      'B-': 6,
      B: 7,
      'B+': 8,
      'A-': 9,
      A: 10,
    };

    for (const candidate of candidates) {
      const student = candidate.student;
      if (student.status !== StudentStatus.ACTIVE || student.holds.length) continue;
      if (
        student.enrollments.some(
          (item) => item.status === EnrollmentStatus.REGISTERED && item.section.courseId === section.courseId,
        )
      )
        continue;
      const completed = student.enrollments.filter((item) => item.status === EnrollmentStatus.COMPLETED);
      const completedByCourse = new Map(
        completed
          .filter((item) => item.finalGrade?.letterGrade)
          .map((item) => [item.section.courseId, item.finalGrade!.letterGrade!]),
      );
      const prerequisitesMet = section.course.prerequisites
        .filter((item) => !item.isCorequisite)
        .every((item) => gradeRank[completedByCourse.get(item.prerequisiteId) ?? 'F'] >= gradeRank[item.minimumGrade]);
      const corequisitesMet = section.course.prerequisites
        .filter((item) => item.isCorequisite)
        .every(
          (item) =>
            completedByCourse.has(item.prerequisiteId) ||
            student.enrollments.some(
              (enrollment) =>
                enrollment.status === EnrollmentStatus.REGISTERED &&
                enrollment.section.termId === section.termId &&
                enrollment.section.courseId === item.prerequisiteId,
            ),
        );
      if (!prerequisitesMet || !corequisitesMet) continue;
      if (completed.filter((item) => item.section.courseId === section.courseId).length >= maxAttempts) continue;
      const currentTerm = student.enrollments.filter(
        (item) => item.status === EnrollmentStatus.REGISTERED && item.section.termId === section.termId,
      );
      const conflicts = currentTerm.some((item) =>
        item.section.meetings.some((existingMeeting) =>
          section.meetings.some(
            (targetMeeting) =>
              existingMeeting.dayOfWeek === targetMeeting.dayOfWeek &&
              existingMeeting.startsAt < targetMeeting.endsAt &&
              targetMeeting.startsAt < existingMeeting.endsAt,
          ),
        ),
      );
      if (conflicts) continue;
      const currentCredits = currentTerm.reduce((sum, item) => sum + item.section.course.credits, 0);
      const finalTerm =
        student.earnedCredits + currentCredits + section.course.credits >= student.program.requiredCredits;
      try {
        evaluateRegistrationLoad({
          termType: section.term.type,
          standing: student.standing,
          cumulativeGpa: student.cumulativeGpa ?? new Prisma.Decimal(0),
          currentRegisteredCredits: currentCredits,
          requestedCredits: section.course.credits,
          waitlistedCredits: 0,
          finalTerm,
          regular,
          summer,
        });
      } catch {
        continue;
      }

      const promotedAt = new Date();
      const promoted = await tx.enrollment.updateMany({
        where: { studentId: candidate.studentId, sectionId, status: EnrollmentStatus.WAITLISTED },
        data: { status: EnrollmentStatus.REGISTERED, registeredAt: promotedAt, version: { increment: 1 } },
      });
      if (promoted.count !== 1) continue;
      await tx.waitlistEntry.update({ where: { id: candidate.id }, data: { promotedAt } });
      await tx.courseSection.update({
        where: { id: sectionId },
        data: { enrolledCount: { increment: 1 }, version: { increment: 1 } },
      });
      await tx.registrationItem.updateMany({
        where: { sectionId, request: { studentId: candidate.studentId, termId: section.termId }, status: 'WAITLISTED' },
        data: { status: 'REGISTERED' },
      });
      await this.audit.record(
        {
          actorUserId: actor.id,
          actorRole: actor.activeRole,
          action: 'WAITLIST_PROMOTED',
          entityType: 'Enrollment',
          requestId,
          metadata: { studentId: candidate.studentId, sectionId, position: candidate.position },
        },
        tx,
      );
      return;
    }
  }

  private async validate(tx: Prisma.TransactionClient, studentId: string, termId: string, sectionIds: string[]) {
    const policyKeys = ['registration.regular_load', 'registration.summer_load', 'registration.repeat'];
    const [student, term, sections, existing, policies] = await Promise.all([
      tx.studentProfile.findUnique({
        where: { id: studentId },
        include: { holds: { where: { active: true } }, program: true },
      }),
      tx.academicTerm.findUnique({ where: { id: termId } }),
      tx.courseSection.findMany({
        where: { id: { in: sectionIds } },
        include: { course: { include: { prerequisites: true } }, meetings: true },
      }),
      tx.enrollment.findMany({
        where: { studentId, status: { in: [EnrollmentStatus.REGISTERED, EnrollmentStatus.COMPLETED] } },
        include: { section: { include: { course: true, meetings: true, term: true } }, finalGrade: true },
      }),
      tx.academicPolicy.findMany({
        where: { key: { in: policyKeys }, active: true, OR: [{ termId }, { termId: null }] },
        orderBy: [{ termId: 'desc' }, { version: 'desc' }],
      }),
    ]);
    if (!student) throw new NotFoundException('STUDENT_NOT_FOUND');
    if (student.status !== StudentStatus.ACTIVE) throw new ConflictException('STUDENT_NOT_ACTIVE');
    if (student.holds.length) throw new ConflictException('REGISTRATION_HOLD');
    if (!term) throw new NotFoundException('TERM_NOT_FOUND');
    const now = new Date();
    if (
      term.status !== TermStatus.REGISTRATION_OPEN ||
      now < term.registrationStartsAt ||
      now > term.registrationEndsAt
    )
      throw new ConflictException('REGISTRATION_WINDOW_CLOSED');
    if (
      sections.length !== sectionIds.length ||
      sections.some((section) => section.termId !== termId || section.status !== 'OPEN')
    )
      throw new ConflictException('SECTION_NOT_AVAILABLE');
    const selectedCourseIds = sections.map((section) => section.courseId);
    if (new Set(selectedCourseIds).size !== selectedCourseIds.length) throw new ConflictException('DUPLICATE_COURSE');
    if (
      existing.some(
        (enrollment) =>
          selectedCourseIds.includes(enrollment.section.courseId) && enrollment.status === EnrollmentStatus.REGISTERED,
      )
    )
      throw new ConflictException('COURSE_ALREADY_ENROLLED');

    const policy = (key: string) =>
      policies.find((entry) => entry.key === key && entry.termId === termId) ??
      policies.find((entry) => entry.key === key);
    const regularPolicy = policy('registration.regular_load');
    const summerPolicy = policy('registration.summer_load');
    if (!regularPolicy || !summerPolicy) throw new ConflictException('ACADEMIC_POLICY_MISSING');
    let regular: RegularLoadPolicy;
    let summer: SummerLoadPolicy;
    try {
      regular = parsePolicyObject<RegularLoadPolicy>(regularPolicy.value, [
        'minimum',
        'standardMaximum',
        'highGpaMaximum',
        'highGpaThreshold',
        'warningProbationMaximum',
      ]);
      summer = parsePolicyObject<SummerLoadPolicy>(summerPolicy.value, ['maximum', 'probationMaximum']);
    } catch {
      throw new ConflictException('ACADEMIC_POLICY_INVALID');
    }
    const repeatPolicyValue = policy('registration.repeat')?.value;
    const repeatPolicy =
      repeatPolicyValue && typeof repeatPolicyValue === 'object' && !Array.isArray(repeatPolicyValue)
        ? (repeatPolicyValue as { maxAttempts?: number })
        : {};
    const maxAttempts = typeof repeatPolicy.maxAttempts === 'number' ? repeatPolicy.maxAttempts : 3;
    const completedByCourse = new Map(
      existing
        .filter((item) => item.status === EnrollmentStatus.COMPLETED && item.finalGrade?.letterGrade)
        .map((item) => [item.section.courseId, item.finalGrade!.letterGrade!]),
    );
    const gradeRank: Record<string, number> = {
      F: 0,
      D: 1,
      'D+': 2,
      'C-': 3,
      C: 4,
      'C+': 5,
      'B-': 6,
      B: 7,
      'B+': 8,
      'A-': 9,
      A: 10,
    };
    const bySection: Record<string, { prerequisites: boolean; capacity: boolean; conflicts: boolean }> = {};
    for (const section of sections) {
      const prerequisites = section.course.prerequisites
        .filter((item) => !item.isCorequisite)
        .every(
          (prerequisite) =>
            gradeRank[completedByCourse.get(prerequisite.prerequisiteId) ?? 'F'] >=
            gradeRank[prerequisite.minimumGrade],
        );
      if (!prerequisites) throw new ConflictException(`PREREQUISITE_NOT_MET:${section.course.code}`);
      const corequisites = section.course.prerequisites
        .filter((item) => item.isCorequisite)
        .every(
          (corequisite) =>
            completedByCourse.has(corequisite.prerequisiteId) ||
            selectedCourseIds.includes(corequisite.prerequisiteId) ||
            existing.some(
              (item) =>
                item.status === EnrollmentStatus.REGISTERED &&
                item.section.termId === termId &&
                item.section.courseId === corequisite.prerequisiteId,
            ),
        );
      if (!corequisites) throw new ConflictException(`COREQUISITE_NOT_MET:${section.course.code}`);
      const attempts = existing.filter(
        (item) => item.section.courseId === section.courseId && item.status === EnrollmentStatus.COMPLETED,
      ).length;
      if (attempts >= maxAttempts) throw new ConflictException(`REPEAT_LIMIT_EXCEEDED:${section.course.code}`);
      bySection[section.id] = {
        prerequisites: true,
        capacity: section.enrolledCount < section.capacity,
        conflicts: false,
      };
    }
    const meetings = [
      ...sections.flatMap((section) => section.meetings),
      ...existing
        .filter((item) => item.status === EnrollmentStatus.REGISTERED && item.section.termId === termId)
        .flatMap((item) => item.section.meetings),
    ];
    for (let i = 0; i < meetings.length; i += 1) {
      for (let j = i + 1; j < meetings.length; j += 1) {
        const a = meetings[i];
        const b = meetings[j];
        if (
          a.sectionId !== b.sectionId &&
          a.dayOfWeek === b.dayOfWeek &&
          a.startsAt < b.endsAt &&
          b.startsAt < a.endsAt
        )
          throw new ConflictException('SCHEDULE_CONFLICT');
      }
    }
    const totalCredits = sections.reduce((sum, section) => sum + section.course.credits, 0);
    const waitlistedCredits = sections
      .filter((section) => section.enrolledCount >= section.capacity)
      .reduce((sum, section) => sum + section.course.credits, 0);
    const currentRegisteredCredits = existing
      .filter((item) => item.status === EnrollmentStatus.REGISTERED && item.section.termId === termId)
      .reduce((sum, item) => sum + item.section.course.credits, 0);
    const finalTerm =
      student.earnedCredits + currentRegisteredCredits + totalCredits >= student.program.requiredCredits;
    try {
      evaluateRegistrationLoad({
        termType: term.type,
        standing: student.standing,
        cumulativeGpa: student.cumulativeGpa ?? new Prisma.Decimal(0),
        currentRegisteredCredits,
        requestedCredits: totalCredits,
        waitlistedCredits,
        finalTerm,
        regular,
        summer,
      });
    } catch (error) {
      throw new ConflictException(error instanceof Error ? error.message : 'ACADEMIC_POLICY_INVALID');
    }
    return { totalCredits, bySection };
  }
}
