"use client";

import { useSport, type SportType } from "../context/SportContext";
import { colors } from "../lib/design-tokens";

interface SportSwitcherProps {
  className?: string;
  size?: "sm" | "md";
}

export default function SportSwitcher({
  className = "",
  size = "md",
}: SportSwitcherProps) {
  const { sport, setSport } = useSport();

  const sports: { id: SportType; label: string; icon: string }[] = [
    { id: "football", label: "Bóng đá", icon: "⚽" },
    { id: "basketball", label: "Bóng rổ", icon: "🏀" },
  ];

  const padY = size === "sm" ? "py-1 px-2.5 text-xs" : "py-1.5 px-3.5 text-xs";

  return (
    <div
      className={`inline-flex items-center rounded-full border p-0.5 ${className}`}
      style={{
        borderColor: colors.border,
        backgroundColor: colors.panel,
      }}
    >
      {sports.map((item) => {
        const isActive = sport === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setSport(item.id)}
            className={`flex items-center gap-1.5 rounded-full font-medium transition-all ${padY} ${
              isActive
                ? "shadow-sm font-semibold"
                : "hover:text-white"
            }`}
            style={{
              backgroundColor: isActive ? colors.panelAlt : "transparent",
              border: isActive ? `1px solid ${colors.borderSoft}` : "1px solid transparent",
              color: isActive ? colors.accent : colors.textMuted,
            }}
          >
            <span className="text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
