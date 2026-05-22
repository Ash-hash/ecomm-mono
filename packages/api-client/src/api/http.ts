import { fetcher } from '../core/fetcher';

export const api = {
  get: <T>(url: string, params?: any) =>
    fetcher<T>(url, { method: 'GET', params }),

  post: <T>(url: string, body?: any, opts?: any) =>
    fetcher<T>(url, { method: 'POST', body, ...opts }),

  patch: <T>(url: string, body?: any, opts?: any) =>
    fetcher<T>(url, { method: 'PATCH', body, ...opts }),

  delete: <T>(url: string, opts?: any) =>
    fetcher<T>(url, { method: 'DELETE', ...opts }),
};