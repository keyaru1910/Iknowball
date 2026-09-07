// src/modules/sports-api/rate-limiter.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bottleneck from 'bottleneck';

@Injectable()
export class RateLimiterService implements OnModuleDestroy {
    private readonly limiter: Bottleneck;

    constructor(config: ConfigService) {
        this.limiter = new Bottleneck({
            // API-Football free tier: 100 req/ngày (§8.4 design doc)
            reservoir: 100,
            reservoirRefreshAmount: 100,
            reservoirRefreshInterval: 24 * 60 * 60 * 1000,
            maxConcurrent: 3,
            minTime: 250,
            datastore: 'ioredis',
            clearDatastore: false,
            clientOptions: {
                host: config.get('REDIS_HOST'),
                port: config.get('REDIS_PORT'),
            },
            id: 'sports-api-limiter', // key chung -> share quota giữa mọi worker instance
        });
    }

    schedule<T>(fn: () => Promise<T>): Promise<T> {
        return this.limiter.schedule(fn);
    }

    async onModuleDestroy() {
        await this.limiter.disconnect();
    }
}