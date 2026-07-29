import { Injectable } from '@nestjs/common';
import { AuditResult, Prisma, RoleKey } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeAuditValue } from '../../common/utilities/security';

export interface AuditEventInput {
  actorUserId?: string;
  actorRole?: RoleKey;
  action: string;
  entityType?: string;
  entityId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  result?: AuditResult;
  failureReason?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(event: AuditEventInput, tx: Prisma.TransactionClient = this.prisma) {
    return tx.auditLog.create({
      data: {
        actorUserId: event.actorUserId,
        actorRole: event.actorRole,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        requestId: event.requestId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent?.slice(0, 500),
        beforeData: sanitizeAuditValue(event.beforeData) as Prisma.InputJsonValue | undefined,
        afterData: sanitizeAuditValue(event.afterData) as Prisma.InputJsonValue | undefined,
        metadata: sanitizeAuditValue(event.metadata) as Prisma.InputJsonValue | undefined,
        result: event.result ?? AuditResult.SUCCESS,
        failureReason: event.failureReason?.slice(0, 500),
      },
    });
  }
}
