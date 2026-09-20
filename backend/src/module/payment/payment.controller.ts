import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreateVietQrPaymentDto } from './dto/create-vietqr-payment.dto';
import { ConfirmSessionDto } from './dto/confirm-session.dto';
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
     * Khởi tạo giao dịch thanh toán VietQR Ngân hàng nội địa (Napas 247)
     */
    @Post('vietqr/create')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @Throttle({ default: { limit: 20, ttl: 60000 } })
    async createVietQrPayment(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateVietQrPaymentDto,
    ) {
        const result = await this.paymentService.createVietQrPayment(userId, dto);
        return { data: result, meta: null, error: null };
    }

    /**
     * Tra cứu trạng thái thanh toán đơn hàng VietQR (Frontend Polling mỗi 3s)
     */
    @Get('vietqr/status/:orderCode')
    @Public()
    async checkVietQrPaymentStatus(@Param('orderCode') orderCode: string) {
        const result = await this.paymentService.checkVietQrPaymentStatus(orderCode);
        return { data: result, meta: null, error: null };
    }

    /**
     * Xác nhận thanh toán VietQR thủ công (môi trường Test / Admin)
     */
    @Post('vietqr/manual-confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async manualConfirmVietQrPayment(
        @Body() body: { orderCode: string; plan?: any },
    ) {
        const result = await this.paymentService.manualConfirmVietQrPayment(body.orderCode, body.plan);
        return { data: result, meta: null, error: null };
    }

    /**
     * Nhận Webhook biến động số dư từ cổng thanh toán Ngân hàng nội địa (SePay, PayOS, Casso...)
     */
    @Post('webhook/domestic')
    @Public()
    @HttpCode(HttpStatus.OK)
    async handleDomesticWebhook(
        @Body() payload: any,
        @Headers('authorization') authHeader?: string,
    ) {
        const result = await this.paymentService.handleDomesticWebhook(payload, authHeader);
        return result;
    }

    /**
     * Alias Webhook cho SePay
     */
    @Post('webhook/sepay')
    @Public()
    @HttpCode(HttpStatus.OK)
    async handleSepayWebhook(
        @Body() payload: any,
        @Headers('authorization') authHeader?: string,
    ) {
        return this.paymentService.handleDomesticWebhook(payload, authHeader);
    }

    /**
     * Alias Webhook cho PayOS
     */
    @Post('webhook/payos')
    @Public()
    @HttpCode(HttpStatus.OK)
    async handlePayosWebhook(
        @Body() payload: any,
        @Headers('x-api-key') apiKey?: string,
        @Headers('authorization') authHeader?: string,
    ) {
        return this.paymentService.handleDomesticWebhook(payload, authHeader || apiKey);
    }

    /**
     * Khởi tạo gói đăng ký / Checkout Session
     */
    @Post('subscriptions')
    @HttpCode(HttpStatus.OK)
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
    @HttpCode(HttpStatus.OK)
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
     * Xác nhận phiên thanh toán và kích hoạt gói Subscription
     */
    @Post('confirm-session')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async confirmSession(
        @CurrentUser('id') userId: string,
        @Body() dto: ConfirmSessionDto,
    ): Promise<any> {
        const result = await this.paymentService.confirmCheckoutSession(userId, dto);
        return { data: result, meta: null, error: null };
    }

    /**
     * Tạo Customer Portal Session
     */
    @Post('customer-portal')
    @HttpCode(HttpStatus.OK)
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
    @HttpCode(HttpStatus.OK)
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
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Req() req: Request,
        @Headers('stripe-signature') signature: string,
    ) {
        const rawBody = (req as any).rawBody || req.body;
        const result = await this.paymentService.handleWebhook(rawBody, signature);
        return result;
    }
}
