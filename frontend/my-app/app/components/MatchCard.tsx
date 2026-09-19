"use client";

import { useState } from "react";
import { colors, type MatchStatus } from "../lib/design-tokens";
import ProbBar from "./ProbBar";

export interface TeamInfo {
  id: string;
  name: string;
  logoUrl?: string | null;
  shortName?: string | null;
}

export interface MatchPrediction {
  homeWinProb: number;
  drawProb: number | null;
  awayWinProb: number;
  predictedOutcome?: string;
}

export interface MatchCardProps {
  id: string;
  league: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  /** ISO string (UTC) */
  kickoffTime: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  prediction?: MatchPrediction;
  onClick?: (matchId: string) => void;
  className?: string;
}

function formatKickoff(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(d);
  } catch {
    return "--:--";
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function TeamLogoFallback({ team, className }: { team: TeamInfo; className: string }) {
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold border border-white/10 bg-white/5 text-neutral-200 shadow-sm ${className}`}
      title={`${team.name}`}
    >
      {initials(team.name)}
    </div>
  );
}

function TeamLogoImage({ team, className }: { team: TeamInfo; className: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (imageFailed || !team.logoUrl) return <TeamLogoFallback team={team} className={className} />;

  return (
    <img
      src={team.logoUrl}
      alt={`${team.name} logo`}
      className={`h-7 w-7 shrink-0 object-contain drop-shadow-sm ${className}`}
      onError={() => setImageFailed(true)}
    />
  );
}

export function TeamLogo({ team, className = "" }: { team: TeamInfo; className?: string }) {
  if (!team.logoUrl) return <TeamLogoFallback team={team} className={className} />;
  return <TeamLogoImage key={`${team.id}:${team.logoUrl}`} team={team} className={className} />;
}

export default function MatchCard({
  id,
  league,
  homeTeam,
  awayTeam,
  kickoffTime,
  status,
  homeScore,
  awayScore,
  prediction,
  onClick,
  className = "",
}: MatchCardProps) {
  const isFinished = status === "finished";
  const isLive = status === "live";
  const homeWon = isFinished && (homeScore ?? 0) > (awayScore ?? 0);
  const awayWon = isFinished && (awayScore ?? 0) > (homeScore ?? 0);

  // Tính toán nhãn AI nhận định
  let aiFavoriteLabel = "";
  if (prediction) {
    const homeProb = Number(prediction.homeWinProb);
    const awayProb = Number(prediction.awayWinProb);
    const drawProb = Number(prediction.drawProb ?? 0);

    const isFraction = homeProb + awayProb + drawProb <= 1.5;
    const homePct = isFraction ? homeProb * 100 : homeProb;
    const awayPct = isFraction ? awayProb * 100 : awayProb;

    if (homePct > awayPct && homePct >= 50) {
      aiFavoriteLabel = `AI: ${homeTeam.name.split(" ").pop()} (${homePct.toFixed(0)}%)`;
    } else if (awayPct > homePct && awayPct >= 50) {
      aiFavoriteLabel = `AI: ${awayTeam.name.split(" ").pop()} (${awayPct.toFixed(0)}%)`;
    }
  }

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(id)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick(id);
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 p-4 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20 hover:-translate-y-0.5 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* Header: Giải đấu & Trạng thái */}
      <div className="mb-3.5 flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-[11px] font-semibold tracking-wide text-neutral-400">
            {league}
          </span>
        </div>

        {isLive ? (
          <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
            LIVE
          </span>
        ) : isFinished ? (
          <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] font-medium text-neutral-400">
            Đã kết thúc
          </span>
        ) : (
          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-300">
            {formatKickoff(kickoffTime)}
          </span>
        )}
      </div>

      {/* Body: Hai đội bóng & Tỷ số */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        {/* Đội nhà */}
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamLogo team={homeTeam} />
          <span
            className={`truncate text-xs sm:text-sm transition-colors ${
              homeWon ? "font-bold text-emerald-300" : "text-neutral-200 group-hover:text-white"
            }`}
            title={homeTeam.name}
          >
            {homeTeam.name}
          </span>
        </div>

        {/* Tỷ số hoặc VS */}
        {(isLive || isFinished) ? (
          <div className="flex min-w-[64px] flex-col items-center justify-center rounded-xl bg-neutral-950/80 px-2.5 py-1 border border-white/10 shadow-inner">
            <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
              {homeScore ?? 0} : {awayScore ?? 0}
            </span>
          </div>
        ) : (
          <div className="flex min-w-[48px] items-center justify-center rounded-lg bg-white/5 px-2 py-0.5">
            <span className="font-mono text-[11px] font-semibold text-neutral-400">
              VS
            </span>
          </div>
        )}

        {/* Đội khách */}
        <div className="flex min-w-0 items-center justify-end gap-2.5">
          <span
            className={`truncate text-right text-xs sm:text-sm transition-colors ${
              awayWon ? "font-bold text-emerald-300" : "text-neutral-200 group-hover:text-white"
            }`}
            title={awayTeam.name}
          >
            {awayTeam.name}
          </span>
          <TeamLogo team={awayTeam} />
        </div>
      </div>

      {/* Footer: Thanh xác suất AI */}
      {prediction ? (
        <div className="mt-1 pt-2 border-t border-white/5">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <span>🤖 Xác suất AI</span>
            </span>
            {aiFavoriteLabel && (
              <span className="font-medium text-amber-300 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                {aiFavoriteLabel}
              </span>
            )}
          </div>
          <ProbBar
            size="sm"
            home={prediction.homeWinProb}
            draw={prediction.drawProb}
            away={prediction.awayWinProb}
          />
        </div>
      ) : (
        <div className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500">
          <span>AI Engine</span>
          <span>Chi tiết trận đấu →</span>
        </div>
      )}
    </div>
  );
}

