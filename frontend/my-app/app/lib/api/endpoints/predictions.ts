import { apiFetch } from "../client";
import { modelPerformanceSchema, predictionDetailSchema, type ModelPerformance, type PredictionDetail } from "../schemas/prediction.schema";

export async function getPrediction(matchId: string): Promise<PredictionDetail> {
  const { data } = await apiFetch<unknown>(`/predictions/${matchId}`);
  return predictionDetailSchema.parse(data);
}

export async function getModelPerformance(history = false, league?: string): Promise<ModelPerformance[]> {
  const query = league ? `?league=${encodeURIComponent(league)}` : "";
  const path = history ? `/predictions/performance/history${query}` : `/predictions/performance${query}`;
  const { data } = await apiFetch<unknown>(path);
  return modelPerformanceSchema.array().parse(data);
}
