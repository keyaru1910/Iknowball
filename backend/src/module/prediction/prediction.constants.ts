export const PREDICTION_QUEUE = 'prediction';
export enum PredictionJob {
  GENERATE = 'generate-predictions',
  EVALUATE = 'evaluate-predictions',
}
export const MODEL_VERSION = process.env.MODEL_VERSION || 'logistic-regression-v2';
export const FREE_DAILY_DETAIL_LIMIT = 3;
