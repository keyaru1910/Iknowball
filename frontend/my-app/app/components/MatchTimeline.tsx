"use client";

import { colors } from "../lib/design-tokens";
import type { MatchEvent } from "../lib/api/schemas/match.schema";

interface MatchTimelineProps {
  events: MatchEvent[];
  homeTeamId: string;
  awayTeamId: string;
}

function getEventIcon(type: string) {
  switch (type.toLowerCase()) {
    case "goal":
      return { icon: "⚽", label: "Bàn thắng", color: colors.accent };
    case "penalty":
      return { icon: "🎯", label: "Phạt đền", color: colors.accent };
    case "card":
    case "yellow_card":
      return { icon: "🟨", label: "Thẻ vàng", color: "#FACC15" };
    case "red_card":
      return { icon: "🟥", label: "Thẻ đỏ", color: colors.loss };
    case "substitution":
      return { icon: "🔄", label: "Thay người", color: "#60A5FA" };
    case "var":
      return { icon: "🖥️", label: "VAR", color: "#C084FC" };
    default:
      return { icon: "📌", label: "Sự kiện", color: colors.textMuted };
  }
}

export default function MatchTimeline({
  events,
  homeTeamId,
  awayTeamId,
}: MatchTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div
        className="rounded-md border p-8 text-center"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Chưa có sự kiện nào được ghi nhận trong trận đấu này.
        </p>
      </div>
    );
  }

  // Sắp xếp sự kiện tăng dần theo phút thi đấu
  const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

  return (
    <div
      className="rounded-md border p-5 sm:p-6"
      style={{ borderColor: colors.border, backgroundColor: colors.panel }}
    >
      <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
        Dòng thời gian sự kiện (Match Events)
      </h3>

      <div className="relative flex flex-col gap-4 before:absolute before:bottom-0 before:left-1/2 before:top-0 before:w-[2px] before:-translate-x-1/2 before:bg-[#232935]">
        {sortedEvents.map((evt) => {
          const isHome = evt.teamId === homeTeamId;
          const { icon, color } = getEventIcon(evt.type);

          return (
            <div
              key={evt.id}
              className="relative grid grid-cols-[1fr_48px_1fr] items-center gap-2 text-xs"
            >
              {/* Home Team Event Column */}
              <div className={`flex items-center gap-2 ${isHome ? "justify-end text-right" : "opacity-0 pointer-events-none"}`}>
                {isHome && (
                  <div>
                    <div className="font-semibold text-white">
                      {evt.playerName || "Cầu thủ"}
                    </div>
                    {evt.assistPlayerName && (
                      <div className="text-[11px]" style={{ color: colors.textMuted }}>
                        Kiến tạo: {evt.assistPlayerName}
                      </div>
                    )}
                  </div>
                )}
                {isHome && <span className="text-base">{icon}</span>}
              </div>

              {/* Minute Marker Badge in the Center */}
              <div className="z-10 flex justify-center">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px] font-bold shadow-md"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.panelAlt,
                    color: color,
                  }}
                >
                  {evt.minute}&apos;
                </span>
              </div>

              {/* Away Team Event Column */}
              <div className={`flex items-center gap-2 ${!isHome ? "justify-start text-left" : "opacity-0 pointer-events-none"}`}>
                {!isHome && <span className="text-base">{icon}</span>}
                {!isHome && (
                  <div>
                    <div className="font-semibold text-white">
                      {evt.playerName || "Cầu thủ"}
                    </div>
                    {evt.assistPlayerName && (
                      <div className="text-[11px]" style={{ color: colors.textMuted }}>
                        Kiến tạo: {evt.assistPlayerName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
