import { useQuery } from "@tanstack/react-query";
import { getMatches, type GetMatchesParams } from "../lib/api/endpoints/matches";
import type { Match } from "../lib/api/schemas/match.schema";

function isToday(dateStr?: string): boolean {
  if (!dateStr) return true; // không truyền date => mặc định là "hôm nay"
  const today = new Intl.DateTimeFormat("en-CA").format(new Date()); // yyyy-MM-dd
  return dateStr === today;
}

/**
 * Chiến lược cache khớp với tần suất polling ở backend (mục 8.2 design doc):
 * - Trận không phải hôm nay (>24h tới): staleTime dài (6h) — lịch hiếm khi đổi.
 * - Trận hôm nay: staleTime ngắn hơn (30 phút) — có thể có trận sắp bắt đầu.
 * - Nếu trong danh sách có trận đang "live": tự động refetch mỗi 20s.
 *   Không polling nếu không có trận live nào — tránh gọi API thừa.
 */
export function useMatches(params: GetMatchesParams = {}) {
  const today = isToday(params.date);

  return useQuery<Match[]>({
    queryKey: ["matches", params],
    queryFn: () => getMatches(params),
    staleTime: today ? 1000 * 60 * 30 : 1000 * 60 * 60 * 6,
    refetchInterval: (query) => {
      const matches = query.state.data;
      const hasLiveMatch = matches?.some((m) => m.status === "live");
      return hasLiveMatch ? 1000 * 20 : false;
    },
  });
}
