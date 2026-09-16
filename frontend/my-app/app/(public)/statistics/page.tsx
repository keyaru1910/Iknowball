"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

export default function StatisticsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Tự động chuyển hướng sau 2 giây sang trang Hiệu năng dự đoán
    const timer = setTimeout(() => {
      router.replace("/predictions/performance");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <div
        className="rounded-xl border p-8 shadow-xl backdrop-blur-md"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(47, 217, 140, 0.15)", color: colors.accent }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Trọng tâm phân tích & Dự đoán AI
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: colors.textMuted }}>
          iKnowBall đã nâng cấp toàn bộ hệ thống để tập trung vào <strong>Mô hình Dự đoán Machine Learning</strong> và <strong>Hiệu năng thống kê định lượng</strong>.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/predictions/performance"
            className="w-full sm:w-auto rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: colors.accent, color: colors.bg }}
          >
            Xem hiệu năng mô hình AI →
          </Link>
          <Link
            href="/predictions"
            className="w-full sm:w-auto rounded-lg border px-6 py-2.5 text-sm font-semibold transition-all hover:bg-white/5"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            Xem danh sách dự đoán trận đấu
          </Link>
        </div>

        <p className="mt-6 text-xs" style={{ color: colors.textFaint }}>
          Đang tự động chuyển hướng sau vài giây...
        </p>
      </div>
    </div>
  );
}
