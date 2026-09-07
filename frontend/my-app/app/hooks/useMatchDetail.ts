import { useQuery } from "@tanstack/react-query";
import { getMatchById } from "../lib/api/endpoints/matches";
import type { MatchDetail } from "../lib/api/schemas/match.schema";

/**
 * Hook lấy chi tiết trận đấu:
 * - Tự động polling mỗi 15-20s nếu trận đang diễn ra ("live") theo tài liệu thiết kế.
 * - Trận chưa diễn ra hoặc đã kết thúc sẽ không refetch liên tục để tiết kiệm tài nguyên.
 */
export function useMatchDetail(id: string) {
  return useQuery<MatchDetail>({
    queryKey: ["match", id],
    queryFn: () => getMatchById(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "live" ? 1000 * 20 : false;
    },
  });
}
