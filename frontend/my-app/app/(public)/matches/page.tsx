"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

/**
 * Trang Matches cũ - Tự động chuyển hướng sang trang trung tâm /predictions
 */
export default function MatchesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/predictions");
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
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Đang chuyển hướng sang trang Dự đoán hôm nay...
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: colors.textMuted }}>
          iKnowBall đã chuyển đổi giao diện lịch thi đấu sang <strong>Trang Dự đoán trận đấu</strong> tập trung vào phân tích xác suất AI.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/predictions"
            className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: colors.accent, color: colors.bg }}
          >
            Đến trang Dự đoán hôm nay ngay →
          </Link>
        </div>
      </div>
    </div>
  );
}
