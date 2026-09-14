"use client";

import { useEffect, useState } from "react";
import { useSport } from "../../context/SportContext";
import { useLeagues } from "../../hooks/useLeagues";
import {
  usePlayerStatistics,
  useTeamSeasonStatistics,
} from "../../hooks/useStatistics";
import PlayerStatsTable from "../../components/PlayerStatsTable";
import TeamStatsTable from "../../components/TeamStatsTable";
import SeasonSelector from "../../components/SeasonSelector";
import { DEFAULT_SEASON } from "../../lib/constants/seasons";
import { colors } from "../../lib/design-tokens";

type ActiveTab = "players" | "teams";

export default function StatisticsPage() {
  const { sport, isBasketball } = useSport();
  const [activeTab, setActiveTab] = useState<ActiveTab>("players");
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<string>(DEFAULT_SEASON);

  // Bộ lọc Leaderboard metric cho Football & Basketball
  const [footballMetric, setFootballMetric] = useState<"goals" | "assists" | "yellowCards">("goals");
  const [basketballMetric, setBasketballMetric] = useState<"pointsAvg" | "reboundsAvg" | "assistsAvg" | "stealsAvg">("pointsAvg");

  const { data: leagues = [], isLoading: isLoadingLeagues } = useLeagues(sport);

  // Reset league selection khi đổi môn thể thao
  useEffect(() => {
    setSelectedLeagueId("");
  }, [sport]);

  // Tự động chọn league đầu tiên khi tải xong
  useEffect(() => {
    if (leagues.length > 0 && !leagues.some((l) => l.id === selectedLeagueId)) {
      setSelectedLeagueId(leagues[0].id);
    }
  }, [leagues, selectedLeagueId]);

  const activeMetric = isBasketball ? basketballMetric : footballMetric;

  // Query dữ liệu cầu thủ
  const {
    data: playersData = [],
    isLoading: isLoadingPlayers,
    isError: isPlayersError,
  } = usePlayerStatistics({
    sport,
    leagueId: selectedLeagueId,
    season: selectedSeason,
    sortBy: activeMetric,
  });

  // Query dữ liệu đội bóng
  const {
    data: teamsData = [],
    isLoading: isLoadingTeams,
    isError: isTeamsError,
  } = useTeamSeasonStatistics({
    sport,
    leagueId: selectedLeagueId,
    season: selectedSeason,
  });

  const isLoading =
    isLoadingLeagues ||
    (activeTab === "players" ? isLoadingPlayers : isLoadingTeams);
  const hasError = activeTab === "players" ? isPlayersError : isTeamsError;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Dữ liệu thống kê {isBasketball ? "Bóng rổ (NBA)" : "Bóng đá"}
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: isBasketball
                  ? "rgba(249, 115, 22, 0.15)"
                  : "rgba(47, 217, 140, 0.15)",
                color: isBasketball ? "#FB923C" : colors.accent,
                border: `1px solid ${isBasketball ? "rgba(249, 115, 22, 0.3)" : "rgba(47, 217, 140, 0.3)"}`,
              }}
            >
              {isBasketball ? "Basketball" : "Football"}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
            {isBasketball
              ? "Bảng vàng danh hiệu, chỉ số trung bình của các ngôi sao và thống kê đội bóng NBA."
              : "Thống kê chi tiết cầu thủ (Bàn thắng, kiến tạo, thẻ phạt) và hiệu số đội bóng theo mùa giải."}
          </p>
        </div>

        {/* Season Selector */}
        <SeasonSelector
          selectedSeason={selectedSeason}
          onSelectSeason={setSelectedSeason}
          variant="pill"
        />
      </div>

      {/* Main Tabs (Cầu thủ | Đội bóng) */}
      <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor: colors.borderSoft }}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("players")}
            className="flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === "players" ? colors.accent : "transparent",
              color: activeTab === "players" ? colors.bg : colors.textMuted,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Cầu thủ nổi bật
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className="flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === "teams" ? colors.accent : "transparent",
              color: activeTab === "teams" ? colors.bg : colors.textMuted,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Chỉ số Đội bóng
          </button>
        </div>

        {/* Sub-filters for Leaderboard metric (Only in Players tab) */}
        {activeTab === "players" && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg p-1" style={{ backgroundColor: colors.panelAlt }}>
            {!isBasketball ? (
              <>
                <button
                  type="button"
                  onClick={() => setFootballMetric("goals")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    footballMetric === "goals" ? "text-white font-semibold" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor: footballMetric === "goals" ? colors.panel : "transparent",
                  }}
                >
                  ⚽ Ghi bàn
                </button>
                <button
                  type="button"
                  onClick={() => setFootballMetric("assists")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    footballMetric === "assists" ? "text-white font-semibold" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor: footballMetric === "assists" ? colors.panel : "transparent",
                  }}
                >
                  🎯 Kiến tạo
                </button>
                <button
                  type="button"
                  onClick={() => setFootballMetric("yellowCards")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    footballMetric === "yellowCards" ? "text-white font-semibold" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor: footballMetric === "yellowCards" ? colors.panel : "transparent",
                  }}
                >
                  🟨 Thẻ phạt
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setBasketballMetric("pointsAvg")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    basketballMetric === "pointsAvg" ? "text-white font-semibold" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor: basketballMetric === "pointsAvg" ? colors.panel : "transparent",
                  }}
                >
                  🏀 Điểm (PPG)
                </button>
                <button
                  type="button"
                  onClick={() => setBasketballMetric("reboundsAvg")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    basketballMetric === "reboundsAvg" ? "text-white font-semibold" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor: basketballMetric === "reboundsAvg" ? colors.panel : "transparent",
                  }}
                >
                  🛡️ Rebounds (RPG)
                </button>
                <button
                  type="button"
                  onClick={() => setBasketballMetric("assistsAvg")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    basketballMetric === "assistsAvg" ? "text-white font-semibold" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor: basketballMetric === "assistsAvg" ? colors.panel : "transparent",
                  }}
                >
                  🎁 Kiến tạo (APG)
                </button>
                <button
                  type="button"
                  onClick={() => setBasketballMetric("stealsAvg")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    basketballMetric === "stealsAvg" ? "text-white font-semibold" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor: basketballMetric === "stealsAvg" ? colors.panel : "transparent",
                  }}
                >
                  ⚡ Cướp bóng (SPG)
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Leagues Tabs (nếu có danh sách giải đấu) */}
      {leagues.length > 0 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b pb-3 scrollbar-none" style={{ borderColor: colors.borderSoft }}>
          {leagues.map((league) => (
            <button
              key={league.id}
              type="button"
              onClick={() => setSelectedLeagueId(league.id)}
              className="whitespace-nowrap rounded-sm px-4 py-2 text-xs font-semibold transition-all hover:text-white"
              style={{
                backgroundColor: selectedLeagueId === league.id ? colors.panelAlt : "transparent",
                border: `1px solid ${selectedLeagueId === league.id ? colors.accent : colors.border}`,
                color: selectedLeagueId === league.id ? colors.accent : colors.textMuted,
              }}
            >
              {league.name}{league.country ? ` (${league.country})` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Content Container */}
      <div
        className="rounded-md border p-4 sm:p-6"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        {isLoading ? (
          <div className="flex flex-col gap-3 py-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-sm"
                style={{ backgroundColor: colors.panelAlt }}
              />
            ))}
          </div>
        ) : hasError ? (
          <p className="py-8 text-center text-sm text-rose-400">
            Không thể tải dữ liệu thống kê lúc này.
          </p>
        ) : activeTab === "players" ? (
          playersData.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: colors.textMuted }}>
              Chưa có dữ liệu thống kê cầu thủ cho mùa giải này.
            </p>
          ) : (
            <PlayerStatsTable players={playersData} sport={sport} />
          )
        ) : teamsData.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: colors.textMuted }}>
            Chưa có dữ liệu thống kê đội bóng cho mùa giải này.
          </p>
        ) : (
          <TeamStatsTable teams={teamsData} sport={sport} />
        )}
      </div>
    </div>
  );
}
