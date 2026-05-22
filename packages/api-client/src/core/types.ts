export interface FetchOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: TBody;
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  successMsg?: string;
  suppressErrorToast?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}


