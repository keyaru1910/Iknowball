import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import { predictionDetailSchema, type PredictionDetail } from "../lib/api/schemas/prediction.schema";

export function usePredictionsList(params: { league?: string; date?: string } = {}) {
  const query = new URLSearchParams();
  if (params.league) query.set("league", params.league);
  if (params.date) query.set("date", params.date);
  return useQuery<PredictionDetail[]>({
    queryKey: ["predictions", params],
    queryFn: async () => {
      const { data } = await apiFetch<unknown>(`/predictions?${query.toString()}`);
      return predictionDetailSchema.array().parse(data);
    },
    staleTime: 1000 * 60 * 30,
  });
}
