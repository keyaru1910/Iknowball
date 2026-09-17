import { apiFetch } from "../client";

export interface FluctuationAlertItem {
  id: string;
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  sport: string;
  type: "ODDS_SHIFT" | "PROBABILITY_SPIKE" | "VALUE_BET" | "LINEUP_CHANGE" | string;
  headline: string;
  description: string;
  previousHomeWinProb: number | string;
  currentHomeWinProb: number | string;
  previousAwayWinProb: number | string;
  currentAwayWinProb: number | string;
  previousDrawProb?: number | string | null;
  currentDrawProb?: number | string | null;
  changePercent: number | string;
  severity: "INFO" | "SIGNIFICANT" | "CRITICAL" | string;
  recommendedBet?: string | null;
  isLocked?: boolean;
  accessLevel?: "full" | "pro" | "teaser";
  createdAt: string;
  match?: {
    id: string;
    matchDate: string;
    status: string;
    league?: {
      name: string;
      logoUrl?: string | null;
    };
  };
}

export interface AlertPreferences {
  id?: string;
  oddsAlertEnabled: boolean;
  predictionShiftEnabled: boolean;
  minThresholdPercent: number;
  notifyInApp: boolean;
  notifyTelegram: boolean;
  notifyEmail: boolean;
}

export async function getFluctuationAlerts(limit = 20): Promise<FluctuationAlertItem[]> {
  const { data } = await apiFetch<FluctuationAlertItem[]>(`/alerts/fluctuations?limit=${limit}`, {
    method: "GET",
  });
  return data;
}

export async function getAlertPreferences(): Promise<AlertPreferences> {
  const { data } = await apiFetch<AlertPreferences>("/alerts/preferences", {
    method: "GET",
  });
  return data;
}

export async function updateAlertPreferences(prefs: Partial<AlertPreferences>): Promise<AlertPreferences> {
  const { data } = await apiFetch<AlertPreferences>("/alerts/preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
  return data;
}

export async function triggerAlertScan() {
  const { data } = await apiFetch<{ success: boolean; recordsScanned: number; alertsCreated: number }>("/alerts/scan", {
    method: "POST",
  });
  return data;
}
