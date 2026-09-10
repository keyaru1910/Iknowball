import { useMemo } from "react";
import { colors } from "../lib/design-tokens";
import type { League } from "../lib/api/schemas/league.schema";
import SeasonSelector from "./SeasonSelector";

interface MatchDateFilterProps {
  selectedDate: string; // yyyy-MM-dd
  onSelectDate: (date: string) => void;
  selectedLeagueId?: string;
  onSelectLeagueId?: (leagueId: string | undefined) => void;
  leagues?: League[];
  selectedSeason?: string;
  onSelectSeason?: (season: string) => void;
}

export default function MatchDateFilter({
  selectedDate,
  onSelectDate,
  selectedLeagueId,
  onSelectLeagueId,
  leagues = [],
  selectedSeason,
  onSelectSeason,
}: MatchDateFilterProps) {
  // Tạo danh sách 7 ngày quanh mốc hôm nay (3 ngày trước, hôm nay, 3 ngày sau)
  const dateOptions = useMemo(() => {
    const dates: { label: string; dateStr: string; isToday: boolean }[] = [];
    const today = new Date();

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date();
      d.setDate(today.getDate() + offset);
      const dateStr = d.toISOString().slice(0, 10); // yyyy-MM-dd

      let label = "";
      if (offset === 0) {
        label = "Hôm nay";
      } else if (offset === -1) {
        label = "Hôm qua";
      } else if (offset === 1) {
        label = "Ngày mai";
      } else {
        label = new Intl.DateTimeFormat("vi-VN", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }).format(d);
      }

      dates.push({
        label,
        dateStr,
        isToday: offset === 0,
      });
    }
    return dates;
  }, []);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Ngày thi đấu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {dateOptions.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`whitespace-nowrap rounded-sm px-3.5 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? "shadow-sm font-semibold"
                  : "hover:text-white"
              }`}
              style={{
                backgroundColor: isSelected ? colors.panelAlt : "transparent",
                border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                color: isSelected ? colors.accent : colors.textMuted,
              }}
            >
              {item.label}
              <span className="block text-[10px] font-mono opacity-80">
                {item.dateStr.slice(5)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bộ lọc Mùa giải & Giải đấu */}
      <div className="flex flex-wrap items-center gap-2.5">
        {selectedSeason && onSelectSeason && (
          <SeasonSelector
            selectedSeason={selectedSeason}
            onSelectSeason={onSelectSeason}
            variant="pill"
          />
        )}

        {leagues.length > 0 && onSelectLeagueId && (
          <div className="flex items-center gap-2">
            <select
              value={selectedLeagueId || ""}
              onChange={(e) => onSelectLeagueId(e.target.value || undefined)}
              className="rounded-sm border px-3 py-2 text-xs font-medium outline-none transition-colors focus:border-emerald-500"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.panel,
                color: colors.text,
              }}
            >
              <option value="">Tất cả giải đấu</option>
              {leagues.map((lg) => (
                <option key={lg.id} value={lg.id}>
                  {lg.name} {lg.country ? `(${lg.country})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
