// src/module/sports-data/adapters/football-data.provider.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
  SportsDataProvider,
} from './football-provider.interface';
import {
  FootballDataAdapter,
  FOOTBALL_DATA_LEAGUES,
  FootballDataLeagueConfig,
} from './football-data.adapter';
import { FootballDataMapper } from './football-data.mapper';
import { layMuaGiaiHienTai } from '../../match/match.service';

@Injectable()
export class FootballDataProvider implements SportsDataProvider {
  readonly sportName = 'football' as const;
  private readonly logger = new Logger(FootballDataProvider.name);

  constructor(
    @Inject(FootballDataAdapter)
    private readonly adapter: FootballDataAdapter,
    @Inject(FootballDataMapper)
    private readonly mapper: FootballDataMapper,
  ) {}

  private findLeagueConfig(leagueExternalId: string): FootballDataLeagueConfig | undefined {
    return FOOTBALL_DATA_LEAGUES.find(
      (l) => l.externalId === leagueExternalId || l.code === leagueExternalId,
    );
  }

  async fetchLeagues(_country?: string): Promise<NormalizedLeague[]> {
    const currentSeason = layMuaGiaiHienTai('football');
    return FOOTBALL_DATA_LEAGUES.map((l) => this.mapper.toLeague(l, currentSeason));
  }

  async fetchTeams(leagueExternalId: string, season: string): Promise<NormalizedTeam[]> {
    const config = this.findLeagueConfig(leagueExternalId);
    if (!config) {
      this.logger.warn(`[FootballData] Không tìm thấy cấu hình giải đấu cho externalId: ${leagueExternalId}`);
      return [];
    }

    try {
      const rawTeams = await this.adapter.getTeams(config.code, season);
      return rawTeams.map((t: any) => this.mapper.toTeam(t, leagueExternalId));
    } catch (err: any) {
      this.logger.warn(`[FootballData] Lỗi fetchTeams cho ${config.name}: ${err.message}`);
      return [];
    }
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
    const config = this.findLeagueConfig(leagueExternalId);
    if (!config) {
      this.logger.warn(`[FootballData] Không tìm thấy cấu hình giải đấu cho externalId: ${leagueExternalId}`);
      return [];
    }

    try {
      const rawMatches = await this.adapter.getMatches(config.code, season);
      let fixtures = rawMatches.map((m: any) => this.mapper.toFixture(m, leagueExternalId, season));

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
      this.logger.warn(`[FootballData] Lỗi fetchFixtures cho ${config.name}: ${err.message}`);
      return [];
    }
  }

  async fetchStandings(leagueExternalId: string, season: string): Promise<NormalizedStanding[]> {
    const config = this.findLeagueConfig(leagueExternalId);
    if (!config) return [];

    try {
      const rawStandings = await this.adapter.getStandings(config.code, season);
      if (Array.isArray(rawStandings) && rawStandings.length > 0) {
        // rawStandings[0].table chứa danh sách các đội
        const table = rawStandings[0]?.table || [];
        return table.map((s: any) => this.mapper.toStanding(s, leagueExternalId, season));
      }
      return [];
    } catch (err: any) {
      this.logger.warn(`[FootballData] Lỗi fetchStandings cho ${config.name}: ${err.message}`);
      return [];
    }
  }
}
