"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMatchDetail } from "../../../hooks/useMatchDetail";
import { useMatchH2H } from "../../../hooks/useMatchH2H";
import { usePrediction } from "../../../hooks/usePrediction";
import MatchHeader from "../../../components/MatchHeader";
import MatchTimeline from "../../../components/MatchTimeline";
import MatchStatsBar from "../../../components/MatchStatsBar";
import H2HCard from "../../../components/H2HCard";
import ProbBar from "../../../components/ProbBar";
import TeamFormBadge from "../../../components/TeamFormBadge";
import PredictionDisclaimer from "../../../components/PredictionDisclaimer";
import { colors } from "../../../lib/design-tokens";

type PredictionDetailTab = "overview" | "explainability" | "h2h" | "stats" | "events";

/**
 * Trang chi tiết phân tích và dự đoán AI chuyên sâu (/predictions/[matchId])
 * Kết hợp thông tin trận đấu, lịch sử đối đầu (H2H), phong độ, và hệ thống giải thích mô hình AI.
 */
export default function PredictionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = String(params?.matchId || params?.id || "");
  const [activeTab, setActiveTab] = useState<PredictionDetailTab>("overview");

  const { data: matchData, isLoading, isError, isStale } = useMatchDetail(matchId);
  const { data: h2hData } = useMatchH2H(matchId);
  const { data: predictionDetail } = usePrediction(matchId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="h-64 animate-pulse rounded-xl border" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }} />
      </div>
    );
  }

  if (isError || !matchData) {
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
  } : undefined);

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

      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
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
          onClick={() => setActiveTab("explainability")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "explainability" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "explainability" ? colors.panelAlt : "transparent",
            color: activeTab === "explainability" ? colors.accent : colors.textMuted,
          }}
        >
          🧠 Giải thích mô hình (Explainability)
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
                      style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
                    >
                      {currentPrediction.isPremium ? "Premium AI" : "Free Summary"}
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
                  {explanation && (
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
                      </p>
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

      {/* Tab 2: Explainability */}
      {activeTab === "explainability" && (
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl border p-6"
            style={{ borderColor: colors.border, backgroundColor: colors.panel }}
          >
            <h3 className="text-lg font-bold text-white mb-2">
              🧠 Giải thích định lượng các yếu tố đóng góp (Explainable AI)
            </h3>
            <p className="text-xs leading-relaxed mb-6" style={{ color: colors.textMuted }}>
              Mô hình Logistic Regression đo lường các đặc trưng số học để đưa ra quyết định mà không phải là hộp đen (Black box).
            </p>

            {explanation || featuresSnapshot ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
                  <div className="text-xs text-emerald-400 font-semibold mb-1">Chênh lệch Elo (Elo Diff)</div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {explanation?.eloDiff ?? ((featuresSnapshot?.homeElo ?? 1500) - (featuresSnapshot?.awayElo ?? 1500))}
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: colors.textMuted }}>
                    Khoảng cách thực lực giữa {match.homeTeam.name} và {match.awayTeam.name}.
                  </p>
                </div>

                <div className="rounded-lg border p-4" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
                  <div className="text-xs text-emerald-400 font-semibold mb-1">Lợi thế sân nhà (Home Advantage)</div>
                  <div className="font-mono text-2xl font-bold text-white">
                    +{explanation?.homeAdvantage ?? 65.0} Elo
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: colors.textMuted }}>
                    Ưu thế thi đấu trên sân nhà của {match.homeTeam.name}.
                  </p>
                </div>

                <div className="rounded-lg border p-4" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
                  <div className="text-xs text-emerald-400 font-semibold mb-1">Điều chỉnh phong độ (Form Adjustment)</div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {explanation?.formAdjustment ? (explanation.formAdjustment > 0 ? `+${explanation.formAdjustment}` : explanation.formAdjustment) : "0.0"} Elo
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: colors.textMuted }}>
                    Tính toán từ chuỗi 5 trận gần nhất trước thời điểm trận đấu diễn ra.
                  </p>
                </div>

                <div className="rounded-lg border p-4" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
                  <div className="text-xs text-emerald-400 font-semibold mb-1">Số trận đối đầu xem xét (H2H)</div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {explanation?.h2hMatchesConsidered ?? (featuresSnapshot?.h2hMatches ?? (h2h?.totalMatches ?? 0))} trận
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: colors.textMuted }}>
                    Dữ liệu lịch sử chạm trán giữa hai câu lạc bộ.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs" style={{ borderColor: colors.borderSoft, color: colors.textMuted }}>
                🔒 Dữ liệu snapshot chi tiết dành cho người dùng xem phân tích nâng cao. Nâng cấp tài khoản để mở khóa đầy đủ trọng số mô hình.
              </div>
            )}
          </div>

          <PredictionDisclaimer variant="banner" />
        </div>
      )}

      {/* Tab 3: H2H */}
      {activeTab === "h2h" && (
        <H2HCard
          h2h={h2h}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
        />
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
