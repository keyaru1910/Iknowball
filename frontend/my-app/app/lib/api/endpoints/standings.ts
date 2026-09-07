import { apiFetch } from "../client";
import { standingsSchema, type StandingRowDto } from "../schemas/standing.schema";

export async function getStandings(leagueId: string): Promise<StandingRowDto[]> {
  const { data } = await apiFetch<unknown>(`/leagues/${leagueId}/standings`);
  return standingsSchema.parse(data);
}
