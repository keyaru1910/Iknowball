// src/module/sports-data/sports-data.module.ts
import { Module } from '@nestjs/common';
import { ApiFootballAdapter } from './adapters/api-football.adapter';
import { ApiFootballMapper } from './adapters/api-football.mapper';
import { ApiFootballProvider } from './adapters/api-football.provider';
import { BalldontlieProvider } from './adapters/balldontlie.provider';
import { ZafronixAdapter } from './adapters/zafronix.adapter';
import { ZafronixMapper } from './adapters/zafronix.mapper';
import { ZafronixProvider } from './adapters/zafronix.provider';
import { SportsDataController } from './sports-data.controller';
import { SportsDataService } from './sports-data.service';
import { SportsDataProvider } from './adapters/football-provider.interface';

export const SPORTS_DATA_PROVIDERS = 'SPORTS_DATA_PROVIDERS';

/**
 * SportsDataModule: Cung cấp các adapter kết nối dữ liệu thể thao (Zafronix, API-Football, Balldontlie)
 * và SportsDataService để truy vấn dữ liệu từ Database/Redis.
 */
@Module({
  controllers: [SportsDataController],
  providers: [
    SportsDataService,
    ApiFootballAdapter,
    ApiFootballMapper,
    ApiFootballProvider,
    ZafronixAdapter,
    ZafronixMapper,
    ZafronixProvider,
    BalldontlieProvider,
    {
      provide: 'SPORTS_DATA_PROVIDER',
      useFactory: (
        zafronix: ZafronixProvider,
        football: ApiFootballProvider,
        basketball: BalldontlieProvider,
      ): SportsDataProvider => {
        if (process.env.SPORTS_PROVIDER === 'balldontlie') return basketball;
        if (process.env.ZAFRONIX_API_KEY || process.env.SPORTS_PROVIDER === 'zafronix') return zafronix;
        return football;
      },
      inject: [ZafronixProvider, ApiFootballProvider, BalldontlieProvider],
    },
    {
      provide: SPORTS_DATA_PROVIDERS,
      useFactory: (
        zafronix: ZafronixProvider,
        football: ApiFootballProvider,
        basketball: BalldontlieProvider,
      ): Record<string, SportsDataProvider> => {
        const footballProvider = process.env.ZAFRONIX_API_KEY || process.env.SPORTS_PROVIDER === 'zafronix' ? zafronix : football;
        return {
          football: footballProvider,
          basketball,
        };
      },
      inject: [ZafronixProvider, ApiFootballProvider, BalldontlieProvider],
    },
  ],
  exports: [
    'SPORTS_DATA_PROVIDER',
    SPORTS_DATA_PROVIDERS,
    SportsDataService,
    ZafronixProvider,
    ApiFootballProvider,
    BalldontlieProvider,
  ],
})
export class SportsDataModule {}
