import { apiRequest } from './client';
import type { Announcement } from './types';
export const announcementsApi = {
  list: () => apiRequest<Announcement[]>('/announcements'),
  create: (body: Record<string, unknown>) =>
    apiRequest('/announcements', { method: 'POST', body: JSON.stringify(body) }),
};
