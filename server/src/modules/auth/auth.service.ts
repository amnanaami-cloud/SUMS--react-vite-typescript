import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, AuditResult, Prisma, RoleKey } from '@prisma/client';
import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { secureToken, sha256 } from '../../common/utilities/security';
import { AuditService } from '../audit/audit.service';
import { ChangePasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, metadata: RequestMetadata) {
    const identifier = dto.identifier.trim();
    const normalizedEmail = identifier.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: 'insensitive' } },
          { universityId: identifier },
          { employeeId: identifier.toUpperCase() },
        ],
      },
      include: {
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        studentProfile: true,
        employeeProfile: true,
      },
    });

    const passwordValid = user ? await argon2.verify(user.passwordHash, dto.password) : false;
    const locked = Boolean(user?.lockedUntil && user.lockedUntil > new Date());
    const usable = user?.status === AccountStatus.ACTIVE && !locked;
    if (!user || !passwordValid || !usable) {
      await this.recordFailedLogin(user?.id, identifier, user, passwordValid, metadata);
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const assignments = user.userRoles;
    if (assignments.length === 0) {
      await this.recordFailedLogin(user.id, identifier, user, true, metadata, 'NO_ACTIVE_ROLE');
      throw new UnauthorizedException('ACCOUNT_NOT_AUTHORIZED');
    }
    const activeRole =
      dto.requestedRole && assignments.some((entry) => entry.role.key === dto.requestedRole)
        ? dto.requestedRole
        : assignments[0].role.key;

    const refreshToken = secureToken();
    const familyId = randomUUID();
    const refreshExpiry = this.refreshExpiry();
    const session = await this.prisma.$transaction(async (tx) => {
      const createdSession = await tx.userSession.create({
        data: {
          userId: user.id,
          activeRole,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent?.slice(0, 500),
          expiresAt: refreshExpiry,
        },
      });
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          sessionId: createdSession.id,
          familyId,
          tokenHash: sha256(refreshToken),
          expiresAt: refreshExpiry,
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
      });
      await tx.loginAttempt.create({
        data: { userId: user.id, identifier, success: true, ...metadata },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: activeRole,
          action: 'AUTH_LOGIN_SUCCESS',
          entityType: 'UserSession',
          entityId: createdSession.id,
          ...metadata,
        },
        tx,
      );
      return createdSession;
    });

    const tokens = await this.makeTokens(user.id, session.id, activeRole, refreshToken);
    return { tokens, user: this.publicUser(user, activeRole) };
  }

  async refresh(rawRefreshToken: string | undefined, metadata: RequestMetadata) {
    if (!rawRefreshToken) throw new UnauthorizedException('REFRESH_REQUIRED');
    const tokenHash = sha256(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        session: true,
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
    if (!stored) throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    if (stored.revokedAt) {
      await this.prisma.$transaction([
        this.prisma.refreshToken.updateMany({
          where: { familyId: stored.familyId, revokedAt: null },
          data: { revokedAt: now },
        }),
        this.prisma.userSession.updateMany({
          where: { id: stored.sessionId, revokedAt: null },
          data: { revokedAt: now, revokeReason: 'REFRESH_TOKEN_REUSE' },
        }),
      ]);
      throw new UnauthorizedException('REFRESH_TOKEN_REUSE');
    }
    if (
      stored.expiresAt <= now ||
      stored.session.expiresAt <= now ||
      stored.session.lastSeenAt < inactivityCutoff ||
      stored.session.revokedAt ||
      stored.user.status !== AccountStatus.ACTIVE
    ) {
      throw new UnauthorizedException('SESSION_EXPIRED');
    }
    if (!stored.user.userRoles.some((entry) => entry.role.key === stored.session.activeRole)) {
      throw new UnauthorizedException('ROLE_REVOKED');
    }

    const nextRaw = secureToken();
    const nextId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      const rotated = await tx.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: now, replacedById: nextId },
      });
      if (rotated.count !== 1) throw new UnauthorizedException('REFRESH_TOKEN_REUSE');
      await tx.refreshToken.create({
        data: {
          id: nextId,
          userId: stored.userId,
          sessionId: stored.sessionId,
          familyId: stored.familyId,
          tokenHash: sha256(nextRaw),
          expiresAt: stored.expiresAt,
        },
      });
      await tx.userSession.update({
        where: { id: stored.sessionId },
        data: { lastSeenAt: now, ipAddress: metadata.ipAddress, userAgent: metadata.userAgent?.slice(0, 500) },
      });
      await this.audit.record(
        {
          actorUserId: stored.userId,
          actorRole: stored.session.activeRole,
          action: 'AUTH_REFRESH_ROTATED',
          entityType: 'UserSession',
          entityId: stored.sessionId,
          ...metadata,
        },
        tx,
      );
    });
    return {
      tokens: await this.makeTokens(stored.userId, stored.sessionId, stored.session.activeRole, nextRaw),
      user: this.publicUser(stored.user, stored.session.activeRole),
    };
  }

  async logout(user: AuthenticatedUser, metadata: RequestMetadata) {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.userSession.updateMany({
        where: { id: user.sessionId, userId: user.id },
        data: { revokedAt: now, revokeReason: 'USER_LOGOUT' },
      });
      await tx.refreshToken.updateMany({
        where: { sessionId: user.sessionId, revokedAt: null },
        data: { revokedAt: now },
      });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'AUTH_LOGOUT',
          entityType: 'UserSession',
          entityId: user.sessionId,
          ...metadata,
        },
        tx,
      );
    });
  }

  async logoutAll(user: AuthenticatedUser, metadata: RequestMetadata) {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.userSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now, revokeReason: 'USER_LOGOUT_ALL' },
      });
      await tx.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now } });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'AUTH_LOGOUT_ALL',
          entityType: 'User',
          entityId: user.id,
          ...metadata,
        },
        tx,
      );
    });
  }

  async me(user: AuthenticatedUser) {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        studentProfile: { include: { program: { include: { department: { include: { faculty: true } } } } } },
        employeeProfile: { include: { department: { include: { faculty: true } } } },
      },
    });
    return this.publicUser(record, user.activeRole);
  }

  async forgotPassword(identifier: string, metadata: RequestMetadata) {
    const normalized = identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalized.toLowerCase(), mode: 'insensitive' } },
          { universityId: normalized },
          { employeeId: normalized.toUpperCase() },
        ],
      },
    });
    if (user?.status === AccountStatus.ACTIVE) {
      const rawToken = secureToken();
      await this.prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: sha256(rawToken),
            expiresAt: new Date(Date.now() + 30 * 60_000),
            requestedIp: metadata.ipAddress,
          },
        });
        await this.audit.record(
          {
            actorUserId: user.id,
            action: 'AUTH_PASSWORD_RESET_REQUESTED',
            entityType: 'User',
            entityId: user.id,
            ...metadata,
          },
          tx,
        );
      });
      // A deployment-specific mail adapter receives this value; it is deliberately never logged or persisted raw.
      if (this.config.get('NODE_ENV') === 'test') return { accepted: true, testToken: rawToken };
    }
    return { accepted: true };
  }

  async resetPassword(dto: ResetPasswordDto, metadata: RequestMetadata) {
    const tokenHash = sha256(dto.token);
    const reset = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date() || reset.user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('INVALID_RESET_TOKEN');
    }
    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: reset.id, usedAt: null },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw new UnauthorizedException('INVALID_RESET_TOKEN');
      await tx.user.update({
        where: { id: reset.userId },
        data: { passwordHash, passwordChangedAt: now, failedLoginCount: 0, lockedUntil: null },
      });
      await tx.userSession.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: now, revokeReason: 'PASSWORD_RESET' },
      });
      await tx.refreshToken.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: now } });
      await this.audit.record(
        {
          actorUserId: reset.userId,
          action: 'AUTH_PASSWORD_RESET_COMPLETED',
          entityType: 'User',
          entityId: reset.userId,
          ...metadata,
        },
        tx,
      );
    });
  }

  async changePassword(user: AuthenticatedUser, dto: ChangePasswordDto, metadata: RequestMetadata) {
    const record = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await argon2.verify(record.passwordHash, dto.currentPassword)))
      throw new UnauthorizedException('CURRENT_PASSWORD_INVALID');
    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash, passwordChangedAt: now } });
      await tx.userSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now, revokeReason: 'PASSWORD_CHANGED' },
      });
      await tx.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now } });
      await this.audit.record(
        {
          actorUserId: user.id,
          actorRole: user.activeRole,
          action: 'AUTH_PASSWORD_CHANGED',
          entityType: 'User',
          entityId: user.id,
          ...metadata,
        },
        tx,
      );
    });
  }

  async sessions(user: AuthenticatedUser) {
    return this.prisma.userSession.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        activeRole: true,
        ipAddress: true,
        userAgent: true,
        lastSeenAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  private async makeTokens(
    userId: string,
    sessionId: string,
    activeRole: RoleKey,
    refreshToken: string,
  ): Promise<SessionTokens> {
    const expiresIn = this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS') ?? 900;
    const accessToken = await this.jwt.signAsync(
      { sub: userId, sid: sessionId, role: activeRole, type: 'access' },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn },
    );
    return { accessToken, refreshToken, expiresIn };
  }

  private refreshExpiry() {
    const days = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS') ?? 7;
    return new Date(Date.now() + days * 86_400_000);
  }

  private publicUser<
    T extends {
      id: string;
      email: string;
      universityId: string | null;
      employeeId: string | null;
      firstNameEn: string;
      lastNameEn: string;
      firstNameAr: string;
      lastNameAr: string;
      preferredLanguage: string;
      userRoles: Array<{ role: { key: RoleKey; permissions: Array<{ permission: { key: string } }> } }>;
      studentProfile?: unknown;
      employeeProfile?: unknown;
    },
  >(user: T, activeRole: RoleKey) {
    const assignment = user.userRoles.find((entry) => entry.role.key === activeRole);
    return {
      id: user.id,
      email: user.email,
      universityId: user.universityId,
      employeeId: user.employeeId,
      nameEn: `${user.firstNameEn} ${user.lastNameEn}`,
      nameAr: `${user.firstNameAr} ${user.lastNameAr}`,
      preferredLanguage: user.preferredLanguage,
      roles: user.userRoles.map((entry) => entry.role.key),
      activeRole,
      permissions: assignment?.role.permissions.map((entry) => entry.permission.key) ?? [],
      studentProfile: user.studentProfile ?? null,
      employeeProfile: user.employeeProfile ?? null,
    };
  }

  private async recordFailedLogin(
    userId: string | undefined,
    identifier: string,
    user: { failedLoginCount: number } | null,
    passwordValid: boolean,
    metadata: RequestMetadata,
    overrideCode?: string,
  ) {
    const code =
      overrideCode ?? (!user ? 'UNKNOWN_ACCOUNT' : !passwordValid ? 'INVALID_PASSWORD' : 'ACCOUNT_UNAVAILABLE');
    await this.prisma.$transaction(async (tx) => {
      if (userId && !passwordValid) {
        const failures = (user?.failedLoginCount ?? 0) + 1;
        await tx.user.update({
          where: { id: userId },
          data: {
            failedLoginCount: failures,
            lockedUntil: failures >= 3 ? new Date(Date.now() + 15 * 60_000) : undefined,
          },
        });
      }
      await tx.loginAttempt.create({ data: { userId, identifier, success: false, failureCode: code, ...metadata } });
      await this.audit.record(
        {
          actorUserId: userId,
          action: 'AUTH_LOGIN_FAILURE',
          entityType: userId ? 'User' : undefined,
          entityId: userId,
          result: AuditResult.FAILURE,
          failureReason: code,
          ...metadata,
        },
        tx,
      );
    });
  }
}
