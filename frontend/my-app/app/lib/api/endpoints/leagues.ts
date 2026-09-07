import { apiFetch } from "../client";
import { leagueListSchema, leagueSchema, type League } from "../schemas/league.schema";

/**
 * Lấy danh sách tất cả các giải đấu đang được theo dõi
 */
export async function getLeagues(): Promise<League[]> {
  const { data } = await apiFetch<unknown>("/leagues");
  return leagueListSchema.parse(data);
}

/**
 * Lấy thông tin một giải đấu theo ID
 */
export async function getLeagueById(id: string): Promise<League> {
  const { data } = await apiFetch<unknown>(`/leagues/${id}`);
  return leagueSchema.parse(data);
}
