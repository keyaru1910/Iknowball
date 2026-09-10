// src/module/sports-data/adapters/api-football.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  SportsDataProvider,
  NormalizedLeague,
  NormalizedTeam,
  NormalizedFixture,
  NormalizedStanding,
} from './football-provider.interface';
import { ApiFootballAdapter } from './api-football.adapter';
import { ApiFootballMapper } from './api-football.mapper';

/**
 * Provider triển khai interface SportsDataProvider cho môn bóng đá sử dụng API-Football
 */
@Injectable()
export class ApiFootballProvider implements SportsDataProvider {
  readonly sportName = 'football' as const;
  private readonly logger = new Logger(ApiFootballProvider.name);

  constructor(
    private readonly adapter: ApiFootballAdapter,
    private readonly mapper: ApiFootballMapper,
  ) {}

  async fetchLeagues(country?: string): Promise<NormalizedLeague[]> {
    if (country) {
      const raw = await this.adapter.getLeagues(country);
      return raw.map((r) => this.mapper.toLeague(r));
    }

    // Mặc định fetch các giải đấu hàng đầu phổ biến nhất: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UCL
    const topLeagueIds = [39, 140, 135, 78, 61, 2];
    const results: NormalizedLeague[] = [];

    for (const leagueId of topLeagueIds) {
      try {
        const raw = await this.adapter.getLeagues(undefined, leagueId);
        if (raw && raw.length > 0) {
          results.push(this.mapper.toLeague(raw[0]));
        }
      } catch (err: any) {
        this.logger.warn(`Không thể lấy giải đấu ${leagueId}: ${err.message}`);
      }
    }

    return results;
  }

  async fetchTeams(
    leagueExternalId: string,
    season: string,
  ): Promise<NormalizedTeam[]> {
    const raw = await this.adapter.getTeams(leagueExternalId, season);
    return raw.map((r) => this.mapper.toTeam(r));
  }

  async fetchFixtures(
    leagueExternalId: string,
    season: string,
    options?: {
      status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELED';
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<NormalizedFixture[]> {
    let apiStatus: string | undefined;
    if (options?.status === 'LIVE') apiStatus = 'LIVE';
    else if (options?.status === 'SCHEDULED') apiStatus = 'NS';
    else if (options?.status === 'FINISHED') apiStatus = 'FT';

    const from = options?.fromDate?.toISOString().split('T')[0];
    const to = options?.toDate?.toISOString().split('T')[0];

    const raw = await this.adapter.getFixtures(leagueExternalId, season, {
      status: apiStatus,
      from,
      to,
    });
    return raw.map((r) => this.mapper.toFixture(r));
  }

  async fetchStandings(
    leagueExternalId: string,
    season: string,
  ): Promise<NormalizedStanding[]> {
    const raw = await this.adapter.getStandings(leagueExternalId, season);
    const standingsList: NormalizedStanding[] = [];

    if (raw && raw.length > 0) {
      const leagueData = raw[0]?.league;
      const allStandings = leagueData?.standings ?? [];
      // allStandings có thể là mảng lồng nhau (các bảng đấu)
      const flattened = allStandings.flat();
      for (const item of flattened) {
        standingsList.push(
          this.mapper.toStanding(item, leagueExternalId, season),
        );
      }
    }

    return standingsList;
  }
}
