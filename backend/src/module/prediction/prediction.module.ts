import { Module } from '@nestjs/common';
import { EloModule } from '../elo/elo.module';
import { AuthModule } from '../auth/AuthModule';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';

@Module({
  imports: [
    AuthModule,
    EloModule,
  ],
  controllers: [PredictionController],
  providers: [PredictionService],
  exports: [PredictionService],
})
export class PredictionModule {}
