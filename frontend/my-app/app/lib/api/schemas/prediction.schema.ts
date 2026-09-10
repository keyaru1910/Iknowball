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
  isPremium: z.boolean().optional(),
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

export type PredictionDetail = z.infer<typeof predictionDetailSchema>;
export type ModelPerformance = z.infer<typeof modelPerformanceSchema>;
