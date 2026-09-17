import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramModule } from '../telegram/telegram.module';
import { NotificationModule } from '../NotificationModule';

@Module({
    imports: [TelegramModule, NotificationModule],
    controllers: [AlertController],
    providers: [AlertService, PrismaService],
    exports: [AlertService],
})
export class AlertModule {}
