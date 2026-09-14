"use client";

import { useMemo, useState } from "react";
import { colors } from "../lib/design-tokens";
import type { TeamSeasonStatisticDto } from "../lib/api/schemas/statistics.schema";

export interface TeamStatsTableProps {
  teams: TeamSeasonStatisticDto[];
  sport: "football" | "basketball";
  onTeamClick?: (teamId: string) => void;
  className?: string;
}

type TeamSortColumn =
  | "played"
  | "wins"
  | "losses"
  | "goalsFor"
  | "goalsAgainst"
  | "goalDifference"
  | "cleanSheets"
  | "winPercentage"
  | "pointsForAvg"
  | "pointsAgainstAvg"
  | "pointDifferential";

export default function TeamStatsTable({
  teams,
  sport,
  onTeamClick,
  className = "",
}: TeamStatsTableProps) {
  const isBasketball = sport === "basketball";

  const [sortKey, setSortKey] = useState<TeamSortColumn>(
    isBasketball ? "winPercentage" : "goalsFor"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(column: TeamSortColumn) {
    if (sortKey === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDir("desc");
    }
  }

  const sortedTeams = useMemo(() => {
    const list = [...teams];
    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortKey === "played") {
        valA = a.played;
        valB = b.played;
      } else if (sortKey === "wins") {
        valA = a.wins;
        valB = b.wins;
      } else if (sortKey === "losses") {
        valA = a.losses;
        valB = b.losses;
      } else if (sortKey === "goalsFor") {
        valA = a.goalsFor ?? 0;
        valB = b.goalsFor ?? 0;
      } else if (sortKey === "goalsAgainst") {
        valA = a.goalsAgainst ?? 0;
        valB = b.goalsAgainst ?? 0;
      } else if (sortKey === "goalDifference") {
        valA = a.goalDifference ?? 0;
        valB = b.goalDifference ?? 0;
      } else if (sortKey === "cleanSheets") {
        valA = a.cleanSheets ?? 0;
        valB = b.cleanSheets ?? 0;
      } else if (sortKey === "winPercentage") {
        valA = a.winPercentage ?? (a.played > 0 ? a.wins / a.played : 0);
        valB = b.winPercentage ?? (b.played > 0 ? b.wins / b.played : 0);
      } else if (sortKey === "pointsForAvg") {
        valA = a.pointsForAvg ?? 0;
        valB = b.pointsForAvg ?? 0;
      } else if (sortKey === "pointsAgainstAvg") {
        valA = a.pointsAgainstAvg ?? 0;
        valB = b.pointsAgainstAvg ?? 0;
      } else if (sortKey === "pointDifferential") {
        valA = a.pointDifferential ?? 0;
        valB = b.pointDifferential ?? 0;
      }

      return sortDir === "asc" ? valA - valB : valB - valA;
    });
    return list;
  }, [teams, sortKey, sortDir]);

  const footballGrid = "40px minmax(220px, 1.5fr) 50px 45px 45px 45px 60px 60px 60px 65px";
  const basketballGrid = "40px minmax(220px, 1.5fr) 50px 45px 45px 65px 75px 75px 75px";

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div
        className="min-w-[700px] border-t"
        style={{ borderColor: colors.border }}
      >
        {/* Table Header */}
        <div
          className="grid items-center border-b py-3 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            borderColor: colors.borderSoft,
            color: colors.textFaint,
            gridTemplateColumns: isBasketball ? basketballGrid : footballGrid,
          }}
        >
          <span className="text-center">#</span>
          <span>Đội bóng</span>
          <button
            type="button"
            onClick={() => handleSort("played")}
            className="text-center transition-colors hover:text-white"
          >
            Trận {sortKey === "played" && (sortDir === "asc" ? "↑" : "↓")}
          </button>
          <button
            type="button"
            onClick={() => handleSort("wins")}
            className="text-center transition-colors hover:text-white"
          >
            T {sortKey === "wins" && (sortDir === "asc" ? "↑" : "↓")}
          </button>

          {!isBasketball ? (
            <>
              <span className="text-center">H</span>
              <button
                type="button"
                onClick={() => handleSort("losses")}
                className="text-center transition-colors hover:text-white"
              >
                B {sortKey === "losses" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("goalsFor")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "goalsFor" ? colors.accent : undefined }}
              >
                BT {sortKey === "goalsFor" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("goalsAgainst")}
                className="text-center transition-colors hover:text-white"
              >
                SBT {sortKey === "goalsAgainst" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("goalDifference")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "goalDifference" ? colors.accent : undefined }}
              >
                HS {sortKey === "goalDifference" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("cleanSheets")}
                className="text-center transition-colors hover:text-white"
              >
                Sạch lưới {sortKey === "cleanSheets" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSort("losses")}
                className="text-center transition-colors hover:text-white"
              >
                B {sortKey === "losses" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("winPercentage")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "winPercentage" ? colors.accent : undefined }}
              >
                Win% {sortKey === "winPercentage" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("pointsForAvg")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "pointsForAvg" ? colors.accent : undefined }}
              >
                Ghi/trận {sortKey === "pointsForAvg" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("pointsAgainstAvg")}
                className="text-center transition-colors hover:text-white"
              >
                Thua/trận {sortKey === "pointsAgainstAvg" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("pointDifferential")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "pointDifferential" ? colors.accent : undefined }}
              >
                Chênh lệch {sortKey === "pointDifferential" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            </>
          )}
        </div>

        {/* Table Rows */}
        {sortedTeams.map((team, index) => {
          const rank = index + 1;
          const isTop1 = rank === 1;
          const isTop2 = rank === 2;
          const isTop3 = rank === 3;
          const winPct = team.winPercentage ?? (team.played > 0 ? team.wins / team.played : 0);

          return (
            <div
              key={team.id || team.teamId}
              role={onTeamClick ? "button" : undefined}
              tabIndex={onTeamClick ? 0 : undefined}
              onClick={() => onTeamClick?.(team.teamId)}
              className={`grid items-center border-b py-3 text-xs transition-colors ${
                onTeamClick ? "cursor-pointer hover:bg-white/[0.03]" : ""
              }`}
              style={{
                borderColor: colors.borderSoft,
                gridTemplateColumns: isBasketball ? basketballGrid : footballGrid,
              }}
            >
              {/* Rank */}
              <div className="flex items-center justify-center">
                {isTop1 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black bg-amber-400 shadow-sm shadow-amber-400/50">
                    1
                  </span>
                ) : isTop2 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black bg-slate-300">
                    2
                  </span>
                ) : isTop3 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black bg-amber-700/80 text-amber-100">
                    3
                  </span>
                ) : (
                  <span className="font-mono text-xs" style={{ color: colors.textMuted }}>
                    {rank}
                  </span>
                )}
              </div>

              {/* Team Info */}
              <div className="flex min-w-0 items-center gap-2.5 pr-2">
                {team.teamLogoUrl ? (
                  <img
                    src={team.teamLogoUrl}
                    alt={team.teamName}
                    className="h-6 w-6 shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: colors.panelAlt, color: colors.accent }}
                  >
                    {team.teamName.charAt(0)}
                  </div>
                )}
                <span className="truncate font-semibold text-white" title={team.teamName}>
                  {team.teamName}
                </span>
              </div>

              {/* Played */}
              <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                {team.played}
              </span>

              {/* Wins */}
              <span className="text-center font-mono font-medium">{team.wins}</span>

              {!isBasketball ? (
                <>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {team.draws ?? 0}
                  </span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {team.losses}
                  </span>
                  <span
                    className="text-center font-mono font-bold"
                    style={{ color: sortKey === "goalsFor" ? colors.accent : colors.text }}
                  >
                    {team.goalsFor ?? 0}
                  </span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {team.goalsAgainst ?? 0}
                  </span>
                  <span
                    className="text-center font-mono font-semibold"
                    style={{
                      color:
                        (team.goalDifference ?? 0) > 0
                          ? colors.accent
                          : (team.goalDifference ?? 0) < 0
                          ? colors.loss
                          : colors.textMuted,
                    }}
                  >
                    {(team.goalDifference ?? 0) > 0
                      ? `+${team.goalDifference}`
                      : team.goalDifference ?? 0}
                  </span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {team.cleanSheets ?? 0}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {team.losses}
                  </span>
                  <span
                    className="text-center font-mono font-bold"
                    style={{ color: sortKey === "winPercentage" ? colors.accent : colors.text }}
                  >
                    {(winPct * 100).toFixed(1)}%
                  </span>
                  <span
                    className="text-center font-mono font-semibold"
                    style={{ color: sortKey === "pointsForAvg" ? colors.accent : colors.text }}
                  >
                    {(team.pointsForAvg ?? 0).toFixed(1)}
                  </span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {(team.pointsAgainstAvg ?? 0).toFixed(1)}
                  </span>
                  <span
                    className="text-center font-mono font-bold"
                    style={{
                      color:
                        (team.pointDifferential ?? 0) > 0
                          ? colors.accent
                          : (team.pointDifferential ?? 0) < 0
                          ? colors.loss
                          : colors.textMuted,
                    }}
                  >
                    {(team.pointDifferential ?? 0) > 0
                      ? `+${(team.pointDifferential ?? 0).toFixed(1)}`
                      : (team.pointDifferential ?? 0).toFixed(1)}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
