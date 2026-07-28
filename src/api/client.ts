import { ApiError, parseApiError } from './errors';
import type { ApiEnvelope, AuthResult } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '/api/v1';
let accessToken: string | null = null;
let refreshPromise: Promise<AuthResult> | null = null;
let sessionExpiredHandler: (() => void) | null = null;
let sessionUpdatedHandler: ((result: AuthResult) => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const onSessionExpired = (handler: () => void) => {
  sessionExpiredHandler = handler;
};
export const onSessionUpdated = (handler: (result: AuthResult) => void) => {
  sessionUpdatedHandler = handler;
};

export async function refreshSession(): Promise<AuthResult> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw await parseApiError(response);
        const result = ((await response.json()) as ApiEnvelope<AuthResult>).data;
        accessToken = result.accessToken;
        sessionUpdatedHandler?.(result);
        return result;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, retryAuth = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
  if (response.status === 401 && retryAuth && path !== '/auth/refresh' && path !== '/auth/login') {
    try {
      await refreshSession();
      return apiRequest<T>(path, options, false);
    } catch {
      accessToken = null;
      sessionExpiredHandler?.();
      throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired');
    }
  }
  if (!response.ok) throw await parseApiError(response);
  if (response.status === 204) return undefined as T;
  return ((await response.json()) as ApiEnvelope<T>).data;
}

export async function downloadApi(path: string): Promise<Blob> {
  const headers = new Headers({ Accept: '*/*' });
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', headers });
  if (response.status === 401) {
    await refreshSession();
    headers.set('Authorization', `Bearer ${accessToken}`);
    response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', headers });
  }
  if (!response.ok) throw await parseApiError(response);
  return response.blob();
}
