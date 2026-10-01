// src/module/sports-sync/sports-sync.module.ts
import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
    SPORTS_SYNC_QUEUE,
    SPORTS_SYNC_FLOW_PRODUCER,
    SPORTS_SYNC_SCHEDULER_QUEUE,
} from './constants/job-names';
import { SportsSyncProcessor } from './sports-sync.processor';
import { SportsSyncSchedulerProcessor } from './sports-sync-scheduler.processor';
import { SportsSyncService } from './sports-sync.service';
import { SportsSyncController } from './sports-sync.controller';
import { SportsDataModule } from '../sports-data/sports-data.module';
import { EloModule } from '../elo/elo.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [
        PrismaModule,
        SharedModule,
        SportsDataModule,
        EloModule,
    ],
    controllers: [SportsSyncController],
    providers: [SportsSyncService],
    exports: [SportsSyncService],
})
export class SportsSyncModule {
    static register(): DynamicModule {
        const isQueueEnabled = process.env.ENABLE_SYNC_QUEUE === 'true';

        if (!isQueueEnabled) {
            return {
                module: SportsSyncModule,
                imports: [
                    PrismaModule,
                    SharedModule,
                    SportsDataModule,
                    EloModule,
                ],
                controllers: [SportsSyncController],
                providers: [SportsSyncService],
                exports: [SportsSyncService],
            };
        }

        return {
            module: SportsSyncModule,
            imports: [
                BullModule.registerQueue({
                    name: SPORTS_SYNC_QUEUE,
                    defaultJobOptions: {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 5000 },
                        removeOnComplete: { count: 100 },
                        removeOnFail: { count: 500 },
                    },
                }),
                BullModule.registerQueue({ name: SPORTS_SYNC_SCHEDULER_QUEUE }),
                BullModule.registerFlowProducer({ name: SPORTS_SYNC_FLOW_PRODUCER }),
                PrismaModule,
                SharedModule,
                SportsDataModule,
                EloModule,
            ],
            controllers: [SportsSyncController],
            providers: [SportsSyncProcessor, SportsSyncSchedulerProcessor, SportsSyncService],
            exports: [SportsSyncService],
        };
    }
}
