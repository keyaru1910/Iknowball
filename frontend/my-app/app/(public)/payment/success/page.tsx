"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import { confirmCheckoutSession } from "../../../lib/api/endpoints/payment";
import { refreshAccessToken } from "../../../lib/api/endpoints/auth";
import { useAuth } from "../../../hooks/useAuth";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const sessionId = searchParams.get("session_id");
  const planParam = searchParams.get("plan");
  const isMock = searchParams.get("mock") === "true";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<string>(planParam || "PRO_MONTHLY");

  useEffect(() => {
    let isMounted = true;

    async function handleConfirm() {
      if (!sessionId) {
        setLoading(false);
        setErrorMessage("Không tìm thấy mã phiên thanh toán hợp lệ.");
        return;
      }

      try {
        setLoading(true);
        // Xác nhận phiên với Backend
        const result = await confirmCheckoutSession(sessionId, planParam || undefined);

        if (result?.data?.success) {
          if (isMounted) {
            setSuccess(true);
            if (result.data.plan) {
              setConfirmedPlan(result.data.plan);
            }
          }

          // Cập nhật lại session người dùng để nhận quyền Pro/VIP mới nhất
          try {
            await refreshAccessToken();
          } catch {
            // Không làm gián đoạn UI nếu refresh token chạy nền
          }
        } else {
          if (isMounted) {
            setErrorMessage(result?.data?.message || "Xác thực phiên thanh toán không thành công.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(
            err.message || "Có lỗi xảy ra khi xác nhận gói đăng ký. Vui lòng liên hệ hỗ trợ."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    handleConfirm();

    return () => {
      isMounted = false;
    };
  }, [sessionId, planParam]);

  const isVip = confirmedPlan.includes("VIP");

  return (
    <div className="min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-neutral-950">
      <div className="max-w-xl w-full">
        {/* State 1: Đang xác thực phiên */}
        {loading && (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Đang xác nhận gói đăng ký...
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Hệ thống iKnowBall đang thiết lập các quyền truy cập AI và phân tích chuyên sâu cho tài khoản của bạn.
            </p>
          </div>
        )}

        {/* State 2: Lỗi xác nhận */}
        {!loading && !success && (
          <div className="bg-neutral-900/80 border border-rose-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Chưa thể xác nhận gói
            </h2>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              {errorMessage || "Phiên thanh toán không tồn tại hoặc đã hết hạn."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold transition-all text-center"
              >
                Quay Lại Bảng Giá
              </Link>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-bold transition-all text-center"
              >
                Về Trang Chủ
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Kích hoạt thành công */}
        {!loading && success && (
          <div className="relative rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border border-emerald-500/40 p-8 sm:p-10 text-center shadow-2xl shadow-emerald-950/40 backdrop-blur-xl overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Badge Banner */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nâng Cấp Tài Khoản Thành Công</span>
            </div>

            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 shadow-xl shadow-emerald-500/25">
              {isVip ? (
                <Crown className="w-10 h-10" />
              ) : (
                <Zap className="w-10 h-10" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              Chào Mừng Đến Với{" "}
              <span className={isVip ? "text-amber-400" : "text-emerald-400"}>
                {isVip ? "VIP Insights" : "Pro Analyst"}
              </span>
              !
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 mb-8 leading-relaxed max-w-md mx-auto">
              Gói dịch vụ đã được kích hoạt thành công trên tài khoản{" "}
              <strong className="text-white">{user?.fullName || user?.email || "của bạn"}</strong>.
              Toàn bộ các tính năng phân tích định lượng và dự đoán AI đã sẵn sàng!
            </p>

            {/* Feature Checklist */}
            <div className="p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-left mb-8 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Các quyền lợi đã mở khóa:
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mở khóa 100% chi tiết các trận đấu & dự đoán không giới hạn</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Giải thích trọng số định lượng AI (Feature Snapshot)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Xem toàn bộ biểu đồ Elo Rating lịch sử và phong độ trận đấu</span>
              </div>
              {isVip && (
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Quyền truy cập Telegram VIP Lounge & Phân tích Odds chuyên sâu</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/predictions"
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 text-sm sm:text-base font-extrabold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <span>Khám Phá Dự Đoán AI Ngay</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/"
                className="w-full py-3 px-6 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Quay Về Trang Chủ</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-24 flex items-center justify-center bg-neutral-950 text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
