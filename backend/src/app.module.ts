import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/AuthModule';
import { UserModule } from './module/UserModule';
import { SportsSyncModule } from './module/sports-sync/sports-sync.module';
import { MatchModule } from './module/MatchModule';
import { SportsDataModule } from './module/SportsDataModule';
import { SharedModule } from './module/SharedModule';
import { PredictionModule } from './module/PredictionModule';
import { PredictionQueueModule } from './module/prediction/prediction-queue.module';
import { HealthModule } from './module/health/health.module';
import { PaymentModule } from './module/payment/payment.module';
import { AdminModule } from './module/admin/admin.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { NewsModule } from './module/news/news.module';
import { CommentsModule } from './module/comments/comments.module';
import { TelegramModule } from './module/telegram/telegram.module';
import { AlertModule } from './module/alert/alert.module';

import { BullModule } from '@nestjs/bullmq';
import { getBullMqRedisConnection } from './config/redis.config';

const optionalModules = process.env.ENABLE_SYNC_QUEUE === 'true' ? [PredictionQueueModule, SportsSyncModule] : [];

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    BullModule.forRoot({
      connection: getBullMqRedisConnection(),
    }),
    SharedModule,
    HealthModule,
    AuthModule,
    UserModule,
    SportsDataModule,
    MatchModule,
    PredictionModule,
    PaymentModule,
    AdminModule,
    NewsModule,
    CommentsModule,
    TelegramModule,
    AlertModule,
    ...optionalModules,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
