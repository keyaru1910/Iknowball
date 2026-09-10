// src/module/sports-data/adapters/balldontlie.provider.ts
import { Injectable, Logger, HttpException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import type {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
  SportsDataProvider,
} from './football-provider.interface';

/**
 * Adapter cho nhà cung cấp dữ liệu balldontlie (NBA và thể thao tương thích)
 */
@Injectable()
export class BalldontlieProvider implements SportsDataProvider {
  readonly sportName = 'basketball' as const;
  private readonly logger = new Logger(BalldontlieProvider.name);
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.balldontlie.io/v1',
      timeout: 8000,
      headers: {
        Authorization: process.env.BALLDONTLIE_API_KEY || process.env.API_BASKETBALL_KEY || '',
      },
    });
  }

  /**
   * Gọi API kèm cơ chế Retry Exponential Backoff khi bị Rate Limit (429) hoặc lỗi mạng tạm thời
   */
  private async requestWithRetry<T = any>(
    path: string,
    params: Record<string, any> = {},
    attempt = 1,
  ): Promise<T> {
    try {
      const response = await this.client.get(path, { params });
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;

      // Xử lý Rate Limit 429
      if (status === 429 && attempt <= 3) {
        const backoffMs = 1000 * 2 ** attempt; // 2s, 4s, 8s
        this.logger.warn(
          `[Balldontlie] Bị giới hạn tần suất (429) tại ${path}, thử lại sau ${backoffMs}ms (lần ${attempt})`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.requestWithRetry<T>(path, params, attempt + 1);
      }

      // Xử lý lỗi Timeout hoặc lỗi Server tạm thời (>= 500)
      if (
        (err?.code === 'ECONNABORTED' || (status && status >= 500)) &&
        attempt <= 3
      ) {
        const backoffMs = 1000 * attempt;
        this.logger.warn(
          `[Balldontlie] Lỗi mạng tạm thời tại ${path}, thử lại sau ${backoffMs}ms (lần ${attempt})`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.requestWithRetry<T>(path, params, attempt + 1);
      }

      this.logger.error(
        `[Balldontlie] Yêu cầu thất bại tới ${path}: ${err?.message}`,
      );
      throw new HttpException(
        `Balldontlie API request failed: ${path} (${err?.message})`,
        status || 502,
      );
    }
  }

  /**
   * Lấy danh sách giải đấu NBA
   */
  async fetchLeagues(): Promise<NormalizedLeague[]> {
    const currentYear = new Date().getUTCFullYear();
    return [
      {
        externalId: 'nba',
        name: 'NBA',
        country: 'USA',
        season: String(currentYear),
      },
    ];
  }

  /**
   * Lấy danh sách toàn bộ các đội bóng rổ NBA
   */
  async fetchTeams(): Promise<NormalizedTeam[]> {
    const data = await this.requestWithRetry<{ data: any[] }>('/teams');
    return (data.data ?? []).map((team: any) => ({
      externalId: String(team.id),
      leagueExternalId: 'nba',
      name: team.full_name,
      shortName: team.abbreviation ?? null,
      logoUrl: `https://cdn.nba.com/logos/nba/${team.id}/global/L/logo.svg`,
      foundedYear: null,
    }));
  }

  /**
   * Lấy danh sách trận đấu NBA theo mùa giải và bộ lọc trạng thái
   */
  async fetchFixtures(
    _leagueExternalId: string,
    season: string,
    options?: {
      status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELED';
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<NormalizedFixture[]> {
    const params: Record<string, any> = {
      'seasons[]': season,
      per_page: 100,
    };

    if (options?.fromDate) {
      params.start_date = options.fromDate.toISOString().split('T')[0];
    }
    if (options?.toDate) {
      params.end_date = options.toDate.toISOString().split('T')[0];
    }

    const data = await this.requestWithRetry<{ data: any[] }>('/games', params);

    return (data.data ?? []).map((game: any) => {
      let status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELED' =
        'SCHEDULED';

      const rawStatus = (game.status || '').toLowerCase();
      if (rawStatus === 'final') {
        status = 'FINISHED';
      } else if (
        rawStatus.includes('q') ||
        rawStatus.includes('halftime') ||
        rawStatus === 'in progress'
      ) {
        status = 'LIVE';
      } else if (rawStatus.includes('postponed')) {
        status = 'POSTPONED';
      } else if (rawStatus.includes('canceled') || rawStatus.includes('cancelled')) {
        status = 'CANCELED';
      }

      return {
        externalId: String(game.id),
        leagueExternalId: 'nba',
        homeTeamExternalId: String(game.home_team.id),
        awayTeamExternalId: String(game.visitor_team.id),
        matchDate: new Date(game.date),
        status,
        homeScore: status === 'FINISHED' || status === 'LIVE' ? game.home_team_score : null,
        awayScore: status === 'FINISHED' || status === 'LIVE' ? game.visitor_team_score : null,
        rawData: game,
      };
    });
  }

  /**
   * Lấy bảng xếp hạng NBA
   */
  async fetchStandings(
    leagueExternalId: string,
    season: string,
  ): Promise<NormalizedStanding[]> {
    const [teams, fixtures] = await Promise.all([
      this.fetchTeams(),
      this.fetchFixtures(leagueExternalId, season),
    ]);

    // Tính toán bảng xếp hạng dựa trên kết quả các trận đã kết thúc
    const standingsMap = new Map<
      string,
      { won: number; lost: number; points: number; played: number; goalsFor: number; goalsAgainst: number }
    >();

    for (const team of teams) {
      standingsMap.set(team.externalId, {
        won: 0,
        lost: 0,
        points: 0,
        played: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      });
    }

    for (const match of fixtures) {
      if (match.status === 'FINISHED' && match.homeScore !== null && match.awayScore !== null) {
        const home = standingsMap.get(match.homeTeamExternalId);
        const away = standingsMap.get(match.awayTeamExternalId);

        if (home) {
          home.played += 1;
          home.goalsFor += match.homeScore;
          home.goalsAgainst += match.awayScore;
          if (match.homeScore > match.awayScore) {
            home.won += 1;
            home.points += 2;
          } else {
            home.lost += 1;
          }
        }

        if (away) {
          away.played += 1;
          away.goalsFor += match.awayScore;
          away.goalsAgainst += match.homeScore;
          if (match.awayScore > match.homeScore) {
            away.won += 1;
            away.points += 2;
          } else {
            away.lost += 1;
          }
        }
      }
    }

    const sortedStandings = Array.from(standingsMap.entries())
      .map(([teamExternalId, stats]) => ({
        leagueExternalId,
        teamExternalId,
        season,
        rank: 0,
        points: stats.points,
        played: stats.played,
        won: stats.won,
        drawn: 0, // NBA không có trận hòa
        lost: stats.lost,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
      }))
      .sort((a, b) => b.won - a.won || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));

    return sortedStandings.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }
}
