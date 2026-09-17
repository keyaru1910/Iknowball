import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [TelegramController],
    providers: [TelegramService, PrismaService],
    exports: [TelegramService],
})
export class TelegramModule {}
