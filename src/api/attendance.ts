import { apiRequest } from './client';
import type { AttendanceSummary, CourseSection } from './types';
export const attendanceApi = {
  sections: () => apiRequest<Array<{ id: string; sectionId: string; section: CourseSection }>>('/attendance/sections'),
  roster: (sectionId: string) =>
    apiRequest<
      Array<{
        id: string;
        student: {
          universityId: string;
          user: { firstNameEn: string; lastNameEn: string; firstNameAr: string; lastNameAr: string };
        };
      }>
    >(`/attendance/sections/${sectionId}/roster`),
  createSession: (sectionId: string, sessionDate: string, startsAt: string) =>
    apiRequest<{ id: string; sectionId: string }>('/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify({ sectionId, sessionDate, startsAt }),
    }),
  save: (sessionId: string, records: Array<Record<string, unknown>>) =>
    apiRequest<{ sessionId: string; saved: number }>(`/attendance/sessions/${sessionId}/records`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    }),
  summary: () => apiRequest<AttendanceSummary[]>('/attendance/summary'),
};
