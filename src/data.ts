import type { Role } from './types';

export const ROLES: Role[] = ['student', 'instructor', 'advisor', 'registrar', 'admin', 'depthead', 'coordinator', 'dean', 'uniregistrar'];

export const MENUS: Record<Role, [string, string][]> = {
  student: [['dashboard', 'home'], ['registration', 'edit'], ['courses', 'book'], ['grades', 'chart'], ['attendance', 'check'], ['transcript', 'graduation'], ['profile', 'user']],
  instructor: [['dashboard', 'home'], ['attendance', 'check'], ['grades', 'chart'], ['classes', 'book'], ['schedule', 'calendar'], ['announcements', 'bell'], ['profile', 'user']],
  advisor: [['dashboard', 'home'], ['advisees', 'users'], ['approvals', 'clock'], ['reports', 'layers'], ['profile', 'user']],
  registrar: [['dashboard', 'home'], ['students', 'users'], ['courses', 'book'], ['monitoring', 'layers'], ['reports', 'chart'], ['profile', 'user']],
  dean: [['dashboard', 'home'], ['analytics', 'chart'], ['planning', 'building'], ['settings', 'cog']],
  depthead: [['dashboard', 'home'], ['approvals', 'clock'], ['schedule', 'calendar'], ['staff', 'users'], ['reports', 'layers']],
  admin: [['dashboard', 'home'], ['users', 'users'], ['roles', 'shield'], ['audit', 'layers'], ['settings', 'cog'], ['profile', 'user']],
  coordinator: [['dashboard', 'home'], ['curriculum', 'book'], ['progress', 'chart'], ['students', 'users'], ['reports', 'layers'], ['profile', 'user']],
  uniregistrar: [['dashboard', 'home'], ['students', 'users'], ['terms', 'calendar'], ['reports', 'chart'], ['profile', 'user']],
};

export const BUILT: Record<Role, string[]> = {
  student: ['dashboard', 'registration', 'courses', 'grades', 'attendance', 'transcript', 'profile'],
  instructor: ['dashboard', 'attendance', 'grades', 'classes', 'schedule', 'announcements', 'profile'],
  advisor: ['dashboard', 'advisees', 'approvals', 'reports', 'profile'],
  registrar: ['dashboard', 'students', 'courses', 'monitoring', 'reports', 'profile'],
  dean: ['dashboard', 'analytics', 'planning', 'settings'],
  depthead: ['dashboard', 'approvals', 'schedule', 'staff', 'reports'],
  admin: ['dashboard', 'users', 'roles', 'audit', 'settings', 'profile'],
  coordinator: ['dashboard', 'curriculum', 'progress', 'students', 'reports', 'profile'],
  uniregistrar: ['dashboard', 'students', 'terms', 'reports', 'profile'],
};

export const AVATAR: Record<Role, string> = { student: '#BFDBFE', instructor: '#FBCA89', advisor: '#A7F3D0', registrar: '#C7D2FE', dean: '#F5E0A3', depthead: '#FBCFE8', admin: '#9CA3AF', coordinator: '#FDE68A', uniregistrar: '#BAE6FD' };

export const NAMES: Record<Role, [string, string, string]> = {
  student: ['Layla Nassar', 'ليلى نصار', 'L'], instructor: ['Dr. Ahmad Khalil', 'د. أحمد خليل', 'A'], advisor: ['Dr. Mona Saleh', 'د. منى صالح', 'M'], registrar: ['Kareem Odeh', 'كريم عودة', 'K'], dean: ['Prof. Sami Barghouti', 'أ.د. سامي البرغوثي', 'S'], depthead: ['Dr. Huda Nassar', 'د. هدى نصار', 'H'], admin: ['System Admin', 'مدير النظام', 'S'], coordinator: ['Rana Ali', 'رنا علي', 'R'], uniregistrar: ['Tariq Mansour', 'طارق منصور', 'T'],
};

export interface Course { code: string; en: string; ar: string; cr: number; sch: string; schAr: string; room: string; instr: string; instrAr: string; seats: number; pre: string; }
export const COURSES: Course[] = [
  { code: 'CS301', en: 'Data Structures', ar: 'هياكل البيانات', cr: 3, sch: 'Sun/Tue 09:00', schAr: 'أحد/ثلاثاء ٠٩:٠٠', room: 'B-204', instr: 'Dr. Khalil', instrAr: 'د. خليل', seats: 8, pre: 'CS201' },
  { code: 'CS340', en: 'Operating Systems', ar: 'نظم التشغيل', cr: 3, sch: 'Mon/Wed 11:00', schAr: 'إثنين/أربعاء ١١:٠٠', room: 'A-110', instr: 'Dr. Odeh', instrAr: 'د. عودة', seats: 3, pre: 'CS301' },
  { code: 'CS355', en: 'Database Systems', ar: 'نظم قواعد البيانات', cr: 3, sch: 'Sun/Tue 12:30', schAr: 'أحد/ثلاثاء ١٢:٣٠', room: 'B-201', instr: 'Dr. Saleh', instrAr: 'د. صالح', seats: 0, pre: 'CS301' },
  { code: 'MATH210', en: 'Linear Algebra', ar: 'الجبر الخطي', cr: 3, sch: 'Mon/Wed 09:00', schAr: 'إثنين/أربعاء ٠٩:٠٠', room: 'C-305', instr: 'Dr. Barghouti', instrAr: 'د. البرغوثي', seats: 12, pre: 'MATH101' },
  { code: 'ENG201', en: 'Technical Writing', ar: 'الكتابة التقنية', cr: 2, sch: 'Thu 10:00', schAr: 'خميس ١٠:٠٠', room: 'D-102', instr: 'Ms. Haddad', instrAr: 'أ. حداد', seats: 20, pre: 'ENG101' },
];

export const GRADES: [string, string, string, number, string, number][] = [
  ['CS301', 'Data Structures', 'هياكل البيانات', 3, 'A', 4.0], ['CS340', 'Operating Systems', 'نظم التشغيل', 3, 'B+', 3.3], ['CS355', 'Database Systems', 'نظم قواعد البيانات', 3, 'A-', 3.7], ['MATH210', 'Linear Algebra', 'الجبر الخطي', 3, 'B', 3.0], ['ENG201', 'Technical Writing', 'الكتابة التقنية', 2, 'A', 4.0],
];
export const ATT: [string, string, string, number][] = [
  ['CS301', 'Data Structures', 'هياكل البيانات', 94], ['CS340', 'Operating Systems', 'نظم التشغيل', 88], ['CS355', 'Database Systems', 'نظم قواعد البيانات', 72], ['MATH210', 'Linear Algebra', 'الجبر الخطي', 91], ['ENG201', 'Technical Writing', 'الكتابة التقنية', 100],
];
export const TS: [string, string, string, string, number, number][] = [
  ['Fall 2025', 'خريف ٢٠٢٥', 'CS230, MATH201, PHYS101', 'هياكل، رياضيات، فيزياء', 15, 3.71], ['Spring 2025', 'ربيع ٢٠٢٥', 'CS201, MATH101, ENG101', 'برمجة، رياضيات، إنجليزي', 16, 3.55], ['Fall 2024', 'خريف ٢٠٢٤', 'CS101, MATH100, ARB101', 'مقدمة، رياضيات، عربي', 15, 3.48],
];
export const ROSTER: [string, string, string][] = [
  ['Omar Haddad', 'عمر حداد', '2022019'], ['Sara Mansour', 'سارة منصور', '2022044'], ['Yousef Ali', 'يوسف علي', '2021088'], ['Nour Khalil', 'نور خليل', '2022101'], ['Rami Saleh', 'رامي صالح', '2021133'], ['Dana Odeh', 'دانا عودة', '2022076'],
];
export const ADVISEES: [string, string, string, string, string, number, number, string, string][] = [
  ['Layla Nassar', 'ليلى نصار', '2021054', 'CS', 'علوم الحاسوب', 3, 3.62, 'Good', 'جيد'], ['Omar Haddad', 'عمر حداد', '2022019', 'CS', 'علوم الحاسوب', 2, 2.91, 'Good', 'جيد'], ['Sara Mansour', 'سارة منصور', '2022044', 'IT', 'تقنية معلومات', 2, 3.44, 'Good', 'جيد'], ['Yousef Ali', 'يوسف علي', '2021088', 'CS', 'علوم الحاسوب', 3, 2.05, 'Probation', 'إنذار'], ['Nour Khalil', 'نور خليل', '2022101', 'SE', 'هندسة برمجيات', 1, 3.88, 'Good', 'جيد'], ['Rami Saleh', 'رامي صالح', '2021133', 'CS', 'علوم الحاسوب', 4, 3.12, 'Good', 'جيد'],
];
export const AUDIT: [string, string, string, string, string][] = [
  ['2026-07-24 14:22', 'K. Odeh', '10.0.4.12', 'UPDATE', 'Student 2021054 · GPA'], ['2026-07-24 13:58', 'A. Khalil', '10.0.4.31', 'CREATE', 'Grade sheet CS301'], ['2026-07-24 11:04', 'admin', '10.0.0.2', 'LOGIN', 'Admin console'], ['2026-07-23 22:10', 'M. Saleh', '10.0.4.9', 'APPROVE', 'Registration 2022019'], ['2026-07-23 18:47', 'system', '127.0.0.1', 'BACKUP', 'Full DB snapshot'],
];

export function auditColor(a: string): string {
  return a === 'LOGIN' ? '#3B82F6' : a === 'CREATE' ? '#10B981' : a === 'UPDATE' ? '#F59E0B' : a === 'APPROVE' ? '#8B5CF6' : '#9CA3AF';
}
export function gradeBadgeColor(g: string): string {
  return g[0] === 'A' ? '#10B981' : g[0] === 'B' ? '#3B82F6' : g[0] === 'C' ? '#F59E0B' : '#EF4444';
}
