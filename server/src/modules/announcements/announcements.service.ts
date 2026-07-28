import { ForbiddenException, Injectable } from '@nestjs/common';
import { AudienceType, Prisma, RoleKey } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { CreateAnnouncementDto } from './dto/announcements.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser) {
    const sectionIds =
      user.activeRole === RoleKey.student && user.studentProfileId
        ? (
            await this.prisma.enrollment.findMany({
              where: { studentId: user.studentProfileId, status: 'REGISTERED' },
              select: { sectionId: true },
            })
          ).map((row) => row.sectionId)
        : user.activeRole === RoleKey.instructor && user.employeeProfileId
          ? (
              await this.prisma.instructorSectionAssignment.findMany({
                where: { instructorId: user.employeeProfileId },
                select: { sectionId: true },
              })
            ).map((row) => row.sectionId)
          : [];
    return this.prisma.announcement.findMany({
      where: {
        publishedAt: { not: null, lte: new Date() },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        audiences: {
          some: {
            OR: [
              { type: AudienceType.ALL },
              { type: AudienceType.ROLE, roleKey: user.activeRole },
              { type: AudienceType.USER, targetId: user.id },
              { type: AudienceType.SECTION, sectionId: { in: sectionIds } },
            ],
          },
        },
      },
      include: { audiences: true },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });
  }

  async create(user: AuthenticatedUser, dto: CreateAnnouncementDto, requestId?: string) {
    if (user.activeRole === RoleKey.instructor && dto.audienceType !== AudienceType.SECTION)
      throw new ForbiddenException('ANNOUNCEMENT_SCOPE_DENIED');
    if (user.activeRole === RoleKey.depthead && dto.audienceType === AudienceType.DEPARTMENT) {
      const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
      if (!departmentId || dto.targetId !== departmentId) throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
    } else if (user.activeRole === RoleKey.depthead && dto.audienceType !== AudienceType.SECTION) {
      throw new ForbiddenException('ANNOUNCEMENT_SCOPE_DENIED');
    }
    if (dto.audienceType === AudienceType.SECTION) {
      if (!dto.sectionId) throw new ForbiddenException('SECTION_REQUIRED');
      if (user.activeRole === RoleKey.instructor) {
        const assigned = await this.prisma.instructorSectionAssignment.count({
          where: { sectionId: dto.sectionId, instructorId: user.employeeProfileId ?? '__none__' },
        });
        if (!assigned) throw new ForbiddenException('SECTION_NOT_ASSIGNED');
      }
      if (user.activeRole === RoleKey.depthead) {
        const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
        const section = await this.prisma.courseSection.findUnique({
          where: { id: dto.sectionId },
          select: { course: { select: { departmentId: true } } },
        });
        if (!section || !departmentId || section.course.departmentId !== departmentId)
          throw new ForbiddenException('DEPARTMENT_SCOPE_DENIED');
      }
    }
    return this.prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: {
          titleEn: dto.titleEn,
          titleAr: dto.titleAr,
          bodyEn: dto.bodyEn,
          bodyAr: dto.bodyAr,
          severity: dto.severity,
          createdBy: user.id,
          publishedAt: new Date(),
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          audiences: {
            create: { type: dto.audienceType, roleKey: dto.roleKey, targetId: dto.targetId, sectionId: dto.sectionId },
          },
        },
        include: { audiences: true },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'ANNOUNCEMENT_PUBLISHED',
          entityType: 'Announcement',
          entityId: announcement.id,
          requestId,
          afterData: announcement,
        },
        tx,
      );
      return announcement;
    });
  }
}
