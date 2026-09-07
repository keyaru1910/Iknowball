// football-provider.interface.ts
export interface NormalizedLeague {
    externalId: string;
    name: string;
    country: string | null;
    season: string;
}

export interface NormalizedTeam {
    externalId: string;
    leagueExternalId: string;
    name: string;
    shortName: string | null;
    logoUrl: string | null;
    foundedYear: number | null;
}

export interface NormalizedFixture {
    externalId: string;
    leagueExternalId: string;
    homeTeamExternalId: string;
    awayTeamExternalId: string;
    matchDate: Date;
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELED';
    homeScore: number | null;
    awayScore: number | null;
    rawData: Record<string, unknown>;
}

// Contract mà mọi provider (API-Football, balldontlie...) phải tuân theo
export interface SportsDataProvider {
    fetchLeagues(country?: string): Promise<NormalizedLeague[]>;
    fetchTeams(leagueExternalId: string, season: string): Promise<NormalizedTeam[]>;
    fetchFixtures(leagueExternalId: string, season: string): Promise<NormalizedFixture[]>;
}