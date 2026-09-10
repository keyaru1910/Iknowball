"use client";

import { colors } from "../lib/design-tokens";
import { SUPPORTED_SEASONS, type SeasonOption } from "../lib/constants/seasons";

interface SeasonSelectorProps {
  selectedSeason: string;
  onSelectSeason: (season: string) => void;
  variant?: "pill" | "select";
  className?: string;
}

/**
 * Component lựa chọn mùa giải (24/25, 25/26, 26/27)
 * Áp dụng thống nhất cho cả trang Trận đấu (Matches) và Bảng xếp hạng (Standings)
 */
export default function SeasonSelector({
  selectedSeason,
  onSelectSeason,
  variant = "pill",
  className = "",
}: SeasonSelectorProps) {
  if (variant === "select") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <label htmlFor="season-select" className="text-xs font-medium" style={{ color: colors.textMuted }}>
          Mùa giải:
        </label>
        <select
          id="season-select"
          value={selectedSeason}
          onChange={(e) => onSelectSeason(e.target.value)}
          className="rounded-sm border px-3 py-1.5 text-xs font-medium outline-none transition-colors focus:border-emerald-500"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.panel,
            color: colors.text,
          }}
        >
          {SUPPORTED_SEASONS.map((s: SeasonOption) => (
            <option key={s.value} value={s.value}>
              Mùa {s.label} ({s.value})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 rounded-md p-1 border ${className}`} style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
      <div className="flex items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Mùa</span>
      </div>
      <div className="flex items-center gap-1">
        {SUPPORTED_SEASONS.map((season: SeasonOption) => {
          const isSelected = selectedSeason === season.value || selectedSeason === season.label;
          return (
            <button
              key={season.value}
              type="button"
              onClick={() => onSelectSeason(season.value)}
              title={season.description}
              className={`whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-semibold transition-all ${
                isSelected ? "text-white shadow-sm" : "hover:text-white"
              }`}
              style={{
                backgroundColor: isSelected ? colors.panelAlt : "transparent",
                border: `1px solid ${isSelected ? colors.accent : "transparent"}`,
                color: isSelected ? colors.accent : colors.textMuted,
              }}
            >
              {season.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
