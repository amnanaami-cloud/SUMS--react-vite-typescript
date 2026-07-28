import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, Prisma, RoleKey } from '@prisma/client';
import argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import {
  CreateStudentDto,
  CreateUserDto,
  ReplaceRolesDto,
  UpdateAccountStatusDto,
  UpdateProfileDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(page: number, pageSize: number, search?: string) {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { universityId: { contains: search } },
            { employeeId: { contains: search, mode: 'insensitive' } },
            { firstNameEn: { contains: search, mode: 'insensitive' } },
            { lastNameEn: { contains: search, mode: 'insensitive' } },
            { firstNameAr: { contains: search } },
            { lastNameAr: { contains: search } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ lastNameEn: 'asc' }, { firstNameEn: 'asc' }],
        select: {
          id: true,
          email: true,
          universityId: true,
          employeeId: true,
          firstNameEn: true,
          lastNameEn: true,
          firstNameAr: true,
          lastNameAr: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            select: { role: { select: { key: true, nameEn: true, nameAr: true } }, scopeType: true, scopeId: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async create(actor: AuthenticatedUser, dto: CreateUserDto, requestId?: string) {
    const roleKeys = [...new Set(dto.roles)];
    if (roleKeys.includes(RoleKey.student) && !('programId' in dto))
      throw new ConflictException('USE_STUDENT_CREATION_ENDPOINT');
    const roles = await this.prisma.role.findMany({ where: { key: { in: roleKeys } } });
    if (roles.length !== roleKeys.length) throw new NotFoundException('ROLE_NOT_FOUND');
    try {
      const passwordHash = await argon2.hash(dto.initialPassword, { type: argon2.argon2id });
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            universityId: dto.universityId,
            employeeId: dto.employeeId,
            firstNameEn: dto.firstNameEn,
            lastNameEn: dto.lastNameEn,
            firstNameAr: dto.firstNameAr,
            lastNameAr: dto.lastNameAr,
            passwordHash,
            userRoles: {
              create: roles.map((role) => ({ roleId: role.id, assignedBy: actor.id, reason: 'ACCOUNT_CREATION' })),
            },
          },
          select: { id: true, email: true, universityId: true, employeeId: true, status: true, createdAt: true },
        });
        await this.audit.record(
          {
            actorUserId: actor.id,
            actorRole: actor.activeRole,
            action: 'USER_CREATED',
            entityType: 'User',
            entityId: created.id,
            requestId,
            afterData: { ...created, roles: roleKeys },
          },
          tx,
        );
        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('IDENTIFIER_ALREADY_EXISTS');
      throw error;
    }
  }

  async updateStatus(actor: AuthenticatedUser, userId: string, dto: UpdateAccountStatusDto, requestId?: string) {
    if (actor.id === userId && dto.status !== AccountStatus.ACTIVE) throw new ForbiddenException('CANNOT_DISABLE_SELF');
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
      if (!before) throw new NotFoundException('USER_NOT_FOUND');
      const after = await tx.user.update({
        where: { id: userId },
        data: {
          status: dto.status,
          archivedAt: dto.status === AccountStatus.ARCHIVED ? new Date() : null,
          ...(dto.status === AccountStatus.ACTIVE ? { failedLoginCount: 0, lockedUntil: null } : {}),
        },
        select: { id: true, status: true },
      });
      if (dto.status !== AccountStatus.ACTIVE) {
        const now = new Date();
        await tx.userSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: now, revokeReason: `ACCOUNT_${dto.status}` },
        });
        await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
      }
      await this.audit.record(
        {
          actorUserId: actor.id,
          actorRole: actor.activeRole,
          action: 'USER_STATUS_CHANGED',
          entityType: 'User',
          entityId: userId,
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

  async replaceRoles(actor: AuthenticatedUser, userId: string, dto: ReplaceRolesDto, requestId?: string) {
    if (actor.id === userId) throw new ForbiddenException('CANNOT_CHANGE_OWN_ROLES');
    const keys = [...new Set(dto.roles)];
    if (keys.length === 0) throw new ConflictException('AT_LEAST_ONE_ROLE_REQUIRED');
    const roles = await this.prisma.role.findMany({ where: { key: { in: keys } } });
    if (roles.length !== keys.length) throw new NotFoundException('ROLE_NOT_FOUND');
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.userRole.findMany({ where: { userId }, include: { role: true } });
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId,
          roleId: role.id,
          assignedBy: actor.id,
          reason: dto.reason,
          scopeType: dto.scopeType,
          scopeId: dto.scopeId,
        })),
      });
      await tx.userSession.updateMany({
        where: { userId, activeRole: { notIn: keys }, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'ROLE_REVOKED' },
      });
      await this.audit.record(
        {
          actorUserId: actor.id,
          actorRole: actor.activeRole,
          action: 'USER_ROLES_REPLACED',
          entityType: 'User',
          entityId: userId,
          requestId,
          beforeData: { roles: before.map((item) => item.role.key) },
          afterData: { roles: keys },
          metadata: { reason: dto.reason, scopeType: dto.scopeType, scopeId: dto.scopeId },
        },
        tx,
      );
      return { userId, roles: keys };
    });
  }

  async updateOwnProfile(actor: AuthenticatedUser, dto: UpdateProfileDto, requestId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({
        where: { id: actor.id },
        include: { studentProfile: true, employeeProfile: true },
      });
      await tx.user.update({ where: { id: actor.id }, data: { preferredLanguage: dto.preferredLanguage } });
      if (before.studentProfile)
        await tx.studentProfile.update({
          where: { userId: actor.id },
          data: { phone: dto.phone, addressEn: dto.addressEn, addressAr: dto.addressAr },
        });
      if (before.employeeProfile)
        await tx.employeeProfile.update({ where: { userId: actor.id }, data: { phone: dto.phone } });
      await this.audit.record(
        {
          actorUserId: actor.id,
          actorRole: actor.activeRole,
          action: 'PROFILE_UPDATED',
          entityType: 'User',
          entityId: actor.id,
          requestId,
          beforeData: before,
          afterData: dto,
        },
        tx,
      );
      return { updated: true };
    });
  }

  async listStudents(actor: AuthenticatedUser, page: number, pageSize: number, search?: string) {
    const where: Prisma.StudentProfileWhereInput = {};
    if (actor.activeRole === RoleKey.student) where.id = actor.studentProfileId ?? '__none__';
    if (actor.activeRole === RoleKey.advisor)
      where.advisorAssignments = { some: { advisorId: actor.employeeProfileId ?? '__none__', active: true } };
    if (actor.activeRole === RoleKey.coordinator && actor.scopeType === 'PROGRAM' && actor.scopeId)
      where.programId = actor.scopeId;
    if (actor.activeRole === RoleKey.depthead && actor.scopeType === 'DEPARTMENT' && actor.scopeId)
      where.program = { departmentId: actor.scopeId };
    if (actor.activeRole === RoleKey.dean && actor.scopeType === 'FACULTY' && actor.scopeId)
      where.program = { department: { facultyId: actor.scopeId } };
    if (search)
      where.OR = [
        { universityId: { contains: search } },
        { user: { firstNameEn: { contains: search, mode: 'insensitive' } } },
        { user: { lastNameEn: { contains: search, mode: 'insensitive' } } },
        { user: { firstNameAr: { contains: search } } },
        { user: { lastNameAr: { contains: search } } },
      ];
    const [items, total] = await this.prisma.$transaction([
      this.prisma.studentProfile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { universityId: 'asc' },
        include: {
          user: { select: { firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true, email: true } },
          program: { select: { code: true, nameEn: true, nameAr: true } },
        },
      }),
      this.prisma.studentProfile.count({ where }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async createStudent(actor: AuthenticatedUser, dto: CreateStudentDto, requestId?: string) {
    if (!dto.universityId || dto.roles.length !== 1 || dto.roles[0] !== RoleKey.student)
      throw new ConflictException('STUDENT_ROLE_AND_ID_REQUIRED');
    const created = await this.create(actor, dto, requestId);
    const year = Number(dto.universityId.slice(1, 5));
    await this.prisma.studentProfile.create({
      data: {
        userId: created.id,
        programId: dto.programId,
        universityId: dto.universityId,
        genderPrefix: Number(dto.universityId[0]),
        admissionYear: year,
        admissionDate: new Date(dto.admissionDate),
        currentLevel: dto.currentLevel,
      },
    });
    return created;
  }
}
