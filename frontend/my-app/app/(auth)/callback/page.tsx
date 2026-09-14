"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    if (accessToken) {
      loginWithToken(accessToken).finally(() => {
        router.replace("/");
      });
    } else {
      router.replace("/login");
    }
  }, [searchParams, loginWithToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-300">Đang hoàn tất đăng nhập...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-sm text-slate-400">Đang tải...</div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
