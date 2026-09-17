import { Module } from '@nestjs/common';
import { EloService } from './elo.service';
import { EloController } from './elo.controller';

@Module({
  controllers: [EloController],
  providers: [EloService],
  exports: [EloService],
})
export class EloModule {}
