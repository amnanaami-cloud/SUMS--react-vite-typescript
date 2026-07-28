import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditResult, Prisma, RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}
  @Permissions('audit.read')
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() page: PaginationDto,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('result') result?: AuditResult,
  ) {
    const where: Prisma.AuditLogWhereInput = {
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
      ...(entityType ? { entityType } : {}),
      ...(result ? { result } : {}),
    };
    if (user.activeRole === RoleKey.depthead) {
      const departmentId = user.scopeType === 'DEPARTMENT' ? user.scopeId : user.departmentId;
      const [employeeUsers, studentUsers] = departmentId
        ? await Promise.all([
            this.prisma.employeeProfile.findMany({ where: { departmentId }, select: { userId: true } }),
            this.prisma.studentProfile.findMany({ where: { program: { departmentId } }, select: { userId: true } }),
          ])
        : [[], []];
      where.actorUserId = { in: [...employeeUsers, ...studentUsers].map((entry) => entry.userId) };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      data: { items, page: page.page, pageSize: page.pageSize, total, totalPages: Math.ceil(total / page.pageSize) },
    };
  }
}
