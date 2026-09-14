"use client";

import { useMemo, useState } from "react";
import { colors } from "../lib/design-tokens";
import type { PlayerStatisticDto } from "../lib/api/schemas/statistics.schema";

export interface PlayerStatsTableProps {
  players: PlayerStatisticDto[];
  sport: "football" | "basketball";
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

type SortColumn =
  | "rank"
  | "appearances"
  | "goals"
  | "assists"
  | "yellowCards"
  | "redCards"
  | "pointsAvg"
  | "reboundsAvg"
  | "assistsAvg"
  | "stealsAvg"
  | "fieldGoalPercentage";

export default function PlayerStatsTable({
  players,
  sport,
  onPlayerClick,
  className = "",
}: PlayerStatsTableProps) {
  const isBasketball = sport === "basketball";

  const [sortKey, setSortKey] = useState<SortColumn>(
    isBasketball ? "pointsAvg" : "goals"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(column: SortColumn) {
    if (sortKey === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDir("desc");
    }
  }

  const sortedPlayers = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortKey === "appearances") {
        valA = a.appearances ?? 0;
        valB = b.appearances ?? 0;
      } else if (sortKey === "goals") {
        valA = a.goals ?? 0;
        valB = b.goals ?? 0;
      } else if (sortKey === "assists") {
        valA = a.assists ?? 0;
        valB = b.assists ?? 0;
      } else if (sortKey === "yellowCards") {
        valA = a.yellowCards ?? 0;
        valB = b.yellowCards ?? 0;
      } else if (sortKey === "redCards") {
        valA = a.redCards ?? 0;
        valB = b.redCards ?? 0;
      } else if (sortKey === "pointsAvg") {
        valA = a.pointsAvg ?? 0;
        valB = b.pointsAvg ?? 0;
      } else if (sortKey === "reboundsAvg") {
        valA = a.reboundsAvg ?? 0;
        valB = b.reboundsAvg ?? 0;
      } else if (sortKey === "assistsAvg") {
        valA = a.assistsAvg ?? 0;
        valB = b.assistsAvg ?? 0;
      } else if (sortKey === "stealsAvg") {
        valA = a.stealsAvg ?? 0;
        valB = b.stealsAvg ?? 0;
      } else if (sortKey === "fieldGoalPercentage") {
        valA = a.fieldGoalPercentage ?? 0;
        valB = b.fieldGoalPercentage ?? 0;
      }

      return sortDir === "asc" ? valA - valB : valB - valA;
    });
    return list;
  }, [players, sortKey, sortDir]);

  // Layout grid linh hoạt theo môn thể thao
  const footballGrid = "40px minmax(200px, 1.5fr) minmax(140px, 1fr) 56px 64px 64px 50px 50px";
  const basketballGrid = "40px minmax(200px, 1.5fr) minmax(140px, 1fr) 56px 70px 70px 70px 64px 64px";

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
          <span>Cầu thủ</span>
          <span>Câu lạc bộ</span>
          <button
            type="button"
            onClick={() => handleSort("appearances")}
            className="text-center transition-colors hover:text-white"
          >
            Trận {sortKey === "appearances" && (sortDir === "asc" ? "↑" : "↓")}
          </button>

          {!isBasketball ? (
            <>
              <button
                type="button"
                onClick={() => handleSort("goals")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "goals" ? colors.accent : undefined }}
              >
                Bàn thắng {sortKey === "goals" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("assists")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "assists" ? colors.accent : undefined }}
              >
                Kiến tạo {sortKey === "assists" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("yellowCards")}
                className="text-center transition-colors hover:text-white"
              >
                Thẻ V {sortKey === "yellowCards" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("redCards")}
                className="text-center transition-colors hover:text-white"
              >
                Thẻ Đ {sortKey === "redCards" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSort("pointsAvg")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "pointsAvg" ? colors.accent : undefined }}
              >
                PPG {sortKey === "pointsAvg" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("reboundsAvg")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "reboundsAvg" ? colors.accent : undefined }}
              >
                RPG {sortKey === "reboundsAvg" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("assistsAvg")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sortKey === "assistsAvg" ? colors.accent : undefined }}
              >
                APG {sortKey === "assistsAvg" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("stealsAvg")}
                className="text-center transition-colors hover:text-white"
              >
                SPG {sortKey === "stealsAvg" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("fieldGoalPercentage")}
                className="text-center transition-colors hover:text-white"
              >
                FG% {sortKey === "fieldGoalPercentage" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            </>
          )}
        </div>

        {/* Table Rows */}
        {sortedPlayers.map((player, index) => {
          const rank = index + 1;
          const isTop1 = rank === 1;
          const isTop2 = rank === 2;
          const isTop3 = rank === 3;

          return (
            <div
              key={player.id || player.playerId}
              role={onPlayerClick ? "button" : undefined}
              tabIndex={onPlayerClick ? 0 : undefined}
              onClick={() => onPlayerClick?.(player.playerId)}
              className={`grid items-center border-b py-3 text-xs transition-colors ${
                onPlayerClick ? "cursor-pointer hover:bg-white/[0.03]" : ""
              }`}
              style={{
                borderColor: colors.borderSoft,
                gridTemplateColumns: isBasketball ? basketballGrid : footballGrid,
              }}
            >
              {/* Rank Badge */}
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

              {/* Player Info */}
              <div className="flex min-w-0 items-center gap-3 pr-2">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                  style={{
                    borderColor: colors.borderSoft,
                    backgroundColor: colors.panelAlt,
                    color: colors.accent,
                  }}
                >
                  {player.playerName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white" title={player.playerName}>
                    {player.playerName}
                  </p>
                  <p className="text-[10px]" style={{ color: colors.textFaint }}>
                    {player.position ?? (isBasketball ? "Player" : "Tiền đạo")}
                    {player.nationality ? ` · ${player.nationality}` : ""}
                  </p>
                </div>
              </div>

              {/* Club Info */}
              <div className="flex min-w-0 items-center gap-2 pr-2">
                {player.teamLogoUrl ? (
                  <img
                    src={player.teamLogoUrl}
                    alt={player.teamName}
                    className="h-5 w-5 shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : null}
                <span className="truncate text-xs" style={{ color: colors.textMuted }} title={player.teamName}>
                  {player.teamName}
                </span>
              </div>

              {/* Appearances */}
              <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                {player.appearances}
              </span>

              {/* Stats Columns */}
              {!isBasketball ? (
                <>
                  <span
                    className="text-center font-mono font-bold text-sm"
                    style={{ color: sortKey === "goals" ? colors.accent : colors.text }}
                  >
                    {player.goals ?? 0}
                  </span>
                  <span
                    className="text-center font-mono font-semibold"
                    style={{ color: sortKey === "assists" ? colors.accent : colors.textMuted }}
                  >
                    {player.assists ?? 0}
                  </span>
                  <div className="flex justify-center">
                    <span className="flex h-4 w-3.5 items-center justify-center rounded-[2px] bg-yellow-400/90 text-[9px] font-bold text-black">
                      {player.yellowCards ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <span className="flex h-4 w-3.5 items-center justify-center rounded-[2px] bg-red-500/90 text-[9px] font-bold text-white">
                      {player.redCards ?? 0}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span
                    className="text-center font-mono font-bold text-sm"
                    style={{ color: sortKey === "pointsAvg" ? colors.accent : colors.text }}
                  >
                    {(player.pointsAvg ?? 0).toFixed(1)}
                  </span>
                  <span
                    className="text-center font-mono font-semibold"
                    style={{ color: sortKey === "reboundsAvg" ? colors.accent : colors.textMuted }}
                  >
                    {(player.reboundsAvg ?? 0).toFixed(1)}
                  </span>
                  <span
                    className="text-center font-mono font-semibold"
                    style={{ color: sortKey === "assistsAvg" ? colors.accent : colors.textMuted }}
                  >
                    {(player.assistsAvg ?? 0).toFixed(1)}
                  </span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {(player.stealsAvg ?? 0).toFixed(1)}
                  </span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {player.fieldGoalPercentage ? `${player.fieldGoalPercentage}%` : "—"}
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
