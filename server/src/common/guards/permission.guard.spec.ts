import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleKey } from '@prisma/client';
import { PermissionGuard } from './permission.guard';
import { AuthenticatedUser } from '../types/authenticated-user';

const user: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  sessionId: '00000000-0000-0000-0000-000000000002',
  activeRole: RoleKey.student,
  roles: [RoleKey.student],
  permissions: ['courses.read'],
  universityId: '2202100054',
  employeeId: null,
  studentProfileId: '00000000-0000-0000-0000-000000000003',
  employeeProfileId: null,
  departmentId: null,
  programId: '00000000-0000-0000-0000-000000000004',
  scopeType: null,
  scopeId: null,
};

function context(requestUser: AuthenticatedUser | undefined): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user: requestUser }) }),
  } as unknown as ExecutionContext;
}

describe('PermissionGuard', () => {
  it('allows an authenticated user with every required permission', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['courses.read']),
    } as unknown as Reflector;
    expect(new PermissionGuard(reflector).canActivate(context(user))).toBe(true);
  });

  it('denies a missing permission with 403 semantics', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['grades.manage.assigned']),
    } as unknown as Reflector;
    expect(() => new PermissionGuard(reflector).canActivate(context(user))).toThrow(ForbiddenException);
  });

  it('denies a role that is not explicitly allowed', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([RoleKey.admin])
        .mockReturnValueOnce([]),
    } as unknown as Reflector;
    expect(() => new PermissionGuard(reflector).canActivate(context(user))).toThrow('ROLE_NOT_ALLOWED');
  });
});
