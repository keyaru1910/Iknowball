// src/module/match/match.module.ts
import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';

/**
 * MatchModule: expose REST endpoints /api/v1/matches
 * PrismaService và CacheService được inject từ global SharedModule
 */
@Module({
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
