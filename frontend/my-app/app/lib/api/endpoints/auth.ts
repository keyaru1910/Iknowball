import { apiFetch } from "../client";

// ─── Kiểu dữ liệu trả về từ backend ─────────────────────────────────────────

/** Thông tin user trả về từ /auth/me hoặc sau khi login */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  role: string; // "user" | "admin"
  createdAt: string;
}

/** Tokens trả về sau khi login thành công */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string; // cũng được set qua HttpOnly cookie
}

/** Response body của /auth/login */
export interface LoginResult {
  user: AuthUser;
  tokens: AuthTokens;
}

/** Body gửi lên khi đăng nhập */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Body gửi lên khi đăng ký */
export interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * Đăng nhập bằng email + mật khẩu.
 * Backend trả về { user, tokens } và set refreshToken vào HttpOnly cookie.
 */
export async function loginWithCredentials(payload: LoginPayload) {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Đăng ký tài khoản mới.
 * Sau khi đăng ký cần verify email trước khi đăng nhập được.
 */
export async function registerUser(payload: RegisterPayload) {
  return apiFetch<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Lấy thông tin user hiện tại (dùng access token trong header).
 * Trả về null nếu chưa đăng nhập hoặc token hết hạn.
 */
export async function getCurrentUser(accessToken: string): Promise<AuthUser | null> {
  try {
    const res = await apiFetch<AuthUser>("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  } catch {
    return null;
  }
}

/**
 * Làm mới access token bằng refreshToken trong cookie.
 */
export async function refreshAccessToken() {
  return apiFetch<LoginResult>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/**
 * Đăng xuất — xóa session trên server và xóa cookie refreshToken.
 */
export async function logoutUser(accessToken: string) {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
