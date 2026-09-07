import type { ApiEnvelope, ApiErrorBody } from "../api/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(body: ApiErrorBody, status: number) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.status = status;
  }
}

export interface ApiFetchResult<T> {
  data: T;
  meta?: ApiEnvelope<T>["meta"];
}

/**
 * Wrapper fetch duy nhất cho toàn bộ FE — mọi endpoint đi qua đây để:
 * 1. Tự động gắn prefix /api/v1
 * 2. Parse đúng shape { data, meta, error } của backend
 * 3. Ném ApiError có code/message rõ ràng thay vì lỗi generic fetch
 *
 * Không tự parse response ở từng endpoint — tránh lặp logic xử lý lỗi.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ApiFetchResult<T>> {
  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include", // gửi kèm cookie refresh token
  });

  let body: ApiEnvelope<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(
      { code: "PARSE_ERROR", message: "Không đọc được phản hồi từ server" },
      res.status
    );
  }

  if (!res.ok || body.error) {
    throw new ApiError(
      body.error ?? { code: "UNKNOWN_ERROR", message: "Có lỗi xảy ra" },
      res.status
    );
  }

  if (body.data === null) {
    throw new ApiError(
      { code: "EMPTY_RESPONSE", message: "Server trả về dữ liệu rỗng" },
      res.status
    );
  }

  return { data: body.data, meta: body.meta };
}
