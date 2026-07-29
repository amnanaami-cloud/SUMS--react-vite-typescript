import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { UpdateAcademicPolicyDto, UpdateSettingDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  list() {
    return this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
  }
  policies() {
    return this.prisma.academicPolicy.findMany({
      where: { active: true },
      include: { term: true },
      orderBy: [{ key: 'asc' }, { version: 'desc' }],
    });
  }
  async update(user: AuthenticatedUser, key: string, dto: UpdateSettingDto, requestId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.systemSetting.findUnique({ where: { key } });
      const after = await tx.systemSetting.upsert({
        where: { key },
        create: { key, value: dto.value as Prisma.InputJsonValue, updatedBy: user.id },
        update: { value: dto.value as Prisma.InputJsonValue, updatedBy: user.id },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'SYSTEM_SETTING_CHANGED',
          entityType: 'SystemSetting',
          entityId: after.id,
          requestId,
          beforeData: before,
          afterData: after,
          metadata: { reason: dto.reason },
        },
        tx,
      );
      return after;
    });
  }

  async updatePolicy(user: AuthenticatedUser, key: string, dto: UpdateAcademicPolicyDto, requestId?: string) {
    if (!/^[a-z][a-z0-9_.-]{2,119}$/.test(key)) throw new BadRequestException('INVALID_POLICY_KEY');
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.academicPolicy.findFirst({
        where: { key, termId: dto.termId ?? null },
        orderBy: { version: 'desc' },
      });
      await tx.academicPolicy.updateMany({
        where: { key, termId: dto.termId ?? null, active: true },
        data: { active: false, effectiveTo: new Date(dto.effectiveFrom) },
      });
      const after = await tx.academicPolicy.create({
        data: {
          key,
          version: (before?.version ?? 0) + 1,
          termId: dto.termId,
          value: dto.value as Prisma.InputJsonValue,
          sourceRef: dto.sourceRef,
          effectiveFrom: new Date(dto.effectiveFrom),
          effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
          active: true,
          createdBy: user.id,
        },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'ACADEMIC_POLICY_CHANGED',
          entityType: 'AcademicPolicy',
          entityId: after.id,
          requestId,
          beforeData: before,
          afterData: after,
          metadata: { reason: dto.reason },
        },
        tx,
      );
      return after;
    });
  }
}
