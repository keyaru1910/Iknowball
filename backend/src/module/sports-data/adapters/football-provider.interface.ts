// src/module/sports-data/adapters/football-provider.interface.ts

/**
 * Cấu trúc dữ liệu Giải đấu đã chuẩn hóa
 */
export interface NormalizedLeague {
    externalId: string;
    name: string;
    country: string | null;
    season: string;
}

/**
 * Cấu trúc dữ liệu Đội bóng đã chuẩn hóa
 */
export interface NormalizedTeam {
    externalId: string;
    leagueExternalId: string;
    name: string;
    shortName: string | null;
    logoUrl: string | null;
    foundedYear: number | null;
}

/**
 * Cấu trúc dữ liệu Trận đấu đã chuẩn hóa
 */
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

/**
 * Cấu trúc dữ liệu Bảng xếp hạng đã chuẩn hóa
 */
export interface NormalizedStanding {
    leagueExternalId: string;
    teamExternalId: string;
    season: string;
    rank: number;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor?: number;
    goalsAgainst?: number;
}

/**
 * Cấu trúc dữ liệu Thống kê Đội bóng
 */
export interface NormalizedTeamStats {
    teamExternalId: string;
    leagueExternalId: string;
    season: string;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
}

/**
 * Contract mà mọi Data Provider (Balldontlie, API-Football...) phải tuân theo
 */
export interface SportsDataProvider {
    readonly sportName: 'football' | 'basketball';

    /**
     * Lấy danh sách giải đấu
     */
    fetchLeagues(country?: string): Promise<NormalizedLeague[]>;

    /**
     * Lấy danh sách đội bóng theo giải đấu và mùa giải
     */
    fetchTeams(leagueExternalId: string, season: string): Promise<NormalizedTeam[]>;

    /**
     * Lấy lịch thi đấu / trận đấu
     */
    fetchFixtures(
        leagueExternalId: string,
        season: string,
        options?: {
            status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELED';
            fromDate?: Date;
            toDate?: Date;
        },
    ): Promise<NormalizedFixture[]>;

    /**
     * Lấy bảng xếp hạng theo giải đấu và mùa giải
     */
    fetchStandings?(leagueExternalId: string, season: string): Promise<NormalizedStanding[]>;
}
