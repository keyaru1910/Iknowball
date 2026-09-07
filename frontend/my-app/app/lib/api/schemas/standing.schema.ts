import { z } from "zod";

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().url().optional(),
});

export const standingRowSchema = z.object({
  position: z.number(),
  team: teamSchema,
  played: z.number(),
  won: z.number(),
  drawn: z.number(),
  lost: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  goalDifference: z.number(),
  points: z.number(),
  form: z.array(z.enum(["W", "D", "L"])).optional(),
});

export const standingsSchema = z.array(standingRowSchema);

export type StandingRowDto = z.infer<typeof standingRowSchema>;
