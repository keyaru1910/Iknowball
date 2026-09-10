import { useQuery } from "@tanstack/react-query";
import { getModelPerformance } from "../lib/api/endpoints/predictions";

export function useModelPerformance(history = false, league?: string) {
  return useQuery({ queryKey: ["model-performance", history, league], queryFn: () => getModelPerformance(history, league), staleTime: 1000 * 60 * 60 * 6 });
}
