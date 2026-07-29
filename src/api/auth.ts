import type { Role } from '../types';
import { apiRequest, refreshSession, setAccessToken } from './client';
import type { AuthResult } from './types';

export const authApi = {
  login: async (identifier: string, password: string, requestedRole: Role) => {
    const result = await apiRequest<AuthResult>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ identifier, password, requestedRole }) },
      false,
    );
    setAccessToken(result.accessToken);
    const user = await apiRequest<AuthResult['user']>('/auth/me');
    return { ...result, user };
  },
  restore: refreshSession,
  me: () => apiRequest<AuthResult['user']>('/auth/me'),
  logout: async () => {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
    setAccessToken(null);
  },
  logoutAll: async () => {
    await apiRequest<void>('/auth/logout-all', { method: 'POST' });
    setAccessToken(null);
  },
  forgotPassword: (identifier: string) =>
    apiRequest<{ accepted: boolean }>(
      '/auth/forgot-password',
      { method: 'POST', body: JSON.stringify({ identifier }) },
      false,
    ),
  resetPassword: (token: string, newPassword: string) =>
    apiRequest<void>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }, false),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
