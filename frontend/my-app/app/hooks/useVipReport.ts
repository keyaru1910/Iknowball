import { useQuery } from "@tanstack/react-query";
import { getVipReport } from "../lib/api/endpoints/predictions";

export function useVipReport(matchId: string) {
  return useQuery({
    queryKey: ["vipReport", matchId],
    queryFn: () => getVipReport(matchId),
    enabled: Boolean(matchId),
    staleTime: 1000 * 60 * 15, // 15 phút
  });
}
