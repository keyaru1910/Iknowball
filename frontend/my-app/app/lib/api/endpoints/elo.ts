import { apiFetch } from "../client";

export interface EloHistoryPoint {
  matchId: string;
  matchDate: string;
  opponent: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  isHome: boolean;
  score: string;
  result: "W" | "D" | "L";
  eloBefore: number;
  eloAfter: number;
  eloChange: number;
}

export interface TeamEloHistory {
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  currentElo: number;
  peakElo: number;
  lowestElo: number;
  history: EloHistoryPoint[];
}

export interface MatchEloComparison {
  homeTeam: TeamEloHistory;
  awayTeam: TeamEloHistory;
  eloDifference: number;
}

/**
 * Lấy lịch sử biến động điểm Elo của 1 đội bóng
 */
export async function getEloHistory(teamId: string, season?: string) {
  const query = season ? `?season=${encodeURIComponent(season)}` : "";
  const { data } = await apiFetch<TeamEloHistory>(`/elo/history/${teamId}${query}`);
  return data;
}

/**
 * So sánh biến động điểm Elo giữa 2 đội bóng đối đầu
 */
export async function getMatchEloComparison(homeTeamId: string, awayTeamId: string, season?: string) {
  const params = new URLSearchParams();
  params.set("homeTeamId", homeTeamId);
  params.set("awayTeamId", awayTeamId);
  if (season) params.set("season", season);

  const { data } = await apiFetch<MatchEloComparison>(`/elo/compare?${params.toString()}`);
  return data;
}
