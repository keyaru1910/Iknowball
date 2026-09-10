import {
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/subscriptions')
export class SubscriptionController {
    constructor(private readonly paymentService: PaymentService) {}

    /**
     * Lấy danh sách các gói dịch vụ và bảng giá (Public)
     */
    @Get('plans')
    @Public()
    getPlans() {
        const plans = this.paymentService.getSubscriptionPlans();
        return { data: plans, meta: null, error: null };
    }

    /**
     * Khởi tạo đăng ký gói mới (yêu cầu đăng nhập)
     */
    @Post()
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
     * Lấy gói đăng ký hiện tại của người dùng
     */
    @Get('current')
    @UseGuards(JwtAuthGuard)
    async getCurrentSubscription(@CurrentUser('id') userId: string) {
        const result = await this.paymentService.getUserSubscription(userId);
        return { data: result, meta: null, error: null };
    }

    /**
     * Tạo đường dẫn đến cổng quản lý thuê bao Stripe Customer Portal
     */
    @Post('portal')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async openCustomerPortal(@CurrentUser('id') userId: string) {
        const result = await this.paymentService.createCustomerPortalSession(userId);
        return { data: result, meta: null, error: null };
    }
}
