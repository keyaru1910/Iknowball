import { colors } from "../lib/design-tokens";

export interface ProbBarProps {
  /** Xác suất đội nhà thắng, [0-1] hoặc [0-100] */
  home: number;
  /** Xác suất hòa (optional - bóng rổ không có hòa), [0-1] hoặc [0-100] */
  draw?: number | null;
  /** Xác suất đội khách thắng, [0-1] hoặc [0-100] */
  away: number;
  /** "sm" cho bảng/danh sách dày đặc, "md" cho card, "lg" cho hero/match detail. Mặc định "md". */
  size?: "sm" | "md" | "lg";
  /** Hiện số % dưới thanh bar. Mặc định true. */
  showLabels?: boolean;
  className?: string;
}

/**
 * Thanh xác suất thắng/hòa/thua (Bóng đá) hoặc thắng/thua (Bóng rổ)
 * Thiết kế chuẩn Cyberpunk/Fintech với gradient màu cao cấp.
 */
export default function ProbBar({
  home,
  draw = 0,
  away,
  size = "md",
  showLabels = true,
  className = "",
}: ProbBarProps) {
  // Tự động chuẩn hóa nếu đầu vào ở thang đo 0..1 thay vì 0..100
  const isFraction = (home + (draw ?? 0) + away) <= 1.5;
  const homePct = isFraction ? home * 100 : home;
  const drawPct = draw !== null && draw !== undefined ? (isFraction ? draw * 100 : draw) : 0;
  const awayPct = isFraction ? away * 100 : away;

  const hasDraw = drawPct > 0.01;

  const barHeight = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  const labelSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-[12px]" : "text-[11px]";

  return (
    <div className={`w-full ${className}`}>
      <div className={`flex w-full overflow-hidden rounded-full bg-neutral-900/60 p-[1px] border border-white/5 shadow-inner ${barHeight}`}>
        {/* Đội nhà */}
        <div
          style={{ width: `${Math.max(0, Math.min(100, homePct))}%` }}
          className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
          title={`Đội nhà thắng: ${homePct.toFixed(1)}%`}
        />
        {/* Hòa */}
        {hasDraw && (
          <div
            style={{ width: `${Math.max(0, Math.min(100, drawPct))}%` }}
            className="bg-gradient-to-r from-neutral-600 to-neutral-500 transition-all duration-500"
            title={`Hòa: ${drawPct.toFixed(1)}%`}
          />
        )}
        {/* Đội khách */}
        <div
          style={{ width: `${Math.max(0, Math.min(100, awayPct))}%` }}
          className={`bg-gradient-to-r ${hasDraw ? 'from-rose-500 to-pink-500' : 'from-cyan-500 to-blue-500'} rounded-r-full transition-all duration-500`}
          title={`Đội khách thắng: ${awayPct.toFixed(1)}%`}
        />
      </div>

      {showLabels && (
        <div className={`mt-1.5 flex justify-between font-mono font-medium ${labelSize}`}>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
            {Number(homePct).toFixed(1)}%
          </span>
          {hasDraw && (
            <span className="text-neutral-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 inline-block" />
              {Number(drawPct).toFixed(1)}%
            </span>
          )}
          <span className={`${hasDraw ? 'text-rose-400' : 'text-cyan-400'} flex items-center gap-1`}>
            <span className={`h-1.5 w-1.5 rounded-full ${hasDraw ? 'bg-rose-400' : 'bg-cyan-400'} inline-block`} />
            {Number(awayPct).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

