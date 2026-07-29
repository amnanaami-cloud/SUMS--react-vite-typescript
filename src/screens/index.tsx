import type { Role } from '../types';
import {
  StudentDashboard,
  StudentRegistration,
  StudentCourses,
  StudentGrades,
  StudentAttendance,
  StudentTranscript,
} from './student';
import { InstructorDashboard, InstructorAttendance, InstructorGrades, InstructorAnnouncements } from './instructor';
import { AdvisorDashboard, AdvisorApprovals } from './advisor';
import { RegistrarDashboard, RegistrarCourses, RegistrarMonitoring } from './registrar';
import {
  DeanDashboard,
  DeanAnalytics,
  DeanPlanning,
  DeanSettings,
  DeptDashboard,
  DeptApprovals,
  DeptStaff,
} from './dean';
import { AdminDashboard, AdminUsers, AdminRoles, AdminAudit, AdminSettings } from './admin';
import {
  Profile,
  WeeklySchedule,
  Reports,
  GenericDashboard,
  StudentsTable,
  Curriculum,
  ProgramProgress,
  Terms,
} from './shared';

/** Registry keyed by `${role}.${screen}` */
export const SCREENS: Record<string, () => JSX.Element> = {
  'student.dashboard': StudentDashboard,
  'student.registration': StudentRegistration,
  'student.courses': StudentCourses,
  'student.grades': StudentGrades,
  'student.attendance': StudentAttendance,
  'student.transcript': StudentTranscript,
  'student.profile': Profile,
  'instructor.dashboard': InstructorDashboard,
  'instructor.attendance': InstructorAttendance,
  'instructor.grades': InstructorGrades,
  'instructor.classes': InstructorDashboard,
  'instructor.schedule': WeeklySchedule,
  'instructor.announcements': InstructorAnnouncements,
  'instructor.profile': Profile,
  'advisor.dashboard': AdvisorDashboard,
  'advisor.advisees': () => <StudentsTable withActions={false} />,
  'advisor.approvals': AdvisorApprovals,
  'advisor.reports': Reports,
  'advisor.profile': Profile,
  'registrar.dashboard': RegistrarDashboard,
  'registrar.students': () => <StudentsTable withActions={true} />,
  'registrar.courses': RegistrarCourses,
  'registrar.monitoring': RegistrarMonitoring,
  'registrar.reports': Reports,
  'registrar.profile': Profile,
  'dean.dashboard': DeanDashboard,
  'dean.analytics': DeanAnalytics,
  'dean.planning': DeanPlanning,
  'dean.settings': DeanSettings,
  'depthead.dashboard': DeptDashboard,
  'depthead.approvals': DeptApprovals,
  'depthead.schedule': WeeklySchedule,
  'depthead.staff': DeptStaff,
  'depthead.reports': Reports,
  'admin.dashboard': AdminDashboard,
  'admin.users': AdminUsers,
  'admin.roles': AdminRoles,
  'admin.audit': AdminAudit,
  'admin.settings': AdminSettings,
  'admin.profile': Profile,
  'coordinator.dashboard': GenericDashboard,
  'coordinator.curriculum': Curriculum,
  'coordinator.progress': ProgramProgress,
  'coordinator.students': () => <StudentsTable withActions={true} />,
  'coordinator.reports': Reports,
  'coordinator.profile': Profile,
  'uniregistrar.dashboard': GenericDashboard,
  'uniregistrar.students': () => <StudentsTable withActions={true} />,
  'uniregistrar.terms': Terms,
  'uniregistrar.reports': Reports,
  'uniregistrar.profile': Profile,
};

export function screenKey(role: Role, screen: string) {
  return `${role}.${screen}`;
}
