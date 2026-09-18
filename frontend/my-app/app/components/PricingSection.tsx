"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Shield, Zap, Crown, HelpCircle, ArrowRight } from "lucide-react";
import { createCheckoutSession } from "../lib/api/endpoints/payment";
import { useAuth } from "../hooks/useAuth";

interface PricingSectionProps {
  id?: string;
  showFaq?: boolean;
  className?: string;
}

export default function PricingSection({
  id = "pricing",
  showFaq = false,
  className = "",
}: PricingSectionProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    if (plan === "FREE") {
      if (!isAuthenticated) {
        router.push("/register");
      } else {
        router.push("/predictions");
      }
      return;
    }

    if (!isAuthenticated) {
      setErrorMsg("Vui lòng đăng nhập trước khi tiến hành nâng cấp gói dịch vụ.");
      setTimeout(() => {
        router.push(`/login?redirect=/pricing`);
      }, 1000);
      return;
    }

    try {
      setLoadingPlan(plan);
      setErrorMsg(null);
      const res = await createCheckoutSession(plan);
      if (res?.data?.url) {
        window.location.href = res.data.url;
      } else {
        setErrorMsg("Không nhận được liên kết thanh toán từ máy chủ. Vui lòng thử lại!");
      }
    } catch (err: any) {
      const msg = err.message || "Không thể khởi tạo phiên thanh toán. Vui lòng thử lại!";
      setErrorMsg(msg);
      if (err.status === 401 || err.code === "UNAUTHORIZED") {
        setTimeout(() => {
          router.push(`/login?redirect=/pricing`);
        }, 1500);
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id={id} className={`py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${className}`}>
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gói Đăng Ký & Bảng Giá Dịch Vụ</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Nâng Tầm Nhận Định Với <span className="text-emerald-400">iKnowBall Pro</span>
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Mở khóa toàn bộ dữ liệu xác suất trận đấu, dự đoán AI chuẩn xác và nhận định độc quyền từ chuyên gia số liệu.
        </p>

        {/* Billing Switcher */}
        <div className="mt-8 inline-flex items-center p-1.5 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${billingCycle === "monthly"
              ? "bg-emerald-500 text-neutral-950 font-bold shadow-lg"
              : "text-neutral-400 hover:text-white"
              }`}
          >
            Hàng Tháng
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === "yearly"
              ? "bg-emerald-500 text-neutral-950 font-bold shadow-lg"
              : "text-neutral-400 hover:text-white"
              }`}
          >
            <span>Hàng Năm</span>
            <span
              className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md tracking-wider transition-all ${billingCycle === "yearly"
                ? "bg-neutral-950 text-emerald-300 border border-neutral-900 shadow-sm"
                : "bg-emerald-400/20 text-emerald-400 border border-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.25)]"
                }`}
            >
              Tiết kiệm 25%
            </span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* FREE PLAN */}
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 sm:p-8 flex flex-col justify-between hover:border-neutral-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-neutral-400">Miễn Phí</span>
              <Shield className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">0đ</span>
              <span className="text-xs sm:text-sm text-neutral-400">/ mãi mãi</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
              Dành cho người hâm mộ muốn trải nghiệm xem lịch thi đấu và 3 lượt xem dự đoán mỗi ngày.
            </p>

            <ul className="space-y-3 text-xs sm:text-sm text-neutral-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Xem lịch thi đấu bóng đá bóng rổ</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Xem tin tức và thông tin mới nhất</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Xem tối đa 3 dự đoán mỗi ngày</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Thống kê hiệu năng mô hình cơ bản</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSubscribe("FREE")}
            className="w-full py-3 px-4 rounded-xl border border-neutral-700 hover:border-neutral-500 bg-neutral-800/80 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <span>Bắt Đầu Miễn Phí</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* PRO PLAN (POPULAR) */}
        <div className="relative rounded-2xl bg-gradient-to-b from-emerald-950/40 via-neutral-900 to-neutral-900 border-2 border-emerald-500/60 p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-emerald-950/40 hover:border-emerald-500 transition-all scale-100 md:scale-[1.03] z-10">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 text-xs font-bold uppercase tracking-wider shadow-md">
            Khuyên Dùng
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">Pro Analyst</span>
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {billingCycle === "monthly" ? "249.000đ" : "1.790.000đ"}
              </span>
              <span className="text-xs sm:text-sm text-neutral-400">
                /{billingCycle === "monthly" ? "tháng" : "năm"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 mb-6 leading-relaxed">
              Toàn quyền truy cập tất cả dự đoán AI, giải thích mô hình định lượng và Elo rating.
            </p>

            <ul className="space-y-3 text-xs sm:text-sm text-neutral-200 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">Mở khóa 100% dự đoán không giới hạn</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Giải thích định lượng từng yếu tố AI (Feature Snapshot)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Biểu đồ Elo Rating lịch sử & phong độ chi tiết</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cập nhật dự đoán tự động 48h trước giờ đấu</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hỗ trợ ưu tiên và huy hiệu Pro</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSubscribe(billingCycle === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY")}
            disabled={loadingPlan !== null}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingPlan === (billingCycle === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY") ? (
              <span>Đang chuyển đến cổng thanh toán...</span>
            ) : (
              <>
                <span>Nâng Cấp Pro Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* VIP PLAN */}
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 sm:p-8 flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-amber-400">VIP Insights</span>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {billingCycle === "monthly" ? "499.000đ" : "3.590.000đ"}
              </span>
              <span className="text-xs sm:text-sm text-neutral-400">
                /{billingCycle === "monthly" ? "tháng" : "năm"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
              Dành cho các chuyên gia và nhà đầu tư thể thao cần dữ liệu chuyên sâu và thông báo biến động tức thì.
            </p>

            <ul className="space-y-3 text-xs sm:text-sm text-neutral-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium text-white">Tất cả quyền lợi của gói Pro</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Báo cáo phân tích chuyên sâu trước trận đấu</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cảnh báo biến động odds và tỷ lệ thắng tức thì</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Xuất dữ liệu thống kê & quyền truy cập API</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Kênh trao đổi & hỗ trợ trực tiếp 1-1 từ chuyên gia</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSubscribe(billingCycle === "monthly" ? "VIP_MONTHLY" : "VIP_YEARLY")}
            disabled={loadingPlan !== null}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingPlan === (billingCycle === "monthly" ? "VIP_MONTHLY" : "VIP_YEARLY") ? (
              <span>Đang chuyển đến cổng thanh toán...</span>
            ) : (
              <>
                <span>Tham Gia Gói VIP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* FAQ Section (Optional) */}
      {showFaq && (
        <div className="max-w-3xl mx-auto border-t border-neutral-800 pt-16 mt-16">
          <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            Câu Hỏi Thường Gặp
          </h3>
          <div className="space-y-4 text-neutral-300">
            <div className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800">
              <h4 className="font-semibold text-white mb-2">Thanh toán được xử lý như thế nào?</h4>
              <p className="text-sm text-neutral-400">
                Mọi giao dịch được bảo mật tuyệt đối và xử lý trực tiếp qua cổng thanh toán quốc tế Stripe bằng thẻ thanh toán quốc tế (Visa/Mastercard/JCB) tính theo tiền tệ VND. Chúng tôi hoàn toàn không lưu trữ thông tin thẻ của bạn.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800">
              <h4 className="font-semibold text-white mb-2">Tôi có thể hủy gói đăng ký bất cứ lúc nào không?</h4>
              <p className="text-sm text-neutral-400">
                Có. Bạn có thể tự quản lý và hủy gói đăng ký bất kỳ lúc nào thông qua cổng Stripe Customer Portal. Quyền lợi tài khoản Pro/VIP của bạn sẽ được duy trì cho đến hết chu kỳ thanh toán hiện tại.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
