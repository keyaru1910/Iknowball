"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Crown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck,
  QrCode,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  getTelegramStatus,
  generateTelegramConnectToken,
  disconnectTelegram,
  sendTelegramTestNotification,
  simulateTelegramConnect,
  type TelegramStatus,
  type TelegramConnectTokenResponse,
} from "../lib/api/endpoints/telegram";
import { useAuth } from "../hooks/useAuth";

export default function TelegramVipLounge() {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TelegramConnectTokenResponse | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const isVip = user?.tier === "vip" || user?.tier === "admin";
  const isPro = user?.tier === "pro";

  const fetchStatus = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getTelegramStatus();
      setStatus(data);
    } catch (err: any) {
      console.error("Lỗi lấy trạng thái Telegram:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [isAuthenticated]);

  const handleGenerateToken = async () => {
    try {
      setGeneratingToken(true);
      setFeedback(null);
      const res = await generateTelegramConnectToken();
      setTokenData(res);
    } catch (err: any) {
      setFeedback({ text: err.message || "Lỗi tạo mã kết nối", type: "error" });
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      await disconnectTelegram();
      setTokenData(null);
      await fetchStatus();
      setFeedback({ text: "Đã ngắt kết nối tài khoản Telegram", type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message || "Lỗi ngắt kết nối", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTest = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await sendTelegramTestNotification();
      setFeedback({ text: res.message || "Đã gửi thông báo kiểm tra!", type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message || "Không thể gửi thông báo", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      await simulateTelegramConnect("VIP_Champion_" + (user?.fullName?.split(" ")[0] || "Trader"));
      await fetchStatus();
      setFeedback({ text: "Đã liên kết tài khoản Telegram mô phỏng thành công!", type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message || "Lỗi mô phỏng", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-cyan-950/40 border border-amber-500/20 p-6 sm:p-10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold mb-4">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Khu Vực Độc Quyền VIP Insights</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Cộng Đồng & Kênh Tín Hiệu <span className="text-cyan-400">Telegram VIP</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
            Nhận tín hiệu biến động Odds và phân tích chiến thuật gửi trực tiếp 24/7 vào ứng dụng Telegram của bạn.
          </p>
        </div>

        {/* Telegram Ambient Glow */}
        <div className="absolute top-1/2 -right-16 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 left-1/3 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 transition-all ${feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/15 border border-red-500/30 text-red-300"
            }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Telegram Account Connection (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-neutral-900/80 border border-neutral-800 p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Liên Kết Bot Telegram</h2>
                  <p className="text-xs text-neutral-400">Kết nối để nhận tin nhắn cảnh báo cá nhân hóa</p>
                </div>
              </div>

              {/* Status Badge */}
              {status?.isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Đã kết nối</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs font-medium">
                  Chưa liên kết
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-neutral-500">Đang kiểm tra kết nối...</div>
            ) : status?.isConnected ? (
              /* Connected State */
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-sm">
                      {(status.telegramUsername?.[0] || "T").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">@{status.telegramUsername || "VIP User"}</p>
                      <p className="text-[11px] text-neutral-500">Chat ID: {status.telegramChatId}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                    Kích hoạt: {new Date(status.telegramConnectedAt || Date.now()).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={actionLoading}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi thông báo thử nghiệm</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-all disabled:opacity-50"
                  >
                    Hủy liên kết
                  </button>
                </div>
              </div>
            ) : (
              /* Not Connected State */
              <div className="space-y-5">
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Liên kết tài khoản iKnowBall với Bot Telegram để nhận thông báo tức thì ngay khi mô hình phát hiện biến động odds hoặc tỷ lệ thắng.
                </p>

                {tokenData ? (
                  <div className="p-4 rounded-2xl bg-neutral-950/90 border border-cyan-500/30 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-cyan-300">Link kết nối 1-Click:</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tokenData.deepLink)}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Đã sao chép" : "Sao chép link"}</span>
                      </button>
                    </div>

                    <a
                      href={tokenData.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Mở Trong Telegram (@{tokenData.botUsername})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <div className="text-center pt-2">
                      <p className="text-[11px] text-neutral-400 mb-2">Hoặc quét mã QR trên điện thoại:</p>
                      <img
                        src={tokenData.qrCodeUrl}
                        alt="Telegram QR Code"
                        className="w-32 h-32 mx-auto rounded-xl border border-neutral-700 p-1 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleGenerateToken}
                      disabled={generatingToken}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{generatingToken ? "Đang tạo mã..." : "Tạo Link Kết Nối Telegram 1-Click"}</span>
                    </button>

                    {/* Quick Simulation Option for testing */}
                    <button
                      type="button"
                      onClick={handleSimulate}
                      disabled={actionLoading}
                      className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium border border-neutral-800 transition-all"
                    >
                      ⚡ Mô phỏng kết nối ngay (Chế độ thử nghiệm Dev)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3-Step Guide */}
          <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800/80 p-6 sm:p-8">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>3 Bước Đơn Giản Nhận Cảnh Báo VIP</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/60">
                <div className="h-6 w-6 rounded-lg bg-neutral-800 text-white font-bold flex items-center justify-center mb-2">
                  1
                </div>
                <p className="font-semibold text-neutral-200 mb-1">Tạo Link</p>
                <p className="text-neutral-400 text-[11px]">Bấm nút tạo link kết nối và mở Telegram.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/60">
                <div className="h-6 w-6 rounded-lg bg-neutral-800 text-white font-bold flex items-center justify-center mb-2">
                  2
                </div>
                <p className="font-semibold text-neutral-200 mb-1">Bấm Start</p>
                <p className="text-neutral-400 text-[11px]">Nhấn nút Start trên Bot để hoàn tất xác thực.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/60">
                <div className="h-6 w-6 rounded-lg bg-neutral-800 text-white font-bold flex items-center justify-center mb-2">
                  3
                </div>
                <p className="font-semibold text-neutral-200 mb-1">Nhận Tín Hiệu</p>
                <p className="text-neutral-400 text-[11px]">Tự động nhận cảnh báo odds & Value Bet 24/7.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: VIP Telegram Channel & Group (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-950/30 via-neutral-900/90 to-neutral-900 border border-amber-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-amber-500/5">
            {/* VIP Crown Header */}
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300">
                <Crown className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Kênh Tín Hiệu Telegram VIP</h3>
                <p className="text-xs text-amber-300/80">Group kín độc quyền dành cho VIP Insights</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              Tham gia cộng đồng phân tích thể thao định lượng chuyên nghiệp. Nơi cập nhật các kèo cược giá trị cao (High EV) và nhận định trực tiếp từ các chuyên gia số liệu.
            </p>

            {/* VIP Perks */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Cảnh báo biến động odds sớm 30 - 60 phút trước giờ bóng lăn.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Tín hiệu Value Bet độc quyền từ mô hình Machine Learning.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Báo cáo nhận định chiến thuật AI trước mỗi vòng đấu lớn.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Hỗ trợ giải đáp số liệu 1-1 từ đội ngũ Data Analyst.</span>
              </div>
            </div>

            {/* Action CTA */}
            {isVip ? (
              <a
                href={status?.vipGroupInviteLink || "https://t.me/+iknowball_vip_signals"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-neutral-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 hover:opacity-95 transition-all"
              >
                <Crown className="w-4 h-4" />
                <span>Tham Gia Nhóm Kín Telegram VIP 👑</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-amber-500/20 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400">
                  <Lock className="w-4 h-4" />
                  <span>Dành Riêng Cho Gói VIP Insights</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Nâng cấp tài khoản VIP Insights để nhận link tham gia và quyền truy cập kênh tín hiệu độc quyền.
                </p>
                <Link
                  href="/pricing"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all block"
                >
                  <span>Nâng cấp VIP (499k/tháng)</span>
                  <ArrowRight className="w-3.5 h-3.5 inline" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
