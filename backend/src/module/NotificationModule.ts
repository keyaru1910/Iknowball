import { Module } from '@nestjs/common';
import { NotificationService } from './notification/notification.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
    providers: [NotificationService, PrismaService],
    exports: [NotificationService],
})
export class NotificationModule {}
