"use client";

import { colors } from "../lib/design-tokens";
import type { MatchStatsComparison } from "../lib/api/schemas/match.schema";

interface MatchStatsBarProps {
  stats?: MatchStatsComparison | null;
  homeTeamName: string;
  awayTeamName: string;
}

interface StatRowConfig {
  key: keyof MatchStatsComparison;
  label: string;
  isPercentage?: boolean;
}

const statConfigs: StatRowConfig[] = [
  { key: "possession", label: "Kiểm soát bóng", isPercentage: true },
  { key: "shotsTotal", label: "Tổng số cú sút" },
  { key: "shotsOnTarget", label: "Sút trúng đích" },
  { key: "corners", label: "Phạt góc" },
  { key: "fouls", label: "Phạm lỗi" },
  { key: "yellowCards", label: "Thẻ vàng" },
  { key: "redCards", label: "Thẻ đỏ" },
  { key: "offsides", label: "Việt vị" },
  { key: "passAccuracy", label: "Chính xác đường chuyền", isPercentage: true },
];

export default function MatchStatsBar({
  stats,
  homeTeamName,
  awayTeamName,
}: MatchStatsBarProps) {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div
        className="rounded-md border p-8 text-center"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Chưa có số liệu thống kê chi tiết cho trận đấu này.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-md border p-5 sm:p-6"
      style={{ borderColor: colors.border, backgroundColor: colors.panel }}
    >
      <div className="mb-6 flex items-center justify-between border-b pb-3 text-xs font-semibold uppercase tracking-wider text-white" style={{ borderColor: colors.borderSoft }}>
        <span className="text-emerald-400">{homeTeamName}</span>
        <span style={{ color: colors.textMuted }}>Chỉ số thống kê</span>
        <span className="text-rose-400">{awayTeamName}</span>
      </div>

      <div className="flex flex-col gap-5">
        {statConfigs.map((config) => {
          const item = stats[config.key];
          if (!item) return null;

          const homeVal = item.home ?? 0;
          const awayVal = item.away ?? 0;
          const total = homeVal + awayVal || 1;
          const homePercent = Math.round((homeVal / total) * 100);
          const awayPercent = 100 - homePercent;

          return (
            <div key={config.key} className="flex flex-col gap-1.5 text-xs">
              {/* Value labels */}
              <div className="flex items-center justify-between font-mono text-[13px]">
                <span className="font-semibold text-white">
                  {homeVal}{config.isPercentage ? "%" : ""}
                </span>
                <span className="text-xs font-medium font-sans" style={{ color: colors.textMuted }}>
                  {config.label}
                </span>
                <span className="font-semibold text-white">
                  {awayVal}{config.isPercentage ? "%" : ""}
                </span>
              </div>

              {/* Progress bar comparison */}
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#161B22] p-[1px] gap-[2px]">
                <div
                  className="h-full rounded-l-full transition-all duration-300"
                  style={{ width: `${homePercent}%`, backgroundColor: colors.accent }}
                />
                <div
                  className="h-full rounded-r-full transition-all duration-300"
                  style={{ width: `${awayPercent}%`, backgroundColor: "#F43F5E" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
