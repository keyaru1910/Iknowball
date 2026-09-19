// src/module/sports-data/adapters/composite-football.provider.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
  SportsDataProvider,
} from './football-provider.interface';
import { ZafronixProvider } from './zafronix.provider';
import { ApiFootballProvider } from './api-football.provider';
import { FootballDataProvider } from './football-data.provider';

/**
 * Bộ điều phối bóng đá đa nhà cung cấp (Multi-Provider Coordinator & Failover for Football)
 * Thứ tự ưu tiên: Zafronix -> API-Football -> Football-Data.org
 */
@Injectable()
export class CompositeFootballProvider implements SportsDataProvider {
  readonly sportName = 'football' as const;
  private readonly logger = new Logger(CompositeFootballProvider.name);
  private readonly providers: { name: string; instance: SportsDataProvider }[];

  constructor(
    @Inject(ZafronixProvider)
    private readonly zafronix: ZafronixProvider,
    @Inject(ApiFootballProvider)
    private readonly apiFootball: ApiFootballProvider,
    @Inject(FootballDataProvider)
    private readonly footballData: FootballDataProvider,
  ) {
    this.providers = [
      { name: 'Zafronix', instance: this.zafronix },
      { name: 'API-Football', instance: this.apiFootball },
      { name: 'Football-Data.org', instance: this.footballData },
    ];
  }

  /**
   * Thực hiện gọi hàm với cơ chế tự động chuyển đổi sang Provider kế tiếp khi gặp sự cố
   */
  private async executeWithFallback<T>(
    actionName: string,
    operation: (provider: SportsDataProvider, name: string) => Promise<T[]>,
  ): Promise<T[]> {
    const errors: string[] = [];

    for (const { name, instance } of this.providers) {
      try {
        const result = await operation(instance, name);
        if (Array.isArray(result) && result.length > 0) {
          this.logger.log(`[Coordinator-Football] ${actionName} thành công từ ${name} (${result.length} bản ghi)`);
          return result;
        }
        this.logger.warn(`[Coordinator-Football] ${name} trả về danh sách rỗng cho ${actionName}, chuyển provider dự phòng...`);
      } catch (err: any) {
        errors.push(`${name}: ${err.message}`);
        this.logger.warn(`[Coordinator-Football] ${name} gặp lỗi khi thực hiện ${actionName}: ${err.message}. Đang chuyển provider tiếp theo...`);
      }
    }

    this.logger.error(`[Coordinator-Football] Tất cả các providers bóng đá đều thất bại cho ${actionName}. Chi tiết: ${errors.join(' | ')}`);
    return [];
  }

  async fetchLeagues(country?: string): Promise<NormalizedLeague[]> {
    return this.executeWithFallback('fetchLeagues', (p) => p.fetchLeagues(country));
  }

  async fetchTeams(leagueExternalId: string, season: string): Promise<NormalizedTeam[]> {
    return this.executeWithFallback(`fetchTeams(${leagueExternalId}, ${season})`, (p) =>
      p.fetchTeams(leagueExternalId, season),
    );
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
    return this.executeWithFallback(`fetchFixtures(${leagueExternalId}, ${season})`, (p) =>
      p.fetchFixtures(leagueExternalId, season, options),
    );
  }

  async fetchStandings(leagueExternalId: string, season: string): Promise<NormalizedStanding[]> {
    return this.executeWithFallback(`fetchStandings(${leagueExternalId}, ${season})`, (p) =>
      p.fetchStandings(leagueExternalId, season),
    );
  }
}
