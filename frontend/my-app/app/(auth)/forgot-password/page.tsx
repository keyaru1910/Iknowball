"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setIsSuccess(true);
    } catch (err: any) {
      // Cho dù email không tồn tại hoặc có lỗi, có thể hiển thị thông báo an toàn hoặc lỗi cụ thể
      if (err?.message) {
        setErrorMessage(err.message);
      } else {
        setIsSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1527]/80 p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-black italic tracking-wider text-emerald-400">
              IKNOWBALL
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">Quên mật khẩu?</h1>
          <p className="mt-2 text-sm text-slate-400">
            Nhập email tài khoản của bạn để nhận liên kết khôi phục mật khẩu.
          </p>
        </div>

        {isSuccess ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-sm font-medium text-emerald-400">
              Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến <span className="font-semibold text-white">{email}</span>.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Địa chỉ Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@example.com"
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {isLoading ? "Đang gửi yêu cầu..." : "Gửi liên kết khôi phục"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                ← Quay lại Đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
