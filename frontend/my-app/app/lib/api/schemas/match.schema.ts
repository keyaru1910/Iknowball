import { z } from "zod";

export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().url().optional().nullable(),
  shortName: z.string().optional().nullable(),
});

export const predictionSchema = z.object({
  homeWinProb: z.number().min(0).max(100),
  drawProb: z.number().min(0).max(100),
  awayWinProb: z.number().min(0).max(100),
  modelVersion: z.string().optional(),
});

export const matchStatusSchema = z.enum([
  "upcoming",
  "live",
  "finished",
  "postponed",
  "canceled",
]);

/**
 * Schema cho sự kiện trong trận đấu (Bàn thắng, Thẻ phạt, Thay người, VAR, v.v.)
 */
export const matchEventSchema = z.object({
  id: z.string(),
  matchId: z.string().optional(),
  type: z.enum(["goal", "card", "substitution", "var", "penalty", "other"]).or(z.string()),
  minute: z.number(),
  extraMinute: z.number().optional().nullable(),
  teamId: z.string(),
  playerId: z.string().optional().nullable(),
  playerName: z.string().optional().nullable(),
  assistPlayerName: z.string().optional().nullable(),
  detail: z.record(z.string(), z.unknown()).or(z.string()).optional().nullable(),
});

/**
 * Thống kê chi tiết trận đấu (so sánh đội nhà vs đội khách)
 */
export const matchStatItemSchema = z.object({
  home: z.number(),
  away: z.number(),
});

export const matchStatsComparisonSchema = z.object({
  possession: matchStatItemSchema.optional(), // Tỷ lệ kiểm soát bóng (%)
  shotsTotal: matchStatItemSchema.optional(),
  shotsOnTarget: matchStatItemSchema.optional(),
  corners: matchStatItemSchema.optional(),
  fouls: matchStatItemSchema.optional(),
  yellowCards: matchStatItemSchema.optional(),
  redCards: matchStatItemSchema.optional(),
  offsides: matchStatItemSchema.optional(),
  passes: matchStatItemSchema.optional(),
  passAccuracy: matchStatItemSchema.optional(),
});

/**
 * Schema cho 1 trận đấu trong danh sách đối đầu lịch sử (Head-to-Head)
 */
export const h2hMatchSchema = z.object({
  id: z.string(),
  matchDate: z.string(),
  leagueName: z.string().optional().nullable(),
  homeTeam: teamSchema,
  awayTeam: teamSchema,
  homeScore: z.number(),
  awayScore: z.number(),
  winnerTeamId: z.string().optional().nullable(),
});

/**
 * Schema tổng hợp lịch sử đối đầu (H2H Summary)
 */
export const h2hSummarySchema = z.object({
  totalMatches: z.number(),
  homeWins: z.number(),
  awayWins: z.number(),
  draws: z.number(),
  matches: z.array(h2hMatchSchema),
});

/**
 * Schema chuẩn cho trận đấu cơ bản (dùng trong danh sách và thẻ trận)
 */
export const matchSchema = z.object({
  id: z.string(),
  league: z.string(),
  leagueId: z.string().optional(),
  homeTeam: teamSchema,
  awayTeam: teamSchema,
  kickoffTime: z.string(), // UTC ISO string
  status: matchStatusSchema,
  homeScore: z.number().nullable().optional(),
  awayScore: z.number().nullable().optional(),
  minute: z.number().optional().nullable(), // Phút thi đấu nếu live
  prediction: predictionSchema.optional(),
});

export const matchListSchema = z.array(matchSchema);

/**
 * Schema chi tiết đầy đủ của trận đấu (Match Detail)
 */
export const matchDetailSchema = matchSchema.extend({
  venue: z.string().optional().nullable(),
  referee: z.string().optional().nullable(),
  round: z.string().optional().nullable(),
  events: z.array(matchEventSchema).default([]),
  stats: matchStatsComparisonSchema.optional().nullable(),
  h2h: h2hSummarySchema.optional().nullable(),
});

export type Team = z.infer<typeof teamSchema>;
export type MatchPrediction = z.infer<typeof predictionSchema>;
export type MatchStatusType = z.infer<typeof matchStatusSchema>;
export type MatchEvent = z.infer<typeof matchEventSchema>;
export type MatchStatsComparison = z.infer<typeof matchStatsComparisonSchema>;
export type H2HMatch = z.infer<typeof h2hMatchSchema>;
export type H2HSummary = z.infer<typeof h2hSummarySchema>;
export type Match = z.infer<typeof matchSchema>;
export type MatchDetail = z.infer<typeof matchDetailSchema>;
