"use client";

import { useMemo, useState } from "react";
import { colors, type FormResult } from "../lib/design-tokens";
import type { TeamInfo } from "./MatchCard";

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

const columns: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "position", label: "#", align: "left" },
  { key: "played", label: "Trận", align: "right" },
  { key: "goalDifference", label: "HS", align: "right" },
  { key: "points", label: "Điểm", align: "right" },
];

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
    <div className={`border-t ${className}`} style={{ borderColor: colors.border }}>
      <div
        className="grid grid-cols-[32px_1fr_60px_50px_50px_80px] items-center gap-3 border-b py-3 text-[11px]"
        style={{ borderColor: colors.borderSoft, color: colors.textFaint }}
      >
        {columns.map((col) => (
          <button
            key={col.key}
            onClick={() => toggleSort(col.key)}
            className={`${col.align === "right" ? "text-right" : "text-left"} hover:text-white transition-colors`}
            style={col.key === "position" ? { textAlign: "left" } : undefined}
          >
            {col.label}
            {sort.key === col.key && (sort.dir === "asc" ? " ↑" : " ↓")}
          </button>
        ))}
        <span className="text-right">Phong độ</span>
      </div>

      {sortedRows.map((row) => {
        const isHighlighted = row.team.id === highlightTeamId;
        return (
          <div
            key={row.team.id}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row.team.id)}
            className={`grid grid-cols-[32px_1fr_60px_50px_50px_80px] items-center gap-3 border-b py-3 text-[13px] ${onRowClick ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
            style={{
              borderColor: colors.borderSoft,
              backgroundColor: isHighlighted ? colors.panelAlt : "transparent",
            }}
          >
            <span className="font-mono" style={{ color: colors.textMuted }}>
              {row.position}
            </span>
            <span>{row.team.name}</span>
            <span className="text-right font-mono" style={{ color: colors.textMuted }}>
              {row.played}
            </span>
            <span
              className="text-right font-mono"
              style={{ color: row.goalDifference >= 0 ? colors.textMuted : colors.loss }}
            >
              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
            </span>
            <span className="text-right font-mono font-semibold" style={{ color: colors.text }}>
              {row.points}
            </span>
            <div className="flex justify-end gap-1">
              {(row.form ?? []).slice(-5).map((result, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: formDotColor(result) }}
                  title={result}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
