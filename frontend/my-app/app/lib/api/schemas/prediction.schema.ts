import { z } from "zod";

export const predictionOutcomeSchema = z.enum(["HOME_WIN", "DRAW", "AWAY_WIN"]);
export const predictionDetailSchema = z.object({
  id: z.string(),
  matchId: z.string(),
  modelVersion: z.string(),
  homeWinProb: z.number(),
  drawProb: z.number().nullable(),
  awayWinProb: z.number(),
  predictedOutcome: predictionOutcomeSchema,
  featuresSnapshot: z.record(z.string(), z.unknown()).optional(),
  explanation: z.record(z.string(), z.unknown()).nullable().optional(),
  isPremium: z.boolean().optional(),
  tier: z.enum(["guest", "free", "pro", "vip", "admin", "premium"]).optional(),
  remainingDailyQuota: z.number().nullable().optional(),
});

export const modelPerformanceSchema = z.object({
  id: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  accuracy: z.number(),
  precision: z.number(),
  recall: z.number(),
  f1: z.number(),
  avgLogLoss: z.number(),
  avgBrierScore: z.number(),
  sampleSize: z.number(),
  league: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
});

export const vipReportSchema = z.object({
  isLocked: z.boolean(),
  userTier: z.enum(["guest", "free", "pro", "vip", "admin", "premium"]).optional(),
  headline: z.string(),
  summary: z.string(),
  tacticalAnalysis: z.string().optional(),
  keyBattles: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  predictedScore: z.string().optional(),
  confidence: z.string().optional(),
  recommendation: z.string().optional(),
  generatedBy: z.string().optional(),
  generatedAt: z.string().optional(),
  lockedMessage: z.string().optional(),
});

export type PredictionDetail = z.infer<typeof predictionDetailSchema>;
export type ModelPerformance = z.infer<typeof modelPerformanceSchema>;
export type VipReport = z.infer<typeof vipReportSchema>;

