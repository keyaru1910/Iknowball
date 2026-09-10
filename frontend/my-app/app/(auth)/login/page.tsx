"use client";

import React, { Suspense, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../lib/api/client";

// ─── Icon components nhỏ gọn ────────────────────────────────────────────────

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ─── Component chính ─────────────────────────────────────────────────────────

function LoginForm() {
  const emailId = useId();
  const passwordId = useId();

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const { login, isAuthenticated } = useAuth();

  // Nếu đã đăng nhập rồi thì redirect luôn
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg] = useState<string | null>(
    searchParams.get("registered") === "1"
      ? "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản rồi đăng nhập."
      : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate đơn giản
    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace(redirectTo);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Email hoặc mật khẩu không đúng.");
      } else {
        setError("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md"
        style={{ animation: "fadeInUp 0.4s ease both" }}
      >
        {/* Card */}
        <div
          className="rounded-2xl border p-8 shadow-2xl backdrop-blur-sm"
          style={{
            background: "rgba(18, 22, 29, 0.85)",
            borderColor: "rgba(35, 41, 53, 0.8)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(47,217,140,0.05)",
          }}
        >
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <img
                src="/img/fasvicon.png"
                alt="iKnowBall"
                className="h-8 w-8 rounded-lg object-contain group-hover:opacity-90 transition-opacity"
              />
              <span className="text-xl font-black tracking-tight text-white">
                iKnow<span style={{ color: "#2FD98C" }}>Ball</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-white">Chào mừng trở lại</h1>
            <p className="mt-1.5 text-sm" style={{ color: "#8890A0" }}>
              Đăng nhập để xem dự đoán & phân tích bóng đá
            </p>
          </div>

          {/* Thông báo đăng ký thành công */}
          {successMsg && (
            <div
              className="mb-5 rounded-xl border px-4 py-3 text-sm"
              style={{
                background: "rgba(47,217,140,0.08)",
                borderColor: "rgba(47,217,140,0.3)",
                color: "#2FD98C",
              }}
              role="status"
            >
              {successMsg}
            </div>
          )}

          {/* Lỗi */}
          {error && (
            <div
              className="mb-5 rounded-xl border px-4 py-3 text-sm"
              style={{
                background: "rgba(229,72,77,0.08)",
                borderColor: "rgba(229,72,77,0.3)",
                color: "#E5484D",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor={emailId}
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "#EDEFF3" }}
              >
                Email
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#565E6C" }}
                >
                  <IconMail />
                </span>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2"
                  style={{
                    background: "rgba(7, 9, 14, 0.7)",
                    borderColor: "#232935",
                    color: "#EDEFF3",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#2FD98C";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(47,217,140,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#232935";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor={passwordId}
                  className="text-sm font-medium"
                  style={{ color: "#EDEFF3" }}
                >
                  Mật khẩu
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors hover:text-white"
                  style={{ color: "#8890A0" }}
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#565E6C" }}
                >
                  <IconLock />
                </span>
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border py-2.5 pl-10 pr-11 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(7, 9, 14, 0.7)",
                    borderColor: "#232935",
                    color: "#EDEFF3",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#2FD98C";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(47,217,140,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#232935";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 transition-colors hover:text-white"
                  style={{ color: "#565E6C" }}
                >
                  <IconEye open={showPassword} />
                </button>
              </div>
            </div>

            {/* Nút Đăng nhập */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isSubmitting
                  ? "#1E9A63"
                  : "linear-gradient(135deg, #2FD98C 0%, #1E9A63 100%)",
                color: "#07090E",
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng nhập…
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "#232935" }} />
            <span className="text-xs" style={{ color: "#565E6C" }}>
              hoặc
            </span>
            <div className="h-px flex-1" style={{ background: "#232935" }} />
          </div>

          {/* Đăng nhập bằng Google */}
          <a
            id="btn-login-google"
            href={`${backendUrl}/api/v1/auth/google`}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border py-2.5 text-sm font-medium transition-all hover:border-white/20 hover:bg-white/5"
            style={{ borderColor: "#232935", color: "#EDEFF3" }}
          >
            <IconGoogle />
            Tiếp tục với Google
          </a>

          {/* Link đăng ký */}
          <p className="mt-6 text-center text-sm" style={{ color: "#8890A0" }}>
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="font-semibold transition-colors hover:underline"
              style={{ color: "#2FD98C" }}
            >
              Đăng ký miễn phí
            </Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white text-sm">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
