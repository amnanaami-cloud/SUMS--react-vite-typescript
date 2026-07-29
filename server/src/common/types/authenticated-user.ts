import { RoleKey } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  sessionId: string;
  activeRole: RoleKey;
  roles: RoleKey[];
  permissions: string[];
  universityId: string | null;
  employeeId: string | null;
  studentProfileId: string | null;
  employeeProfileId: string | null;
  departmentId: string | null;
  programId: string | null;
  scopeType: string | null;
  scopeId: string | null;
}
