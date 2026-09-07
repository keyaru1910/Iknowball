import { useQuery } from "@tanstack/react-query";
import { getStandings } from "../lib/api/endpoints/standings";
import type { StandingRowDto } from "../lib/api/schemas/standing.schema";

/**
 * Standings chỉ được backend đồng bộ 1 lần/ngày (mục 8.2 design doc),
 * nên staleTime dài (6h) và tắt refetchOnWindowFocus — tránh gọi API
 * không cần thiết cho dữ liệu gần như tĩnh trong ngày.
 */
export function useStandings(leagueId: string) {
  return useQuery<StandingRowDto[]>({
    queryKey: ["standings", leagueId],
    queryFn: () => getStandings(leagueId),
    enabled: Boolean(leagueId),
    staleTime: 1000 * 60 * 60 * 6,
    refetchOnWindowFocus: false,
  });
}
