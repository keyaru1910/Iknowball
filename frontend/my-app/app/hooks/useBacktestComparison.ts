"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import { z } from "zod";

// ── Schema ────────────────────────────────────────────────────────────────────

const backtestMetricsSchema = z.object({
  accuracy: z.number(),
  avgLogLoss: z.number().optional(),
  avgBrierScore: z.number().optional(),
});

const backtestImprovementSchema = z.object({
  accuracy: z.number(),
});

const backtestSchema = z.object({
  totalMatches: z.number(),
  model: backtestMetricsSchema.nullable(),
  randomBaseline: z.object({ accuracy: z.number() }).nullable(),
  higherEloBaseline: z.object({ accuracy: z.number() }).nullable(),
  improvementOverRandom: backtestImprovementSchema.optional(),
  improvementOverHigherElo: backtestImprovementSchema.optional(),
  message: z.string().optional(),
});

export type BacktestData = z.infer<typeof backtestSchema>;

// ── API ───────────────────────────────────────────────────────────────────────

async function getBacktestComparison(leagueId?: string): Promise<BacktestData> {
  const query = leagueId ? `?league=${encodeURIComponent(leagueId)}` : "";
  const { data } = await apiFetch<unknown>(`/predictions/backtest${query}`);
  return backtestSchema.parse(data);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook lấy dữ liệu so sánh Backtest Baseline cho Dashboard.
 * Cache 6 giờ vì dữ liệu tổng hợp không thay đổi thường xuyên.
 */
export function useBacktestComparison(leagueId?: string) {
  return useQuery({
    queryKey: ["backtest-comparison", leagueId],
    queryFn: () => getBacktestComparison(leagueId),
    staleTime: 1000 * 60 * 60 * 6, // 6 giờ
    retry: 2,
  });
}
