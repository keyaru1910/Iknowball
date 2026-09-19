// src/module/sports-data/adapters/api-basketball.provider.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
  SportsDataProvider,
} from './football-provider.interface';
import { ApiBasketballAdapter } from './api-basketball.adapter';
import { ApiBasketballMapper } from './api-basketball.mapper';

@Injectable()
export class ApiBasketballProvider implements SportsDataProvider {
  readonly sportName = 'basketball' as const;
  private readonly logger = new Logger(ApiBasketballProvider.name);

  constructor(
    @Inject(ApiBasketballAdapter)
    private readonly adapter: ApiBasketballAdapter,
    @Inject(ApiBasketballMapper)
    private readonly mapper: ApiBasketballMapper,
  ) {}

  async fetchLeagues(): Promise<NormalizedLeague[]> {
    try {
      const raw = await this.adapter.getLeagues(12);
      if (raw && raw.length > 0) {
        return [this.mapper.toLeague(raw[0])];
      }
    } catch (err: any) {
      this.logger.warn(`[ApiBasketball] Lỗi fetchLeagues: ${err.message}`);
    }
    return [{ externalId: 'nba', name: 'NBA', country: 'USA', season: '2024-2025' }];
  }

  async fetchTeams(): Promise<NormalizedTeam[]> {
    try {
      const raw = await this.adapter.getTeams(12);
      return raw.map((t: any) => this.mapper.toTeam(t));
    } catch (err: any) {
      this.logger.warn(`[ApiBasketball] Lỗi fetchTeams: ${err.message}`);
      return [];
    }
  }

  async fetchFixtures(
    _leagueExternalId: string,
    season: string,
    options?: {
      status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELED';
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<NormalizedFixture[]> {
    try {
      const rawGames = await this.adapter.getGames(12, season);
      let fixtures = rawGames.map((g: any) => this.mapper.toFixture(g));

      if (options?.status) {
        fixtures = fixtures.filter((f) => f.status === options.status);
      }
      if (options?.fromDate) {
        fixtures = fixtures.filter((f) => f.matchDate >= options.fromDate!);
      }
      if (options?.toDate) {
        fixtures = fixtures.filter((f) => f.matchDate <= options.toDate!);
      }

      return fixtures;
    } catch (err: any) {
      this.logger.warn(`[ApiBasketball] Lỗi fetchFixtures: ${err.message}`);
      return [];
    }
  }

  async fetchStandings(_leagueExternalId: string, season: string): Promise<NormalizedStanding[]> {
    try {
      const raw = await this.adapter.getStandings(12, season);
      const flattened = Array.isArray(raw) ? raw.flat() : [];
      return flattened.map((s: any) => this.mapper.toStanding(s, season));
    } catch (err: any) {
      this.logger.warn(`[ApiBasketball] Lỗi fetchStandings: ${err.message}`);
      return [];
    }
  }
}
