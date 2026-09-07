"use client";

import { colors } from "../lib/design-tokens";
import type { MatchDetail } from "../lib/api/schemas/match.schema";

interface MatchHeaderProps {
  match: MatchDetail;
}

function formatMatchTime(utcIso: string): { date: string; time: string } {
  try {
    const d = new Date(utcIso);
    const date = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    return { date, time };
  } catch {
    return { date: "--/--/----", time: "--:--" };
  }
}

export default function MatchHeader({ match }: MatchHeaderProps) {
  const { date, time } = formatMatchTime(match.kickoffTime);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div
      className="relative overflow-hidden rounded-md border p-6 sm:p-8"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.panel,
      }}
    >
      {/* Background glow subtle effect */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-36 w-80 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: isLive ? colors.live : colors.accent }}
      />

      {/* Top Meta info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4 text-xs" style={{ borderColor: colors.borderSoft }}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{match.league}</span>
          {match.round && (
            <span style={{ color: colors.textMuted }}>• {match.round}</span>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span style={{ color: colors.textMuted }}>{date} lúc {time}</span>
          {isLive ? (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider animate-pulse"
              style={{ backgroundColor: `${colors.live}20`, color: colors.live }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.live }} />
              Live {match.minute ? `${match.minute}'` : ""}
            </span>
          ) : isFinished ? (
            <span
              className="rounded px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: colors.borderSoft, color: colors.textMuted }}
            >
              Đã kết thúc
            </span>
          ) : (
            <span
              className="rounded px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
            >
              Sắp diễn ra
            </span>
          )}
        </div>
      </div>

      {/* Main Scoreboard Layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-8 sm:gap-8">
        {/* Home Team */}
        <div className="flex flex-col items-center text-center sm:flex-row sm:justify-end sm:text-right gap-3 sm:gap-4">
          <div className="order-2 sm:order-1">
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
              {match.homeTeam.name}
            </h2>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
              Chủ nhà
            </span>
          </div>
          <div className="order-1 sm:order-2 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-md border p-2" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
            {match.homeTeam.logoUrl ? (
              <img
                src={match.homeTeam.logoUrl}
                alt={match.homeTeam.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-lg font-bold" style={{ color: colors.textMuted }}>
                {match.homeTeam.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Score / Center */}
        <div className="flex flex-col items-center justify-center px-2 sm:px-6">
          {isLive || isFinished ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="font-mono text-3xl sm:text-5xl font-extrabold text-white">
                {match.homeScore ?? 0}
              </span>
              <span className="text-xl sm:text-3xl font-light" style={{ color: colors.textFaint }}>
                -
              </span>
              <span className="font-mono text-3xl sm:text-5xl font-extrabold text-white">
                {match.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold font-mono" style={{ color: colors.textMuted }}>
                VS
              </span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center text-center sm:flex-row sm:justify-start sm:text-left gap-3 sm:gap-4">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-md border p-2" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
            {match.awayTeam.logoUrl ? (
              <img
                src={match.awayTeam.logoUrl}
                alt={match.awayTeam.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-lg font-bold" style={{ color: colors.textMuted }}>
                {match.awayTeam.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
              {match.awayTeam.name}
            </h2>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
              Đội khách
            </span>
          </div>
        </div>
      </div>

      {/* Bottom venue & referee information */}
      {(match.venue || match.referee) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-6 border-t pt-4 text-xs" style={{ borderColor: colors.borderSoft, color: colors.textFaint }}>
          {match.venue && <span>🏟️ Sân vận động: <strong className="font-medium text-gray-300">{match.venue}</strong></span>}
          {match.referee && <span>⚖️ Trọng tài: <strong className="font-medium text-gray-300">{match.referee}</strong></span>}
        </div>
      )}
    </div>
  );
}
