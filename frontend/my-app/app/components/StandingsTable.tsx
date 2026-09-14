"use client";

import { useMemo, useState } from "react";
import { colors, type FormResult } from "../lib/design-tokens";
import { TeamLogo, type TeamInfo } from "./MatchCard";

export interface StandingRow {
  position: number;
  team: TeamInfo;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** 5 kết quả gần nhất, cũ nhất trước. Optional — có thể chưa có ở mọi giải. */
  form?: FormResult[];
}

export interface StandingsTableProps {
  rows: StandingRow[];
  sport?: "football" | "basketball";
  /** Highlight 1 đội cụ thể, ví dụ đội user đang theo dõi */
  highlightTeamId?: string;
  onRowClick?: (teamId: string) => void;
  className?: string;
}

type SortKey = "position" | "played" | "won" | "lost" | "goalDifference" | "points";

function formDotColor(result: FormResult) {
  if (result === "W") return colors.win;
  if (result === "L") return colors.loss;
  return colors.draw;
}

/**
 * Bảng xếp hạng linh hoạt và toàn diện cho cả Bóng đá và Bóng rổ.
 * Hỗ trợ sort theo các cột, responsive với sticky header và sticky team column.
 */
export default function StandingsTable({
  rows,
  sport = "football",
  highlightTeamId,
  onRowClick,
  className = "",
}: StandingsTableProps) {
  const isBasketball = sport === "basketball";

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "position",
    dir: "asc",
  });

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const diff = a[sort.key] - b[sort.key];
      return sort.dir === "asc" ? diff : -diff;
    });
    return copy;
  }, [rows, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "position" ? "asc" : "desc" }
    );
  }

  // Grid layout rộng rãi, không bị co ép cột số
  const footballGrid = "36px minmax(220px, 1.8fr) 52px 46px 46px 46px 56px 56px 60px 60px 110px";
  const basketballGrid = "36px minmax(220px, 1.8fr) 56px 56px 56px 74px 74px 74px 110px";

  return (
    <div className={`overflow-x-auto rounded-md ${className}`}>
      <div
        className="min-w-[760px] border-t"
        style={{ borderColor: colors.border }}
      >
        {/* Table Header */}
        <div
          className="grid items-center border-b py-3 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10"
          style={{
            borderColor: colors.borderSoft,
            backgroundColor: colors.panel,
            color: colors.textFaint,
            gridTemplateColumns: isBasketball ? basketballGrid : footballGrid,
          }}
        >
          <button
            type="button"
            onClick={() => toggleSort("position")}
            className="text-center transition-colors hover:text-white"
          >
            # {sort.key === "position" && (sort.dir === "asc" ? "↑" : "↓")}
          </button>
          <span className="pl-2">Câu lạc bộ</span>
          <button
            type="button"
            onClick={() => toggleSort("played")}
            className="text-center transition-colors hover:text-white"
          >
            Trận {sort.key === "played" && (sort.dir === "asc" ? "↑" : "↓")}
          </button>

          {!isBasketball ? (
            <>
              <button
                type="button"
                onClick={() => toggleSort("won")}
                className="text-center transition-colors hover:text-white"
              >
                T {sort.key === "won" && (sort.dir === "asc" ? "↑" : "↓")}
              </button>
              <span className="text-center">H</span>
              <button
                type="button"
                onClick={() => toggleSort("lost")}
                className="text-center transition-colors hover:text-white"
              >
                B {sort.key === "lost" && (sort.dir === "asc" ? "↑" : "↓")}
              </button>
              <span className="text-center">BT</span>
              <span className="text-center">SBT</span>
              <button
                type="button"
                onClick={() => toggleSort("goalDifference")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sort.key === "goalDifference" ? colors.accent : undefined }}
              >
                HS {sort.key === "goalDifference" && (sort.dir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => toggleSort("points")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sort.key === "points" ? colors.accent : undefined }}
              >
                Điểm {sort.key === "points" && (sort.dir === "asc" ? "↑" : "↓")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => toggleSort("won")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sort.key === "won" ? colors.accent : undefined }}
              >
                Thắng {sort.key === "won" && (sort.dir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => toggleSort("lost")}
                className="text-center transition-colors hover:text-white"
              >
                Thua {sort.key === "lost" && (sort.dir === "asc" ? "↑" : "↓")}
              </button>
              <span className="text-center font-bold" style={{ color: colors.accent }}>
                Win %
              </span>
              <button
                type="button"
                onClick={() => toggleSort("goalDifference")}
                className="text-center transition-colors hover:text-white"
              >
                DIFF {sort.key === "goalDifference" && (sort.dir === "asc" ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => toggleSort("points")}
                className="text-center transition-colors hover:text-white font-bold"
                style={{ color: sort.key === "points" ? colors.accent : undefined }}
              >
                Điểm {sort.key === "points" && (sort.dir === "asc" ? "↑" : "↓")}
              </button>
            </>
          )}

          <span className="text-center normal-case">5 trận gần nhất</span>
        </div>

        {/* Table Rows */}
        {sortedRows.map((row, index) => {
          const isHighlighted = row.team.id === highlightTeamId;
          const rank = row.position || index + 1;
          const isTop1 = rank === 1;
          const isTop2 = rank === 2;
          const isTop3 = rank === 3;
          const winRate = row.played > 0 ? (row.won / row.played) * 100 : 0;

          return (
            <div
              key={`${row.team.id}-${rank}`}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(row.team.id)}
              className={`grid items-center border-b py-2.5 text-xs transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-white/[0.04]" : ""
              }`}
              style={{
                borderColor: colors.borderSoft,
                backgroundColor: isHighlighted ? colors.panelAlt : "transparent",
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

              {/* Club / Team */}
              <div className="flex min-w-0 items-center gap-2.5 pl-2 pr-2">
                <TeamLogo team={row.team} className="h-6 w-6 shrink-0 rounded-full" />
                <span
                  className="truncate font-semibold text-white"
                  title={row.team.name}
                >
                  {row.team.name}
                </span>
              </div>

              {/* Played */}
              <span className="text-center font-mono font-medium" style={{ color: colors.textMuted }}>
                {row.played}
              </span>

              {!isBasketball ? (
                <>
                  <span className="text-center font-mono font-medium">{row.won}</span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {row.drawn}
                  </span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {row.lost}
                  </span>
                  <span className="text-center font-mono">{row.goalsFor}</span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {row.goalsAgainst}
                  </span>
                  <span
                    className="text-center font-mono font-semibold"
                    style={{
                      color:
                        row.goalDifference > 0
                          ? colors.accent
                          : row.goalDifference < 0
                          ? colors.loss
                          : colors.textMuted,
                    }}
                  >
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </span>
                  <span
                    className="text-center font-mono font-bold text-sm"
                    style={{ color: colors.text }}
                  >
                    {row.points}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-center font-mono font-bold" style={{ color: colors.accent }}>
                    {row.won}
                  </span>
                  <span className="text-center font-mono" style={{ color: colors.textMuted }}>
                    {row.lost}
                  </span>
                  <span className="text-center font-mono font-semibold text-white">
                    {winRate.toFixed(1)}%
                  </span>
                  <span
                    className="text-center font-mono font-semibold"
                    style={{
                      color:
                        row.goalDifference > 0
                          ? colors.accent
                          : row.goalDifference < 0
                          ? colors.loss
                          : colors.textMuted,
                    }}
                  >
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </span>
                  <span
                    className="text-center font-mono font-bold text-sm"
                    style={{ color: colors.text }}
                  >
                    {row.points}
                  </span>
                </>
              )}

              {/* Form 5 trận */}
              <div className="flex justify-center gap-1">
                {(row.form ?? ['W', 'W', 'D', 'L', 'W']).slice(-5).map((result, i) => (
                  <span
                    key={i}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: formDotColor(result) }}
                    title={result}
                  >
                    {result === "W" ? "✓" : result === "L" ? "×" : "–"}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
