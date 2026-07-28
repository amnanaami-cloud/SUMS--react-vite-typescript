import { apiRequest } from './client';
import type {
  CourseSection,
  Dashboard,
  DegreeProgress,
  InstructorCourseAssignment,
  Meeting,
  MyCourse,
  StudentCourseEnrollment,
  Term,
} from './types';

export const academicApi = {
  dashboard: () => apiRequest<Dashboard>('/dashboard'),
  courses: (search = '') =>
    apiRequest<CourseSection[]>(`/courses${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  myCourses: () => apiRequest<Array<MyCourse | StudentCourseEnrollment | InstructorCourseAssignment>>('/courses/mine'),
  schedule: () => apiRequest<Meeting[]>('/schedule'),
  terms: () => apiRequest<Term[]>('/terms'),
  curriculum: () =>
    apiRequest<{
      id: string;
      nameEn: string;
      nameAr: string;
      program: { requiredCredits: number };
      courses: Array<{
        category: string;
        recommendedLevel: number;
        course: { code: string; nameEn: string; nameAr: string; credits: number };
      }>;
    } | null>('/curriculum'),
  degreeProgress: (studentId?: string) =>
    apiRequest<DegreeProgress>(`/degree-progress${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`),
  staff: () =>
    apiRequest<
      Array<{
        id: string;
        employeeId: string;
        titleEn: string | null;
        titleAr: string | null;
        user: { firstNameEn: string; lastNameEn: string; firstNameAr: string; lastNameAr: string; email: string };
        department: { nameEn: string; nameAr: string };
        _count: { sectionAssignments: number; advisorAssignments: number };
      }>
    >('/staff'),
  analytics: () =>
    apiRequest<{
      totalStudents: number;
      standing: Array<{ standing: string; _count: number }>;
      status: Array<{ status: string; _count: number }>;
    }>('/analytics'),
};
