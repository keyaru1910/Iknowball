import { z } from "zod";

/**
 * Schema thông tin cầu thủ
 */
export const playerSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  position: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  number: z.number().nullable().optional(),
});

/**
 * Schema thống kê mùa giải của đội bóng
 */
export const teamStatsSchema = z.object({
  matchesPlayed: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  eloRating: z.number().optional(),
  cleanSheets: z.number().optional(),
  avgGoalsScored: z.number().optional(),
  avgGoalsConceded: z.number().optional(),
});

/**
 * Schema thông tin chi tiết đội bóng
 */
export const teamDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  foundedYear: z.number().nullable().optional(),
  leagueId: z.string().optional(),
  leagueName: z.string().optional(),
  venue: z.string().nullable().optional(),
  // 5-10 trận gần nhất: "W" | "D" | "L"
  form: z.array(z.enum(["W", "D", "L"])).optional(),
  stats: teamStatsSchema.optional(),
  players: z.array(playerSchema).optional(),
});

export type Player = z.infer<typeof playerSchema>;
export type TeamStats = z.infer<typeof teamStatsSchema>;
export type TeamDetail = z.infer<typeof teamDetailSchema>;
