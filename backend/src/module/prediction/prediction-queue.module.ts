import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PREDICTION_QUEUE } from './prediction.constants';
import { PredictionProcessor } from './prediction.processor';
import { PredictionModule } from './prediction.module';
import { EloModule } from '../elo/elo.module';

@Module({
  imports: [
    PredictionModule,
    EloModule,
    BullModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config: ConfigService) => ({ connection: { host: config.get('REDIS_HOST', 'localhost'), port: config.get<number>('REDIS_PORT', 6379), password: config.get('REDIS_PASSWORD') || undefined } }) }),
    BullModule.registerQueue({ name: PREDICTION_QUEUE, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: { count: 100 }, removeOnFail: { count: 500 } } }),
  ],
  providers: [PredictionProcessor],
})
export class PredictionQueueModule {}
