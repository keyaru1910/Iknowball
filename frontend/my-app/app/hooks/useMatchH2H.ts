import { useQuery } from "@tanstack/react-query";
import { getMatchH2H } from "../lib/api/endpoints/matches";
import type { H2HSummary } from "../lib/api/schemas/match.schema";

/**
 * Hook lấy dữ liệu đối đầu (Head-to-Head) giữa 2 đội của trận đấu:
 * Dữ liệu lịch sử đối đầu không thay đổi trong suốt trận nên staleTime dài (6h).
 */
export function useMatchH2H(matchId: string) {
  return useQuery<H2HSummary>({
    queryKey: ["match-h2h", matchId],
    queryFn: () => getMatchH2H(matchId),
    enabled: Boolean(matchId),
    staleTime: 1000 * 60 * 60 * 6, // 6 giờ
    refetchOnWindowFocus: false,
  });
}
