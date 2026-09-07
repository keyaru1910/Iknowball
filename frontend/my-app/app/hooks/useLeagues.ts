import { useQuery } from "@tanstack/react-query";
import { getLeagues, getLeagueById } from "../lib/api/endpoints/leagues";
import type { League } from "../lib/api/schemas/league.schema";

/**
 * Hook lấy danh sách tất cả giải đấu (Premier League, La Liga, Serie A,...).
 * Dữ liệu tĩnh nên cache 24h và không refetch khi focus.
 */
export function useLeagues() {
  return useQuery<League[]>({
    queryKey: ["leagues"],
    queryFn: getLeagues,
    staleTime: 1000 * 60 * 60 * 24, // 24 giờ
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook lấy thông tin 1 giải đấu cụ thể theo ID
 */
export function useLeagueDetail(leagueId: string) {
  return useQuery<League>({
    queryKey: ["league", leagueId],
    queryFn: () => getLeagueById(leagueId),
    enabled: Boolean(leagueId),
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });
}
