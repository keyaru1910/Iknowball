import { useQuery } from "@tanstack/react-query";
import { getPrediction } from "../lib/api/endpoints/predictions";

export function usePrediction(matchId: string) {
  return useQuery({ queryKey: ["prediction", matchId], queryFn: () => getPrediction(matchId), enabled: Boolean(matchId), staleTime: 1000 * 60 * 30 });
}
