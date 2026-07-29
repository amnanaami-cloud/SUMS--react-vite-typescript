import { apiRequest } from './client';
import type { RegistrationRequest, StudentCourseEnrollment } from './types';
export const registrationsApi = {
  mine: () => apiRequest<RegistrationRequest[]>('/registrations/mine'),
  pending: () => apiRequest<RegistrationRequest[]>('/registrations/pending'),
  submit: (termId: string, sectionIds: string[]) =>
    apiRequest<RegistrationRequest>('/registrations', { method: 'POST', body: JSON.stringify({ termId, sectionIds }) }),
  decide: (id: string, outcome: 'APPROVED' | 'REJECTED' | 'RETURNED', reason: string) =>
    apiRequest<RegistrationRequest>(`/registrations/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ outcome, reason }),
    }),
  finalize: (id: string) => apiRequest<RegistrationRequest>(`/registrations/${id}/finalize`, { method: 'POST' }),
  drop: (id: string, reason: string) =>
    apiRequest<StudentCourseEnrollment>(`/registrations/enrollments/${id}/drop`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
