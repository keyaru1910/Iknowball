"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { colors } from "../../../lib/design-tokens";

/**
 * Trang chi tiết trận đấu cũ - Tự động chuyển hướng sang /predictions/[matchId]
 */
export default function MatchDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = String(params?.id || "");

  useEffect(() => {
    if (matchId) {
      router.replace(`/predictions/${matchId}`);
    } else {
      router.replace("/predictions");
    }
  }, [matchId, router]);

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
          Đang chuyển hướng sang Chi tiết Dự đoán AI...
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: colors.textMuted }}>
          Dữ liệu trận đấu đã được tích hợp vào hệ thống phân tích chi tiết của mô hình AI.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href={matchId ? `/predictions/${matchId}` : "/predictions"}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: colors.accent, color: colors.bg }}
          >
            Đến trang Chi tiết dự đoán ngay →
          </Link>
        </div>
      </div>
    </div>
  );
}
