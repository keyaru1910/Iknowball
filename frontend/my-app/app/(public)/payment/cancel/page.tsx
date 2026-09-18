"use client";

import React from "react";
import Link from "next/link";
import { XCircle, ArrowLeft, HelpCircle, RefreshCcw } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-neutral-950">
      <div className="max-w-md w-full bg-neutral-900/80 border border-neutral-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <XCircle className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Giao Dịch Đã Hủy
        </h1>

        <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
          Phiên thanh toán gói iKnowBall đã được hủy theo yêu cầu. Bạn hoàn toàn chưa bị trừ bất kỳ khoản phí nào.
        </p>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Thử Chọn Lại Gói Dịch Vụ</span>
          </Link>

          <Link
            href="/"
            className="w-full py-3 px-6 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
