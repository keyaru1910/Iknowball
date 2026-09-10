"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../lib/api/client";

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

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

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Kiểm tra độ mạnh mật khẩu ───────────────────────────────────────────────

interface PasswordStrength {
  level: 0 | 1 | 2 | 3; // 0 = rỗng, 1 = yếu, 2 = trung bình, 3 = mạnh
  label: string;
  color: string;
}

function checkPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;

  if (score === 1) return { level: 1, label: "Yếu", color: "#E5484D" };
  if (score === 2) return { level: 2, label: "Trung bình", color: "#F2A93B" };
  return { level: 3, label: "Mạnh", color: "#2FD98C" };
}

// ─── Component chính ─────────────────────────────────────────────────────────

export default function RegisterPage() {
  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  // Nếu đã đăng nhập thì redirect về trang chủ
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const passwordStrength = checkPasswordStrength(password);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên.";
    if (!email.trim()) errors.email = "Vui lòng nhập email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Email không hợp lệ.";
    if (!password) errors.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 8)
      errors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    if (!confirmPassword)
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim() || undefined,
      });
      // Đăng ký xong → chuyển sang trang login kèm thông báo
      router.push("/login?registered=1");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("Email này đã được sử dụng. Vui lòng dùng email khác.");
        } else {
          setError(err.message || "Đăng ký thất bại, vui lòng thử lại.");
        }
      } else {
        setError("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    background: "rgba(7, 9, 14, 0.7)",
    borderColor: hasError ? "#E5484D" : "#232935",
    color: "#EDEFF3",
  });

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#2FD98C";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(47,217,140,0.12)";
  }
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#232935";
    e.currentTarget.style.boxShadow = "none";
  }

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
          <div className="mb-7 text-center">
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
            <h1 className="text-2xl font-bold text-white">Tạo tài khoản</h1>
            <p className="mt-1.5 text-sm" style={{ color: "#8890A0" }}>
              Miễn phí — không cần thẻ tín dụng
            </p>
          </div>

          {/* Lỗi tổng */}
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
            {/* Họ tên */}
            <div>
              <label htmlFor={fullNameId} className="mb-1.5 block text-sm font-medium" style={{ color: "#EDEFF3" }}>
                Họ và tên
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#565E6C" }}>
                  <IconUser />
                </span>
                <input
                  id={fullNameId}
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                  style={inputStyle(!!fieldErrors.fullName)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs" style={{ color: "#E5484D" }}>{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium" style={{ color: "#EDEFF3" }}>
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#565E6C" }}>
                  <IconMail />
                </span>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                  style={inputStyle(!!fieldErrors.email)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs" style={{ color: "#E5484D" }}>{fieldErrors.email}</p>
              )}
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium" style={{ color: "#EDEFF3" }}>
                Mật khẩu
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#565E6C" }}>
                  <IconLock />
                </span>
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-11 text-sm outline-none transition-all"
                  style={inputStyle(!!fieldErrors.password)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 transition-colors hover:text-white" style={{ color: "#565E6C" }}>
                  <IconEye open={showPassword} />
                </button>
              </div>
              {/* Strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= passwordStrength.level ? passwordStrength.color : "#232935",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: passwordStrength.color }}>
                    Mật khẩu {passwordStrength.label.toLowerCase()}
                  </p>
                </div>
              )}
              {fieldErrors.password && (
                <p className="mt-1 text-xs" style={{ color: "#E5484D" }}>{fieldErrors.password}</p>
              )}
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label htmlFor={confirmPasswordId} className="mb-1.5 block text-sm font-medium" style={{ color: "#EDEFF3" }}>
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#565E6C" }}>
                  <IconLock />
                </span>
                <input
                  id={confirmPasswordId}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-11 text-sm outline-none transition-all"
                  style={inputStyle(!!fieldErrors.confirmPassword)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                {/* Icon check nếu khớp */}
                {confirmPassword && password === confirmPassword && (
                  <span className="absolute right-10 top-1/2 -translate-y-1/2" style={{ color: "#2FD98C" }}>
                    <IconCheck />
                  </span>
                )}
                <button type="button" aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 transition-colors hover:text-white" style={{ color: "#565E6C" }}>
                  <IconEye open={showConfirmPassword} />
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs" style={{ color: "#E5484D" }}>{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Điều khoản */}
            <p className="text-xs leading-relaxed" style={{ color: "#565E6C" }}>
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <Link href="/terms" className="underline hover:text-white transition-colors">Điều khoản sử dụng</Link>
              {" "}và{" "}
              <Link href="/privacy" className="underline hover:text-white transition-colors">Chính sách bảo mật</Link>.
            </p>

            {/* Nút đăng ký */}
            <button
              id="btn-register-submit"
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #2FD98C 0%, #1E9A63 100%)",
                color: "#07090E",
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tạo tài khoản…
                </span>
              ) : (
                "Tạo tài khoản miễn phí"
              )}
            </button>
          </form>

          {/* Link đăng nhập */}
          <p className="mt-6 text-center text-sm" style={{ color: "#8890A0" }}>
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="font-semibold transition-colors hover:underline"
              style={{ color: "#2FD98C" }}
            >
              Đăng nhập
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
