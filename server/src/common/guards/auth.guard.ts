import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

interface AccessPayload {
  sub: string;
  sid: string;
  role: string;
  type: 'access';
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('AUTH_REQUIRED');

    let payload: AccessPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('SESSION_EXPIRED');
    }
    if (payload.type !== 'access') throw new UnauthorizedException('INVALID_TOKEN');

    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sid },
      include: {
        user: {
          include: {
            userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
            studentProfile: true,
            employeeProfile: true,
          },
        },
      },
    });
    const now = new Date();
    const inactivityCutoff = new Date(now.getTime() - 30 * 60_000);
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.lastSeenAt < inactivityCutoff ||
      session.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException('SESSION_EXPIRED');
    }

    const roleAssignments = session.user.userRoles;
    const activeAssignment = roleAssignments.find((entry) => entry.role.key === session.activeRole);
    if (!activeAssignment) throw new UnauthorizedException('ROLE_REVOKED');

    const authUser: AuthenticatedUser = {
      id: session.user.id,
      sessionId: session.id,
      activeRole: session.activeRole,
      roles: roleAssignments.map((entry) => entry.role.key),
      permissions: activeAssignment.role.permissions.map((entry) => entry.permission.key),
      universityId: session.user.universityId,
      employeeId: session.user.employeeId,
      studentProfileId: session.user.studentProfile?.id ?? null,
      employeeProfileId: session.user.employeeProfile?.id ?? null,
      departmentId: session.user.employeeProfile?.departmentId ?? null,
      programId: session.user.studentProfile?.programId ?? null,
      scopeType: activeAssignment.scopeType,
      scopeId: activeAssignment.scopeId,
    };
    request.user = authUser;
    if (now.getTime() - session.lastSeenAt.getTime() > 60_000) {
      void this.prisma.userSession.update({ where: { id: session.id }, data: { lastSeenAt: now } });
    }
    return true;
  }
}
