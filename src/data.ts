import type { Role } from './types';

// Static navigation and visual tokens only. Academic and identity data is loaded from the API.
export const ROLES: Role[] = [
  'student',
  'instructor',
  'advisor',
  'registrar',
  'admin',
  'depthead',
  'coordinator',
  'dean',
  'uniregistrar',
];

export const MENUS: Record<Role, [string, string][]> = {
  student: [
    ['dashboard', 'home'],
    ['registration', 'edit'],
    ['courses', 'book'],
    ['grades', 'chart'],
    ['attendance', 'check'],
    ['transcript', 'graduation'],
    ['profile', 'user'],
  ],
  instructor: [
    ['dashboard', 'home'],
    ['attendance', 'check'],
    ['grades', 'chart'],
    ['classes', 'book'],
    ['schedule', 'calendar'],
    ['announcements', 'bell'],
    ['profile', 'user'],
  ],
  advisor: [
    ['dashboard', 'home'],
    ['advisees', 'users'],
    ['approvals', 'clock'],
    ['reports', 'layers'],
    ['profile', 'user'],
  ],
  registrar: [
    ['dashboard', 'home'],
    ['students', 'users'],
    ['courses', 'book'],
    ['monitoring', 'layers'],
    ['reports', 'chart'],
    ['profile', 'user'],
  ],
  dean: [
    ['dashboard', 'home'],
    ['analytics', 'chart'],
    ['planning', 'building'],
    ['settings', 'cog'],
  ],
  depthead: [
    ['dashboard', 'home'],
    ['approvals', 'clock'],
    ['schedule', 'calendar'],
    ['staff', 'users'],
    ['reports', 'layers'],
  ],
  admin: [
    ['dashboard', 'home'],
    ['users', 'users'],
    ['roles', 'shield'],
    ['audit', 'layers'],
    ['settings', 'cog'],
    ['profile', 'user'],
  ],
  coordinator: [
    ['dashboard', 'home'],
    ['curriculum', 'book'],
    ['progress', 'chart'],
    ['students', 'users'],
    ['reports', 'layers'],
    ['profile', 'user'],
  ],
  uniregistrar: [
    ['dashboard', 'home'],
    ['students', 'users'],
    ['terms', 'calendar'],
    ['reports', 'chart'],
    ['profile', 'user'],
  ],
};

export const BUILT: Record<Role, string[]> = Object.fromEntries(
  Object.entries(MENUS).map(([role, entries]) => [role, entries.map(([screen]) => screen)]),
) as Record<Role, string[]>;

export const AVATAR: Record<Role, string> = {
  student: '#BFDBFE',
  instructor: '#FBCA89',
  advisor: '#A7F3D0',
  registrar: '#C7D2FE',
  dean: '#F5E0A3',
  depthead: '#FBCFE8',
  admin: '#9CA3AF',
  coordinator: '#FDE68A',
  uniregistrar: '#BAE6FD',
};

export function gradeBadgeColor(grade: string): string {
  return grade[0] === 'A' ? '#10B981' : grade[0] === 'B' ? '#3B82F6' : grade[0] === 'C' ? '#F59E0B' : '#EF4444';
}
