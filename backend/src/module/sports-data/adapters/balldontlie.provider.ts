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
   * Chuẩn hóa mùa giải sang định dạng năm 4 chữ số (ví dụ: '24/25' | '2024-2025' -> '2024')
   */
  private normalizeSeason(season?: string): string {
    if (!season) return String(new Date().getUTCFullYear());
    const clean = season.trim();
    if (clean.includes('-')) return clean.split('-')[0];
    if (clean.includes('/')) {
      const parts = clean.split('/');
      return parts[0].length === 2 ? `20${parts[0]}` : parts[0];
    }
    return clean;
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
   * Lấy danh sách toàn bộ các đội bóng rổ NBA (hỗ trợ phân trang cursor)
   */
  async fetchTeams(): Promise<NormalizedTeam[]> {
    const allTeams: any[] = [];
    let nextCursor: number | null | undefined = undefined;
    let pageCount = 0;
    const maxPages = 10;

    do {
      pageCount++;
      const params: Record<string, any> = { per_page: 100 };
      if (nextCursor !== undefined && nextCursor !== null) {
        params.cursor = nextCursor;
      }
      const data = await this.requestWithRetry<{ data: any[]; meta?: { next_cursor?: number | null } }>('/teams', params);
      allTeams.push(...(data.data ?? []));
      nextCursor = data.meta?.next_cursor;
    } while (nextCursor && pageCount < maxPages);

    return allTeams.map((team: any) => {
      const abbr = (team.abbreviation || '').toLowerCase();
      const logoUrl = abbr
        ? `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`
        : `https://cdn.nba.com/logos/nba/${team.id}/global/L/logo.svg`;

      return {
        externalId: String(team.id),
        leagueExternalId: 'nba',
        name: team.full_name,
        shortName: team.abbreviation ?? null,
        logoUrl,
        foundedYear: null,
      };
    });
  }

  /**
   * Lấy danh sách trận đấu NBA theo mùa giải và bộ lọc trạng thái (hỗ trợ phân trang cursor)
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
    const normalizedSeason = this.normalizeSeason(season);
    const baseParams: Record<string, any> = {
      'seasons[]': normalizedSeason,
      per_page: 100,
    };

    if (options?.fromDate) {
      baseParams.start_date = options.fromDate.toISOString().split('T')[0];
    }
    if (options?.toDate) {
      baseParams.end_date = options.toDate.toISOString().split('T')[0];
    }

    const allGames: any[] = [];
    let nextCursor: number | null | undefined = undefined;
    let pageCount = 0;
    const maxPages = 30; // Giới hạn an toàn chống vòng lặp

    do {
      pageCount++;
      const params: Record<string, any> = { ...baseParams };
      if (nextCursor !== undefined && nextCursor !== null) {
        params.cursor = nextCursor;
      }

      const res = await this.requestWithRetry<{ data: any[]; meta?: { next_cursor?: number | null } }>('/games', params);
      const games = res.data ?? [];
      allGames.push(...games);
      nextCursor = res.meta?.next_cursor;
    } while (nextCursor && pageCount < maxPages);

    let fixtures: NormalizedFixture[] = allGames.map((game: any) => {
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

    if (options?.status) {
      fixtures = fixtures.filter((f) => f.status === options.status);
    }

    return fixtures;
  }

  /**
   * Lấy bảng xếp hạng NBA trực tiếp từ endpoint /standings của Balldontlie API.
   * Chỉ tốn 1 request thay vì phải fetchFixtures() toàn mùa giải.
   */
  async fetchStandings(
    _leagueExternalId: string,
    season: string,
  ): Promise<NormalizedStanding[]> {
    try {
      const data = await this.requestWithRetry<{ data: any[] }>('/standings', { season });
      const standings = data.data ?? [];

      // Sắp xếp theo thứ hạng conference, fallback theo số thắng
      const sorted = [...standings].sort((a, b) => {
        const rankA: number = a.conference?.rank ?? 999;
        const rankB: number = b.conference?.rank ?? 999;
        if (rankA !== rankB) return rankA - rankB;
        return (b.wins ?? 0) - (a.wins ?? 0);
      });

      return sorted.map((item: any, index: number) => ({
        leagueExternalId: _leagueExternalId,
        teamExternalId: String(item.team?.id ?? ''),
        season: String(season),
        rank: index + 1,
        points: (item.wins ?? 0) * 2, // NBA: 2 điểm/thắng, 0 điểm/thua
        played: (item.wins ?? 0) + (item.losses ?? 0),
        won: item.wins ?? 0,
        drawn: 0, // NBA không có trận hòa
        lost: item.losses ?? 0,
        goalsFor: 0,    // Balldontlie /standings không trả về điểm số chi tiết
        goalsAgainst: 0,
      }));
    } catch (err: any) {
      this.logger.warn(`[Balldontlie] fetchStandings thất bại: ${err.message}`);
      return [];
    }
  }
}
