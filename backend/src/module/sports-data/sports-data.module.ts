// src/module/sports-data/sports-data.module.ts
import { Module } from '@nestjs/common';
import { ApiFootballAdapter } from './adapters/api-football.adapter';
import { ApiFootballMapper } from './adapters/api-football.mapper';
import { ApiFootballProvider } from './adapters/api-football.provider';
import { BalldontlieProvider } from './adapters/balldontlie.provider';
import { SportsDataController } from './sports-data.controller';
import { SportsDataService } from './sports-data.service';
import { SportsDataProvider } from './adapters/football-provider.interface';

export const SPORTS_DATA_PROVIDERS = 'SPORTS_DATA_PROVIDERS';

/**
 * SportsDataModule: Cung cấp các adapter kết nối dữ liệu thể thao (API-Football, Balldontlie)
 * và SportsDataService để truy vấn dữ liệu từ Database/Redis.
 */
@Module({
  controllers: [SportsDataController],
  providers: [
    SportsDataService,
    ApiFootballAdapter,
    ApiFootballMapper,
    ApiFootballProvider,
    BalldontlieProvider,
    {
      provide: 'SPORTS_DATA_PROVIDER',
      useFactory: (
        football: ApiFootballProvider,
        basketball: BalldontlieProvider,
      ): SportsDataProvider =>
        process.env.SPORTS_PROVIDER === 'balldontlie' ? basketball : football,
      inject: [ApiFootballProvider, BalldontlieProvider],
    },
    {
      provide: SPORTS_DATA_PROVIDERS,
      useFactory: (
        football: ApiFootballProvider,
        basketball: BalldontlieProvider,
      ): Record<string, SportsDataProvider> => ({
        football,
        basketball,
      }),
      inject: [ApiFootballProvider, BalldontlieProvider],
    },
  ],
  exports: [
    'SPORTS_DATA_PROVIDER',
    SPORTS_DATA_PROVIDERS,
    SportsDataService,
    ApiFootballProvider,
    BalldontlieProvider,
  ],
})
export class SportsDataModule {}
