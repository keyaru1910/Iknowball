"use client";

import { useSport, type SportType } from "../context/SportContext";
import { colors } from "../lib/design-tokens";

interface SportSwitcherProps {
  className?: string;
  size?: "xs" | "sm" | "md";
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

  const padY =
    size === "xs"
      ? "py-0.5 px-2 text-[11px]"
      : size === "sm"
      ? "py-0.5 sm:py-1 px-2 sm:px-2.5 text-[11px] sm:text-xs"
      : "py-1.5 px-3.5 text-xs sm:text-sm";

  return (
    <div
      className={`inline-flex items-center rounded-full border p-0.5 shrink-0 ${className}`}
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
            className={`flex items-center gap-1 sm:gap-1.5 rounded-full font-medium transition-all ${padY} ${
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
            <span className="text-xs sm:text-sm leading-none">{item.icon}</span>
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

