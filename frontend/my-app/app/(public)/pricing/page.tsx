"use client";

import React, { useState } from "react";
import { Check, Sparkles, Shield, Zap, Crown, HelpCircle } from "lucide-react";
import { createCheckoutSession } from "../../lib/api/endpoints/payment";

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    try {
      setLoadingPlan(plan);
      setErrorMsg(null);
      const res = await createCheckoutSession(plan);
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể khởi tạo phiên thanh toán. Vui lòng thử lại!");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mô Hình AI & Dự Đoán Thể Thao Chuẩn Xác</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Nâng Cấp Gói Dịch Vụ <span className="text-emerald-400">iKnowBall</span>
        </h1>
        <p className="text-lg text-neutral-400">
          Mở khóa toàn bộ dự đoán xác suất trận đấu, phân tích Elo chuyên sâu và nhận định thời gian thực.
        </p>

        {/* Billing Switcher */}
        <div className="mt-8 inline-flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === "monthly"
                ? "bg-emerald-500 text-neutral-950 font-semibold shadow-lg"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Hàng Tháng
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              billingCycle === "yearly"
                ? "bg-emerald-500 text-neutral-950 font-semibold shadow-lg"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Hàng Năm
            <span className="text-[10px] uppercase font-bold bg-neutral-950/30 px-1.5 py-0.5 rounded text-neutral-900">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
        {/* FREE PLAN */}
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-8 flex flex-col justify-between hover:border-neutral-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-neutral-400">Miễn Phí</span>
              <Shield className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">0đ</span>
              <span className="text-sm text-neutral-400">/ mãi mãi</span>
            </div>
            <p className="text-sm text-neutral-400 mb-6">
              Dành cho người hâm mộ muốn xem thông tin cơ bản và bảng xếp hạng thể thao.
            </p>

            <ul className="space-y-3 text-sm text-neutral-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Xem lịch thi đấu & tỷ số trực tiếp</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bảng xếp hạng 5 giải đấu hàng đầu</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Xem 3 dự đoán AI mỗi ngày</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full py-3 px-4 rounded-xl bg-neutral-800 text-neutral-400 text-sm font-semibold cursor-default"
          >
            Gói Hiện Tại
          </button>
        </div>

        {/* PRO PLAN (POPULAR) */}
        <div className="relative rounded-2xl bg-gradient-to-b from-emerald-950/40 to-neutral-900 border-2 border-emerald-500/50 p-8 flex flex-col justify-between shadow-2xl shadow-emerald-950/30 hover:border-emerald-500 transition-all">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 text-xs font-bold uppercase tracking-wider shadow-md">
            Khuyên Dùng
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">Pro Analyst</span>
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">
                {billingCycle === "monthly" ? "$9.99" : "$89.99"}
              </span>
              <span className="text-sm text-neutral-400">/{billingCycle === "monthly" ? "tháng" : "năm"}</span>
            </div>
            <p className="text-sm text-neutral-300 mb-6">
              Toàn quyền truy cập tất cả dự đoán AI, phân tích xác suất và chỉ số Elo rating.
            </p>

            <ul className="space-y-3 text-sm text-neutral-200 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Mở khóa 100% dự đoán không giới hạn</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Giải thích định lượng từng yếu tố AI</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Biểu đồ Elo Rating lịch sử & phong độ</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cập nhật dự đoán tự động 48h trước giờ đấu</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSubscribe(billingCycle === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY")}
            disabled={loadingPlan !== null}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
          >
            {loadingPlan === (billingCycle === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY")
              ? "Đang chuyển đến Stripe..."
              : "Nâng Cấp Pro Ngay"}
          </button>
        </div>

        {/* VIP PLAN */}
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-8 flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-amber-400">VIP Insights</span>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">$19.99</span>
              <span className="text-sm text-neutral-400">/ tháng</span>
            </div>
            <p className="text-sm text-neutral-400 mb-6">
              Dành cho các chuyên gia và nhà đầu tư thể thao cần dữ liệu chuyên sâu và thông báo tức thì.
            </p>

            <ul className="space-y-3 text-sm text-neutral-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Tất cả quyền lợi của gói Pro</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Thông báo biến động kèo và đội hình sớm</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Xuất dữ liệu thống kê & API truy cập</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Hỗ trợ ưu tiên 1-1 từ đội ngũ dữ liệu</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSubscribe("VIP_MONTHLY")}
            disabled={loadingPlan !== null}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50"
          >
            {loadingPlan === "VIP_MONTHLY" ? "Đang chuyển đến Stripe..." : "Tham Gia Gói VIP"}
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto border-t border-neutral-800 pt-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
          <HelpCircle className="w-6 h-6 text-emerald-400" />
          Câu Hỏi Thường Gặp
        </h2>
        <div className="space-y-6 text-neutral-300">
          <div className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800">
            <h3 className="font-semibold text-white mb-2">Thanh toán được xử lý như thế nào?</h3>
            <p className="text-sm text-neutral-400">
              Mọi giao dịch được bảo mật và xử lý trực tiếp qua cổng thanh toán quốc tế Stripe. Chúng tôi không lưu trữ thông tin thẻ ngân hàng của bạn.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800">
            <h3 className="font-semibold text-white mb-2">Tôi có thể hủy gói đăng ký bất cứ lúc nào không?</h3>
            <p className="text-sm text-neutral-400">
              Có. Bạn có thể hủy gói đăng ký bất kỳ lúc nào thông qua cổng quản lý tài khoản Stripe Customer Portal. Quyền lợi Pro sẽ được duy trì cho đến hết chu kỳ thanh toán hiện tại.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
