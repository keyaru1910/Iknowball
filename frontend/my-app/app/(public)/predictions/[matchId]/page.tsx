"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMatchDetail } from "../../../hooks/useMatchDetail";
import { useMatchH2H } from "../../../hooks/useMatchH2H";
import { usePrediction } from "../../../hooks/usePrediction";
import { useAuth } from "../../../hooks/useAuth";
import MatchHeader from "../../../components/MatchHeader";
import MatchTimeline from "../../../components/MatchTimeline";
import MatchStatsBar from "../../../components/MatchStatsBar";
import H2HCard from "../../../components/H2HCard";
import ProbBar from "../../../components/ProbBar";
import TeamFormBadge from "../../../components/TeamFormBadge";
import PredictionDisclaimer from "../../../components/PredictionDisclaimer";
import UserBadge from "../../../components/UserBadge";
import EloChart from "../../../components/EloChart";
import VisualFeatureSnapshot from "../../../components/VisualFeatureSnapshot";
import VipMatchReport from "../../../components/VipMatchReport";
import CsvExportButton from "../../../components/CsvExportButton";
import { colors } from "../../../lib/design-tokens";

type PredictionDetailTab = "overview" | "vipReport" | "explainability" | "h2h" | "stats" | "events";

/**
 * Trang chi tiết phân tích và dự đoán AI chuyên sâu (/predictions/[matchId])
 * Kết hợp thông tin trận đấu, lịch sử đối đầu (H2H), phong độ, và hệ thống giải thích mô hình AI.
 */
export default function PredictionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = String(params?.matchId || params?.id || "");
  const [activeTab, setActiveTab] = useState<PredictionDetailTab>("overview");
  const { user, isAuthenticated } = useAuth();

  const { data: matchData, isLoading: isMatchLoading, isError: isMatchError, isStale } = useMatchDetail(matchId);
  const { data: h2hData } = useMatchH2H(matchId);
  const { data: predictionDetail, error: predictionError } = usePrediction(matchId);

  const isPaywallExceeded =
    Boolean(predictionError && (predictionError as any)?.message?.includes("lượt xem")) ||
    (predictionDetail?.tier === "free" && predictionDetail?.remainingDailyQuota === 0 && !predictionDetail?.isPremium);

  if (isMatchLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="h-64 animate-pulse rounded-xl border" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }} />
      </div>
    );
  }

  if (isMatchError || !matchData) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: colors.loss, backgroundColor: `${colors.loss}10` }}>
          <p className="text-sm font-semibold text-rose-400">Không thể tải dữ liệu chi tiết trận đấu từ hệ thống.</p>
          <p className="text-xs mt-2" style={{ color: colors.textMuted }}>Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau vài phút.</p>
          <button
            type="button"
            onClick={() => router.push("/predictions")}
            className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:bg-white/10"
            style={{ backgroundColor: colors.panelAlt, color: colors.text }}
          >
            ← Quay lại danh sách dự đoán
          </button>
        </div>
      </div>
    );
  }

  const match = matchData;
  const h2h = h2hData ?? match.h2h;
  const isBasketball = match.league?.toLowerCase().includes("nba") || false;

  const currentPrediction = predictionDetail ?? (match.prediction ? {
    homeWinProb: match.prediction.homeWinProb,
    drawProb: match.prediction.drawProb,
    awayWinProb: match.prediction.awayWinProb,
    modelVersion: match.prediction.modelVersion,
    predictedOutcome: "HOME_WIN" as const,
    featuresSnapshot: undefined,
    explanation: undefined,
    isPremium: false,
    tier: undefined,
    remainingDailyQuota: undefined,
  } : undefined);

  const isPremiumUser = predictionDetail?.isPremium || user?.tier === "pro" || user?.tier === "vip" || user?.role === "admin";
  const isVipUser = user?.tier === "vip" || user?.role === "admin";
  const explanation = (currentPrediction as any)?.explanation || (currentPrediction?.featuresSnapshot as any)?.explanation;
  const featuresSnapshot = currentPrediction?.featuresSnapshot as any;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Cảnh báo dữ liệu nền đang đồng bộ */}
      {isStale && (
        <div
          className="mb-4 flex items-center justify-between rounded-lg border px-4 py-2 text-xs"
          style={{ borderColor: `${colors.accent}40`, backgroundColor: `${colors.accent}15`, color: colors.accent }}
        >
          <span>ℹ️ Dữ liệu đang được đồng bộ định kỳ trong nền.</span>
          <span className="font-mono text-[11px] opacity-80">Cache Validated</span>
        </div>
      )}

      {/* Breadcrumb Navigation & Tier Quota Tracker */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" style={{ color: colors.textMuted }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/predictions")}
            className="hover:text-white transition-colors"
          >
            ← Danh sách dự đoán
          </button>
          <span>/</span>
          <span>{match.league}</span>
          <span>/</span>
          <span className="text-white font-medium">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </span>
        </div>

        {/* Quota Tracker & Export Action */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <CsvExportButton
            type="predictions"
            leagueId={(match as any).leagueId || undefined}
            season={(match as any).season || undefined}
            sport={isBasketball ? "basketball" : "football"}
            label="Xuất CSV Trận Đấu"
          />

          {isPremiumUser ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-semibold">
              <span>✨</span>
              <span>Không giới hạn</span>
              <UserBadge tier={user?.tier || "pro"} size="xs" />
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-neutral-300 text-[11px]">
              <span>
                🎯 Lượt xem hôm nay:{" "}
                <strong className={predictionDetail?.remainingDailyQuota === 0 ? "text-rose-400" : "text-emerald-400"}>
                  {predictionDetail?.remainingDailyQuota ?? 3}/3
                </strong>
              </span>
              <Link href="/pricing" className="text-emerald-400 font-semibold hover:underline">
                Nâng cấp Pro →
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-neutral-300 text-[11px]">
              <span>⚡ Bản xem trước</span>
              <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Scoreboard & Match Header */}
      <div className="mb-8">
        <MatchHeader match={match} />
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 flex items-center gap-2 border-b pb-3 overflow-x-auto scrollbar-none" style={{ borderColor: colors.borderSoft }}>
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "overview" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "overview" ? colors.panelAlt : "transparent",
            color: activeTab === "overview" ? colors.accent : colors.textMuted,
          }}
        >
          🎯 Tổng quan & Dự đoán AI
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vipReport")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "vipReport"
              ? "text-amber-300 shadow-sm border border-amber-500/40 bg-amber-500/20"
              : "hover:text-amber-300"
          }`}
          style={{
            backgroundColor: activeTab === "vipReport" ? "rgba(245, 158, 11, 0.15)" : "transparent",
            color: activeTab === "vipReport" ? "#FBBF24" : colors.textMuted,
          }}
        >
          <span>👑 Báo cáo AI VIP</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
            VIP
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("explainability")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "explainability" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "explainability" ? colors.panelAlt : "transparent",
            color: activeTab === "explainability" ? colors.accent : colors.textMuted,
          }}
        >
          <span>🧠 Trọng số AI</span>
          {!isPremiumUser && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
              PRO
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("h2h")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "h2h" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "h2h" ? colors.panelAlt : "transparent",
            color: activeTab === "h2h" ? colors.accent : colors.textMuted,
          }}
        >
          Đối đầu (H2H)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "stats" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "stats" ? colors.panelAlt : "transparent",
            color: activeTab === "stats" ? colors.accent : colors.textMuted,
          }}
        >
          Thống kê chỉ số
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "events" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "events" ? colors.panelAlt : "transparent",
            color: activeTab === "events" ? colors.accent : colors.textMuted,
          }}
        >
          Diễn biến ({match.events?.length || 0})
        </button>
      </div>


      {/* Tab 1: Overview & AI Prediction */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {/* Paywall Banner if Quota Limit Reached */}
          {isPaywallExceeded && (
            <div
              className="rounded-xl border p-6 text-center shadow-lg relative overflow-hidden"
              style={{
                borderColor: "rgba(245, 158, 11, 0.4)",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)",
              }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-2xl mb-3">
                🔒
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Bạn đã sử dụng hết 3 lượt xem chi tiết dự đoán hôm nay
              </h3>
              <p className="text-xs text-neutral-300 max-w-md mx-auto mb-4 leading-relaxed">
                Nâng cấp lên gói <strong>PRO Analyst</strong> hoặc <strong>VIP Insights</strong> để mở khóa không giới hạn lượt xem trận đấu, biểu đồ Elo lịch sử và toàn bộ trọng số mô hình AI.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/pricing"
                  className="rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-md hover:scale-105"
                  style={{ backgroundColor: colors.accent, color: colors.bg }}
                >
                  ⚡ Nâng cấp PRO chỉ từ 249k/tháng
                </Link>
                <Link
                  href="/predictions"
                  className="rounded-xl border px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                  style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
                >
                  Xem danh sách trận khác
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Prediction Card */}
            {currentPrediction ? (
              <div
                className="rounded-xl border p-6 flex flex-col justify-between"
                style={{ borderColor: colors.border, backgroundColor: colors.panel }}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                      Dự đoán xác suất trận đấu
                    </h3>
                    <span
                      className="rounded-md px-2 py-0.5 font-mono text-[10px]"
                      style={{ backgroundColor: isPremiumUser ? "rgba(245, 158, 11, 0.2)" : `${colors.accent}15`, color: isPremiumUser ? "#FBBF24" : colors.accent }}
                    >
                      {isPremiumUser ? "👑 Premium AI" : "Free Summary"}
                    </span>
                  </div>

                  <p className="text-xs mb-6 leading-relaxed" style={{ color: colors.textMuted }}>
                    {isBasketball
                      ? "Xác suất được tính toán từ mô hình Logistic 2 chiều dựa trên Elo rating và hiệu chỉnh phong độ NBA."
                      : "Xác suất được tính từ mô hình Logistic Regression đa lớp kết hợp Elo rating và hiệu chỉnh phong độ 5 trận."}
                  </p>

                  <div className="mb-6">
                    <ProbBar
                      size="lg"
                      home={currentPrediction.homeWinProb}
                      draw={currentPrediction.drawProb}
                      away={currentPrediction.awayWinProb}
                    />
                  </div>

                  {/* Highlight factor */}
                  {explanation ? (
                    <div
                      className="mt-4 rounded-lg border p-3 text-xs mb-4"
                      style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
                    >
                      <div className="text-[11px] font-semibold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                        <span>✨</span>
                        <span>Yếu tố chi phối lớn nhất:</span>
                      </div>
                      <p className="text-white font-medium text-xs">
                        {explanation.dominantFactor === "elo_difference" && "⚡ Chênh lệch đẳng cấp Elo rating"}
                        {explanation.dominantFactor === "recent_form" && "🔥 Phong độ chuỗi 5 trận gần nhất"}
                        {explanation.dominantFactor === "home_advantage" && "🏟️ Lợi thế sân nhà"}
                        {!["elo_difference", "recent_form", "home_advantage"].includes(explanation.dominantFactor) &&
                          (explanation.dominantFactor || "⚡ Phân tích đa yếu tố AI")}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="mt-4 rounded-lg border p-3 text-xs mb-4 flex items-center justify-between"
                      style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
                    >
                      <span className="text-[11px] text-neutral-400">🔒 Giải thích chi tiết yếu tố chi phối</span>
                      <Link href="/pricing" className="text-[11px] text-emerald-400 font-semibold hover:underline">
                        Mở khóa Pro →
                      </Link>
                    </div>
                  )}
                </div>

                <div
                  className="rounded-lg border p-3 text-xs"
                  style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
                >
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: colors.textMuted }}>Phiên bản mô hình:</span>
                    <span className="font-mono text-white">{currentPrediction.modelVersion || "logistic-regression-v1"}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: colors.textMuted }}>Phương pháp:</span>
                    <span className="font-mono text-emerald-400">Calibrated Logistic Regression</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl border p-6 flex items-center justify-center text-center"
                style={{ borderColor: colors.border, backgroundColor: colors.panel }}
              >
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Chưa có dữ liệu dự đoán được tạo cho trận đấu này.
                </p>
              </div>
            )}

            {/* Quick Stats & Form */}
            <div
              className="rounded-xl border p-6 flex flex-col justify-between"
              style={{ borderColor: colors.border, backgroundColor: colors.panel }}
            >
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                  Phong độ gần đây & Địa điểm
                </h3>

                <div className="flex flex-col gap-4 border-b pb-6" style={{ borderColor: colors.borderSoft }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{match.homeTeam.name}</span>
                    <TeamFormBadge form={["W", "W", "D", "W", "W"]} showLabel={false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{match.awayTeam.name}</span>
                    <TeamFormBadge form={["L", "W", "W", "D", "L"]} showLabel={false} />
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    Thông tin trận đấu
                  </h4>
                  <div className="flex flex-col gap-1.5 text-xs" style={{ color: colors.textMuted }}>
                    <div>🏟️ Sân vận động: <strong className="text-white">{match.venue || "Sân vận động chính"}</strong></div>
                    <div>⚖️ Trọng tài / Giám sát: <strong className="text-white">{match.referee || "Tổ trọng tài chính thức"}</strong></div>
                    <div>🏆 Giải đấu: <strong className="text-white">{match.league}</strong></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: colors.borderSoft }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("explainability")}
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Xem chi tiết giải thích mô hình AI →
                </button>
              </div>
            </div>
          </div>

          {/* VIP Match Report Highlight Card in Overview */}
          <VipMatchReport
            matchId={match.id}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            isVipUser={isVipUser}
          />

          {/* Visual AI Breakdown Card */}
          <VisualFeatureSnapshot
            featuresSnapshot={featuresSnapshot}
            explanation={explanation}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            isLocked={!isPremiumUser}
          />

          <PredictionDisclaimer variant="banner" />

          <div>
            <MatchTimeline
              events={match.events}
              homeTeamId={match.homeTeam.id}
              awayTeamId={match.awayTeam.id}
            />
          </div>
        </div>
      )}

      {/* Tab: VIP Match Intelligence Report (Dedicated View) */}
      {activeTab === "vipReport" && (
        <div className="flex flex-col gap-6">
          <VipMatchReport
            matchId={match.id}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            isVipUser={isVipUser}
          />

          <VisualFeatureSnapshot
            featuresSnapshot={featuresSnapshot}
            explanation={explanation}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            isLocked={!isPremiumUser}
          />

          <EloChart
            homeTeamId={match.homeTeam.id}
            awayTeamId={match.awayTeam.id}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            isLocked={!isPremiumUser}
          />

          <PredictionDisclaimer variant="banner" />
        </div>
      )}

      {/* Tab 2: Explainability with Visual Feature Snapshot & Elo Chart */}
      {activeTab === "explainability" && (
        <div className="flex flex-col gap-6">
          <VisualFeatureSnapshot
            featuresSnapshot={featuresSnapshot}
            explanation={explanation}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            isLocked={!isPremiumUser}
          />

          <EloChart
            homeTeamId={match.homeTeam.id}
            awayTeamId={match.awayTeam.id}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            isLocked={!isPremiumUser}
          />

          <PredictionDisclaimer variant="banner" />
        </div>
      )}

      {/* Tab 3: H2H with Elo Rating Trend */}
      {activeTab === "h2h" && (
        <div className="flex flex-col gap-6">
          <H2HCard
            h2h={h2h}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
          />

          <EloChart
            homeTeamId={match.homeTeam.id}
            awayTeamId={match.awayTeam.id}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            isLocked={!isPremiumUser}
          />
        </div>
      )}

      {/* Tab 4: Stats */}
      {activeTab === "stats" && (
        <MatchStatsBar
          stats={match.stats}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
        />
      )}

      {/* Tab 5: Events */}
      {activeTab === "events" && (
        <MatchTimeline
          events={match.events}
          homeTeamId={match.homeTeam.id}
          awayTeamId={match.awayTeam.id}
        />
      )}
    </div>
  );
}

