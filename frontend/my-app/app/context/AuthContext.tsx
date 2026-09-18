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
  getCurrentUser,
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
  /** Đăng nhập bằng token nhận được từ OAuth */
  loginWithToken: (token: string, refreshToken?: string) => Promise<void>;
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
   * 1. Ưu tiên kiểm tra accessToken còn hạn trong localStorage để load ngay lập tức
   * 2. Nếu accessToken hết hạn, tự động gọi /auth/refresh bằng refreshToken
   */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Nếu đang ở trang callback (chờ nhận accessToken từ OAuth), để trang callback xử lý
    if (
      typeof window !== "undefined" &&
      (window.location.pathname.includes("/callback") ||
        window.location.search.includes("accessToken="))
    ) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const storedAccessToken =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;
        const storedRefreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;

        // Nếu có accessToken, thử lấy user trực tiếp trước (rất nhanh, không xoay vòng refresh token)
        if (storedAccessToken) {
          setApiAccessToken(storedAccessToken);
          const currentUser = await getCurrentUser(storedAccessToken);
          if (currentUser) {
            setAccessToken(storedAccessToken);
            setUser(currentUser);
            setIsLoading(false);
            return;
          }
        }

        // Nếu không có accessToken hoặc accessToken đã hết hạn, dùng refreshToken
        if (storedRefreshToken) {
          const res = await refreshAccessToken(storedRefreshToken);
          const token = res.data.tokens.accessToken;
          setAccessToken(token);
          setApiAccessToken(token);
          setUser(res.data.user);

          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", token);
            if (res.data.tokens?.refreshToken) {
              localStorage.setItem("refreshToken", res.data.tokens.refreshToken);
            }
          }
          setIsLoading(false);
          return;
        }

        // Không có token nào
        setUser(null);
        setAccessToken(null);
        setApiAccessToken(null);
      } catch {
        // Token không hợp lệ hoặc hết hạn
        setUser(null);
        setAccessToken(null);
        setApiAccessToken(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
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
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
      if (res.data.tokens?.refreshToken) {
        localStorage.setItem("refreshToken", res.data.tokens.refreshToken);
      }
    }
  }, []);

  /** Đăng nhập với Token có sẵn từ OAuth (Google) */
  const loginWithToken = useCallback(async (token: string, refreshToken?: string) => {
    setIsLoading(true);
    setAccessToken(token);
    setApiAccessToken(token);
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
    }
    try {
      const currentUser = await getCurrentUser(token);
      if (currentUser) {
        setUser(currentUser);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Đăng ký — chỉ tạo tài khoản, không tự đăng nhập */
  const register = useCallback(async (payload: RegisterPayload) => {
    await registerUser(payload);
    // Không set user ở đây vì cần verify email trước
  }, []);

  /** Đăng xuất */
  const logout = useCallback(async () => {
    const storedRefreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : undefined;

    if (accessToken) {
      try {
        await logoutUser(accessToken, storedRefreshToken || undefined);
      } catch {
        // Dù lỗi vẫn clear state phía client
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
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
      loginWithToken,
      logout,
      register,
    }),
    [user, accessToken, isLoading, login, loginWithToken, logout, register]
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
