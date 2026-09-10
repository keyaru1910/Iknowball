// src/module/sports-sync/sports-sync.module.ts
import { Module } from '@nestjs/common';
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

@Module({
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
        SportsDataModule,
        EloModule,
    ],
    controllers: [SportsSyncController],
    providers: [SportsSyncProcessor, SportsSyncSchedulerProcessor, SportsSyncService],
    exports: [SportsSyncService],
})
export class SportsSyncModule { }
