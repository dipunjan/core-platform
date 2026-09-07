import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { urls } from './urls';

type NestBody = { message?: string | string[] };

export function readCookie(name: string): string {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return '';
}

export function hasCsrfCookie(): boolean {
  return Boolean(readCookie('csrf_token'));
}

export function clearCsrfCookie(): void {
  document.cookie = 'csrf_token=; Path=/; Max-Age=0; SameSite=Lax';
}

function unreachableHost(err: AxiosError): string {
  const url = err.config?.url ?? '';
  try {
    return new URL(url, window.location.origin).host;
  } catch {
    return 'the API';
  }
}

export function apiMessage(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    if (
      !err.response &&
      (err.code === 'ERR_NETWORK' || err.message === 'Network Error')
    ) {
      return `Cannot reach ${unreachableHost(err)}. Start that service, then refresh.`;
    }
    const body = err.response?.data as NestBody | undefined;
    const msg = body?.message;
    if (Array.isArray(msg)) {
      return msg.join(', ');
    }
    if (typeof msg === 'string') {
      return msg;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export const http = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }
  const method = (config.method ?? 'get').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = readCookie('csrf_token');
    if (csrf) {
      config.headers.set('X-CSRF-Token', csrf);
    }
  }
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshWait: Promise<boolean> | null = null;

function shouldSkipRefresh(url: string | undefined): boolean {
  const path = url ?? '';
  return (
    path.includes('/auth/refresh') ||
    path.includes('/auth/login') ||
    path.endsWith('/users')
  );
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (
      !original ||
      error.response?.status !== 401 ||
      original._retried ||
      !hasCsrfCookie() ||
      shouldSkipRefresh(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retried = true;
    refreshWait ??= http
      .post(urls.refresh, {})
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshWait = null;
      });

    const refreshed = await refreshWait;
    if (!refreshed) {
      clearCsrfCookie();
      return Promise.reject(error);
    }
    return http.request(original);
  },
);

export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}
