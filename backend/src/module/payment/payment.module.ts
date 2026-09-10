import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [PaymentController, SubscriptionController],
    providers: [PaymentService, PrismaService],
    exports: [PaymentService],
})
export class PaymentModule {}
