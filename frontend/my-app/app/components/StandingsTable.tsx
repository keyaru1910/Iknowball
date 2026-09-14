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
  /** Highlight 1 đội cụ thể, ví dụ đội user đang theo dõi */
  highlightTeamId?: string;
  onRowClick?: (teamId: string) => void;
  className?: string;
}

type SortKey = "position" | "played" | "goalDifference" | "points";

const tableGrid = "32px minmax(190px, 1fr) repeat(8, 34px) 96px";

function formDotColor(result: FormResult) {
  if (result === "W") return colors.win;
  if (result === "L") return colors.loss;
  return colors.draw;
}

/**
 * Bảng xếp hạng có thể sort theo Trận/Hiệu số/Điểm.
 * Không phụ thuộc thư viện ngoài — nếu cần thêm tính năng
 * (filter, phân trang), cân nhắc thay bằng @tanstack/react-table
 * mà không cần đổi props bên ngoài của component này.
 */
export default function StandingsTable({
  rows,
  highlightTeamId,
  onRowClick,
  className = "",
}: StandingsTableProps) {
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

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="min-w-[690px] border-t" style={{ borderColor: colors.border }}>
      <div
        className="grid items-center border-b py-2.5 text-[10px] uppercase tracking-wide"
        style={{ borderColor: colors.borderSoft, color: colors.textFaint, gridTemplateColumns: tableGrid }}
      >
        <button type="button" onClick={() => toggleSort("position")} className="text-left transition-colors hover:text-white">
          # {sort.key === "position" && (sort.dir === "asc" ? "↑" : "↓")}
        </button>
        <span>Câu lạc bộ</span>
        <button type="button" onClick={() => toggleSort("played")} className="text-center transition-colors hover:text-white">
          ĐĐ {sort.key === "played" && (sort.dir === "asc" ? "↑" : "↓")}
        </button>
        <span className="text-center">T</span>
        <span className="text-center">H</span>
        <span className="text-center">B</span>
        <span className="text-center">BT</span>
        <span className="text-center">SBT</span>
        <button type="button" onClick={() => toggleSort("goalDifference")} className="text-center transition-colors hover:text-white">
          HS {sort.key === "goalDifference" && (sort.dir === "asc" ? "↑" : "↓")}
        </button>
        <button type="button" onClick={() => toggleSort("points")} className="text-center transition-colors hover:text-white">
          Đ {sort.key === "points" && (sort.dir === "asc" ? "↑" : "↓")}
        </button>
        <span className="text-center normal-case">5 trận gần nhất</span>
      </div>

      {sortedRows.map((row) => {
        const isHighlighted = row.team.id === highlightTeamId;
        return (
          <div
            key={row.team.id}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row.team.id)}
            className={`grid items-center border-b py-2 text-[12px] ${onRowClick ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
            style={{
              borderColor: colors.borderSoft,
              backgroundColor: isHighlighted ? colors.panelAlt : "transparent",
              gridTemplateColumns: tableGrid,
            }}
          >
            <span className="font-mono" style={{ color: colors.textMuted }}>
              {row.position}
            </span>
            <div className="flex min-w-0 items-center gap-2.5">
              <TeamLogo team={row.team} className="h-6 w-6 rounded-full" />
              <span className="truncate font-medium" title={row.team.name}>{row.team.name}</span>
            </div>
            <span className="text-center font-mono" style={{ color: colors.textMuted }}>
              {row.played}
            </span>
            <span className="text-center font-mono">{row.won}</span>
            <span className="text-center font-mono">{row.drawn}</span>
            <span className="text-center font-mono">{row.lost}</span>
            <span className="text-center font-mono">{row.goalsFor}</span>
            <span className="text-center font-mono">{row.goalsAgainst}</span>
            <span
              className="text-center font-mono"
              style={{ color: row.goalDifference >= 0 ? colors.textMuted : colors.loss }}
            >
              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
            </span>
            <span className="text-center font-mono font-bold" style={{ color: colors.text }}>
              {row.points}
            </span>
            <div className="flex justify-center gap-1">
              {(row.form ?? []).slice(-5).map((result, i) => (
                <span
                  key={i}
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
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
