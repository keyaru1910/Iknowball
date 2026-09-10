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
    SharedModule,
    HealthModule,
    AuthModule,
    UserModule,
    SportsDataModule,
    MatchModule,
    PredictionModule,
    PaymentModule,
    AdminModule,
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
