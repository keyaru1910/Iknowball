import { apiFetch } from "../client";
import {
  teamDetailSchema,
  teamStatsSchema,
  type TeamDetail,
  type TeamStats,
} from "../schemas/team.schema";

/**
 * Lấy thông tin chi tiết của một đội bóng (thông tin chung, đội hình, form 5 trận)
 */
export async function getTeamById(teamId: string): Promise<TeamDetail> {
  const { data } = await apiFetch<unknown>(`/teams/${teamId}`);
  return teamDetailSchema.parse(data);
}

/**
 * Lấy thống kê mùa giải của đội bóng (số trận, thắng, hòa, thua, bàn thắng/thua, elo)
 */
export async function getTeamStats(
  teamId: string,
  season?: string
): Promise<TeamStats> {
  const query = season ? `?season=${encodeURIComponent(season)}` : "";
  const { data } = await apiFetch<unknown>(`/teams/${teamId}/stats${query}`);
  return teamStatsSchema.parse(data);
}
