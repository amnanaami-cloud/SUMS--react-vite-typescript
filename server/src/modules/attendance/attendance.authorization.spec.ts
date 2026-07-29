import { ForbiddenException } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AttendanceService } from './attendance.service';

const baseUser: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  sessionId: '00000000-0000-0000-0000-000000000002',
  activeRole: RoleKey.student,
  roles: [RoleKey.student],
  permissions: ['attendance.read'],
  universityId: '2202100054',
  employeeId: null,
  studentProfileId: '00000000-0000-0000-0000-000000000003',
  employeeProfileId: null,
  departmentId: null,
  programId: '00000000-0000-0000-0000-000000000004',
  scopeType: null,
  scopeId: null,
};

describe('AttendanceService resource authorization', () => {
  it('prevents a student from reading another student attendance record', async () => {
    const service = new AttendanceService({} as PrismaService, {} as AuditService);
    await expect(service.studentSummary(baseUser, '00000000-0000-0000-0000-000000000099')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('prevents an advisor from reading an unassigned student attendance record', async () => {
    const prisma = { advisorAssignment: { count: jest.fn().mockResolvedValue(0) } } as unknown as PrismaService;
    const service = new AttendanceService(prisma, {} as AuditService);
    await expect(
      service.studentSummary(
        {
          ...baseUser,
          activeRole: RoleKey.advisor,
          roles: [RoleKey.advisor],
          studentProfileId: null,
          employeeProfileId: '00000000-0000-0000-0000-000000000010',
        },
        '00000000-0000-0000-0000-000000000099',
      ),
    ).rejects.toThrow('ADVISEE_SCOPE_DENIED');
  });

  it('prevents an instructor from opening an unassigned roster', async () => {
    const prisma = {
      instructorSectionAssignment: { count: jest.fn().mockResolvedValue(0) },
    } as unknown as PrismaService;
    const service = new AttendanceService(prisma, {} as AuditService);
    await expect(
      service.roster(
        {
          ...baseUser,
          activeRole: RoleKey.instructor,
          roles: [RoleKey.instructor],
          studentProfileId: null,
          employeeProfileId: '00000000-0000-0000-0000-000000000010',
        },
        '00000000-0000-0000-0000-000000000099',
      ),
    ).rejects.toThrow('SECTION_NOT_ASSIGNED');
  });
});
