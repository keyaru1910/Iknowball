import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
    imports: [TelegramModule],
    controllers: [PaymentController, SubscriptionController],
    providers: [PaymentService, PrismaService],
    exports: [PaymentService],
})
export class PaymentModule {}
