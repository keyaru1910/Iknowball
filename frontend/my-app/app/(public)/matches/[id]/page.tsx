"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMatchDetail } from "../../../hooks/useMatchDetail";
import { useMatchH2H } from "../../../hooks/useMatchH2H";
import MatchHeader from "../../../components/MatchHeader";
import MatchTimeline from "../../../components/MatchTimeline";
import MatchStatsBar from "../../../components/MatchStatsBar";
import H2HCard from "../../../components/H2HCard";
import ProbBar from "../../../components/ProbBar";
import TeamFormBadge from "../../../components/TeamFormBadge";
import { colors } from "../../../lib/design-tokens";
import type { MatchDetail } from "../../../lib/api/schemas/match.schema";

// Dữ liệu mẫu dự phòng khi chưa có API backend
const mockDetail: MatchDetail = {
  id: "m-1",
  league: "Premier League",
  round: "Vòng 28",
  venue: "Emirates Stadium (London)",
  referee: "Michael Oliver",
  homeTeam: { id: "t-1", name: "Arsenal", logoUrl: "https://media.api-sports.io/football/teams/42.png" },
  awayTeam: { id: "t-2", name: "Chelsea", logoUrl: "https://media.api-sports.io/football/teams/49.png" },
  kickoffTime: new Date().toISOString(),
  status: "live",
  homeScore: 2,
  awayScore: 1,
  minute: 68,
  prediction: {
    homeWinProb: 58,
    drawProb: 24,
    awayWinProb: 18,
    modelVersion: "v1.2-elo-logistic",
  },
  events: [
    { id: "e-1", type: "goal", minute: 14, teamId: "t-1", playerName: "Bukayo Saka", assistPlayerName: "Martin Ødegaard" },
    { id: "e-2", type: "card", minute: 32, teamId: "t-2", playerName: "Moises Caicedo" },
    { id: "e-3", type: "goal", minute: 41, teamId: "t-2", playerName: "Cole Palmer", assistPlayerName: "Nicolas Jackson" },
    { id: "e-4", type: "goal", minute: 56, teamId: "t-1", playerName: "Kai Havertz", assistPlayerName: "Declan Rice" },
    { id: "e-5", type: "substitution", minute: 62, teamId: "t-2", playerName: "Mykhailo Mudryk" },
  ],
  stats: {
    possession: { home: 58, away: 42 },
    shotsTotal: { home: 14, away: 8 },
    shotsOnTarget: { home: 6, away: 3 },
    corners: { home: 7, away: 4 },
    fouls: { home: 9, away: 13 },
    yellowCards: { home: 1, away: 2 },
    redCards: { home: 0, away: 0 },
    passAccuracy: { home: 88, away: 81 },
  },
  h2h: {
    totalMatches: 5,
    homeWins: 3,
    draws: 1,
    awayWins: 1,
    matches: [
      {
        id: "h-1",
        matchDate: "2025-11-10",
        leagueName: "Premier League",
        homeTeam: { id: "t-2", name: "Chelsea" },
        awayTeam: { id: "t-1", name: "Arsenal" },
        homeScore: 1,
        awayScore: 1,
      },
      {
        id: "h-2",
        matchDate: "2025-04-23",
        leagueName: "Premier League",
        homeTeam: { id: "t-1", name: "Arsenal" },
        awayTeam: { id: "t-2", name: "Chelsea" },
        homeScore: 5,
        awayScore: 0,
      },
      {
        id: "h-3",
        matchDate: "2024-10-21",
        leagueName: "Premier League",
        homeTeam: { id: "t-2", name: "Chelsea" },
        awayTeam: { id: "t-1", name: "Arsenal" },
        homeScore: 2,
        awayScore: 2,
      },
    ],
  },
};

type MatchTab = "overview" | "events" | "stats" | "h2h";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = String(params?.id || "");
  const [activeTab, setActiveTab] = useState<MatchTab>("overview");

  const { data: matchData, isLoading, isError } = useMatchDetail(matchId);
  const { data: h2hData } = useMatchH2H(matchId);

  // Fallback sang mockDetail nếu API chưa có sẵn
  const match = matchData || mockDetail;
  const h2h = h2hData || match.h2h;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="h-64 animate-pulse rounded-md border" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Prediction Card */}
          {match.prediction && (
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
                    Elo Model
                  </span>
                </div>

                <p className="text-xs mb-6 leading-relaxed" style={{ color: colors.textMuted }}>
                  Xác suất được tính toán dựa trên Elo rating, phong độ 5 trận gần nhất và lợi thế sân nhà/sân khách.
                </p>

                <div className="mb-6">
                  <ProbBar
                    size="lg"
                    home={match.prediction.homeWinProb}
                    draw={match.prediction.drawProb}
                    away={match.prediction.awayWinProb}
                  />
                </div>
              </div>

              <div
                className="rounded-sm border p-3 text-xs"
                style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
              >
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color: colors.textMuted }}>Mô hình:</span>
                  <span className="font-mono text-white">{match.prediction.modelVersion || "Elo-v1"}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: colors.textMuted }}>Sai số kỳ vọng (Brier Score):</span>
                  <span className="font-mono text-emerald-400">0.21</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats & Form */}
          <div
            className="rounded-md border p-6"
            style={{ borderColor: colors.border, backgroundColor: colors.panel }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Phong độ 5 trận gần nhất
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
              <div className="flex flex-col gap-1 text-xs" style={{ color: colors.textMuted }}>
                <div>🏟️ Sân: <strong className="text-white">{match.venue || "Chưa cập nhật"}</strong></div>
                <div>⚖️ Trọng tài chính: <strong className="text-white">{match.referee || "Chưa cập nhật"}</strong></div>
              </div>
            </div>
          </div>

          {/* Quick Timeline Preview */}
          <div className="md:col-span-2">
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
