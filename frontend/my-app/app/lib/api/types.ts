export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

/** Khớp với convention { data, meta, error } đã chốt ở Phase 2 (Auth module) */
export interface ApiEnvelope<T> {
  data: T | null;
  meta?: ApiMeta | null;
  error?: ApiErrorBody | null;
}
