import { Module } from '@nestjs/common';
import { ApiFootballAdapter } from './adapters/api-football.adapter';
import { ApiFootballMapper } from './adapters/api-football.mapper';
import { ApiFootballProvider } from './adapters/api-football.provider';

@Module({
    providers: [
        ApiFootballAdapter,
        ApiFootballMapper,
        {
            provide: 'SPORTS_DATA_PROVIDER',
            useClass: ApiFootballProvider,
        },
    ],
    exports: ['SPORTS_DATA_PROVIDER'],
})
export class SportsDataModule { }
