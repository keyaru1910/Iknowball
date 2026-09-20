"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Sparkles,
  Zap,
  HelpCircle,
} from "lucide-react";
import {
  checkVietQrPaymentStatus,
  createVietQrPayment,
  manualConfirmVietQrPayment,
  VietQrPaymentResponse,
} from "../../../lib/api/endpoints/payment";
import { useAuth } from "../../../hooks/useAuth";

function VietQrPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const orderCodeParam = searchParams.get("orderCode");
  const planParam = searchParams.get("plan") || "PRO_MONTHLY";

  const [paymentData, setPaymentData] = useState<VietQrPaymentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 phút (900s)
  const [confirmingTest, setConfirmingTest] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Khởi tạo đơn hàng hoặc lấy thông tin
  useEffect(() => {
    let isMounted = true;

    async function initPayment() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // Khởi tạo đơn VietQR từ API
        const res = await createVietQrPayment(planParam);
        if (res?.data && isMounted) {
          setPaymentData(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || "Không thể khởi tạo mã VietQR. Vui lòng thử lại!");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      initPayment();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [planParam, isAuthenticated]);

  // 2. Countdown Timer đếm ngược 15 phút
  useEffect(() => {
    if (isPaid || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaid, timeLeft]);

  // 3. Polling kiểm tra trạng thái thanh toán mỗi 3 giây
  useEffect(() => {
    if (!paymentData?.orderCode || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await checkVietQrPaymentStatus(paymentData.orderCode);
        if (res?.data?.isPaid) {
          setIsPaid(true);
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/payment/success?session_id=${paymentData.orderCode}&plan=${paymentData.plan}`);
          }, 1500);
        }
      } catch (err) {
        // Không ngắt polling nếu có lỗi mạng nhất thời
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentData?.orderCode, isPaid, paymentData?.plan, router]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleTestConfirm = async () => {
    if (!paymentData?.orderCode) return;
    try {
      setConfirmingTest(true);
      const res = await manualConfirmVietQrPayment(paymentData.orderCode, paymentData.plan);
      if (res?.data?.success) {
        setIsPaid(true);
        setTimeout(() => {
          router.push(`/payment/success?session_id=${paymentData.orderCode}&plan=${paymentData.plan}`);
        }, 1200);
      }
    } catch (err: any) {
      alert(err.message || "Lỗi khi xác nhận thử nghiệm");
    } finally {
      setConfirmingTest(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen py-24 px-4 flex items-center justify-center bg-neutral-950">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-sm text-neutral-400 mb-6">
            Vui lòng đăng nhập tài khoản trước khi thực hiện thanh toán gói dịch vụ.
          </p>
          <Link
            href={`/login?redirect=/payment/vietqr?plan=${planParam}`}
            className="block w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-all text-center"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại bảng giá</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Cổng Thanh Toán Napas 247 An Toàn</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-12 text-center shadow-2xl backdrop-blur-xl">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Đang tạo mã VietQR...</h2>
            <p className="text-sm text-neutral-400">Vui lòng đợi giây lát để hệ thống tạo phiên chuyển khoản.</p>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMsg && (
          <div className="bg-neutral-900/80 border border-rose-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Không thể tạo đơn thanh toán</h2>
            <p className="text-sm text-neutral-400 mb-6">{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-all"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Success Transition State */}
        {isPaid && (
          <div className="bg-neutral-900/90 border border-emerald-500/50 rounded-3xl p-12 text-center shadow-2xl shadow-emerald-950/50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Thanh toán thành công!</h2>
            <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto">
              Hệ thống đã nhận được tiền và kích hoạt gói thành viên của bạn. Đang chuyển hướng đến trang xác nhận...
            </p>
          </div>
        )}

        {/* Main VietQR Checkout Form */}
        {!loading && !errorMsg && !isPaid && paymentData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: QR Code & Countdown (5 cols) */}
            <div className="lg:col-span-5 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Countdown badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs font-semibold text-neutral-300 mb-6">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Mã QR hết hạn trong:</span>
                <span className="text-amber-400 font-mono font-bold text-sm">{formattedTime}</span>
              </div>

              {/* VietQR Image Container */}
              <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/20 max-w-[280px] sm:max-w-[320px] w-full mb-6">
                <img
                  src={paymentData.qrCodeUrl}
                  alt={`VietQR ${paymentData.orderCode}`}
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
                Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MBBank, Techcombank, VPBank, MoMo...) và chọn <strong>Quét mã QR</strong> để thanh toán tự động.
              </p>

              {/* Polling indicator */}
              <div className="mt-6 flex items-center gap-2 text-xs text-emerald-400/90 font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Đang tự động chờ nhận tiền (Real-time)...</span>
              </div>
            </div>

            {/* Right Column: Transfer Details & Copy Helpers (7 cols) */}
            <div className="lg:col-span-7 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
              <div>
                {/* Package summary header */}
                <div className="border-b border-neutral-800 pb-6 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {paymentData.planName}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">Mã Đơn: #{paymentData.orderCode}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      {paymentData.formattedAmount}
                    </span>
                    <span className="text-xs text-neutral-400">/ kích hoạt tức thì</span>
                  </div>
                </div>

                {/* Transfer Info Details */}
                <div className="space-y-4 mb-8">
                  {/* Bank Name */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                    <div>
                      <p className="text-[11px] text-neutral-500 font-medium uppercase">Ngân Hàng Thụ Hưởng</p>
                      <p className="text-sm font-bold text-white">{paymentData.bankName} (Napas 247)</p>
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                    <div>
                      <p className="text-[11px] text-neutral-500 font-medium uppercase">Số Tài Khoản</p>
                      <p className="text-base font-mono font-bold text-emerald-400 tracking-wider">
                        {paymentData.bankAccountNo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentData.bankAccountNo, "accountNo")}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-all flex items-center gap-1.5"
                    >
                      {copiedField === "accountNo" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Account Name */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                    <div>
                      <p className="text-[11px] text-neutral-500 font-medium uppercase">Tên Chủ Tài Khoản</p>
                      <p className="text-sm font-bold text-white uppercase">{paymentData.bankAccountName}</p>
                    </div>
                  </div>

                  {/* Exact Amount */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                    <div>
                      <p className="text-[11px] text-neutral-500 font-medium uppercase">Số Tiền Chuyển Khoản</p>
                      <p className="text-base font-mono font-bold text-white">
                        {paymentData.amount.toLocaleString("vi-VN")} VNĐ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(paymentData.amount), "amount")}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-all flex items-center gap-1.5"
                    >
                      {copiedField === "amount" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Transfer Content (CRITICAL) */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-colors">
                    <div>
                      <p className="text-[11px] text-amber-400 font-bold uppercase flex items-center gap-1">
                        <span>Nội Dung Chuyển Khoản (Bắt Buộc Đúng)</span>
                      </p>
                      <p className="text-lg font-mono font-black text-amber-300 tracking-wider">
                        {paymentData.transferContent}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentData.transferContent, "content")}
                      className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md"
                    >
                      {copiedField === "content" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Important Note */}
                <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-400 space-y-1.5 mb-6">
                  <p className="font-semibold text-neutral-300 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Lưu ý quan trọng:
                  </p>
                  <p>• Vui lòng giữ nguyên nội dung chuyển khoản <strong>{paymentData.transferContent}</strong> để hệ thống tự động nhận diện và kích hoạt trong 5 - 30 giây.</p>
                  <p>• Nếu sau 3 phút chưa thấy tài khoản nâng cấp, vui lòng liên hệ hotline / Telegram <strong>@iKnowBall_Support</strong> kèm mã đơn hàng.</p>
                </div>
              </div>

              {/* Action Buttons & Simulation Test */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleTestConfirm}
                  disabled={confirmingTest}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {confirmingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra giao dịch...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tôi Đã Chuyển Khoản Thành Công</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VietQrPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-24 flex items-center justify-center bg-neutral-950">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <VietQrPaymentContent />
    </Suspense>
  );
}
