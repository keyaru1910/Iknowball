import { useMemo } from "react";
import { colors } from "../lib/design-tokens";
import type { League } from "../lib/api/schemas/league.schema";
import SeasonSelector from "./SeasonSelector";

interface MatchDateFilterProps {
  selectedDate?: string; // yyyy-MM-dd; undefined means the whole season
  onSelectDate: (date: string | undefined) => void;
  selectedLeagueId?: string;
  onSelectLeagueId?: (leagueId: string | undefined) => void;
  leagues?: League[];
  selectedSeason?: string;
  onSelectSeason?: (season: string) => void;
  sport?: "football" | "basketball";
}

/**
 * Định dạng đối tượng Date thành chuỗi YYYY-MM-DD theo giờ địa phương của người dùng (tránh lệch UTC)
 */
export function dinhDangNgayDiaPhuong(d: Date = new Date()): string {
  const nam = d.getFullYear();
  const thang = String(d.getMonth() + 1).padStart(2, "0");
  const ngay = String(d.getDate()).padStart(2, "0");
  return `${nam}-${thang}-${ngay}`;
}

const TEN_THU_VIET_TAT = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

/**
 * Định dạng thứ và ngày tháng theo định dạng đồng nhất giữa Server và Client (tránh lỗi Hydration)
 */
function dinhDangThuVaNgay(d: Date): string {
  const tenThu = TEN_THU_VIET_TAT[d.getDay()];
  const ngay = String(d.getDate()).padStart(2, "0");
  const thang = String(d.getMonth() + 1).padStart(2, "0");
  return `${tenThu}, ${ngay}/${thang}`;
}

export default function MatchDateFilter({
  selectedDate,
  onSelectDate,
  selectedLeagueId,
  onSelectLeagueId,
  leagues = [],
  selectedSeason,
  onSelectSeason,
  sport = "football",
}: MatchDateFilterProps) {
  // Tạo danh sách 7 ngày quanh mốc hôm nay (3 ngày trước, hôm nay, 3 ngày sau) theo giờ địa phương
  const dateOptions = useMemo(() => {
    const dates: { label: string; dateStr: string; isToday: boolean }[] = [];
    const today = new Date();

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date();
      d.setDate(today.getDate() + offset);
      const dateStr = dinhDangNgayDiaPhuong(d); // yyyy-MM-dd theo Local Timezone

      let label = "";
      if (offset === 0) {
        label = "Hôm nay";
      } else if (offset === -1) {
        label = "Hôm qua";
      } else if (offset === 1) {
        label = "Ngày mai";
      } else {
        label = dinhDangThuVaNgay(d);
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
        <button
          type="button"
          onClick={() => onSelectDate(undefined)}
          className={`whitespace-nowrap rounded-sm px-3.5 py-1.5 text-xs font-medium transition-all ${selectedDate === undefined ? "shadow-sm font-semibold" : "hover:text-white"
            }`}
          style={{
            backgroundColor: selectedDate === undefined ? colors.panelAlt : "transparent",
            border: `1px solid ${selectedDate === undefined ? colors.accent : colors.border}`,
            color: selectedDate === undefined ? colors.accent : colors.textMuted,
          }}
        >
          Cả mùa
          <span className="block text-[10px] font-mono opacity-80">Tất cả ngày</span>
        </button>
        {dateOptions.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`whitespace-nowrap rounded-sm px-3.5 py-1.5 text-xs font-medium transition-all ${isSelected
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

        {/* Chọn ngày tùy chỉnh */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={selectedDate || ""}
            onChange={(e) => onSelectDate(e.target.value || undefined)}
            className="rounded-sm border px-2 py-1.5 text-xs font-medium outline-none transition-colors focus:border-emerald-500 cursor-pointer"
            style={{
              borderColor: selectedDate && !dateOptions.some(d => d.dateStr === selectedDate) ? colors.accent : colors.border,
              backgroundColor: colors.panelAlt,
              color: colors.text,
            }}
            title="Chọn ngày tùy chỉnh"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => onSelectDate(undefined)}
              className="text-xs px-1.5 py-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: colors.textMuted }}
              title="Xóa lọc ngày"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc Mùa giải & Giải đấu */}
      <div className="flex flex-wrap items-center gap-2.5">
        {selectedSeason && onSelectSeason && (
          <SeasonSelector
            selectedSeason={selectedSeason}
            onSelectSeason={onSelectSeason}
            sport={sport}
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
