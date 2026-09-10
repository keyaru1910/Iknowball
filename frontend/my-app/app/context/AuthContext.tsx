"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  loginWithCredentials,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../lib/api/endpoints/auth";
import { setApiAccessToken } from "../lib/api/client";


// ─── Kiểu dữ liệu Context ────────────────────────────────────────────────────

interface AuthContextValue {
  /** Thông tin user hiện tại — null nếu chưa đăng nhập */
  user: AuthUser | null;
  /** Access token lưu trong memory — không bao giờ để vào localStorage */
  accessToken: string | null;
  /** true khi đang khôi phục session ban đầu (check cookie) */
  isLoading: boolean;
  /** Người dùng đã đăng nhập chưa */
  isAuthenticated: boolean;
  /** Người dùng có role admin không */
  isAdmin: boolean;
  /** Đăng nhập bằng email + password */
  login: (payload: LoginPayload) => Promise<void>;
  /** Đăng ký tài khoản mới */
  register: (payload: RegisterPayload) => Promise<void>;
  /** Đăng xuất */
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tránh gọi refresh nhiều lần khi mount
  const hasInitialized = useRef(false);

  /**
   * Khôi phục session khi app khởi động:
   * Gọi /auth/refresh — nếu còn refreshToken trong HttpOnly cookie,
   * backend sẽ trả về access token mới + thông tin user.
   */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      try {
        const res = await refreshAccessToken();
        const token = res.data.tokens.accessToken;
        setAccessToken(token);
        setApiAccessToken(token);
        setUser(res.data.user);
      } catch {
        // Chưa đăng nhập hoặc refresh token hết hạn — bình thường
        setUser(null);
        setAccessToken(null);
        setApiAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /** Đăng nhập */
  const login = useCallback(async (payload: LoginPayload) => {
    const res = await loginWithCredentials(payload);
    const token = res.data.tokens.accessToken;
    setAccessToken(token);
    setApiAccessToken(token);
    setUser(res.data.user);
  }, []);

  /** Đăng ký — chỉ tạo tài khoản, không tự đăng nhập */
  const register = useCallback(async (payload: RegisterPayload) => {
    await registerUser(payload);
    // Không set user ở đây vì cần verify email trước
  }, []);

  /** Đăng xuất */
  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await logoutUser(accessToken);
      } catch {
        // Dù lỗi vẫn clear state phía client
      }
    }
    setUser(null);
    setAccessToken(null);
    setApiAccessToken(null);
  }, [accessToken]);


  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
      register,
    }),
    [user, accessToken, isLoading, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Hook để truy cập AuthContext.
 * Phải dùng bên trong <AuthProvider>.
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext phải được dùng bên trong <AuthProvider>");
  }
  return ctx;
}
