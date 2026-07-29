import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalOutcome, AttendanceSessionStatus, Prisma, RoleKey } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import {
  BulkAttendanceDto,
  CreateAttendanceSessionDto,
  DecideAttendanceAdjustmentDto,
  RequestAttendanceAdjustmentDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async sections(user: AuthenticatedUser) {
    if (!user.employeeProfileId) throw new ForbiddenException('EMPLOYEE_PROFILE_REQUIRED');
    return this.prisma.instructorSectionAssignment.findMany({
      where: { instructorId: user.employeeProfileId, section: { status: { in: ['OPEN', 'CLOSED'] } } },
      include: {
        section: {
          include: { course: true, term: true, _count: { select: { enrollments: true, attendanceSessions: true } } },
        },
      },
    });
  }

  async roster(user: AuthenticatedUser, sectionId: string) {
    await this.assertAssigned(user, sectionId);
    return this.prisma.enrollment.findMany({
      where: { sectionId, status: 'REGISTERED' },
      include: {
        student: {
          include: { user: { select: { firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true } } },
        },
      },
      orderBy: { student: { universityId: 'asc' } },
    });
  }

  async createSession(user: AuthenticatedUser, dto: CreateAttendanceSessionDto, requestId?: string) {
    await this.assertAssigned(user, dto.sectionId);
    const startsAt = new Date(`1970-01-01T${dto.startsAt}Z`);
    if (Number.isNaN(startsAt.getTime())) throw new ConflictException('INVALID_SESSION_TIME');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const session = await tx.attendanceSession.create({
          data: { sectionId: dto.sectionId, sessionDate: new Date(dto.sessionDate), startsAt, createdBy: user.id },
        });
        await this.audit.record(
          {
            actorUserId: user.id,
            actorRole: user.activeRole,
            action: 'ATTENDANCE_SESSION_CREATED',
            entityType: 'AttendanceSession',
            entityId: session.id,
            requestId,
            afterData: session,
          },
          tx,
        );
        return session;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('ATTENDANCE_SESSION_EXISTS');
      throw error;
    }
  }

  async save(user: AuthenticatedUser, sessionId: string, dto: BulkAttendanceDto, requestId?: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { section: { include: { instructors: true } }, records: true },
    });
    if (!session) throw new NotFoundException('ATTENDANCE_SESSION_NOT_FOUND');
    if (!session.section.instructors.some((assignment) => assignment.instructorId === user.employeeProfileId))
      throw new ForbiddenException('SECTION_NOT_ASSIGNED');
    if (session.status === AttendanceSessionStatus.CANCELLED)
      throw new ConflictException('ATTENDANCE_SESSION_CANCELLED');
    const attendancePolicy = await this.policy(session.section.termId);
    if (
      session.submittedAt &&
      Date.now() - session.submittedAt.getTime() > attendancePolicy.instructorEditDays * 24 * 60 * 60_000
    )
      throw new ConflictException('ATTENDANCE_EDIT_WINDOW_CLOSED');
    const enrollmentIds = dto.records.map((record) => record.enrollmentId);
    if (new Set(enrollmentIds).size !== enrollmentIds.length)
      throw new ConflictException('DUPLICATE_ATTENDANCE_RECORD');
    const enrollments = await this.prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds }, sectionId: session.sectionId, status: 'REGISTERED' },
      select: { id: true, studentId: true },
    });
    if (enrollments.length !== enrollmentIds.length) throw new ConflictException('ROSTER_MISMATCH');
    const enrollmentMap = new Map(enrollments.map((entry) => [entry.id, entry.studentId]));
    const before = session.records.map((record) => ({ studentId: record.studentId, status: record.status }));
    return this.prisma.$transaction(async (tx) => {
      for (const record of dto.records) {
        const studentId = enrollmentMap.get(record.enrollmentId)!;
        await tx.attendanceRecord.upsert({
          where: { sessionId_studentId: { sessionId, studentId } },
          create: {
            sessionId,
            studentId,
            enrollmentId: record.enrollmentId,
            status: record.status,
            note: record.note,
            evidenceRef: record.evidenceRef,
            markedBy: user.id,
          },
          update: {
            status: record.status,
            note: record.note,
            evidenceRef: record.evidenceRef,
            markedBy: user.id,
            markedAt: new Date(),
          },
        });
      }
      await tx.attendanceSession.update({
        where: { id: sessionId },
        data: { status: AttendanceSessionStatus.SUBMITTED, submittedAt: new Date() },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'ATTENDANCE_SUBMITTED',
          entityType: 'AttendanceSession',
          entityId: sessionId,
          requestId,
          beforeData: before,
          afterData: dto.records.map((record) => ({ enrollmentId: record.enrollmentId, status: record.status })),
        },
        tx,
      );
      return { sessionId, saved: dto.records.length };
    });
  }

  async requestAdjustment(user: AuthenticatedUser, dto: RequestAttendanceAdjustmentDto, requestId?: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: dto.recordId },
      include: { session: { include: { section: { include: { instructors: true } } } } },
    });
    if (!record) throw new NotFoundException('ATTENDANCE_RECORD_NOT_FOUND');
    if (!record.session.section.instructors.some((assignment) => assignment.instructorId === user.employeeProfileId))
      throw new ForbiddenException('SECTION_NOT_ASSIGNED');
    const attendancePolicy = await this.policy(record.session.section.termId);
    if (
      !record.session.submittedAt ||
      Date.now() - record.session.submittedAt.getTime() <= attendancePolicy.instructorEditDays * 24 * 60 * 60_000
    )
      throw new ConflictException('DIRECT_EDIT_WINDOW_OPEN');
    const pending = await this.prisma.attendanceAdjustment.findFirst({
      where: { recordId: record.id, decision: null },
    });
    if (pending) throw new ConflictException('ATTENDANCE_ADJUSTMENT_PENDING');
    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.attendanceAdjustment.create({
        data: {
          recordId: record.id,
          fromStatus: record.status,
          toStatus: dto.toStatus,
          reason: dto.reason,
          requestedBy: user.id,
        },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'ATTENDANCE_ADJUSTMENT_REQUESTED',
          entityType: 'AttendanceAdjustment',
          entityId: adjustment.id,
          requestId,
          afterData: { ...adjustment, evidenceRef: dto.evidenceRef },
        },
        tx,
      );
      return adjustment;
    });
  }

  async decideAdjustment(user: AuthenticatedUser, id: string, dto: DecideAttendanceAdjustmentDto, requestId?: string) {
    if (dto.outcome !== ApprovalOutcome.APPROVED && dto.outcome !== ApprovalOutcome.REJECTED)
      throw new ConflictException('INVALID_DECISION');
    const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
    if (!departmentId) throw new ForbiddenException('DEPARTMENT_SCOPE_REQUIRED');
    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.attendanceAdjustment.findUnique({
        where: { id },
        include: { record: { include: { session: { include: { section: { include: { course: true } } } } } } },
      });
      if (!adjustment) throw new NotFoundException('ATTENDANCE_ADJUSTMENT_NOT_FOUND');
      if (adjustment.decision) throw new ConflictException('ATTENDANCE_ADJUSTMENT_DECIDED');
      if (adjustment.record.session.section.course.departmentId !== departmentId)
        throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
      if (dto.outcome === ApprovalOutcome.APPROVED)
        await tx.attendanceRecord.update({
          where: { id: adjustment.recordId },
          data: { status: adjustment.toStatus, markedBy: user.id, markedAt: new Date() },
        });
      const decided = await tx.attendanceAdjustment.update({
        where: { id },
        data: {
          decision: dto.outcome,
          decisionReason: dto.reason,
          approvedBy: dto.outcome === ApprovalOutcome.APPROVED ? user.id : null,
          decidedAt: new Date(),
        },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: `ATTENDANCE_ADJUSTMENT_${dto.outcome}`,
          entityType: 'AttendanceAdjustment',
          entityId: id,
          requestId,
          beforeData: { decision: null },
          afterData: decided,
        },
        tx,
      );
      return decided;
    });
  }

  async studentSummary(user: AuthenticatedUser, studentId?: string) {
    const target = studentId ?? user.studentProfileId;
    if (!target) throw new ConflictException('STUDENT_REQUIRED');
    if (user.studentProfileId && user.activeRole === 'student' && target !== user.studentProfileId)
      throw new ForbiddenException('STUDENT_SCOPE_DENIED');
    if (user.activeRole === RoleKey.advisor) {
      const assigned = await this.prisma.advisorAssignment.count({
        where: { studentId: target, advisorId: user.employeeProfileId ?? '__none__', active: true },
      });
      if (!assigned) throw new ForbiddenException('ADVISEE_SCOPE_DENIED');
    }
    if (([RoleKey.coordinator, RoleKey.depthead, RoleKey.dean] as RoleKey[]).includes(user.activeRole)) {
      const student = await this.prisma.studentProfile.findUniqueOrThrow({
        where: { id: target },
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
    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId: target, session: { status: 'SUBMITTED' } },
      include: { enrollment: { include: { section: { include: { course: true, term: true } } } } },
    });
    const grouped = new Map<
      string,
      {
        termId: string;
        course: { code: string; nameEn: string; nameAr: string };
        present: number;
        absent: number;
        late: number;
        excused: number;
        total: number;
      }
    >();
    for (const record of records) {
      const key = record.enrollment.sectionId;
      const current = grouped.get(key) ?? {
        termId: record.enrollment.section.termId,
        course: record.enrollment.section.course,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };
      current.total += 1;
      if (record.status === 'PRESENT') current.present += 1;
      if (record.status === 'ABSENT') current.absent += 1;
      if (record.status === 'LATE') current.late += 1;
      if (record.status === 'EXCUSED') current.excused += 1;
      grouped.set(key, current);
    }
    const policies = new Map<string, Awaited<ReturnType<AttendanceService['policy']>>>();
    for (const termId of new Set([...grouped.values()].map((row) => row.termId)))
      policies.set(termId, await this.policy(termId));
    return [...grouped.values()].map((row) => {
      const attendancePolicy = policies.get(row.termId)!;
      const effectiveAbsences = row.absent + Math.floor(row.late / attendancePolicy.latePerAbsence);
      const denominator = Math.max(1, row.total - row.excused);
      return {
        ...row,
        effectiveAbsences,
        attendancePercent: Math.trunc(((denominator - effectiveAbsences) / denominator) * 100),
        thresholdPercent: attendancePolicy.thresholdPercent,
      };
    });
  }

  private async policy(termId: string) {
    const records = await this.prisma.academicPolicy.findMany({
      where: { key: 'attendance.general', active: true, OR: [{ termId }, { termId: null }] },
      orderBy: [{ termId: 'desc' }, { version: 'desc' }],
    });
    const record = records.find((entry) => entry.termId === termId) ?? records[0];
    if (!record || !record.value || typeof record.value !== 'object' || Array.isArray(record.value))
      throw new ConflictException('ACADEMIC_POLICY_MISSING');
    const value = record.value as Record<string, unknown>;
    if (
      typeof value.thresholdPercent !== 'number' ||
      typeof value.latePerAbsence !== 'number' ||
      typeof value.instructorEditDays !== 'number' ||
      value.latePerAbsence <= 0
    ) {
      throw new ConflictException('ACADEMIC_POLICY_INVALID');
    }
    return {
      thresholdPercent: value.thresholdPercent,
      latePerAbsence: value.latePerAbsence,
      instructorEditDays: value.instructorEditDays,
    };
  }

  private async assertAssigned(user: AuthenticatedUser, sectionId: string) {
    if (!user.employeeProfileId) throw new ForbiddenException('EMPLOYEE_PROFILE_REQUIRED');
    const count = await this.prisma.instructorSectionAssignment.count({
      where: { sectionId, instructorId: user.employeeProfileId },
    });
    if (!count) throw new ForbiddenException('SECTION_NOT_ASSIGNED');
  }
}
