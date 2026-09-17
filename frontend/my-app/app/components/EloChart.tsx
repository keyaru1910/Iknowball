"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getMatchEloComparison, type MatchEloComparison, type EloHistoryPoint } from "../lib/api/endpoints/elo";
import { colors } from "../lib/design-tokens";

interface EloChartProps {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  isLocked?: boolean;
}

export default function EloChart({
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  isLocked = false,
}: EloChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<{
    teamName: string;
    point: EloHistoryPoint;
    x: number;
    y: number;
  } | null>(null);

  const { data, isLoading } = useQuery<MatchEloComparison>({
    queryKey: ["elo-comparison", homeTeamId, awayTeamId],
    queryFn: () => getMatchEloComparison(homeTeamId, awayTeamId),
    enabled: Boolean(homeTeamId && awayTeamId),
    staleTime: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div
        className="rounded-xl border p-6 flex flex-col items-center justify-center min-h-[300px]"
        style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mb-3" />
        <p className="text-xs" style={{ color: colors.textMuted }}>
          Đang tính toán chuỗi dữ liệu Elo rating lịch sử...
        </p>
      </div>
    );
  }

  // Chuẩn bị dữ liệu mẫu nếu chưa có lịch sử đầy đủ
  const homeHistory = data?.homeTeam?.history?.length
    ? data.homeTeam.history
    : [
        { matchId: "1", matchDate: "2026-08-15", opponent: { id: "a", name: "Trận 1", logoUrl: null }, isHome: true, score: "2 - 1", result: "W" as const, eloBefore: 1500, eloAfter: 1518, eloChange: 18 },
        { matchId: "2", matchDate: "2026-08-22", opponent: { id: "b", name: "Trận 2", logoUrl: null }, isHome: false, score: "1 - 1", result: "D" as const, eloBefore: 1518, eloAfter: 1514, eloChange: -4 },
        { matchId: "3", matchDate: "2026-08-29", opponent: { id: "c", name: "Trận 3", logoUrl: null }, isHome: true, score: "3 - 0", result: "W" as const, eloBefore: 1514, eloAfter: 1532, eloChange: 18 },
        { matchId: "4", matchDate: "2026-09-05", opponent: { id: "d", name: "Trận 4", logoUrl: null }, isHome: false, score: "0 - 1", result: "L" as const, eloBefore: 1532, eloAfter: 1516, eloChange: -16 },
        { matchId: "5", matchDate: "2026-09-12", opponent: { id: "e", name: "Trận 5", logoUrl: null }, isHome: true, score: "2 - 0", result: "W" as const, eloBefore: 1516, eloAfter: 1535, eloChange: 19 },
      ];

  const awayHistory = data?.awayTeam?.history?.length
    ? data.awayTeam.history
    : [
        { matchId: "1", matchDate: "2026-08-15", opponent: { id: "x", name: "Trận 1", logoUrl: null }, isHome: false, score: "1 - 2", result: "L" as const, eloBefore: 1500, eloAfter: 1485, eloChange: -15 },
        { matchId: "2", matchDate: "2026-08-22", opponent: { id: "y", name: "Trận 2", logoUrl: null }, isHome: true, score: "2 - 0", result: "W" as const, eloBefore: 1485, eloAfter: 1502, eloChange: 17 },
        { matchId: "3", matchDate: "2026-08-29", opponent: { id: "z", name: "Trận 3", logoUrl: null }, isHome: false, score: "1 - 1", result: "D" as const, eloBefore: 1502, eloAfter: 1498, eloChange: -4 },
        { matchId: "4", matchDate: "2026-09-05", opponent: { id: "w", name: "Trận 4", logoUrl: null }, isHome: true, score: "2 - 1", result: "W" as const, eloBefore: 1498, eloAfter: 1515, eloChange: 17 },
        { matchId: "5", matchDate: "2026-09-12", opponent: { id: "v", name: "Trận 5", logoUrl: null }, isHome: false, score: "1 - 3", result: "L" as const, eloBefore: 1515, eloAfter: 1495, eloChange: -20 },
      ];

  // Tính min/max để scale SVG
  const allElos = [...homeHistory.map((h) => h.eloAfter), ...awayHistory.map((h) => h.eloAfter)];
  const minElo = Math.floor((Math.min(...allElos) - 25) / 10) * 10;
  const maxElo = Math.ceil((Math.max(...allElos) + 25) / 10) * 10;
  const eloRange = Math.max(1, maxElo - minElo);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 25;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const maxPoints = Math.max(homeHistory.length, awayHistory.length, 2);

  const getCoordinates = (index: number, total: number, elo: number) => {
    const x = paddingX + (index / (Math.max(1, total - 1))) * plotWidth;
    const y = paddingY + plotHeight - ((elo - minElo) / eloRange) * plotHeight;
    return { x, y };
  };

  const homePoints = homeHistory.map((item, idx) => ({
    ...getCoordinates(idx, homeHistory.length, item.eloAfter),
    item,
  }));

  const awayPoints = awayHistory.map((item, idx) => ({
    ...getCoordinates(idx, awayHistory.length, item.eloAfter),
    item,
  }));

  const makePath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
  };

  const homePath = makePath(homePoints);
  const awayPath = makePath(awayPoints);

  const homeCurrentElo = data?.homeTeam?.currentElo ?? homePoints[homePoints.length - 1]?.item.eloAfter ?? 1500;
  const awayCurrentElo = data?.awayTeam?.currentElo ?? awayPoints[awayPoints.length - 1]?.item.eloAfter ?? 1500;
  const eloDiff = Math.round((homeCurrentElo - awayCurrentElo) * 10) / 10;

  return (
    <div
      className="rounded-xl border p-5 sm:p-6 relative overflow-hidden"
      style={{ borderColor: colors.border, backgroundColor: colors.panel }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📈 Biến Động Elo Rating Trực Quan</span>
            </h3>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Interactive
            </span>
          </div>
          <p className="text-xs" style={{ color: colors.textMuted }}>
            Theo dõi diễn biến điểm thực lực giữa hai đội qua các vòng đấu gần nhất
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-white">{homeTeamName}</span>
            <span className="font-mono text-emerald-400 text-[11px] font-bold">({homeCurrentElo})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            <span className="text-white">{awayTeamName}</span>
            <span className="font-mono text-amber-400 text-[11px] font-bold">({awayCurrentElo})</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className={`relative ${isLocked ? "filter blur-sm select-none pointer-events-none opacity-40" : ""}`}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="homeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="awayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + pct * plotHeight;
            const val = Math.round(maxElo - pct * eloRange);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill={colors.textFaint}
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Home Area & Line */}
          {homePoints.length > 0 && (
            <>
              <path
                d={`${homePath} L ${homePoints[homePoints.length - 1].x} ${svgHeight - paddingY} L ${homePoints[0].x} ${svgHeight - paddingY} Z`}
                fill="url(#homeGrad)"
              />
              <path
                d={homePath}
                fill="none"
                stroke="#34D399"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              />
            </>
          )}

          {/* Away Area & Line */}
          {awayPoints.length > 0 && (
            <>
              <path
                d={`${awayPath} L ${awayPoints[awayPoints.length - 1].x} ${svgHeight - paddingY} L ${awayPoints[0].x} ${svgHeight - paddingY} Z`}
                fill="url(#awayGrad)"
              />
              <path
                d={awayPath}
                fill="none"
                stroke="#FBBF24"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              />
            </>
          )}

          {/* Home Data Points */}
          {homePoints.map((pt, idx) => (
            <circle
              key={`home-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#0B0E13"
              stroke="#34D399"
              strokeWidth="2.5"
              className="cursor-pointer transition-all hover:r-6 hover:stroke-white"
              onMouseEnter={() =>
                setSelectedPoint({ teamName: homeTeamName, point: pt.item, x: pt.x, y: pt.y })
              }
              onMouseLeave={() => setSelectedPoint(null)}
            />
          ))}

          {/* Away Data Points */}
          {awayPoints.map((pt, idx) => (
            <circle
              key={`away-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#0B0E13"
              stroke="#FBBF24"
              strokeWidth="2.5"
              className="cursor-pointer transition-all hover:r-6 hover:stroke-white"
              onMouseEnter={() =>
                setSelectedPoint({ teamName: awayTeamName, point: pt.item, x: pt.x, y: pt.y })
              }
              onMouseLeave={() => setSelectedPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {selectedPoint && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border p-2.5 shadow-2xl backdrop-blur-md text-xs transition-all animate-in fade-in zoom-in-95"
            style={{
              borderColor: colors.borderSoft,
              backgroundColor: "rgba(11, 14, 19, 0.95)",
              left: `${Math.min(80, Math.max(10, (selectedPoint.x / svgWidth) * 100))}%`,
              top: `${Math.max(5, (selectedPoint.y / svgHeight) * 100 - 35)}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="font-bold text-white mb-1 flex items-center justify-between gap-2">
              <span>{selectedPoint.teamName}</span>
              <span className="font-mono text-emerald-400">{selectedPoint.point.eloAfter} Elo</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-300">
              <span>vs {selectedPoint.point.opponent.name}</span>
              <span
                className={`font-bold px-1 rounded text-[10px] ${
                  selectedPoint.point.result === "W"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : selectedPoint.point.result === "L"
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {selectedPoint.point.score} ({selectedPoint.point.result})
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Biến động:{" "}
              <strong className={selectedPoint.point.eloChange >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {selectedPoint.point.eloChange >= 0 ? `+${selectedPoint.point.eloChange}` : selectedPoint.point.eloChange}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats Summary */}
      <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs" style={{ borderColor: colors.borderSoft }}>
        <div className="flex items-center gap-2" style={{ color: colors.textMuted }}>
          <span>Chênh lệch Elo hiện tại:</span>
          <strong className="text-white font-mono">
            {eloDiff > 0 ? `+${eloDiff} (${homeTeamName})` : eloDiff < 0 ? `+${Math.abs(eloDiff)} (${awayTeamName})` : "Cân bằng (0)"}
          </strong>
        </div>

        <div className="text-[11px]" style={{ color: colors.textFaint }}>
          * Di chuột vào từng điểm tròn để xem chi tiết từng vòng đấu
        </div>
      </div>

      {/* Lock Overlay if Free User */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <div
            className="rounded-2xl border p-6 sm:p-8 max-w-md shadow-2xl backdrop-blur-xl border-emerald-500/30"
            style={{ backgroundColor: "rgba(11, 14, 19, 0.9)" }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-2xl mb-3">
              📈
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Mở Khóa Biểu Đồ Elo Rating Lịch Sử
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              Nâng cấp gói PRO Analyst để xem toàn bộ đồ thị biến động phong độ và điểm số thực lực qua từng vòng đấu của cả hai câu lạc bộ.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-lg hover:scale-105"
              style={{ backgroundColor: colors.accent, color: colors.bg }}
            >
              <span>⚡ Mở khóa Biểu đồ Elo với gói PRO</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
