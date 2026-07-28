import { apiRequest } from './client';
import type { GradeSection, GradeSubmission, Transcript } from './types';
export const gradesApi = {
  section: (id: string) => apiRequest<GradeSection>(`/grades/sections/${id}`),
  pending: () => apiRequest<GradeSubmission[]>('/grades/submissions/pending'),
  saveScores: (assessmentId: string, grades: Array<{ enrollmentId: string; score: number }>) =>
    apiRequest(`/grades/assessments/${assessmentId}/scores`, { method: 'POST', body: JSON.stringify({ grades }) }),
  submit: (sectionId: string) => apiRequest(`/grades/sections/${sectionId}/submit`, { method: 'POST' }),
  publish: (sectionId: string) => apiRequest(`/grades/sections/${sectionId}/publish`, { method: 'POST' }),
  returnSubmission: (sectionId: string, reason: string) =>
    apiRequest(`/grades/sections/${sectionId}/return`, { method: 'POST', body: JSON.stringify({ reason }) }),
  transcript: (studentId?: string) =>
    apiRequest<Transcript>(`/grades/transcript${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`),
  appeal: (finalGradeId: string, reason: string) =>
    apiRequest('/grades/appeals', { method: 'POST', body: JSON.stringify({ finalGradeId, reason }) }),
};
