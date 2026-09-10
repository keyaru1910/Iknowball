import type { ApiEnvelope, ApiErrorBody } from "../api/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

let currentAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setApiAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getApiAccessToken(): string | null {
  return currentAccessToken;
}

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

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        setApiAccessToken(null);
        return null;
      }

      const body = await res.json();
      const newToken = body?.data?.tokens?.accessToken ?? null;
      setApiAccessToken(newToken);
      return newToken;
    } catch {
      setApiAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Wrapper fetch duy nhất cho toàn bộ FE — mọi endpoint đi qua đây để:
 * 1. Tự động gắn prefix /api/v1
 * 2. Tự động gắn header Authorization Bearer token nếu có
 * 3. Tự động refresh token khi gặp 401 Unauthorized
 * 4. Parse đúng shape { data, meta, error } của backend
 * 5. Ném ApiError có code/message rõ ràng thay vì lỗi generic fetch
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  retryOn401 = true
): Promise<ApiFetchResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };

  // Tự động đính kèm accessToken nếu có và header chưa có Authorization
  if (currentAccessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${currentAccessToken}`;
  }

  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...init,
    headers,
    credentials: "include", // gửi kèm cookie refresh token
  });

  // Tự động refresh token nếu bị 401 (và không phải endpoint refresh/login)
  if (
    res.status === 401 &&
    retryOn401 &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/refresh")
  ) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return apiFetch<T>(
        path,
        {
          ...init,
          headers: {
            ...init?.headers,
            Authorization: `Bearer ${newToken}`,
          },
        },
        false
      );
    }
  }

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

