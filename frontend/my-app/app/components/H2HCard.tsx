"use client";

import { colors } from "../lib/design-tokens";
import type { H2HSummary } from "../lib/api/schemas/match.schema";

interface H2HCardProps {
  h2h?: H2HSummary | null;
  homeTeamName: string;
  awayTeamName: string;
}

export default function H2HCard({
  h2h,
  homeTeamName,
  awayTeamName,
}: H2HCardProps) {
  if (!h2h || !h2h.matches || h2h.matches.length === 0) {
    return (
      <div
        className="rounded-md border p-8 text-center"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Chưa có dữ liệu lịch sử đối đầu giữa hai đội.
        </p>
      </div>
    );
  }

  const total = h2h.totalMatches || (h2h.homeWins + h2h.draws + h2h.awayWins) || 1;
  const homeWinPct = Math.round((h2h.homeWins / total) * 100);
  const drawPct = Math.round((h2h.draws / total) * 100);
  const awayWinPct = 100 - homeWinPct - drawPct;

  return (
    <div
      className="rounded-md border p-5 sm:p-6"
      style={{ borderColor: colors.border, backgroundColor: colors.panel }}
    >
      <div className="mb-6 flex items-center justify-between border-b pb-3" style={{ borderColor: colors.borderSoft }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          Lịch sử đối đầu ({h2h.totalMatches} trận gần nhất)
        </h3>
      </div>

      {/* Summary Stats Overview */}
      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-sm border p-3" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
          <div className="text-xl font-bold text-emerald-400 font-mono">{h2h.homeWins}</div>
          <div className="text-[11px] font-medium mt-1 truncate" style={{ color: colors.textMuted }}>
            {homeTeamName} thắng
          </div>
          <div className="text-[10px] font-mono" style={{ color: colors.textFaint }}>{homeWinPct}%</div>
        </div>

        <div className="rounded-sm border p-3" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
          <div className="text-xl font-bold text-gray-300 font-mono">{h2h.draws}</div>
          <div className="text-[11px] font-medium mt-1" style={{ color: colors.textMuted }}>
            Hòa
          </div>
          <div className="text-[10px] font-mono" style={{ color: colors.textFaint }}>{drawPct}%</div>
        </div>

        <div className="rounded-sm border p-3" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
          <div className="text-xl font-bold text-rose-400 font-mono">{h2h.awayWins}</div>
          <div className="text-[11px] font-medium mt-1 truncate" style={{ color: colors.textMuted }}>
            {awayTeamName} thắng
          </div>
          <div className="text-[10px] font-mono" style={{ color: colors.textFaint }}>{awayWinPct}%</div>
        </div>
      </div>

      {/* List of past matches */}
      <div className="flex flex-col divide-y" style={{ borderColor: colors.borderSoft }}>
        {h2h.matches.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-3 text-xs"
            style={{ borderColor: colors.borderSoft }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11px]" style={{ color: colors.textFaint }}>
                {item.matchDate.slice(0, 10)}
              </span>
              {item.leagueName && (
                <span className="text-[10px]" style={{ color: colors.textMuted }}>
                  {item.leagueName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-medium text-white">{item.homeTeam.name}</span>
              <span
                className="rounded px-2 py-0.5 font-mono font-bold text-white text-[12px]"
                style={{ backgroundColor: colors.panelAlt }}
              >
                {item.homeScore} - {item.awayScore}
              </span>
              <span className="font-medium text-white">{item.awayTeam.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
