import { colors, type FormResult } from "../lib/design-tokens";

interface TeamFormBadgeProps {
  form?: FormResult[];
  showLabel?: boolean;
}

const formMap: Record<FormResult, { label: string; bg: string; text: string }> = {
  W: { label: "T", bg: colors.win, text: "#0B0E13" },
  D: { label: "H", bg: colors.draw, text: "#EDEFF3" },
  L: { label: "B", bg: colors.loss, text: "#FFFFFF" },
};

/**
 * Hiển thị 5 kết quả phong độ gần nhất của đội (W = Thắng, D = Hòa, L = Bại)
 */
export default function TeamFormBadge({ form = [], showLabel = false }: TeamFormBadgeProps) {
  if (!form || form.length === 0) {
    return <span className="text-xs" style={{ color: colors.textFaint }}>Chưa có dữ liệu</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {showLabel && (
        <span className="text-xs font-medium mr-1" style={{ color: colors.textMuted }}>
          Phong độ:
        </span>
      )}
      <div className="flex items-center gap-1">
        {form.slice(-5).map((res, index) => {
          const config = formMap[res] || formMap.D;
          return (
            <span
              key={index}
              title={res === "W" ? "Thắng" : res === "D" ? "Hòa" : "Thua"}
              className="flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold shadow-sm"
              style={{ backgroundColor: config.bg, color: config.text }}
            >
              {config.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
