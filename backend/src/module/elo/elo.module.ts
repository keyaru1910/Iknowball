import { Module } from '@nestjs/common';
import { EloService } from './elo.service';
import { EloController } from './elo.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EloController],
  providers: [EloService],
  exports: [EloService],
})
export class EloModule {}
