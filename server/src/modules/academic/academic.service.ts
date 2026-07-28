import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, RoleKey, SectionStatus, TermStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { CreateCourseDto, CreateSectionDto, CreateTermDto } from './dto/academic.dto';

@Injectable()
export class AcademicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async dashboard(user: AuthenticatedUser) {
    const activeTerm = await this.prisma.academicTerm.findFirst({
      where: { status: { in: [TermStatus.REGISTRATION_OPEN, TermStatus.ACTIVE, TermStatus.GRADING] } },
      orderBy: { startsOn: 'desc' },
    });
    const termId = activeTerm?.id;
    if (user.activeRole === RoleKey.student && user.studentProfileId) {
      const [courseCount, attendance, pending, profile] = await Promise.all([
        this.prisma.enrollment.count({
          where: { studentId: user.studentProfileId, section: { termId }, status: 'REGISTERED' },
        }),
        this.prisma.attendanceRecord.groupBy({
          by: ['status'],
          where: { studentId: user.studentProfileId, session: { section: { termId }, status: 'SUBMITTED' } },
          _count: true,
        }),
        this.prisma.registrationRequest.count({
          where: { studentId: user.studentProfileId, status: { in: ['PENDING_ADVISOR', 'RETURNED'] } },
        }),
        this.prisma.studentProfile.findUnique({
          where: { id: user.studentProfileId },
          select: {
            cumulativeGpa: true,
            semesterGpa: true,
            earnedCredits: true,
            program: { select: { requiredCredits: true } },
          },
        }),
      ]);
      const totalAttendance = attendance.reduce((sum, row) => sum + row._count, 0);
      const present = attendance.find((row) => row.status === 'PRESENT')?._count ?? 0;
      return {
        activeTerm,
        stats: {
          enrolledCourses: courseCount,
          cumulativeGpa: profile?.cumulativeGpa,
          semesterGpa: profile?.semesterGpa,
          attendancePercent: totalAttendance ? Math.trunc((present / totalAttendance) * 100) : 0,
          pendingRequests: pending,
          earnedCredits: profile?.earnedCredits ?? 0,
          requiredCredits: profile?.program.requiredCredits ?? 0,
        },
      };
    }
    if (user.activeRole === RoleKey.instructor && user.employeeProfileId) {
      const assignments = await this.prisma.instructorSectionAssignment.findMany({
        where: { instructorId: user.employeeProfileId, section: { termId } },
        select: { sectionId: true },
      });
      const sectionIds = assignments.map((row) => row.sectionId);
      const [students, openAttendance, pendingGrades] = await Promise.all([
        this.prisma.enrollment.count({ where: { sectionId: { in: sectionIds }, status: 'REGISTERED' } }),
        this.prisma.attendanceSession.count({ where: { sectionId: { in: sectionIds }, status: 'OPEN' } }),
        this.prisma.gradeSubmission.count({
          where: { sectionId: { in: sectionIds }, status: { in: ['DRAFT', 'RETURNED'] } },
        }),
      ]);
      return { activeTerm, stats: { classes: sectionIds.length, students, openAttendance, pendingGrades } };
    }
    if (user.activeRole === RoleKey.advisor && user.employeeProfileId) {
      const studentIds = (
        await this.prisma.advisorAssignment.findMany({
          where: { advisorId: user.employeeProfileId, active: true },
          select: { studentId: true },
        })
      ).map((row) => row.studentId);
      const [pending, atRisk] = await Promise.all([
        this.prisma.registrationRequest.count({ where: { studentId: { in: studentIds }, status: 'PENDING_ADVISOR' } }),
        this.prisma.studentProfile.count({
          where: { id: { in: studentIds }, standing: { in: ['WARNING', 'PROBATION'] } },
        }),
      ]);
      return { activeTerm, stats: { advisees: studentIds.length, pendingApprovals: pending, atRisk } };
    }
    const studentScope: Prisma.StudentProfileWhereInput = {};
    const courseScope: Prisma.CourseWhereInput = { active: true };
    if (user.activeRole === RoleKey.depthead && user.scopeType === 'DEPARTMENT' && user.scopeId) {
      studentScope.program = { departmentId: user.scopeId };
      courseScope.departmentId = user.scopeId;
    }
    if (user.activeRole === RoleKey.coordinator && user.scopeType === 'PROGRAM' && user.scopeId)
      studentScope.programId = user.scopeId;
    if (user.activeRole === RoleKey.dean && user.scopeType === 'FACULTY' && user.scopeId) {
      studentScope.program = { department: { facultyId: user.scopeId } };
      courseScope.department = { facultyId: user.scopeId };
    }
    const [students, courses, sections, pendingRegistrations] = await Promise.all([
      this.prisma.studentProfile.count({ where: studentScope }),
      this.prisma.course.count({ where: courseScope }),
      this.prisma.courseSection.count({ where: { termId, course: courseScope } }),
      this.prisma.registrationRequest.count({
        where: { termId, student: studentScope, status: { in: ['PENDING_ADVISOR', 'APPROVED'] } },
      }),
    ]);
    return { activeTerm, stats: { students, courses, sections, pendingRegistrations } };
  }

  async courses(user: AuthenticatedUser, search?: string, termId?: string) {
    const courseWhere: Prisma.CourseWhereInput = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
            { nameAr: { contains: search } },
          ],
        }
      : {};
    if (user.activeRole === RoleKey.depthead && user.scopeType === 'DEPARTMENT' && user.scopeId)
      courseWhere.departmentId = user.scopeId;
    const where: Prisma.CourseSectionWhereInput = {
      status: { in: [SectionStatus.OPEN, SectionStatus.CLOSED] },
      ...(termId ? { termId } : { term: { status: { in: [TermStatus.REGISTRATION_OPEN, TermStatus.ACTIVE] } } }),
      course: courseWhere,
    };
    if (user.activeRole === RoleKey.instructor)
      where.instructors = { some: { instructorId: user.employeeProfileId ?? '__none__' } };
    return this.prisma.courseSection.findMany({
      where,
      include: {
        course: {
          include: {
            prerequisites: { include: { prerequisite: { select: { code: true, nameEn: true, nameAr: true } } } },
            department: { select: { code: true, nameEn: true, nameAr: true } },
          },
        },
        term: { select: { id: true, code: true, nameEn: true, nameAr: true, status: true } },
        meetings: { include: { room: true }, orderBy: [{ dayOfWeek: 'asc' }, { startsAt: 'asc' }] },
        instructors: {
          include: {
            instructor: {
              include: {
                user: { select: { firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true } },
              },
            },
          },
        },
      },
      orderBy: [{ course: { code: 'asc' } }, { sectionNo: 'asc' }],
    });
  }

  async myCourses(user: AuthenticatedUser) {
    if (user.activeRole === RoleKey.student && user.studentProfileId) {
      return this.prisma.enrollment.findMany({
        where: { studentId: user.studentProfileId, status: { in: ['REGISTERED', 'COMPLETED'] } },
        include: {
          section: {
            include: {
              course: true,
              term: true,
              meetings: { include: { room: true } },
              instructors: { include: { instructor: { include: { user: true } } } },
            },
          },
        },
        orderBy: { registeredAt: 'desc' },
      });
    }
    if (user.activeRole === RoleKey.instructor && user.employeeProfileId) {
      return this.prisma.instructorSectionAssignment.findMany({
        where: { instructorId: user.employeeProfileId },
        include: {
          section: {
            include: {
              course: true,
              term: true,
              meetings: { include: { room: true } },
              _count: { select: { enrollments: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    throw new ForbiddenException('COURSE_SCOPE_DENIED');
  }

  terms() {
    return this.prisma.academicTerm.findMany({
      include: { academicYear: true, _count: { select: { sections: true, registrationRequests: true } } },
      orderBy: { startsOn: 'desc' },
    });
  }

  async schedule(user: AuthenticatedUser) {
    if (user.activeRole === RoleKey.student && user.studentProfileId) {
      return this.prisma.sectionMeeting.findMany({
        where: {
          section: {
            enrollments: { some: { studentId: user.studentProfileId, status: 'REGISTERED' } },
            term: { status: { in: ['REGISTRATION_OPEN', 'ACTIVE'] } },
          },
        },
        include: { room: true, section: { include: { course: true } } },
        orderBy: [{ dayOfWeek: 'asc' }, { startsAt: 'asc' }],
      });
    }
    if (user.activeRole === RoleKey.depthead) {
      if (user.scopeType !== 'DEPARTMENT' || !user.scopeId) throw new ForbiddenException('DEPARTMENT_SCOPE_REQUIRED');
      return this.prisma.sectionMeeting.findMany({
        where: {
          section: {
            course: { departmentId: user.scopeId },
            term: { status: { in: ['REGISTRATION_OPEN', 'ACTIVE'] } },
          },
        },
        include: { room: true, section: { include: { course: true } } },
        orderBy: [{ dayOfWeek: 'asc' }, { startsAt: 'asc' }],
      });
    }
    if (user.employeeProfileId) {
      return this.prisma.sectionMeeting.findMany({
        where: {
          section: {
            instructors: { some: { instructorId: user.employeeProfileId } },
            term: { status: { in: ['REGISTRATION_OPEN', 'ACTIVE'] } },
          },
        },
        include: { room: true, section: { include: { course: true } } },
        orderBy: [{ dayOfWeek: 'asc' }, { startsAt: 'asc' }],
      });
    }
    return [];
  }

  async curriculum(user: AuthenticatedUser, programId?: string) {
    const scopedProgramId =
      user.activeRole === RoleKey.coordinator && user.scopeType === 'PROGRAM' ? user.scopeId : user.programId;
    const targetProgramId = programId ?? scopedProgramId;
    if (!targetProgramId) throw new ConflictException('PROGRAM_REQUIRED');
    const program = await this.prisma.academicProgram.findUniqueOrThrow({
      where: { id: targetProgramId },
      select: { id: true, departmentId: true, department: { select: { facultyId: true } } },
    });
    if (user.activeRole === RoleKey.student && targetProgramId !== user.programId)
      throw new ForbiddenException('PROGRAM_SCOPE_DENIED');
    if (user.activeRole === RoleKey.coordinator && (user.scopeType !== 'PROGRAM' || targetProgramId !== user.scopeId))
      throw new ForbiddenException('PROGRAM_SCOPE_DENIED');
    if (
      user.activeRole === RoleKey.depthead &&
      (user.scopeType !== 'DEPARTMENT' || program.departmentId !== user.scopeId)
    )
      throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
    if (
      user.activeRole === RoleKey.dean &&
      (user.scopeType !== 'FACULTY' || program.department.facultyId !== user.scopeId)
    )
      throw new ForbiddenException('FACULTY_SCOPE_DENIED');
    return this.prisma.curriculum.findFirst({
      where: { programId: targetProgramId, active: true },
      include: {
        program: true,
        courses: { include: { course: true }, orderBy: [{ category: 'asc' }, { recommendedLevel: 'asc' }] },
      },
    });
  }

  async degreeProgress(user: AuthenticatedUser, studentId?: string) {
    const target = studentId ?? user.studentProfileId;
    if (!target) throw new ConflictException('STUDENT_REQUIRED');
    if (user.activeRole === RoleKey.student && target !== user.studentProfileId)
      throw new ForbiddenException('STUDENT_SCOPE_DENIED');
    if (user.activeRole === RoleKey.advisor) {
      const assigned = await this.prisma.advisorAssignment.count({
        where: { studentId: target, advisorId: user.employeeProfileId ?? '__none__', active: true },
      });
      if (!assigned) throw new ForbiddenException('ADVISEE_SCOPE_DENIED');
    }
    const targetScope = await this.prisma.studentProfile.findUniqueOrThrow({
      where: { id: target },
      select: {
        programId: true,
        program: { select: { departmentId: true, department: { select: { facultyId: true } } } },
      },
    });
    if (
      user.activeRole === RoleKey.coordinator &&
      (user.scopeType !== 'PROGRAM' || targetScope.programId !== user.scopeId)
    )
      throw new ForbiddenException('PROGRAM_SCOPE_DENIED');
    if (
      user.activeRole === RoleKey.depthead &&
      (user.scopeType !== 'DEPARTMENT' || targetScope.program.departmentId !== user.scopeId)
    )
      throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
    if (
      user.activeRole === RoleKey.dean &&
      (user.scopeType !== 'FACULTY' || targetScope.program.department.facultyId !== user.scopeId)
    )
      throw new ForbiddenException('FACULTY_SCOPE_DENIED');
    const student = await this.prisma.studentProfile.findUniqueOrThrow({
      where: { id: target },
      include: {
        program: true,
        enrollments: {
          where: { status: 'COMPLETED' },
          include: { section: { include: { course: true } }, finalGrade: true },
        },
      },
    });
    const completed = student.enrollments.filter(
      (item) => item.finalGrade?.letterGrade && item.finalGrade.letterGrade !== 'F',
    );
    return {
      studentId: target,
      completedCredits: completed.reduce((sum, item) => sum + item.section.course.credits, 0),
      requiredCredits: student.program.requiredCredits,
      courses: completed.map((item) => ({
        code: item.section.course.code,
        credits: item.section.course.credits,
        grade: item.finalGrade?.letterGrade,
      })),
    };
  }

  staff(user: AuthenticatedUser) {
    const where: Prisma.EmployeeProfileWhereInput = {};
    if (user.activeRole === RoleKey.depthead && user.scopeType === 'DEPARTMENT' && user.scopeId)
      where.departmentId = user.scopeId;
    if (user.activeRole === RoleKey.dean && user.scopeType === 'FACULTY' && user.scopeId)
      where.department = { facultyId: user.scopeId };
    return this.prisma.employeeProfile.findMany({
      where,
      include: {
        user: { select: { firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true, email: true } },
        department: true,
        _count: { select: { sectionAssignments: true, advisorAssignments: true } },
      },
      orderBy: { employeeId: 'asc' },
    });
  }

  async analytics(user: AuthenticatedUser) {
    const programWhere: Prisma.StudentProfileWhereInput = {};
    if (user.activeRole === RoleKey.depthead && user.scopeType === 'DEPARTMENT' && user.scopeId)
      programWhere.program = { departmentId: user.scopeId };
    if (user.activeRole === RoleKey.coordinator && user.scopeType === 'PROGRAM' && user.scopeId)
      programWhere.programId = user.scopeId;
    if (user.activeRole === RoleKey.dean && user.scopeType === 'FACULTY' && user.scopeId)
      programWhere.program = { department: { facultyId: user.scopeId } };
    const [standing, status, total] = await Promise.all([
      this.prisma.studentProfile.groupBy({ by: ['standing'], where: programWhere, _count: true }),
      this.prisma.studentProfile.groupBy({ by: ['status'], where: programWhere, _count: true }),
      this.prisma.studentProfile.count({ where: programWhere }),
    ]);
    return { totalStudents: total, standing, status };
  }

  async createCourse(actor: AuthenticatedUser, dto: CreateCourseDto, requestId?: string) {
    if (actor.activeRole === RoleKey.depthead && actor.departmentId !== dto.departmentId)
      throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({ data: { ...dto, code: dto.code.toUpperCase() } });
      await this.audit.record(
        {
          actorUserId: actor.id,
          actorRole: actor.activeRole,
          action: 'COURSE_CREATED',
          entityType: 'Course',
          entityId: course.id,
          requestId,
          afterData: course,
        },
        tx,
      );
      return course;
    });
  }

  async createTerm(actor: AuthenticatedUser, dto: CreateTermDto, requestId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const term = await tx.academicTerm.create({
        data: {
          ...dto,
          startsOn: new Date(dto.startsOn),
          endsOn: new Date(dto.endsOn),
          registrationStartsAt: new Date(dto.registrationStartsAt),
          registrationEndsAt: new Date(dto.registrationEndsAt),
          addDropEndsAt: new Date(dto.addDropEndsAt),
          withdrawalEndsAt: new Date(dto.withdrawalEndsAt),
        },
      });
      await this.audit.record(
        {
          actorUserId: actor.id,
          actorRole: actor.activeRole,
          action: 'TERM_CREATED',
          entityType: 'AcademicTerm',
          entityId: term.id,
          requestId,
          afterData: term,
        },
        tx,
      );
      return term;
    });
  }

  async createSection(actor: AuthenticatedUser, dto: CreateSectionDto, requestId?: string) {
    const [course, term] = await Promise.all([
      this.prisma.course.findUniqueOrThrow({ where: { id: dto.courseId } }),
      this.prisma.academicTerm.findUniqueOrThrow({ where: { id: dto.termId } }),
    ]);
    if (actor.activeRole === RoleKey.depthead && actor.departmentId !== course.departmentId)
      throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
    const sectionCode = `${course.code}-${term.code}-${dto.sectionNo}`;
    return this.prisma.$transaction(async (tx) => {
      const section = await tx.courseSection.create({ data: { ...dto, sectionCode, status: SectionStatus.OPEN } });
      await this.audit.record(
        {
          actorUserId: actor.id,
          actorRole: actor.activeRole,
          action: 'SECTION_CREATED',
          entityType: 'CourseSection',
          entityId: section.id,
          requestId,
          afterData: section,
        },
        tx,
      );
      return section;
    });
  }
}
