import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    /**
     * Danh sách bảng giá và gói dịch vụ (Public)
     */
    @Get('plans')
    @Public()
    getPlans() {
        const plans = this.paymentService.getSubscriptionPlans();
        return { data: plans, meta: null, error: null };
    }

    /**
     * Khởi tạo gói đăng ký / Checkout Session
     */
    @Post('subscriptions')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async createSubscription(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateCheckoutSessionDto,
    ) {
        const result = await this.paymentService.createCheckoutSession(userId, dto);
        return { data: result, meta: null, error: null };
    }

    /**
     * Khởi tạo Stripe Checkout Session (backward compatibility)
     */
    @Post('create-checkout-session')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async createCheckoutSession(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateCheckoutSessionDto,
    ) {
        const result = await this.paymentService.createCheckoutSession(userId, dto);
        return { data: result, meta: null, error: null };
    }

    /**
     * Tạo Customer Portal Session
     */
    @Post('customer-portal')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async createCustomerPortalSession(@CurrentUser('id') userId: string) {
        const result = await this.paymentService.createCustomerPortalSession(userId);
        return { data: result, meta: null, error: null };
    }

    /**
     * Lấy thông tin gói đăng ký của tài khoản hiện tại
     */
    @Get('subscription')
    @UseGuards(JwtAuthGuard)
    async getSubscription(@CurrentUser('id') userId: string) {
        const result = await this.paymentService.getUserSubscription(userId);
        return { data: result, meta: null, error: null };
    }

    /**
     * Lấy chi tiết lịch sử thanh toán theo ID (chủ sở hữu hoặc admin)
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getPaymentDetail(
        @CurrentUser() user: { id: string; role?: string },
        @Param('id') paymentId: string,
    ) {
        const result = await this.paymentService.getPaymentById(paymentId, user.id, user.role);
        return { data: result, meta: null, error: null };
    }

    /**
     * Nhận Stripe Webhook Event (/api/v1/payments/webhook/stripe)
     */
    @Post('webhook/stripe')
    @Public()
    @HttpCode(200)
    async handleStripeWebhook(
        @Req() req: Request,
        @Headers('stripe-signature') signature: string,
    ) {
        const rawBody = (req as any).rawBody || req.body;
        const result = await this.paymentService.handleWebhook(rawBody, signature);
        return result;
    }

    /**
     * Nhận Stripe Webhook Event (/api/v1/payments/webhook)
     */
    @Post('webhook')
    @Public()
    @HttpCode(200)
    async handleWebhook(
        @Req() req: Request,
        @Headers('stripe-signature') signature: string,
    ) {
        const rawBody = (req as any).rawBody || req.body;
        const result = await this.paymentService.handleWebhook(rawBody, signature);
        return result;
    }
}
