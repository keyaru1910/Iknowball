"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Zap,
  Target,
  Bell,
  RefreshCw,
  SlidersHorizontal,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  getFluctuationAlerts,
  triggerAlertScan,
  type FluctuationAlertItem,
} from "../lib/api/endpoints/alerts";
import { useAuth } from "../hooks/useAuth";
import AlertPreferencesModal from "./AlertPreferencesModal";

interface FluctuationAlertFeedProps {
  limit?: number;
  showFilterTabs?: boolean;
  showSettingsButton?: boolean;
  showScanButton?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function FluctuationAlertFeed({
  limit = 20,
  showFilterTabs = true,
  showSettingsButton = true,
  showScanButton = true,
  title = "Bảng Tin Biến Động Kèo & Xác Suất AI",
  subtitle = "Hệ thống tự động theo dõi biến động odds châu Á, châu Âu và tín hiệu xác suất Machine Learning 24/7",
  className = "",
}: FluctuationAlertFeedProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<FluctuationAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const isVip = user?.tier === "vip" || user?.tier === "admin";
  const isPro = user?.tier === "pro";

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await getFluctuationAlerts(limit);
      setAlerts(data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách cảnh báo biến động:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [limit]);

  const handleScan = async () => {
    try {
      setScanning(true);
      setScanMessage(null);
      const res = await triggerAlertScan();
      setScanMessage(`Quét thành công! Đã kiểm tra ${res.recordsScanned} trận và cập nhật ${res.alertsCreated} cảnh báo.`);
      await fetchAlerts();
    } catch (err: any) {
      setScanMessage(err.message || "Lỗi quét biến động");
    } finally {
      setScanning(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  const filteredAlerts = alerts.filter((item) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "VALUE_BET") return item.type === "VALUE_BET";
    if (activeTab === "ODDS_SHIFT") return item.type === "ODDS_SHIFT";
    if (activeTab === "PROBABILITY_SPIKE") return item.type === "PROBABILITY_SPIKE";
    return true;
  });

  return (
    <div className={`w-full ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-neutral-400 mt-1">{subtitle}</p>}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {showScanButton && (
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-xs font-medium text-neutral-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin text-emerald-400" : ""}`} />
              <span>{scanning ? "Đang quét AI..." : "Quét biến động"}</span>
            </button>
          )}

          {showSettingsButton && (
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-emerald-500/50 text-xs font-medium text-neutral-300 hover:text-white transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cài đặt cảnh báo</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {scanMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      {showFilterTabs && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "ALL"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            Tất cả ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("VALUE_BET")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "VALUE_BET"
                ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20"
                : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 Value Bet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ODDS_SHIFT")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "ODDS_SHIFT"
                ? "bg-cyan-400 text-neutral-950 shadow-md shadow-cyan-400/20"
                : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Biến động Odds</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PROBABILITY_SPIKE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "PROBABILITY_SPIKE"
                ? "bg-purple-400 text-neutral-950 shadow-md shadow-purple-400/20"
                : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>📈 AI Shift</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-neutral-900/60 border border-neutral-800 animate-pulse p-5"
            />
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
          <Info className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-300">Không có biến động nào trong danh mục này</p>
          <p className="text-xs text-neutral-500 mt-1">Hệ thống đang quét liên tục các giải đấu sắp diễn ra.</p>
        </div>
      ) : (
        /* Alerts List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((item) => {
            const isCritical = item.severity === "CRITICAL" || item.type === "VALUE_BET";
            const changeVal = Number(item.changePercent);
            const prevHome = Math.round(Number(item.previousHomeWinProb) * 100);
            const currHome = Math.round(Number(item.currentHomeWinProb) * 100);
            const prevAway = Math.round(Number(item.previousAwayWinProb) * 100);
            const currAway = Math.round(Number(item.currentAwayWinProb) * 100);

            return (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-all hover:border-neutral-700 backdrop-blur-xl ${
                  isCritical
                    ? "bg-gradient-to-b from-amber-950/20 via-neutral-900/90 to-neutral-950 border-amber-500/30 shadow-lg shadow-amber-500/5"
                    : "bg-neutral-900/80 border-neutral-800/90"
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                        item.type === "VALUE_BET"
                          ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                          : item.type === "ODDS_SHIFT"
                          ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                          : "bg-purple-400/15 text-purple-300 border border-purple-400/30"
                      }`}
                    >
                      {item.type === "VALUE_BET" && <Target className="w-3 h-3" />}
                      {item.type === "ODDS_SHIFT" && <Zap className="w-3 h-3" />}
                      {item.type === "PROBABILITY_SPIKE" && <TrendingUp className="w-3 h-3" />}
                      <span>{item.type === "VALUE_BET" ? "Value Bet" : item.type === "ODDS_SHIFT" ? "Odds Shift" : "AI Spike"}</span>
                    </span>

                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      +{changeVal}%
                    </span>
                  </div>

                  <span className="text-[11px] text-neutral-500">
                    {new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Match Title */}
                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {item.headline}
                </h3>

                <div className="text-xs font-semibold text-neutral-300 mb-4 flex items-center gap-1.5">
                  <span className="text-emerald-400">⚽</span>
                  <span>{item.homeTeamName}</span>
                  <span className="text-neutral-500 font-normal">vs</span>
                  <span>{item.awayTeamName}</span>
                </div>

                {/* Probability Visual Diff Bar */}
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 mb-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 font-medium">Xác suất {item.homeTeamName} (Chủ):</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-neutral-500 line-through text-[10px]">{prevHome}%</span>
                      <span className="text-neutral-400">→</span>
                      <span className="text-emerald-400">{currHome}%</span>
                    </div>
                  </div>

                  {/* Dual Bar Diff */}
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${currHome}%` }}
                    />
                    <div
                      className="h-full bg-neutral-600 transition-all"
                      style={{ width: `${100 - currHome - currAway}%` }}
                    />
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${currAway}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>Chủ ({currHome}%)</span>
                    <span>Hòa ({100 - currHome - currAway}%)</span>
                    <span>Khách ({currAway}%)</span>
                  </div>
                </div>

                {/* Tactical Explanation / Description */}
                <div className="relative">
                  <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {/* Recommended Bet Pill */}
                  {item.recommendedBet && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-medium">Gợi ý AI:</span>
                        <span className="font-bold text-white">{item.recommendedBet}</span>
                      </div>
                    </div>
                  )}

                  {/* Paywall Overlay for Free Users */}
                  {item.isLocked && !isVip && !isPro && (
                    <div className="absolute inset-0 -top-2 rounded-xl bg-neutral-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center border border-amber-500/30">
                      <Lock className="w-5 h-5 text-amber-400 mb-1.5" />
                      <p className="text-xs font-bold text-white mb-1">Mở Khóa Tín Hiệu VIP</p>
                      <p className="text-[11px] text-neutral-400 mb-3 max-w-xs">
                        Nâng cấp gói VIP để xem phân tích nguyên nhân biến động & khuyến nghị cược AI.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 text-xs font-bold shadow-md hover:opacity-90"
                      >
                        <span>Nâng cấp VIP Insights</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Preferences Modal */}
      <AlertPreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
      />
    </div>
  );
}
