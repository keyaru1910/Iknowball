import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
  SportsDataProvider,
} from './football-provider.interface';
import { ZafronixAdapter, ZAFRONIX_TOP_LEAGUES, ZafronixLeagueConfig } from './zafronix.adapter';
import { ZafronixMapper } from './zafronix.mapper';
import { layMuaGiaiHienTai } from '../../match/match.service';

@Injectable()
export class ZafronixProvider implements SportsDataProvider {
  readonly sportName = 'football' as const;
  private readonly logger = new Logger(ZafronixProvider.name);

  constructor(
    @Inject(ZafronixAdapter)
    private readonly adapter: ZafronixAdapter,
    @Inject(ZafronixMapper)
    private readonly mapper: ZafronixMapper,
  ) {}

  private findLeagueConfig(leagueExternalId: string): ZafronixLeagueConfig | undefined {
    return ZAFRONIX_TOP_LEAGUES.find(
      (l) => l.externalId === leagueExternalId || l.endpointPrefix === leagueExternalId,
    );
  }

  async fetchLeagues(_country?: string): Promise<NormalizedLeague[]> {
    const currentSeason = layMuaGiaiHienTai('football');
    return ZAFRONIX_TOP_LEAGUES.map((l) => this.mapper.toLeague(l, currentSeason));
  }

  async fetchTeams(leagueExternalId: string, season: string): Promise<NormalizedTeam[]> {
    const config = this.findLeagueConfig(leagueExternalId);
    if (!config) {
      this.logger.warn(`Không tìm thấy cấu hình giải đấu cho externalId: ${leagueExternalId}`);
      return [];
    }

    try {
      const tournament = await this.adapter.getTournamentDetails(config.endpointPrefix, season);
      const rawTeams = tournament?.teams || [];
      return rawTeams.map((t: any) => this.mapper.toTeam(t.name, leagueExternalId));
    } catch (err: any) {
      this.logger.warn(`Lỗi fetchTeams từ Zafronix cho ${config.name}: ${err.message}`);
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
      this.logger.warn(`Không tìm thấy cấu hình giải đấu cho externalId: ${leagueExternalId}`);
      return [];
    }

    try {
      const rawMatches = await this.adapter.getMatches(config.endpointPrefix, season);
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
      this.logger.warn(`Lỗi fetchFixtures từ Zafronix cho ${config.name}: ${err.message}`);
      return [];
    }
  }

  async fetchStandings(leagueExternalId: string, season: string): Promise<NormalizedStanding[]> {
    const config = this.findLeagueConfig(leagueExternalId);
    if (!config) return [];

    try {
      const rawStandings = await this.adapter.getStandings(config.endpointPrefix, season);
      const list = Array.isArray(rawStandings)
        ? rawStandings
        : Array.isArray(rawStandings?.standings)
        ? rawStandings.standings
        : Array.isArray(rawStandings?.data)
        ? rawStandings.data
        : [];
      return list.map((s: any) => this.mapper.toStanding(s, leagueExternalId, season));
    } catch (err: any) {
      this.logger.warn(`Lỗi fetchStandings từ Zafronix cho ${config.name}: ${err.message}`);
      return [];
    }
  }
}
