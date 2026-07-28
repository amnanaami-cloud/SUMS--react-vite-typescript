import { apiRequest } from './client';
import type { SystemSetting } from './types';
export const settingsApi = {
  list: () => apiRequest<SystemSetting[]>('/settings'),
  policies: () => apiRequest<Array<Record<string, unknown>>>('/academic-policies'),
  update: (key: string, value: Record<string, unknown>, reason: string) =>
    apiRequest(`/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value, reason }) }),
};
