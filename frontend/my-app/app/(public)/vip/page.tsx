"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import VipAiCopilotSimulator from "../../components/VipAiCopilotSimulator";
import FluctuationAlertFeed from "../../components/FluctuationAlertFeed";
import VipApiKeyManager from "../../components/VipApiKeyManager";
import { colors } from "../../lib/design-tokens";
import { Crown, Sparkles, Zap, Key, Bot, ShieldAlert, ArrowRight, TrendingUp, Cpu } from "lucide-react";

interface TopPickItem {
  matchId: string;
  matchDate: string;
  status: string;
  homeTeam: { id: string; name: string; logoUrl?: string };
  awayTeam: { id: string; name: string; logoUrl?: string };
  league: { id: string; name: string; sport: string };
  predictedOutcome: string;
  homeWinProb: number;
  drawProb: number | null;
  awayWinProb: number;
  confidenceScore: number;
  confidenceLevel: string;
  recommendedBet: string;
  marketOdds: number;
  expectedValuePercent: number;
  isValueBet: boolean;
  scoreDetails?: any;
  vipHeadline: string;
  vipSummary: string;
}

export default function VipHubPage() {
  const { user } = useAuth();
  const isVip = user?.tier === "vip" || user?.role === "admin";
  const [activeTab, setActiveTab] = useState<"top-picks" | "fluctuations" | "simulator" | "api">("top-picks");
  const [topPicks, setTopPicks] = useState<TopPickItem[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [sportFilter, setSportFilter] = useState<string>("all");

  useEffect(() => {
    const fetchTopPicks = async () => {
      setLoadingPicks(true);
      try {
        const sportQuery = sportFilter !== "all" ? `?sport=${sportFilter}` : "";
        const res = await fetch(`http://localhost:8000/api/v1/predictions/vip/top-picks${sportQuery}`);
        const json = await res.json();
        setTopPicks(json.data || []);
      } catch {
        // ignore
      } finally {
        setLoadingPicks(false);
      }
    };
    fetchTopPicks();
  }, [sportFilter]);

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* VIP Intelligence Header */}
      <div
        className="rounded-3xl border p-6 sm:p-10 relative overflow-hidden shadow-2xl"
        style={{
          borderColor: "rgba(245, 158, 11, 0.35)",
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(18, 22, 29, 0.95) 100%)",
          boxShadow: "0 0 50px rgba(245, 158, 11, 0.08)",
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/30 mb-3">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>VIP Insights Intelligence Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Trung Tâm Dữ Liệu & Phân Tích Cao Cấp
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Dành riêng cho hội viên VIP: Bộ công cụ độc quyền gồm <strong>Daily Top Picks (+EV)</strong>, <strong>Radar Biến Động Odds</strong>, <strong>Giả Lập 10.000 Kịch Bản Monte Carlo & AI Copilot 1-1</strong> và <strong>Developer REST API</strong>.
            </p>
          </div>

          {!isVip && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-xs sm:text-sm font-bold shadow-xl transition-all hover:scale-105 shrink-0"
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                color: "#0B0E13",
                boxShadow: "0 0 25px rgba(245, 158, 11, 0.35)",
              }}
            >
              <span>👑 Kích hoạt VIP Insights (499k/tháng)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* VIP Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4" style={{ borderColor: colors.borderSoft }}>
        <button
          onClick={() => setActiveTab("top-picks")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "top-picks"
              ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
              : "text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Daily VIP Top Picks (+EV)</span>
        </button>

        <button
          onClick={() => setActiveTab("fluctuations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "fluctuations"
              ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
              : "text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Live Odds & Fluctuation Radar</span>
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "simulator"
              ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
              : "text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Giả Lập Monte Carlo & AI Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab("api")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "api"
              ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
              : "text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Developer API & Keys</span>
        </button>
      </div>

      {/* Tab Content: Top Picks */}
      {activeTab === "top-picks" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🎯</span>
                <span>Kèo Vàng AI & Value Bets Trong Ngày</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Các trận đấu có độ hội tụ xác suất cao nhất kèm tỷ lệ kỳ vọng dương (+EV) do mô hình Machine Learning sàng lọc.
              </p>
            </div>

            {/* Sport filter */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 self-start">
              <button
                onClick={() => setSportFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sportFilter === "all" ? "bg-amber-500 text-black font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setSportFilter("football")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sportFilter === "football" ? "bg-amber-500 text-black font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                ⚽ Bóng đá
              </button>
              <button
                onClick={() => setSportFilter("basketball")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sportFilter === "basketball" ? "bg-amber-500 text-black font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                🏀 Bóng rổ
              </button>
            </div>
          </div>

          {loadingPicks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
              ))}
            </div>
          ) : topPicks.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}>
              <p className="text-xs text-neutral-400">Hiện chưa có trận đấu nào khớp bộ lọc Top Picks hôm nay.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topPicks.map((pick) => (
                <div
                  key={pick.matchId}
                  className="rounded-2xl border p-5 flex flex-col justify-between transition-all hover:border-amber-500/50 hover:shadow-xl"
                  style={{
                    borderColor: "rgba(245, 158, 11, 0.25)",
                    backgroundColor: colors.panel,
                  }}
                >
                  <div>
                    {/* Badge & League */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                          👑 +EV {pick.expectedValuePercent}%
                        </span>
                        <span className="text-xs font-semibold text-neutral-400">
                          {pick.league.name} ({pick.league.sport === "basketball" ? "Bóng rổ" : "Bóng đá"})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {new Date(pick.matchDate).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Match Headline */}
                    <h3 className="text-sm font-bold text-white mb-2">
                      {pick.homeTeam.name} vs {pick.awayTeam.name}
                    </h3>

                    {/* Recommendation Card */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between mb-3 text-xs">
                      <div>
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold">Khuyến nghị AI:</div>
                        <div className="font-bold text-emerald-400 font-mono mt-0.5">{pick.recommendedBet}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold">Xác suất thắng:</div>
                        <div className="font-bold text-white font-mono text-sm">{pick.confidenceScore}%</div>
                      </div>
                    </div>

                    {/* AI Teaser */}
                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed mb-4">
                      {pick.vipSummary}
                    </p>
                  </div>

                  <Link
                    href={`/predictions/${pick.matchId}`}
                    className="w-full py-2.5 px-4 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Mở Báo Cáo Chiến Thuật AI VIP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Fluctuations */}
      {activeTab === "fluctuations" && (
        <div>
          <FluctuationAlertFeed
            limit={20}
            title="Radar Biến Động Kèo & Tỷ Lệ Thắng Trực Tiếp"
            subtitle="Tín hiệu Value Bet và chênh lệch xác suất thời gian thực dành cho thành viên VIP"
          />
        </div>
      )}

      {/* Tab Content: Simulator & AI Copilot */}
      {activeTab === "simulator" && (
        <div>
          <VipAiCopilotSimulator />
        </div>
      )}

      {/* Tab Content: API */}
      {activeTab === "api" && (
        <div className="space-y-8">
          <VipApiKeyManager />
        </div>
      )}
    </div>
  );
}
