import { RoleKey } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UsersService } from './users.service';

const admin: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  sessionId: '00000000-0000-0000-0000-000000000002',
  activeRole: RoleKey.admin,
  roles: [RoleKey.admin],
  permissions: ['roles.manage'],
  universityId: null,
  employeeId: 'E20260001',
  studentProfileId: null,
  employeeProfileId: '00000000-0000-0000-0000-000000000003',
  departmentId: null,
  programId: null,
  scopeType: null,
  scopeId: null,
};

describe('UsersService role authorization', () => {
  it('prevents administrators from changing their own roles', async () => {
    const service = new UsersService({} as PrismaService, {} as AuditService);
    await expect(
      service.replaceRoles(admin, admin.id, { roles: [RoleKey.student], reason: 'self escalation attempt' }),
    ).rejects.toThrow('CANNOT_CHANGE_OWN_ROLES');
  });
});
