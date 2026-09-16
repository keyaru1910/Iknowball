import { apiFetch } from "../client";
import {
  type PlayerStatisticDto,
  type TeamSeasonStatisticDto,
  playerStatisticSchema,
  teamSeasonStatisticSchema,
} from "../schemas/statistics.schema";
import { z } from "zod";

// Fallback mock data cho Football Cầu thủ
const mockFootballPlayers: PlayerStatisticDto[] = [
  {
    id: "fp-1",
    playerId: "p-1",
    playerName: "Erling Haaland",
    teamId: "t-1",
    teamName: "Manchester City",
    teamLogoUrl: "https://media.api-sports.io/football/teams/50.png",
    season: "2025-2026",
    sport: "football",
    position: "Attacker",
    nationality: "Norway",
    appearances: 26,
    minutesPlayed: 2280,
    goals: 24,
    assists: 5,
    yellowCards: 2,
    redCards: 0,
    shotsOnTarget: 58,
  },
  {
    id: "fp-2",
    playerId: "p-2",
    playerName: "Mohamed Salah",
    teamId: "t-2",
    teamName: "Liverpool",
    teamLogoUrl: "https://media.api-sports.io/football/teams/40.png",
    season: "2025-2026",
    sport: "football",
    position: "Attacker",
    nationality: "Egypt",
    appearances: 27,
    minutesPlayed: 2340,
    goals: 21,
    assists: 14,
    yellowCards: 1,
    redCards: 0,
    shotsOnTarget: 52,
  },
  {
    id: "fp-3",
    playerId: "p-3",
    playerName: "Bukayo Saka",
    teamId: "t-3",
    teamName: "Arsenal",
    teamLogoUrl: "https://media.api-sports.io/football/teams/42.png",
    season: "2025-2026",
    sport: "football",
    position: "Midfielder",
    nationality: "England",
    appearances: 25,
    minutesPlayed: 2150,
    goals: 15,
    assists: 12,
    yellowCards: 3,
    redCards: 0,
    shotsOnTarget: 41,
  },
  {
    id: "fp-4",
    playerId: "p-4",
    playerName: "Cole Palmer",
    teamId: "t-4",
    teamName: "Chelsea",
    teamLogoUrl: "https://media.api-sports.io/football/teams/49.png",
    season: "2025-2026",
    sport: "football",
    position: "Midfielder",
    nationality: "England",
    appearances: 26,
    minutesPlayed: 2200,
    goals: 16,
    assists: 10,
    yellowCards: 4,
    redCards: 0,
    shotsOnTarget: 45,
  },
  {
    id: "fp-5",
    playerId: "p-5",
    playerName: "Alexander Isak",
    teamId: "t-5",
    teamName: "Newcastle United",
    teamLogoUrl: "https://media.api-sports.io/football/teams/34.png",
    season: "2025-2026",
    sport: "football",
    position: "Attacker",
    nationality: "Sweden",
    appearances: 23,
    minutesPlayed: 1980,
    goals: 17,
    assists: 3,
    yellowCards: 2,
    redCards: 0,
    shotsOnTarget: 38,
  },
  {
    id: "fp-6",
    playerId: "p-6",
    playerName: "Son Heung-Min",
    teamId: "t-6",
    teamName: "Tottenham",
    teamLogoUrl: "https://media.api-sports.io/football/teams/47.png",
    season: "2025-2026",
    sport: "football",
    position: "Attacker",
    nationality: "South Korea",
    appearances: 25,
    minutesPlayed: 2110,
    goals: 12,
    assists: 9,
    yellowCards: 1,
    redCards: 0,
    shotsOnTarget: 34,
  },
  {
    id: "fp-7",
    playerId: "p-7",
    playerName: "Kevin De Bruyne",
    teamId: "t-1",
    teamName: "Manchester City",
    teamLogoUrl: "https://media.api-sports.io/football/teams/50.png",
    season: "2025-2026",
    sport: "football",
    position: "Midfielder",
    nationality: "Belgium",
    appearances: 20,
    minutesPlayed: 1600,
    goals: 6,
    assists: 15,
    yellowCards: 2,
    redCards: 0,
    shotsOnTarget: 22,
  },
  {
    id: "fp-8",
    playerId: "p-8",
    playerName: "Bruno Fernandes",
    teamId: "t-7",
    teamName: "Manchester United",
    teamLogoUrl: "https://media.api-sports.io/football/teams/33.png",
    season: "2025-2026",
    sport: "football",
    position: "Midfielder",
    nationality: "Portugal",
    appearances: 27,
    minutesPlayed: 2410,
    goals: 9,
    assists: 11,
    yellowCards: 5,
    redCards: 1,
    shotsOnTarget: 36,
  }
];

import mockNbaData from "./mock_nba.json";

// Fallback mock data cho Basketball Cầu thủ từ dữ liệu 2 mùa 24/25 & 25/26
const mockBasketballPlayers: PlayerStatisticDto[] = (mockNbaData.players as any[]).map((p, idx) => ({
  id: `bp-${idx + 1}`,
  playerId: p.externalId,
  playerName: p.playerName,
  teamId: `t-${p.teamName.toLowerCase().replace(/\s+/g, '-')}`,
  teamName: p.teamName,
  teamLogoUrl: p.teamLogoUrl,
  season: p.season,
  sport: "basketball",
  position: p.position || "Guard",
  appearances: p.appearances,
  minutesPlayed: p.minutesPlayed,
  pointsAvg: p.pointsAvg,
  reboundsAvg: p.reboundsAvg,
  assistsAvg: p.assistsAvg,
  stealsAvg: p.stealsAvg,
  blocksAvg: p.blocksAvg,
  fieldGoalPercentage: p.fieldGoalPercentage,
}));

// Mock Football Đội bóng
const mockFootballTeams: TeamSeasonStatisticDto[] = [
  {
    id: "ft-1",
    teamId: "t-2",
    teamName: "Liverpool",
    teamLogoUrl: "https://media.api-sports.io/football/teams/40.png",
    season: "2025-2026",
    sport: "football",
    played: 28,
    wins: 20,
    draws: 5,
    losses: 3,
    goalsFor: 68,
    goalsAgainst: 25,
    goalDifference: 43,
    cleanSheets: 12,
  },
  {
    id: "ft-2",
    teamId: "t-3",
    teamName: "Arsenal",
    teamLogoUrl: "https://media.api-sports.io/football/teams/42.png",
    season: "2025-2026",
    sport: "football",
    played: 28,
    wins: 19,
    draws: 6,
    losses: 3,
    goalsFor: 62,
    goalsAgainst: 22,
    goalDifference: 40,
    cleanSheets: 14,
  },
  {
    id: "ft-3",
    teamId: "t-1",
    teamName: "Manchester City",
    teamLogoUrl: "https://media.api-sports.io/football/teams/50.png",
    season: "2025-2026",
    sport: "football",
    played: 28,
    wins: 18,
    draws: 5,
    losses: 5,
    goalsFor: 65,
    goalsAgainst: 30,
    goalDifference: 35,
    cleanSheets: 10,
  },
  {
    id: "ft-4",
    teamId: "t-4",
    teamName: "Chelsea",
    teamLogoUrl: "https://media.api-sports.io/football/teams/49.png",
    season: "2025-2026",
    sport: "football",
    played: 28,
    wins: 15,
    draws: 7,
    losses: 6,
    goalsFor: 54,
    goalsAgainst: 36,
    goalDifference: 18,
    cleanSheets: 8,
  },
  {
    id: "ft-5",
    teamId: "t-5",
    teamName: "Newcastle United",
    teamLogoUrl: "https://media.api-sports.io/football/teams/34.png",
    season: "2025-2026",
    sport: "football",
    played: 28,
    wins: 14,
    draws: 5,
    losses: 9,
    goalsFor: 49,
    goalsAgainst: 37,
    goalDifference: 12,
    cleanSheets: 9,
  }
];

// Fallback Mock Basketball Đội bóng từ dữ liệu 2 mùa 24/25 & 25/26
const mockBasketballTeams: TeamSeasonStatisticDto[] = (mockNbaData.teams as any[]).map((t, idx) => ({
  id: `bt-${idx + 1}`,
  teamId: `tb-${t.teamName.toLowerCase().replace(/\s+/g, '-')}`,
  teamName: t.teamName,
  teamLogoUrl: t.teamLogoUrl,
  season: t.season,
  sport: "basketball",
  played: t.played,
  wins: t.wins,
  draws: null,
  losses: t.losses,
  winPercentage: t.winPercentage,
  pointsForAvg: t.pointsForAvg,
  pointsAgainstAvg: t.pointsAgainstAvg,
  pointDifferential: t.pointDifferential,
}));

export async function getPlayerStatistics(params: {
  sport: "football" | "basketball";
  leagueId?: string;
  season?: string;
  sortBy?: string;
}): Promise<PlayerStatisticDto[]> {
  try {
    const query = new URLSearchParams({
      sport: params.sport,
      ...(params.leagueId && { leagueId: params.leagueId }),
      ...(params.season && { season: params.season }),
      ...(params.sortBy && { sortBy: params.sortBy }),
    }).toString();

    const response = await apiFetch<unknown>(`/statistics/players?${query}`);
    return z.array(playerStatisticSchema).parse(response.data);
  } catch (error) {
    // Trả về mock data chất lượng cao khi API backend đang load/offline
    let list = params.sport === "basketball" ? mockBasketballPlayers : mockFootballPlayers;
    const seasonFilter = params.season;
    
    if (seasonFilter) {
      const filtered = list.filter((p) => p.season === seasonFilter || seasonFilter.includes(p.season.slice(0, 4)));
      if (filtered.length > 0) {
        list = filtered;
      }
    }
    
    // Sort logic cho mock
    if (params.sortBy) {
      const sortByMetric = params.sortBy;
      return [...list].sort((a, b) => {
        const valA = (a as Record<string, unknown>)[sortByMetric] as number ?? 0;
        const valB = (b as Record<string, unknown>)[sortByMetric] as number ?? 0;
        return valB - valA;
      });
    }
    return list;
  }
}

export async function getTeamSeasonStatistics(params: {
  sport: "football" | "basketball";
  leagueId?: string;
  season?: string;
}): Promise<TeamSeasonStatisticDto[]> {
  try {
    const query = new URLSearchParams({
      sport: params.sport,
      ...(params.leagueId && { leagueId: params.leagueId }),
      ...(params.season && { season: params.season }),
    }).toString();

    const response = await apiFetch<unknown>(`/statistics/teams?${query}`);
    return z.array(teamSeasonStatisticSchema).parse(response.data);
  } catch (error) {
    // Trả về mock data khi API backend chưa có sẵn
    const list = params.sport === "basketball" ? mockBasketballTeams : mockFootballTeams;
    const seasonFilter = params.season;
    if (seasonFilter) {
      const filtered = list.filter((t) => t.season === seasonFilter || seasonFilter.includes(t.season.slice(0, 4)));
      if (filtered.length > 0) {
        return filtered;
      }
    }
    return list;
  }
}
