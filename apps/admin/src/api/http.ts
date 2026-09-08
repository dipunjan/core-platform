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

const AREA_BY_HOST: Record<string, string> = {
  'localhost:3000': 'sign-in',
  'localhost:3001': 'product catalog',
  'localhost:3002': 'stock levels',
  'localhost:3003': 'shopping carts',
  'localhost:3004': 'orders and payments',
};

function offlineMessage(err: AxiosError): string {
  const url = err.config?.url ?? '';
  try {
    const host = new URL(url, window.location.origin).host;
    const area = AREA_BY_HOST[host];
    if (area) {
      return `Can't load ${area} right now. Refresh the page, or try again in a moment.`;
    }
  } catch {
    /* fall through */
  }
  return "Can't connect to the shop right now. Refresh the page, or try again in a moment.";
}

function isOfflineError(err: AxiosError): boolean {
  return (
    !err.response &&
    (err.code === 'ERR_NETWORK' ||
      err.code === 'ECONNREFUSED' ||
      err.message === 'Network Error')
  );
}

/** User-facing message for any failed API call (axios, wrapped Error, or unknown). */
export function apiMessage(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    if (isOfflineError(err)) {
      return offlineMessage(err);
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

/** Display message for any query/mutation error. */
export function queryError(error: unknown, fallback = ''): string {
  if (!error) {
    return fallback;
  }
  return apiMessage(error, fallback);
}

function rejectApiError(error: unknown, fallback = 'Request failed'): Promise<never> {
  if (axios.isCancel(error)) {
    return Promise.reject(error);
  }
  if (error instanceof Error && !axios.isAxiosError(error)) {
    return Promise.reject(error);
  }
  return Promise.reject(new Error(apiMessage(error, fallback), { cause: error }));
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
      return rejectApiError(error);
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
      return rejectApiError(error);
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
