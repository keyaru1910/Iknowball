import { colors } from "../lib/design-tokens";

export interface ProbBarProps {
  /** Xác suất đội nhà thắng, 0-100 */
  home: number;
  /** Xác suất hòa (optional - bóng rổ không có hòa), 0-100 */
  draw?: number | null;
  /** Xác suất đội khách thắng, 0-100 */
  away: number;
  /** "sm" cho bảng/danh sách dày đặc, "md" cho card, "lg" cho hero/match detail. Mặc định "md". */
  size?: "sm" | "md" | "lg";
  /** Hiện số % dưới thanh bar. Mặc định true. */
  showLabels?: boolean;
  className?: string;
}

/**
 * Thanh xác suất thắng/hòa/thua (Bóng đá) hoặc thắng/thua (Bóng rổ)
 */
export default function ProbBar({
  home,
  draw = 0,
  away,
  size = "md",
  showLabels = true,
  className = "",
}: ProbBarProps) {
  const drawVal = draw ?? 0;
  const hasDraw = drawVal > 0;
  const total = home + drawVal + away;

  if (process.env.NODE_ENV !== "production" && Math.abs(total - 100) > 1.5) {
    console.warn(
      `[ProbBar] home+draw+away = ${total}, kỳ vọng ~100. Kiểm tra lại nguồn dữ liệu prediction.`
    );
  }

  const barHeight = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  const labelSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-[12px]" : "text-[11px]";

  return (
    <div className={className}>
      <div className={`flex w-full overflow-hidden rounded-full ${barHeight}`}>
        <div style={{ width: `${home}%`, backgroundColor: colors.accent }} />
        {hasDraw && (
          <div style={{ width: `${drawVal}%`, backgroundColor: colors.textFaint }} />
        )}
        <div style={{ width: `${away}%`, backgroundColor: hasDraw ? colors.borderSoft : "#F43F5E" }} />
      </div>

      {showLabels && (
        <div
          className={`mt-1 flex justify-between font-mono ${labelSize}`}
          style={{ color: colors.textMuted }}
        >
          <span>{Math.round(home)}%</span>
          {hasDraw ? <span>{Math.round(drawVal)}%</span> : null}
          <span>{Math.round(away)}%</span>
        </div>
      )}
    </div>
  );
}
