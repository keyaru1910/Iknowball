"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const modelSummarySchema = z.object({
  version: z.string(),
  name: z.string(),
  type: z.string(),
  accuracy: z.number(),
  macroF1: z.number(),
  avgLogLoss: z.number(),
  avgBrierScore: z.number(),
  sampleSize: z.number(),
  status: z.enum(["active", "baseline", "candidate", "deprecated"]).or(z.string()),
});

export const perClassMetricSchema = z.object({
  label: z.string(),
  actualCount: z.number(),
  predictedCount: z.number(),
  accuracy: z.number(),
  precision: z.number(),
  recall: z.number(),
  f1: z.number(),
});

export const modelComparisonResponseSchema = z.object({
  totalMatches: z.number(),
  models: z.array(modelSummarySchema),
  perClassBreakdown: z.record(z.string(), perClassMetricSchema),
  drawChallengeInsight: z.string().optional(),
});

export type ModelSummary = z.infer<typeof modelSummarySchema>;
export type PerClassMetric = z.infer<typeof perClassMetricSchema>;
export type ModelComparisonData = z.infer<typeof modelComparisonResponseSchema>;

// ── API Fetcher ───────────────────────────────────────────────────────────────

async function getModelComparison(leagueId?: string): Promise<ModelComparisonData> {
  const query = leagueId ? `?league=${encodeURIComponent(leagueId)}` : "";
  const { data } = await apiFetch<unknown>(`/predictions/comparison${query}`);
  return modelComparisonResponseSchema.parse(data);
}

// ── React Hook ────────────────────────────────────────────────────────────────

/**
 * Hook truy xuất bảng so sánh đa mô hình (Model Comparison Matrix)
 * và phân tích chi tiết hiệu năng theo từng kịch bản (Per-Class Breakdown).
 */
export function useModelComparison(leagueId?: string) {
  return useQuery({
    queryKey: ["model-comparison", leagueId],
    queryFn: () => getModelComparison(leagueId),
    staleTime: 1000 * 60 * 60 * 2, // 2 giờ
    retry: 2,
  });
}
