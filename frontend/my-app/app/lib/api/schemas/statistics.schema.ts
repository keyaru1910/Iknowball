import { z } from "zod";

/**
 * Schema thống kê cá nhân cầu thủ (Player Statistics)
 * Hỗ trợ cả Bóng đá (Football) và Bóng rổ (Basketball)
 */
export const playerStatisticSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  playerName: z.string(),
  avatarUrl: z.string().nullable().optional(),
  teamId: z.string(),
  teamName: z.string(),
  teamLogoUrl: z.string().nullable().optional(),
  leagueId: z.string().optional(),
  season: z.string(),
  sport: z.enum(["football", "basketball"]),
  position: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  appearances: z.number().default(0),
  minutesPlayed: z.number().default(0),

  // Chỉ số Bóng đá
  goals: z.number().nullable().optional(),
  assists: z.number().nullable().optional(),
  yellowCards: z.number().nullable().optional(),
  redCards: z.number().nullable().optional(),
  cleanSheets: z.number().nullable().optional(),
  shotsOnTarget: z.number().nullable().optional(),

  // Chỉ số Bóng rổ (Trung bình trận)
  pointsAvg: z.number().nullable().optional(),
  reboundsAvg: z.number().nullable().optional(),
  assistsAvg: z.number().nullable().optional(),
  stealsAvg: z.number().nullable().optional(),
  blocksAvg: z.number().nullable().optional(),
  fieldGoalPercentage: z.number().nullable().optional(),
});

export type PlayerStatisticDto = z.infer<typeof playerStatisticSchema>;

/**
 * Schema thống kê cả mùa giải của đội bóng (Team Season Statistics)
 */
export const teamSeasonStatisticSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  teamName: z.string(),
  teamLogoUrl: z.string().nullable().optional(),
  leagueId: z.string().optional(),
  season: z.string(),
  sport: z.enum(["football", "basketball"]),
  played: z.number().default(0),
  wins: z.number().default(0),
  draws: z.number().nullable().optional(),
  losses: z.number().default(0),

  // Chỉ số Bóng đá
  goalsFor: z.number().nullable().optional(),
  goalsAgainst: z.number().nullable().optional(),
  goalDifference: z.number().nullable().optional(),
  cleanSheets: z.number().nullable().optional(),

  // Chỉ số Bóng rổ
  winPercentage: z.number().nullable().optional(),
  pointsForAvg: z.number().nullable().optional(),
  pointsAgainstAvg: z.number().nullable().optional(),
  pointDifferential: z.number().nullable().optional(),
});

export type TeamSeasonStatisticDto = z.infer<typeof teamSeasonStatisticSchema>;
