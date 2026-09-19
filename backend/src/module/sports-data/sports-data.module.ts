// src/module/sports-data/sports-data.module.ts
import { Module } from '@nestjs/common';
import { ApiFootballAdapter } from './adapters/api-football.adapter';
import { ApiFootballMapper } from './adapters/api-football.mapper';
import { ApiFootballProvider } from './adapters/api-football.provider';
import { BalldontlieProvider } from './adapters/balldontlie.provider';
import { ZafronixAdapter } from './adapters/zafronix.adapter';
import { ZafronixMapper } from './adapters/zafronix.mapper';
import { ZafronixProvider } from './adapters/zafronix.provider';
import { FootballDataAdapter } from './adapters/football-data.adapter';
import { FootballDataMapper } from './adapters/football-data.mapper';
import { FootballDataProvider } from './adapters/football-data.provider';
import { ApiBasketballAdapter } from './adapters/api-basketball.adapter';
import { ApiBasketballMapper } from './adapters/api-basketball.mapper';
import { ApiBasketballProvider } from './adapters/api-basketball.provider';
import { CompositeFootballProvider } from './adapters/composite-football.provider';
import { CompositeBasketballProvider } from './adapters/composite-basketball.provider';
import { SportsDataController } from './sports-data.controller';
import { SportsDataService } from './sports-data.service';
import { SportsDataProvider } from './adapters/football-provider.interface';

export const SPORTS_DATA_PROVIDERS = 'SPORTS_DATA_PROVIDERS';

/**
 * SportsDataModule: Cung cấp các adapter và bộ điều phối dữ liệu thể thao đa nhà cung cấp
 * (Zafronix, API-Football, Football-Data.org, Balldontlie, API-Basketball)
 * hỗ trợ Key Rotation và Failover tự động.
 */
@Module({
  controllers: [SportsDataController],
  providers: [
    SportsDataService,
    // Football Providers
    ZafronixAdapter,
    ZafronixMapper,
    ZafronixProvider,
    ApiFootballAdapter,
    ApiFootballMapper,
    ApiFootballProvider,
    FootballDataAdapter,
    FootballDataMapper,
    FootballDataProvider,
    CompositeFootballProvider,
    // Basketball Providers
    BalldontlieProvider,
    ApiBasketballAdapter,
    ApiBasketballMapper,
    ApiBasketballProvider,
    CompositeBasketballProvider,
    {
      provide: 'SPORTS_DATA_PROVIDER',
      useFactory: (
        compositeFootball: CompositeFootballProvider,
        compositeBasketball: CompositeBasketballProvider,
        zafronix: ZafronixProvider,
        apiFootball: ApiFootballProvider,
        footballData: FootballDataProvider,
        balldontlie: BalldontlieProvider,
        apiBasketball: ApiBasketballProvider,
      ): SportsDataProvider => {
        const forced = process.env.SPORTS_PROVIDER?.toLowerCase();
        if (forced === 'zafronix') return zafronix;
        if (forced === 'api-football') return apiFootball;
        if (forced === 'football-data') return footballData;
        if (forced === 'balldontlie') return balldontlie;
        if (forced === 'api-basketball') return apiBasketball;
        if (forced === 'basketball') return compositeBasketball;
        return compositeFootball;
      },
      inject: [
        CompositeFootballProvider,
        CompositeBasketballProvider,
        ZafronixProvider,
        ApiFootballProvider,
        FootballDataProvider,
        BalldontlieProvider,
        ApiBasketballProvider,
      ],
    },
    {
      provide: SPORTS_DATA_PROVIDERS,
      useFactory: (
        compositeFootball: CompositeFootballProvider,
        compositeBasketball: CompositeBasketballProvider,
      ): Record<string, SportsDataProvider> => {
        return {
          football: compositeFootball,
          basketball: compositeBasketball,
        };
      },
      inject: [CompositeFootballProvider, CompositeBasketballProvider],
    },
  ],
  exports: [
    'SPORTS_DATA_PROVIDER',
    SPORTS_DATA_PROVIDERS,
    SportsDataService,
    CompositeFootballProvider,
    CompositeBasketballProvider,
    ZafronixProvider,
    ApiFootballProvider,
    FootballDataProvider,
    BalldontlieProvider,
    ApiBasketballProvider,
  ],
})
export class SportsDataModule {}
