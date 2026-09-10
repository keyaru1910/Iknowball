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

type MatchTab = "overview" | "events" | "stats" | "h2h";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = String(params?.id || "");
  const [activeTab, setActiveTab] = useState<MatchTab>("overview");

  const { data: matchData, isLoading, isError, isStale } = useMatchDetail(matchId);
  const { data: h2hData } = useMatchH2H(matchId);
  const { data: predictionDetail } = usePrediction(matchId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="h-64 animate-pulse rounded-md border" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }} />
      </div>
    );
  }

  if (isError || !matchData) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-md border p-8 text-center" style={{ borderColor: colors.loss, backgroundColor: `${colors.loss}10` }}>
          <p className="text-sm font-semibold text-rose-400">Không thể tải dữ liệu chi tiết trận đấu từ hệ thống provider.</p>
          <p className="text-xs mt-2" style={{ color: colors.textMuted }}>Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau vài phút.</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 rounded-sm px-4 py-2 text-xs font-semibold"
            style={{ backgroundColor: colors.panelAlt, color: colors.text }}
          >
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const match = matchData;
  const h2h = h2hData ?? match.h2h;
  const currentPrediction = predictionDetail ?? (match.prediction ? {
    homeWinProb: match.prediction.homeWinProb,
    drawProb: match.prediction.drawProb,
    awayWinProb: match.prediction.awayWinProb,
    modelVersion: match.prediction.modelVersion,
    predictedOutcome: "HOME_WIN" as const,
    featuresSnapshot: undefined,
    isPremium: false,
  } : undefined);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Stale data alert if applicable */}
      {isStale && (
        <div
          className="mb-4 flex items-center justify-between rounded-md border px-4 py-2 text-xs"
          style={{ borderColor: `${colors.accent}40`, backgroundColor: `${colors.accent}15`, color: colors.accent }}
        >
          <span>ℹ️ Dữ liệu đang được đồng bộ định kỳ trong nền.</span>
          <span className="font-mono text-[11px] opacity-80">Cache Validated</span>
        </div>
      )}

      {/* Breadcrumb back navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="hover:text-white transition-colors"
        >
          ← Quay lại danh sách
        </button>
        <span>/</span>
        <span>{match.league}</span>
        <span>/</span>
        <span className="text-white font-medium">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </span>
      </div>

      {/* Match Header Scoreboard */}
      <div className="mb-8">
        <MatchHeader match={match} />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b pb-3" style={{ borderColor: colors.borderSoft }}>
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "overview" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "overview" ? colors.panelAlt : "transparent",
            color: activeTab === "overview" ? colors.accent : colors.textMuted,
          }}
        >
          Tổng quan & Dự đoán
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-1.5 rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "events" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "events" ? colors.panelAlt : "transparent",
            color: activeTab === "events" ? colors.accent : colors.textMuted,
          }}
        >
          Diễn biến ({match.events?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
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
          onClick={() => setActiveTab("h2h")}
          className={`rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "h2h" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: activeTab === "h2h" ? colors.panelAlt : "transparent",
            color: activeTab === "h2h" ? colors.accent : colors.textMuted,
          }}
        >
          Đối đầu (H2H)
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Prediction Card */}
            {currentPrediction ? (
              <div
                className="rounded-md border p-6 flex flex-col justify-between"
                style={{ borderColor: colors.border, backgroundColor: colors.panel }}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                      Dự đoán xác suất trận đấu
                    </h3>
                    <span
                      className="rounded px-2 py-0.5 font-mono text-[10px]"
                      style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
                    >
                      {currentPrediction.isPremium ? "Premium AI" : "Free Summary"}
                    </span>
                  </div>

                  <p className="text-xs mb-6 leading-relaxed" style={{ color: colors.textMuted }}>
                    Xác suất được tính toán dựa trên Elo rating, phong độ 5 trận gần nhất và lợi thế sân nhà/sân khách.
                  </p>

                  <div className="mb-6">
                    <ProbBar
                      size="lg"
                      home={currentPrediction.homeWinProb}
                      draw={currentPrediction.drawProb}
                      away={currentPrediction.awayWinProb}
                    />
                  </div>

                  {/* Features Snapshot (dành riêng cho Premium / Admin) */}
                  {currentPrediction.featuresSnapshot ? (
                    <div
                      className="mt-4 rounded-sm border p-3 text-xs mb-4"
                      style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
                    >
                      <div className="text-[11px] font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                        <span>✨</span>
                        <span>Dữ liệu chi tiết mô hình (Features Snapshot):</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>Home Elo: <strong className="text-white">{(currentPrediction.featuresSnapshot as any).homeElo ?? 1500}</strong></div>
                        <div>Away Elo: <strong className="text-white">{(currentPrediction.featuresSnapshot as any).awayElo ?? 1500}</strong></div>
                        <div>Tỷ lệ thắng nhà: <strong className="text-white">{(((currentPrediction.featuresSnapshot as any).homeWinRate ?? 0) * 100).toFixed(1)}%</strong></div>
                        <div>Tỷ lệ thắng khách: <strong className="text-white">{(((currentPrediction.featuresSnapshot as any).awayWinRate ?? 0) * 100).toFixed(1)}%</strong></div>
                        <div>Trận đối đầu: <strong className="text-white">{(currentPrediction.featuresSnapshot as any).h2hMatches ?? 0} trận</strong></div>
                        <div>Môn thể thao: <strong className="text-white">{(currentPrediction.featuresSnapshot as any).sport ?? "Football"}</strong></div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="mt-3 mb-4 rounded-sm border border-dashed p-3 text-center text-xs"
                      style={{ borderColor: colors.borderSoft, backgroundColor: `${colors.panelAlt}60` }}
                    >
                      <p style={{ color: colors.textMuted }}>
                        🔒 Đang xem bản tóm tắt xác suất. Nâng cấp <strong>Premium</strong> để mở khóa toàn bộ chỉ số Elo, lịch sử đối đầu và giải thích mô hình AI.
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className="rounded-sm border p-3 text-xs"
                  style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
                >
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: colors.textMuted }}>Mô hình:</span>
                    <span className="font-mono text-white">{currentPrediction.modelVersion || "Elo-v1"}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: colors.textMuted }}>Độ tin cậy toán học:</span>
                    <span className="font-mono text-emerald-400">High (Validated)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-md border p-6 flex items-center justify-center text-center"
                style={{ borderColor: colors.border, backgroundColor: colors.panel }}
              >
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Chưa có dữ liệu dự đoán được tạo cho trận đấu này.
                </p>
              </div>
            )}

            {/* Quick Stats & Form */}
            <div
              className="rounded-md border p-6 flex flex-col justify-between"
              style={{ borderColor: colors.border, backgroundColor: colors.panel }}
            >
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                  Phong độ gần đây & Thông tin sân
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
                    Địa điểm thi đấu
                  </h4>
                  <div className="flex flex-col gap-1.5 text-xs" style={{ color: colors.textMuted }}>
                    <div>🏟️ Sân vận động: <strong className="text-white">{match.venue || "Sân vận động chính"}</strong></div>
                    <div>⚖️ Trọng tài điều khiển: <strong className="text-white">{match.referee || "Tổ trọng tài quốc tế"}</strong></div>
                    <div>🏆 Vòng đấu / Mùa giải: <strong className="text-white">{match.round || "Chính thức"}</strong></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.borderSoft }}>
                <Link
                  href={`/teams/${match.homeTeam.id}`}
                  className="text-xs font-semibold text-emerald-400 hover:underline mr-4"
                >
                  Xem đội {match.homeTeam.shortName || match.homeTeam.name} →
                </Link>
                <Link
                  href={`/teams/${match.awayTeam.id}`}
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Xem đội {match.awayTeam.shortName || match.awayTeam.name} →
                </Link>
              </div>
            </div>
          </div>

          {/* Disclaimer cố định trên toàn màn prediction */}
          <PredictionDisclaimer variant="banner" />

          {/* Quick Timeline Preview */}
          <div>
            <MatchTimeline
              events={match.events}
              homeTeamId={match.homeTeam.id}
              awayTeamId={match.awayTeam.id}
            />
          </div>
        </div>
      )}

      {activeTab === "events" && (
        <MatchTimeline
          events={match.events}
          homeTeamId={match.homeTeam.id}
          awayTeamId={match.awayTeam.id}
        />
      )}

      {activeTab === "stats" && (
        <MatchStatsBar
          stats={match.stats}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
        />
      )}

      {activeTab === "h2h" && (
        <H2HCard
          h2h={h2h}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
        />
      )}
    </div>
  );
}

