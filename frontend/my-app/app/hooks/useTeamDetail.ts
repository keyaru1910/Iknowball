import { useQuery } from "@tanstack/react-query";
import { getTeamById, getTeamStats } from "../lib/api/endpoints/teams";
import type { TeamDetail, TeamStats } from "../lib/api/schemas/team.schema";

/**
 * Hook lấy thông tin chi tiết một đội bóng (thông tin chung, đội hình, form 5 trận)
 */
export function useTeamDetail(teamId: string) {
  return useQuery<TeamDetail>({
    queryKey: ["team", teamId],
    queryFn: () => getTeamById(teamId),
    enabled: Boolean(teamId),
    staleTime: 1000 * 60 * 60 * 6, // 6 giờ
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook lấy thống kê mùa giải của đội bóng
 */
export function useTeamStats(teamId: string, season?: string) {
  return useQuery<TeamStats>({
    queryKey: ["team-stats", teamId, season],
    queryFn: () => getTeamStats(teamId, season),
    enabled: Boolean(teamId),
    staleTime: 1000 * 60 * 60 * 6,
    refetchOnWindowFocus: false,
  });
}
