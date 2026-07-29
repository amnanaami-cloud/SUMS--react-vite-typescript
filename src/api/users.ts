import { apiRequest } from './client';
import type { AuditEntry, Page, StudentListItem, UserListItem } from './types';
export const usersApi = {
  students: (search = '') =>
    apiRequest<Page<StudentListItem>>(`/students?pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  users: (search = '') =>
    apiRequest<Page<UserListItem>>(`/users?pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  audit: () => apiRequest<Page<AuditEntry>>('/audit?pageSize=100'),
  updateProfile: (body: Record<string, unknown>) =>
    apiRequest('/profile', { method: 'PATCH', body: JSON.stringify(body) }),
};
