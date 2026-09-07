import { z } from "zod";

/**
 * Schema cho thông tin giải đấu thể thao
 */
export const leagueSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string().nullable().optional(),
  season: z.string(),
  logoUrl: z.string().url().nullable().optional(),
  sportId: z.string().optional(),
});

export const leagueListSchema = z.array(leagueSchema);

export type League = z.infer<typeof leagueSchema>;
export type LeagueList = z.infer<typeof leagueListSchema>;
