import { Module } from '@nestjs/common';
import { NotificationService } from './notification/notification.service';
import { NotificationController } from './notification/notification.controller';
import { PrismaService } from './prisma/prisma.service';

@Module({
    controllers: [NotificationController],
    providers: [NotificationService, PrismaService],
    exports: [NotificationService],
})
export class NotificationModule {}
