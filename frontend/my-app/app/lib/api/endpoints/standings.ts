import { apiFetch } from "../client";
import { standingsSchema, type StandingRowDto } from "../schemas/standing.schema";

export async function getStandings(leagueId: string, season?: string): Promise<StandingRowDto[]> {
  const query = season ? `?season=${encodeURIComponent(season)}` : "";
  const { data } = await apiFetch<unknown>(`/leagues/${leagueId}/standings${query}`);
  return standingsSchema.parse(data);
}
