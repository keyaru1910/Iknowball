// src/module/sports-data/adapters/composite-basketball.provider.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
  SportsDataProvider,
} from './football-provider.interface';
import { BalldontlieProvider } from './balldontlie.provider';
import { ApiBasketballProvider } from './api-basketball.provider';

/**
 * Bộ điều phối bóng rổ đa nhà cung cấp (Multi-Provider Coordinator & Failover for Basketball)
 * Thứ tự ưu tiên: Balldontlie -> API-Basketball (API-Sports)
 */
@Injectable()
export class CompositeBasketballProvider implements SportsDataProvider {
  readonly sportName = 'basketball' as const;
  private readonly logger = new Logger(CompositeBasketballProvider.name);
  private readonly providers: { name: string; instance: SportsDataProvider }[];

  constructor(
    @Inject(BalldontlieProvider)
    private readonly balldontlie: BalldontlieProvider,
    @Inject(ApiBasketballProvider)
    private readonly apiBasketball: ApiBasketballProvider,
  ) {
    this.providers = [
      { name: 'Balldontlie', instance: this.balldontlie },
      { name: 'API-Basketball', instance: this.apiBasketball },
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
          this.logger.log(`[Coordinator-Basketball] ${actionName} thành công từ ${name} (${result.length} bản ghi)`);
          return result;
        }
        this.logger.warn(`[Coordinator-Basketball] ${name} trả về danh sách rỗng cho ${actionName}, chuyển provider dự phòng...`);
      } catch (err: any) {
        errors.push(`${name}: ${err.message}`);
        this.logger.warn(`[Coordinator-Basketball] ${name} gặp lỗi khi thực hiện ${actionName}: ${err.message}. Đang chuyển provider tiếp theo...`);
      }
    }

    this.logger.error(`[Coordinator-Basketball] Tất cả các providers bóng rổ đều thất bại cho ${actionName}. Chi tiết: ${errors.join(' | ')}`);
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
