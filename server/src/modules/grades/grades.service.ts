import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GradeWorkflowStatus, Prisma, RoleKey, StandingCode } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import {
  ABSOLUTE_THRESHOLDS,
  absoluteLetterGrade,
  calculateGpa,
  GradeThresholds,
  GRADE_POINTS,
  RELATIVE_THRESHOLDS,
  relativeScores,
} from './grade-calculation';
import { BulkGradeEntryDto, CreateAssessmentDto, GradeAppealDto } from './dto/grades.dto';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async section(user: AuthenticatedUser, sectionId: string) {
    await this.assertAssigned(user, sectionId);
    return this.prisma.courseSection.findUniqueOrThrow({
      where: { id: sectionId },
      include: {
        course: true,
        term: true,
        assessments: { orderBy: { createdAt: 'asc' }, include: { grades: true } },
        enrollments: {
          where: { status: 'REGISTERED' },
          include: { student: { include: { user: true } }, finalGrade: true },
        },
        gradeSubmissions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  pendingDepartment(user: AuthenticatedUser) {
    const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
    if (!departmentId) throw new ForbiddenException('DEPARTMENT_SCOPE_REQUIRED');
    return this.prisma.gradeSubmission.findMany({
      where: { status: GradeWorkflowStatus.SUBMITTED, section: { course: { departmentId } } },
      include: {
        section: {
          include: {
            course: true,
            instructors: {
              include: {
                instructor: {
                  include: {
                    user: { select: { firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true } },
                  },
                },
              },
            },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async createAssessment(user: AuthenticatedUser, dto: CreateAssessmentDto, requestId?: string) {
    await this.assertAssigned(user, dto.sectionId);
    const total = await this.prisma.assessment.aggregate({
      where: { sectionId: dto.sectionId },
      _sum: { weight: true },
    });
    if (Number(total._sum.weight ?? 0) + dto.weight > 100) throw new ConflictException('ASSESSMENT_WEIGHTS_EXCEED_100');
    return this.prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.create({
        data: {
          ...dto,
          weight: new Prisma.Decimal(dto.weight),
          maxScore: new Prisma.Decimal(dto.maxScore),
          createdBy: user.id,
        },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'ASSESSMENT_CREATED',
          entityType: 'Assessment',
          entityId: assessment.id,
          requestId,
          afterData: assessment,
        },
        tx,
      );
      return assessment;
    });
  }

  async saveAssessmentGrades(
    user: AuthenticatedUser,
    assessmentId: string,
    dto: BulkGradeEntryDto,
    requestId?: string,
  ) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('ASSESSMENT_NOT_FOUND');
    await this.assertAssigned(user, assessment.sectionId);
    const ids = dto.grades.map((entry) => entry.enrollmentId);
    if (new Set(ids).size !== ids.length) throw new ConflictException('DUPLICATE_GRADE_ENTRY');
    if (dto.grades.some((entry) => new Prisma.Decimal(entry.score).gt(assessment.maxScore)))
      throw new ConflictException('SCORE_EXCEEDS_MAXIMUM');
    const enrollments = await this.prisma.enrollment.count({
      where: { id: { in: ids }, sectionId: assessment.sectionId, status: 'REGISTERED' },
    });
    if (enrollments !== ids.length) throw new ConflictException('ROSTER_MISMATCH');
    return this.prisma.$transaction(async (tx) => {
      for (const entry of dto.grades) {
        await tx.assessmentGrade.upsert({
          where: { assessmentId_enrollmentId: { assessmentId, enrollmentId: entry.enrollmentId } },
          create: {
            assessmentId,
            enrollmentId: entry.enrollmentId,
            score: new Prisma.Decimal(entry.score),
            enteredBy: user.id,
          },
          update: { score: new Prisma.Decimal(entry.score), enteredBy: user.id },
        });
      }
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'ASSESSMENT_GRADES_SAVED',
          entityType: 'Assessment',
          entityId: assessmentId,
          requestId,
          afterData: { count: dto.grades.length },
        },
        tx,
      );
      return { assessmentId, saved: dto.grades.length };
    });
  }

  async submit(user: AuthenticatedUser, sectionId: string, requestId?: string) {
    await this.assertAssigned(user, sectionId);
    return this.prisma.$transaction(
      async (tx) => {
        const section = await tx.courseSection.findUniqueOrThrow({
          where: { id: sectionId },
          include: { assessments: { include: { grades: true } }, enrollments: { where: { status: 'REGISTERED' } } },
        });
        const weightTotal = section.assessments.reduce(
          (sum, assessment) => sum.add(assessment.weight),
          new Prisma.Decimal(0),
        );
        if (!weightTotal.eq(100)) throw new ConflictException('ASSESSMENT_WEIGHTS_MUST_TOTAL_100');
        for (const assessment of section.assessments)
          if (assessment.grades.length !== section.enrollments.length)
            throw new ConflictException('INCOMPLETE_GRADE_SHEET');
        const raw = section.enrollments.map((enrollment) => {
          const score = section.assessments.reduce((sum, assessment) => {
            const grade = assessment.grades.find((entry) => entry.enrollmentId === enrollment.id)!;
            return sum.add(grade.score.div(assessment.maxScore).mul(assessment.weight));
          }, new Prisma.Decimal(0));
          return { enrollment, score: score.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP) };
        });
        const gradingPolicy = await tx.gradingPolicy.findFirst({
          where: { model: section.gradingModel, active: true },
          orderBy: { updatedAt: 'desc' },
        });
        if (!gradingPolicy) throw new ConflictException('GRADING_POLICY_MISSING');
        const thresholds = this.thresholds(
          gradingPolicy.thresholds,
          section.gradingModel === 'RELATIVE' ? RELATIVE_THRESHOLDS : ABSOLUTE_THRESHOLDS,
        );
        const absolutePolicy =
          section.gradingModel === 'RELATIVE'
            ? await tx.gradingPolicy.findFirst({
                where: { model: 'ABSOLUTE', active: true },
                orderBy: { updatedAt: 'desc' },
              })
            : gradingPolicy;
        const absoluteThresholds = this.thresholds(absolutePolicy?.thresholds, ABSOLUTE_THRESHOLDS);
        const converted =
          section.gradingModel === 'RELATIVE'
            ? relativeScores(
                raw.map((entry) => entry.score),
                {
                  minPopulation: gradingPolicy.minPopulation ?? 10,
                  failFloor: gradingPolicy.failFloor,
                  relativeThresholds: thresholds,
                  absoluteThresholds,
                },
              )
            : raw.map((entry) => ({
                raw: entry.score,
                tScore: entry.score,
                letter: absoluteLetterGrade(entry.score, thresholds),
              }));
        for (let index = 0; index < raw.length; index += 1) {
          const result = converted[index];
          await tx.finalGrade.upsert({
            where: { enrollmentId: raw[index].enrollment.id },
            create: {
              enrollmentId: raw[index].enrollment.id,
              rawScore: result.raw,
              standardizedScore: result.tScore,
              letterGrade: result.letter,
              gradePoints: GRADE_POINTS[result.letter],
              status: GradeWorkflowStatus.SUBMITTED,
            },
            update: {
              rawScore: result.raw,
              standardizedScore: result.tScore,
              letterGrade: result.letter,
              gradePoints: GRADE_POINTS[result.letter],
              status: GradeWorkflowStatus.SUBMITTED,
            },
          });
        }
        const submission = await tx.gradeSubmission.create({
          data: { sectionId, status: GradeWorkflowStatus.SUBMITTED, submittedBy: user.id, submittedAt: new Date() },
        });
        await this.audit.record(
          {
            actorUserId: user.id,
            actorRole: user.activeRole,
            action: 'GRADES_SUBMITTED',
            entityType: 'GradeSubmission',
            entityId: submission.id,
            requestId,
            afterData: { sectionId, count: raw.length, gradingModel: section.gradingModel },
          },
          tx,
        );
        return submission;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async publish(user: AuthenticatedUser, sectionId: string, requestId?: string) {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        gradeSubmissions: { where: { status: 'SUBMITTED' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!section) throw new NotFoundException('SECTION_NOT_FOUND');
    const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
    if (user.activeRole !== RoleKey.depthead || section.course.departmentId !== departmentId)
      throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
    const submission = section.gradeSubmissions[0];
    if (!submission) throw new ConflictException('GRADE_SUBMISSION_NOT_FOUND');
    return this.prisma.$transaction(
      async (tx) => {
        const now = new Date();
        await tx.finalGrade.updateMany({
          where: { enrollment: { sectionId }, status: 'SUBMITTED' },
          data: { status: 'PUBLISHED', publishedAt: now, effectiveForGpa: true },
        });
        const completed = await tx.enrollment.findMany({
          where: { sectionId, finalGrade: { status: 'PUBLISHED' } },
          select: { id: true, studentId: true },
        });
        await tx.enrollment.updateMany({
          where: { id: { in: completed.map((entry) => entry.id) } },
          data: { status: 'COMPLETED' },
        });
        for (const studentId of new Set(completed.map((entry) => entry.studentId)))
          await this.recalculateStudent(tx, studentId, section.termId);
        const published = await tx.gradeSubmission.update({
          where: { id: submission.id },
          data: { status: 'PUBLISHED', approvedBy: user.id, approvedAt: now, publishedAt: now },
        });
        await this.audit.record(
          {
            actorUserId: user.id,
            actorRole: user.activeRole,
            action: 'GRADES_PUBLISHED',
            entityType: 'GradeSubmission',
            entityId: submission.id,
            requestId,
            afterData: { sectionId },
          },
          tx,
        );
        return published;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async returnSubmission(user: AuthenticatedUser, sectionId: string, reason: string, requestId?: string) {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        gradeSubmissions: { where: { status: 'SUBMITTED' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!section) throw new NotFoundException('SECTION_NOT_FOUND');
    const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
    if (user.activeRole !== RoleKey.depthead || section.course.departmentId !== departmentId)
      throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
    const submission = section.gradeSubmissions[0];
    if (!submission) throw new ConflictException('GRADE_SUBMISSION_NOT_FOUND');
    return this.prisma.$transaction(async (tx) => {
      await tx.finalGrade.updateMany({
        where: { enrollment: { sectionId }, status: 'SUBMITTED' },
        data: { status: 'RETURNED', effectiveForGpa: false },
      });
      const returned = await tx.gradeSubmission.update({
        where: { id: submission.id },
        data: { status: 'RETURNED', returnReason: reason, approvedBy: user.id, approvedAt: new Date() },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'GRADES_RETURNED',
          entityType: 'GradeSubmission',
          entityId: submission.id,
          requestId,
          beforeData: { status: submission.status },
          afterData: { status: returned.status },
          metadata: { reason },
        },
        tx,
      );
      return returned;
    });
  }

  private async recalculateStudent(tx: Prisma.TransactionClient, studentId: string, termId: string) {
    const attempts = await tx.enrollment.findMany({
      where: { studentId, finalGrade: { status: GradeWorkflowStatus.PUBLISHED } },
      include: { finalGrade: true, section: { include: { course: true, term: true } } },
      orderBy: [{ section: { term: { startsOn: 'asc' } } }, { attemptNumber: 'asc' }],
    });
    const lastByCourse = new Map<string, (typeof attempts)[number]>();
    for (const attempt of attempts) lastByCourse.set(attempt.section.courseId, attempt);
    const effective = [...lastByCourse.values()];
    const gpaAttempts = effective.filter(
      (attempt) => attempt.finalGrade?.gradePoints !== null && attempt.finalGrade?.gradePoints !== undefined,
    );
    const cumulativeWeighted = gpaAttempts.reduce(
      (sum, attempt) => sum.add(attempt.finalGrade!.gradePoints!.mul(attempt.section.course.credits)),
      new Prisma.Decimal(0),
    );
    const cumulativeCredits = gpaAttempts.reduce(
      (sum, attempt) => sum.add(attempt.section.course.credits),
      new Prisma.Decimal(0),
    );
    const cumulativeGpa = calculateGpa(cumulativeWeighted, cumulativeCredits);
    const termAttempts = gpaAttempts.filter((attempt) => attempt.section.termId === termId);
    const semesterWeighted = termAttempts.reduce(
      (sum, attempt) => sum.add(attempt.finalGrade!.gradePoints!.mul(attempt.section.course.credits)),
      new Prisma.Decimal(0),
    );
    const semesterCredits = termAttempts.reduce(
      (sum, attempt) => sum.add(attempt.section.course.credits),
      new Prisma.Decimal(0),
    );
    const semesterGpa = calculateGpa(semesterWeighted, semesterCredits);
    const earnedCredits = effective
      .filter((attempt) => attempt.finalGrade?.letterGrade && attempt.finalGrade.letterGrade !== 'F')
      .reduce((sum, attempt) => sum + attempt.section.course.credits, 0);
    const standing = cumulativeGpa.gte(2)
      ? StandingCode.GOOD_STANDING
      : cumulativeGpa.gte(1.5)
        ? StandingCode.WARNING
        : StandingCode.PROBATION;
    await tx.studentProfile.update({
      where: { id: studentId },
      data: { cumulativeGpa, semesterGpa, earnedCredits, standing },
    });
    await tx.academicStandingHistory.upsert({
      where: { studentId_termId: { studentId, termId } },
      create: {
        studentId,
        termId,
        cumulativeGpa,
        semesterGpa,
        standing,
        reason: 'Published grade recalculation (BR-44/BR-45/BR-49)',
      },
      update: { cumulativeGpa, semesterGpa, standing, reason: 'Published grade recalculation (BR-44/BR-45/BR-49)' },
    });
  }

  async transcript(user: AuthenticatedUser, studentId?: string) {
    const target = studentId ?? user.studentProfileId;
    if (!target) throw new ConflictException('STUDENT_REQUIRED');
    await this.assertStudentScope(user, target);
    const student = await this.prisma.studentProfile.findUniqueOrThrow({
      where: { id: target },
      include: {
        user: true,
        program: true,
        enrollments: {
          where: { finalGrade: { status: 'PUBLISHED' } },
          include: { section: { include: { course: true, term: true } }, finalGrade: true },
          orderBy: { section: { term: { startsOn: 'asc' } } },
        },
      },
    });
    const latestByCourse = new Map<string, (typeof student.enrollments)[number]>();
    for (const enrollment of student.enrollments) latestByCourse.set(enrollment.section.courseId, enrollment);
    const effective = [...latestByCourse.values()].filter(
      (entry) => entry.finalGrade?.gradePoints !== null && entry.finalGrade?.gradePoints !== undefined,
    );
    const weighted = effective.reduce(
      (sum, entry) => sum.add(entry.finalGrade!.gradePoints!.mul(entry.section.course.credits)),
      new Prisma.Decimal(0),
    );
    const credits = effective.reduce((sum, entry) => sum.add(entry.section.course.credits), new Prisma.Decimal(0));
    const cumulativeGpa = calculateGpa(weighted, credits);
    const terms = new Map<
      string,
      {
        term: (typeof student.enrollments)[number]['section']['term'];
        courses: Array<{
          finalGradeId: string | null;
          publishedAt: Date | null;
          code: string;
          nameEn: string;
          nameAr: string;
          credits: number;
          letterGrade: string | null;
          gradePoints: Prisma.Decimal | null;
        }>;
        weighted: Prisma.Decimal;
        credits: Prisma.Decimal;
      }
    >();
    for (const enrollment of student.enrollments) {
      const key = enrollment.section.termId;
      const current = terms.get(key) ?? {
        term: enrollment.section.term,
        courses: [],
        weighted: new Prisma.Decimal(0),
        credits: new Prisma.Decimal(0),
      };
      current.courses.push({
        finalGradeId: enrollment.finalGrade?.id ?? null,
        publishedAt: enrollment.finalGrade?.publishedAt ?? null,
        code: enrollment.section.course.code,
        nameEn: enrollment.section.course.nameEn,
        nameAr: enrollment.section.course.nameAr,
        credits: enrollment.section.course.credits,
        letterGrade: enrollment.finalGrade?.letterGrade ?? null,
        gradePoints: enrollment.finalGrade?.gradePoints ?? null,
      });
      if (
        latestByCourse.get(enrollment.section.courseId)?.id === enrollment.id &&
        enrollment.finalGrade?.gradePoints !== null &&
        enrollment.finalGrade?.gradePoints !== undefined
      ) {
        current.weighted = current.weighted.add(
          enrollment.finalGrade.gradePoints.mul(enrollment.section.course.credits),
        );
        current.credits = current.credits.add(enrollment.section.course.credits);
      }
      terms.set(key, current);
    }
    return {
      student: {
        id: student.id,
        universityId: student.universityId,
        nameEn: `${student.user.firstNameEn} ${student.user.lastNameEn}`,
        nameAr: `${student.user.firstNameAr} ${student.user.lastNameAr}`,
        program: student.program,
        standing: student.standing,
        cumulativeGpa,
      },
      terms: [...terms.values()].map((term) => ({
        term: term.term,
        courses: term.courses,
        semesterGpa: calculateGpa(term.weighted, term.credits),
      })),
    };
  }

  async appeal(user: AuthenticatedUser, dto: GradeAppealDto, requestId?: string) {
    if (!user.studentProfileId) throw new ForbiddenException('STUDENT_PROFILE_REQUIRED');
    const finalGrade = await this.prisma.finalGrade.findUnique({
      where: { id: dto.finalGradeId },
      include: { enrollment: { include: { section: { include: { term: true } } } } },
    });
    if (!finalGrade || finalGrade.enrollment.studentId !== user.studentProfileId || finalGrade.status !== 'PUBLISHED')
      throw new NotFoundException('FINAL_GRADE_NOT_FOUND');
    const appealDeadline = finalGrade.enrollment.section.term.appealEndsAt;
    if (!finalGrade.publishedAt || !appealDeadline || new Date() > appealDeadline)
      throw new ConflictException('APPEAL_WINDOW_CLOSED');
    const existingAppeal = await this.prisma.gradeAppeal.findFirst({
      where: { finalGradeId: dto.finalGradeId, studentId: user.studentProfileId, status: { not: 'CANCELLED' } },
    });
    if (existingAppeal) throw new ConflictException('GRADE_APPEAL_ALREADY_EXISTS');
    return this.prisma.$transaction(async (tx) => {
      const appeal = await tx.gradeAppeal.create({
        data: { finalGradeId: dto.finalGradeId, studentId: user.studentProfileId!, reason: dto.reason },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'GRADE_APPEAL_SUBMITTED',
          entityType: 'GradeAppeal',
          entityId: appeal.id,
          requestId,
          afterData: { finalGradeId: dto.finalGradeId, attachmentRef: dto.attachmentRef },
        },
        tx,
      );
      return appeal;
    });
  }

  private async assertAssigned(user: AuthenticatedUser, sectionId: string) {
    if (!user.employeeProfileId) throw new ForbiddenException('EMPLOYEE_PROFILE_REQUIRED');
    const count = await this.prisma.instructorSectionAssignment.count({
      where: { sectionId, instructorId: user.employeeProfileId },
    });
    if (!count) throw new ForbiddenException('SECTION_NOT_ASSIGNED');
  }

  private thresholds(value: Prisma.JsonValue | undefined, fallback: GradeThresholds): GradeThresholds {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
    const candidate = value as Record<string, unknown>;
    const result = { ...fallback };
    for (const letter of Object.keys(result) as Array<keyof GradeThresholds>) {
      if (typeof candidate[letter] === 'number' || typeof candidate[letter] === 'string')
        result[letter] = candidate[letter] as Prisma.Decimal.Value;
    }
    return result;
  }

  private async assertStudentScope(user: AuthenticatedUser, studentId: string) {
    if (user.activeRole === RoleKey.student && user.studentProfileId !== studentId)
      throw new ForbiddenException('STUDENT_SCOPE_DENIED');
    if (user.activeRole === RoleKey.advisor) {
      const assigned = await this.prisma.advisorAssignment.count({
        where: { studentId, advisorId: user.employeeProfileId ?? '__none__', active: true },
      });
      if (!assigned) throw new ForbiddenException('ADVISEE_SCOPE_DENIED');
    }
    if (([RoleKey.coordinator, RoleKey.depthead, RoleKey.dean] as RoleKey[]).includes(user.activeRole)) {
      const student = await this.prisma.studentProfile.findUniqueOrThrow({
        where: { id: studentId },
        select: {
          programId: true,
          program: { select: { departmentId: true, department: { select: { facultyId: true } } } },
        },
      });
      if (
        user.activeRole === RoleKey.coordinator &&
        (user.scopeType !== 'PROGRAM' || student.programId !== user.scopeId)
      )
        throw new ForbiddenException('PROGRAM_SCOPE_DENIED');
      if (
        user.activeRole === RoleKey.depthead &&
        (user.scopeType !== 'DEPARTMENT' || student.program.departmentId !== user.scopeId)
      )
        throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
      if (
        user.activeRole === RoleKey.dean &&
        (user.scopeType !== 'FACULTY' || student.program.department.facultyId !== user.scopeId)
      )
        throw new ForbiddenException('FACULTY_SCOPE_DENIED');
    }
  }
}
