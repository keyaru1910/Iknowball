"use client";

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
  drawProb: number;
  awayWinProb: number;
}

export interface MatchCardProps {
  id: string;
  league: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  /** ISO string (UTC) — quy ước lưu UTC ở BE, convert giờ local ngay tại component này */
  kickoffTime: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  /** Optional — chưa có ở Phase 4, sẽ được truyền vào khi Phase 5 (Prediction) hoàn thành */
  prediction?: MatchPrediction;
  onClick?: (matchId: string) => void;
  className?: string;
}

function formatKickoff(iso: string): string {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "--:--";
  }
}

function TeamLogo({ team }: { team: TeamInfo }) {
  if (team.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={team.logoUrl} alt={team.name} className="h-5 w-5 object-contain" />;
  }
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-medium"
      style={{ backgroundColor: colors.borderSoft, color: colors.textMuted }}
    >
      {team.name.charAt(0)}
    </div>
  );
}

/**
 * Card hiển thị 1 trận đấu. Dùng ở trang Schedule và các danh sách trận đấu.
 * - status="upcoming": hiện giờ đá + prediction (nếu có)
 * - status="live": hiện tỷ số hiện tại + dấu hiệu live
 * - status="finished": hiện tỷ số cuối, đội thắng in đậm
 */
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
  const homeWon = isFinished && (homeScore ?? 0) > (awayScore ?? 0);
  const awayWon = isFinished && (awayScore ?? 0) > (homeScore ?? 0);

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(id)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick(id);
      }}
      className={`rounded-sm border p-4 transition-colors ${onClick ? "cursor-pointer hover:border-white/20" : ""} ${className}`}
      style={{ borderColor: colors.border, backgroundColor: colors.panel }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px]" style={{ color: colors.textFaint }}>
          {league}
        </span>

        {status === "live" ? (
          <span
            className="flex items-center gap-1.5 font-mono text-[11px]"
            style={{ color: colors.live }}
          >
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ backgroundColor: colors.live }}
            />
            live
          </span>
        ) : (
          <span className="font-mono text-[11px]" style={{ color: colors.textFaint }}>
            {status === "upcoming" ? formatKickoff(kickoffTime) : "Kết thúc"}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between text-[14px]">
        <div className="flex items-center gap-2">
          <TeamLogo team={homeTeam} />
          <span style={{ fontWeight: homeWon ? 600 : 400 }}>{homeTeam.name}</span>
        </div>

        {(status === "live" || status === "finished") ? (
          <span className="font-mono text-[15px]" style={{ color: colors.text }}>
            {homeScore ?? 0} – {awayScore ?? 0}
          </span>
        ) : (
          <span className="text-[12px]" style={{ color: colors.textFaint }}>
            vs
          </span>
        )}

        <div className="flex items-center gap-2">
          <span style={{ fontWeight: awayWon ? 600 : 400 }}>{awayTeam.name}</span>
          <TeamLogo team={awayTeam} />
        </div>
      </div>

      {prediction && status === "upcoming" && (
        <ProbBar
          size="sm"
          home={prediction.homeWinProb}
          draw={prediction.drawProb}
          away={prediction.awayWinProb}
        />
      )}
    </div>
  );
}
