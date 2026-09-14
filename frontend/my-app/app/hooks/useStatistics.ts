import { useQuery } from "@tanstack/react-query";
import {
  getPlayerStatistics,
  getTeamSeasonStatistics,
} from "../lib/api/endpoints/statistics";
import type {
  PlayerStatisticDto,
  TeamSeasonStatisticDto,
} from "../lib/api/schemas/statistics.schema";

/**
 * Hook truy vấn thống kê cầu thủ theo giải đấu, mùa giải và tiêu chí sắp xếp
 */
export function usePlayerStatistics(params: {
  sport: "football" | "basketball";
  leagueId?: string;
  season?: string;
  sortBy?: string;
}) {
  return useQuery<PlayerStatisticDto[]>({
    queryKey: ["player-statistics", params.sport, params.leagueId, params.season, params.sortBy],
    queryFn: () => getPlayerStatistics(params),
    staleTime: 1000 * 60 * 60 * 2, // 2 giờ
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook truy vấn thống kê mùa giải của các đội bóng
 */
export function useTeamSeasonStatistics(params: {
  sport: "football" | "basketball";
  leagueId?: string;
  season?: string;
}) {
  return useQuery<TeamSeasonStatisticDto[]>({
    queryKey: ["team-season-statistics", params.sport, params.leagueId, params.season],
    queryFn: () => getTeamSeasonStatistics(params),
    staleTime: 1000 * 60 * 60 * 2, // 2 giờ
    refetchOnWindowFocus: false,
  });
}
