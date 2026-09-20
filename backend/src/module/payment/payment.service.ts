import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreateVietQrPaymentDto } from './dto/create-vietqr-payment.dto';
import { ConfirmSessionDto } from './dto/confirm-session.dto';
import {
    PaymentStatus,
    SubscriptionPlan,
    SubscriptionStatus,
    WebhookEventStatus,
} from '@prisma/client';

export const PLAN_PRICES: Record<SubscriptionPlan, { amount: number; currency: string; name: string; interval: 'month' | 'year' }> = {
    [SubscriptionPlan.PRO_MONTHLY]: {
        amount: 249000, // 249.000 VND
        currency: 'vnd',
        name: 'iKnowBall Pro (Hàng Tháng)',
        interval: 'month',
    },
    [SubscriptionPlan.PRO_YEARLY]: {
        amount: 1790000, // 1.790.000 VND (Tiết kiệm 25%)
        currency: 'vnd',
        name: 'iKnowBall Pro (Hàng Năm)',
        interval: 'year',
    },
    [SubscriptionPlan.VIP_MONTHLY]: {
        amount: 499000, // 499.000 VND
        currency: 'vnd',
        name: 'iKnowBall VIP Insights (Hàng Tháng)',
        interval: 'month',
    },
    [SubscriptionPlan.VIP_YEARLY]: {
        amount: 3590000, // 3.590.000 VND (Tiết kiệm 40%)
        currency: 'vnd',
        name: 'iKnowBall VIP Insights (Hàng Năm)',
        interval: 'year',
    },
    [SubscriptionPlan.FREE]: {
        amount: 0,
        currency: 'vnd',
        name: 'iKnowBall Free',
        interval: 'month',
    },
};

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly stripe: Stripe | null = null;
    private readonly webhookSecret: string | null = null;

    // Cấu hình tài khoản ngân hàng thụ hưởng VietQR
    private readonly bankName: string;
    private readonly bankBin: string;
    private readonly bankAccountNo: string;
    private readonly bankAccountName: string;
    private readonly domesticWebhookSecret: string | null;

    constructor(
        private prisma: PrismaService,
        private telegramService: TelegramService,
    ) {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || null;

        if (stripeKey) {
            this.stripe = new Stripe(stripeKey, {
                apiVersion: '2025-02-24.acacia' as any,
            });
            this.logger.log('Stripe SDK initialized in test/live mode');
        } else {
            this.logger.warn('STRIPE_SECRET_KEY is not set. VietQR Domestic Payment is primary method.');
        }

        // Thông tin ngân hàng nội địa
        this.bankName = process.env.BANK_NAME || 'MB Bank';
        this.bankBin = process.env.BANK_BIN || '970422'; // 970422 là BIN MBBank
        this.bankAccountNo = process.env.BANK_ACCOUNT_NO || '0333888999';
        this.bankAccountName = process.env.BANK_ACCOUNT_NAME || 'NGUYEN VAN A';
        this.domesticWebhookSecret = process.env.DOMESTIC_PAYMENT_WEBHOOK_SECRET || null;
    }

    /**
     * Khởi tạo giao dịch thanh toán VietQR ngân hàng nội địa
     */
    async createVietQrPayment(userId: string, dto: CreateVietQrPaymentDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy tài khoản người dùng');
        }

        if (dto.plan === SubscriptionPlan.FREE) {
            throw new BadRequestException('Không cần thanh toán cho gói miễn phí');
        }

        const planConfig = PLAN_PRICES[dto.plan];
        if (!planConfig) {
            throw new BadRequestException('Gói đăng ký không tồn tại trong hệ thống');
        }

        // Sinh mã đơn hàng duy nhất: IKB + số ngẫu nhiên 6 chữ số (dễ nhập trên app ngân hàng)
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        const orderCode = `IKB${randomDigits}`;

        // Link ảnh VietQR chuẩn Napas 247
        // Định dạng template: compact2 (gọn gàng, có logo ngân hàng và thông tin chuyển khoản)
        const qrCodeUrl = `https://img.vietqr.io/image/${this.bankBin}-${this.bankAccountNo}-compact2.png?amount=${planConfig.amount}&addInfo=${orderCode}&accountName=${encodeURIComponent(this.bankAccountName)}`;

        // Tạo bản ghi Payment PENDING trong DB
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                orderCode,
                amount: planConfig.amount,
                currency: 'vnd',
                status: PaymentStatus.PENDING,
                paymentMethod: 'vietqr',
                bankCode: this.bankName,
                bankAccount: this.bankAccountNo,
                qrCodeUrl,
            },
        });

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Đơn hết hạn sau 15 phút

        return {
            paymentId: payment.id,
            orderCode,
            plan: dto.plan,
            planName: planConfig.name,
            amount: planConfig.amount,
            formattedAmount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(planConfig.amount),
            currency: 'VND',
            bankName: this.bankName,
            bankBin: this.bankBin,
            bankAccountNo: this.bankAccountNo,
            bankAccountName: this.bankAccountName,
            transferContent: orderCode,
            qrCodeUrl,
            expiresAt: expiresAt.toISOString(),
            checkoutUrl: `/payment/vietqr?orderCode=${orderCode}&plan=${dto.plan}`,
        };
    }

    /**
     * Kiểm tra trạng thái thanh toán VietQR (cho Frontend Polling mỗi 3 giây)
     */
    async checkVietQrPaymentStatus(orderCode: string, userId?: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { orderCode },
            include: {
                subscription: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Không tìm thấy đơn hàng với mã: ' + orderCode);
        }

        const isPaid = payment.status === PaymentStatus.SUCCEEDED;

        return {
            orderCode: payment.orderCode,
            status: payment.status,
            isPaid,
            amount: Number(payment.amount),
            currency: payment.currency,
            plan: payment.subscription?.plan || null,
            paidAt: payment.status === PaymentStatus.SUCCEEDED ? payment.updatedAt : null,
        };
    }

    /**
     * Xác nhận thanh toán VietQR thủ công hoặc giả lập (Dành cho Admin hoặc Môi trường Test)
     */
    async manualConfirmVietQrPayment(orderCode: string, targetPlan?: SubscriptionPlan) {
        const payment = await this.prisma.payment.findUnique({
            where: { orderCode },
            include: { user: true },
        });

        if (!payment) {
            throw new NotFoundException(`Không tìm thấy đơn hàng có mã ${orderCode}`);
        }

        if (payment.status === PaymentStatus.SUCCEEDED) {
            return { success: true, message: 'Đơn hàng này đã được thanh toán trước đó.', payment };
        }

        // Xác định gói đăng ký
        const plan = targetPlan || SubscriptionPlan.PRO_MONTHLY;
        const planConfig = PLAN_PRICES[plan];

        const now = new Date();
        const periodEnd = new Date(now);
        if (plan.includes('YEARLY')) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Tạo hoặc cập nhật Subscription
            const existingSub = await tx.subscription.findFirst({
                where: { userId: payment.userId },
                orderBy: { createdAt: 'desc' },
            });

            let subscription;
            if (existingSub) {
                subscription = await tx.subscription.update({
                    where: { id: existingSub.id },
                    data: {
                        plan,
                        status: SubscriptionStatus.ACTIVE,
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                });
            } else {
                subscription = await tx.subscription.create({
                    data: {
                        userId: payment.userId,
                        plan,
                        status: SubscriptionStatus.ACTIVE,
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                    },
                });
            }

            // 2. Cập nhật bản ghi Payment sang SUCCEEDED
            const updatedPayment = await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.SUCCEEDED,
                    subscriptionId: subscription.id,
                },
            });

            // 3. Nâng role người dùng lên 'premium' nếu chưa có
            const premiumRole = await tx.role.findUnique({ where: { name: 'premium' } });
            if (premiumRole) {
                await tx.user.update({
                    where: { id: payment.userId },
                    data: { roleId: premiumRole.id },
                });
            }

            // 4. Ghi nhận Audit Log
            await tx.auditLog.create({
                data: {
                    targetUserId: payment.userId,
                    action: 'DOMESTIC_PAYMENT_CONFIRMED',
                    details: {
                        orderCode,
                        amount: Number(payment.amount),
                        plan,
                        subscriptionId: subscription.id,
                    },
                },
            });

            return { subscription, payment: updatedPayment };
        });

        // 5. Gửi thông báo Telegram cho người dùng nếu đã liên kết Bot
        await this.telegramService.sendSubscriptionSuccessNotification(
            payment.userId,
            planConfig.name,
            periodEnd,
            Number(payment.amount),
        );

        return {
            success: true,
            message: `Xác nhận thanh toán thành công cho đơn ${orderCode}!`,
            data: result,
        };
    }

    /**
     * Xử lý Webhook thanh toán từ ngân hàng nội địa (SePay, PayOS, Casso, Open API Ngân Hàng)
     */
    async handleDomesticWebhook(payload: any, authHeader?: string) {
        this.logger.log(`Nhận Domestic Payment Webhook: ${JSON.stringify(payload)}`);

        // Kiểm tra Secret Token nếu có cấu hình
        if (this.domesticWebhookSecret && authHeader) {
            const token = authHeader.replace(/^Bearer\s+/i, '').replace(/^Apikey\s+/i, '').trim();
            if (token !== this.domesticWebhookSecret) {
                this.logger.warn('Domestic Webhook secret mismatch');
                throw new UnauthorizedException('Webhook secret không hợp lệ');
            }
        }

        // Bóc tách nội dung giao dịch và số tiền
        // Hỗ trợ SePay: payload.content, payload.description, payload.amountIn, payload.code
        // Hỗ trợ PayOS: payload.data.description, payload.data.amount, payload.data.orderCode
        // Hỗ trợ Generic: payload.content, payload.amount, payload.orderCode
        const content = String(
            payload.content ||
            payload.description ||
            payload.body ||
            payload.data?.description ||
            payload.transactionContent ||
            payload.orderCode ||
            payload.data?.orderCode ||
            ''
        ).toUpperCase();

        const amountReceived = Number(
            payload.amountIn ||
            payload.amount ||
            payload.transferAmount ||
            payload.data?.amount ||
            0
        );

        // Tìm mã đơn hàng có định dạng IKB + 6 chữ số
        const orderMatch = content.match(/IKB[0-9]{5,8}/i);
        const orderCode = orderMatch ? orderMatch[0].toUpperCase() : null;

        if (!orderCode) {
            this.logger.warn(`Không tìm thấy mã đơn hàng IKB hợp lệ trong nội dung chuyển khoản: "${content}"`);
            return {
                success: false,
                message: 'Không tìm thấy mã đơn hàng hợp lệ trong nội dung chuyển khoản',
            };
        }

        // Tìm bản ghi Payment tương ứng
        const payment = await this.prisma.payment.findUnique({
            where: { orderCode },
            include: { user: true },
        });

        if (!payment) {
            this.logger.warn(`Không tìm thấy đơn hàng trong hệ thống cho mã ${orderCode}`);
            return { success: false, message: `Không tìm thấy đơn hàng ${orderCode}` };
        }

        if (payment.status === PaymentStatus.SUCCEEDED) {
            this.logger.log(`Đơn hàng ${orderCode} đã được xử lý thành công trước đó.`);
            return { success: true, message: 'Đơn hàng đã được xác nhận trước đó' };
        }

        // Kiểm tra số tiền chuyển khoản (cho phép chênh lệch nhỏ nếu có phí)
        const expectedAmount = Number(payment.amount);
        if (amountReceived > 0 && amountReceived < expectedAmount) {
            this.logger.warn(`Số tiền nhận được (${amountReceived}) nhỏ hơn giá trị đơn hàng (${expectedAmount})`);
            return { success: false, message: 'Số tiền thanh toán không đủ so với giá trị gói' };
        }

        // Tìm gói tương ứng với số tiền
        let matchedPlan: SubscriptionPlan = SubscriptionPlan.PRO_MONTHLY;
        for (const [pKey, pVal] of Object.entries(PLAN_PRICES)) {
            if (Math.abs(pVal.amount - expectedAmount) < 1000) {
                matchedPlan = pKey as SubscriptionPlan;
                break;
            }
        }

        const planConfig = PLAN_PRICES[matchedPlan];
        const now = new Date();
        const periodEnd = new Date(now);
        if (matchedPlan.includes('YEARLY')) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Kích hoạt giao dịch trong Database Transaction
        await this.prisma.$transaction(async (tx) => {
            // 1. Cập nhật Subscription
            const existingSub = await tx.subscription.findFirst({
                where: { userId: payment.userId },
                orderBy: { createdAt: 'desc' },
            });

            let subscription;
            if (existingSub) {
                subscription = await tx.subscription.update({
                    where: { id: existingSub.id },
                    data: {
                        plan: matchedPlan,
                        status: SubscriptionStatus.ACTIVE,
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                });
            } else {
                subscription = await tx.subscription.create({
                    data: {
                        userId: payment.userId,
                        plan: matchedPlan,
                        status: SubscriptionStatus.ACTIVE,
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                    },
                });
            }

            // 2. Cập nhật trạng thái Payment
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.SUCCEEDED,
                    subscriptionId: subscription.id,
                },
            });

            // 3. Cập nhật quyền người dùng lên 'premium'
            const premiumRole = await tx.role.findUnique({ where: { name: 'premium' } });
            if (premiumRole) {
                await tx.user.update({
                    where: { id: payment.userId },
                    data: { roleId: premiumRole.id },
                });
            }

            // 4. Ghi Audit Log
            await tx.auditLog.create({
                data: {
                    targetUserId: payment.userId,
                    action: 'DOMESTIC_WEBHOOK_CONFIRMED',
                    details: {
                        orderCode,
                        amount: amountReceived || expectedAmount,
                        plan: matchedPlan,
                        subscriptionId: subscription.id,
                        rawWebhook: payload,
                    },
                },
            });
        });

        // 5. Gửi thông báo Telegram chúc mừng
        await this.telegramService.sendSubscriptionSuccessNotification(
            payment.userId,
            planConfig.name,
            periodEnd,
            expectedAmount,
        );

        this.logger.log(`Kích hoạt thành công gói ${matchedPlan} cho user ${payment.userId} qua đơn ${orderCode}`);

        return {
            success: true,
            message: `Kích hoạt thành công đơn ${orderCode}`,
            orderCode,
            plan: matchedPlan,
        };
    }

    /**
     * Lấy hoặc tạo Stripe Customer ID cho người dùng (phương thức phụ)
     */
    private async getOrCreateStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
        if (!this.stripe) {
            return `mock_cust_${userId}`;
        }

        const existingSub = await this.prisma.subscription.findFirst({
            where: { userId },
            select: { stripeCustomerId: true },
        });

        if (existingSub?.stripeCustomerId) {
            return existingSub.stripeCustomerId;
        }

        const customer = await this.stripe.customers.create({
            email,
            name: name || undefined,
            metadata: { userId },
        });

        return customer.id;
    }

    /**
     * Khởi tạo Stripe Checkout Session (hỗ trợ backward compatibility)
     */
    async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        if (dto.plan === SubscriptionPlan.FREE) {
            throw new BadRequestException('Không cần thanh toán cho gói miễn phí');
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const successUrl = dto.successUrl || `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = dto.cancelUrl || `${frontendUrl}/pricing?canceled=true`;

        // Nếu chưa cấu hình Stripe Key: Chuyển hướng thông minh sang VietQR hoặc mock
        if (!this.stripe) {
            const vietQrRes = await this.createVietQrPayment(userId, { plan: dto.plan });
            return {
                url: `${frontendUrl}${vietQrRes.checkoutUrl}`,
                sessionId: vietQrRes.orderCode,
                mode: 'vietqr',
            };
        }

        const customerId = await this.getOrCreateStripeCustomer(userId, user.email, user.fullName || undefined);
        const planConfig = PLAN_PRICES[dto.plan];

        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            client_reference_id: userId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: planConfig.currency,
                        product_data: {
                            name: planConfig.name,
                            description: `Quyền truy cập dự đoán thể thao & phân tích chuyên sâu iKnowBall (${dto.plan})`,
                        },
                        unit_amount: planConfig.amount,
                        recurring: {
                            interval: planConfig.interval,
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
                plan: dto.plan,
            },
            subscription_data: {
                metadata: {
                    userId,
                    plan: dto.plan,
                },
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return {
            url: session.url,
            sessionId: session.id,
            mode: 'stripe_checkout',
        };
    }

    /**
     * Xác nhận phiên thanh toán và kích hoạt gói Subscription
     */
    async confirmCheckoutSession(userId: string, dto: ConfirmSessionDto): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        // Nếu là mã đơn VietQR
        if (dto.sessionId.startsWith('IKB')) {
            return this.checkVietQrPaymentStatus(dto.sessionId, userId);
        }

        const isMockSession = dto.sessionId.startsWith('mock_session_') || !this.stripe;
        const targetPlan = dto.plan || SubscriptionPlan.PRO_MONTHLY;
        const planConfig = PLAN_PRICES[targetPlan];

        if (isMockSession) {
            this.logger.log(`Kích hoạt subscription (Mock Mode) cho user ${userId} gói ${targetPlan}`);

            const now = new Date();
            const periodEnd = new Date(now);
            if (targetPlan.includes('YEARLY')) {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            return await this.prisma.$transaction(async (tx) => {
                const existingSub = await tx.subscription.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                });

                let subscription;
                if (existingSub) {
                    subscription = await tx.subscription.update({
                        where: { id: existingSub.id },
                        data: {
                            plan: targetPlan,
                            status: SubscriptionStatus.ACTIVE,
                            currentPeriodStart: now,
                            currentPeriodEnd: periodEnd,
                            cancelAtPeriodEnd: false,
                        },
                    });
                } else {
                    subscription = await tx.subscription.create({
                        data: {
                            userId,
                            stripeCustomerId: `mock_cust_${userId}`,
                            stripeSubscriptionId: `mock_sub_${Date.now()}`,
                            stripePriceId: `mock_price_${targetPlan}`,
                            plan: targetPlan,
                            status: SubscriptionStatus.ACTIVE,
                            currentPeriodStart: now,
                            currentPeriodEnd: periodEnd,
                        },
                    });
                }

                await tx.payment.create({
                    data: {
                        userId,
                        subscriptionId: subscription.id,
                        stripeSessionId: dto.sessionId,
                        amount: planConfig.amount,
                        currency: planConfig.currency,
                        status: PaymentStatus.SUCCEEDED,
                        paymentMethod: 'mock_card',
                    },
                });

                const premiumRole = await tx.role.findUnique({ where: { name: 'premium' } });
                if (premiumRole && user.role?.name === 'user') {
                    await tx.user.update({
                        where: { id: userId },
                        data: { roleId: premiumRole.id },
                    });
                }

                return {
                    success: true,
                    message: `Kích hoạt thành công gói ${planConfig.name}!`,
                    subscription,
                    plan: targetPlan,
                };
            });
        }

        // Xử lý với Stripe thật
        try {
            const session = await this.stripe.checkout.sessions.retrieve(dto.sessionId);
            if (session.payment_status === 'paid') {
                const subscription = await this.prisma.subscription.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                });

                return {
                    success: true,
                    message: 'Thanh toán Stripe thành công!',
                    subscription,
                    plan: subscription?.plan || targetPlan,
                };
            } else {
                return {
                    success: false,
                    message: 'Giao dịch thanh toán chưa hoàn tất hoặc đang được xử lý.',
                    status: session.payment_status,
                };
            }
        } catch (err: any) {
            this.logger.error(`Lỗi xác thực Stripe session: ${err.message}`);
            throw new BadRequestException(`Không thể xác thực phiên thanh toán: ${err.message}`);
        }
    }

    /**
     * Tạo Stripe Customer Portal session
     */
    async createCustomerPortalSession(userId: string) {
        if (!this.stripe) {
            return { url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing` };
        }

        const subscription = await this.prisma.subscription.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!subscription?.stripeCustomerId) {
            throw new BadRequestException('Bạn chưa có thông tin khách hàng thanh toán tại Stripe');
        }

        const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`;
        const session = await this.stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: returnUrl,
        });

        return { url: session.url };
    }

    /**
     * Xử lý Stripe Webhook bảo mật
     */
    async handleWebhook(rawBody: Buffer | string, signature: string) {
        if (!this.stripe || !this.webhookSecret) {
            this.logger.warn('Stripe or WebhookSecret is not configured. Skipping webhook verification.');
            return { received: true, note: 'Mock mode' };
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
        } catch (err: any) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw new BadRequestException(`Chữ ký Webhook không hợp lệ: ${err.message}`);
        }

        this.logger.log(`Processing Stripe Webhook Event: ${event.id} [${event.type}]`);

        const existingEvent = await this.prisma.webhookEvent.findUnique({
            where: { id: event.id },
        });

        if (existingEvent && existingEvent.status === WebhookEventStatus.PROCESSED) {
            return { received: true, alreadyProcessed: true };
        }

        if (!existingEvent) {
            await this.prisma.webhookEvent.create({
                data: {
                    id: event.id,
                    type: event.type,
                    status: WebhookEventStatus.RECEIVED,
                    payload: event as any,
                },
            });
        }

        try {
            await this.processStripeEventInTransaction(event);

            await this.prisma.webhookEvent.update({
                where: { id: event.id },
                data: {
                    status: WebhookEventStatus.PROCESSED,
                    processedAt: new Date(),
                },
            });

            return { received: true };
        } catch (error: any) {
            this.logger.error(`Failed to process Stripe event ${event.id}: ${error.message}`, error.stack);
            await this.prisma.webhookEvent.update({
                where: { id: event.id },
                data: {
                    status: WebhookEventStatus.FAILED,
                    error: error.message,
                },
            });
            throw new InternalServerErrorException('Lỗi xử lý sự kiện Webhook');
        }
    }

    private async processStripeEventInTransaction(event: Stripe.Event): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const userId = session.client_reference_id || session.metadata?.userId;
                    const planStr = (session.metadata?.plan as SubscriptionPlan) || SubscriptionPlan.PRO_MONTHLY;

                    if (!userId) {
                        return;
                    }

                    let premiumRole = await tx.role.findUnique({ where: { name: 'premium' } });
                    if (!premiumRole) {
                        premiumRole = await tx.role.create({ data: { name: 'premium' } });
                    }

                    await tx.user.update({
                        where: { id: userId },
                        data: { roleId: premiumRole.id },
                    });

                    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
                    let stripeSubscription: Stripe.Subscription | null = null;
                    if (subscriptionId && this.stripe) {
                        try {
                            stripeSubscription = await this.stripe.subscriptions.retrieve(subscriptionId);
                        } catch (err) {
                            this.logger.warn(`Could not retrieve Stripe subscription ${subscriptionId}`);
                        }
                    }

                    const subAny = stripeSubscription as any;
                    const currentPeriodStart = subAny?.current_period_start
                        ? new Date(subAny.current_period_start * 1000)
                        : new Date();
                    const currentPeriodEnd = subAny?.current_period_end
                        ? new Date(subAny.current_period_end * 1000)
                        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                    const dbSubscription = await tx.subscription.upsert({
                        where: { stripeSubscriptionId: subscriptionId || `mock_sub_${session.id}` },
                        create: {
                            userId,
                            stripeCustomerId: String(session.customer),
                            stripeSubscriptionId: subscriptionId || `mock_sub_${session.id}`,
                            stripePriceId: (stripeSubscription as any)?.items?.data?.[0]?.price?.id || 'price_default',
                            plan: planStr,
                            status: SubscriptionStatus.ACTIVE,
                            currentPeriodStart,
                            currentPeriodEnd,
                        },
                        update: {
                            plan: planStr,
                            status: SubscriptionStatus.ACTIVE,
                            currentPeriodStart,
                            currentPeriodEnd,
                        },
                    });

                    const isZeroDecimal = (c?: string | null) => ['vnd', 'jpy', 'krw'].includes(c?.toLowerCase() || '');
                    const paymentAmount = isZeroDecimal(session.currency)
                        ? (session.amount_total || 0)
                        : (session.amount_total || 0) / 100;

                    await tx.payment.create({
                        data: {
                            userId,
                            subscriptionId: dbSubscription.id,
                            stripeSessionId: session.id,
                            stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                            amount: paymentAmount,
                            currency: session.currency || 'vnd',
                            status: PaymentStatus.SUCCEEDED,
                            paymentMethod: session.payment_method_types?.[0] || 'card',
                        },
                    });
                    break;
                }

                case 'customer.subscription.deleted': {
                    const sub = event.data.object as any;
                    const dbSub = await tx.subscription.findUnique({
                        where: { stripeSubscriptionId: sub.id },
                    });

                    if (dbSub) {
                        await tx.subscription.update({
                            where: { id: dbSub.id },
                            data: { status: SubscriptionStatus.CANCELED },
                        });

                        const userRole = await tx.role.findUnique({ where: { name: 'user' } });
                        if (userRole) {
                            await tx.user.update({
                                where: { id: dbSub.userId },
                                data: { roleId: userRole.id },
                            });
                        }
                    }
                    break;
                }
            }
        });
    }

    /**
     * Danh sách các gói đăng ký kèm tính năng và bảng giá
     */
    getSubscriptionPlans() {
        return [
            {
                id: SubscriptionPlan.FREE,
                name: 'Miễn Phí (Free)',
                description: 'Trải nghiệm cơ bản dữ liệu trận đấu và tối đa 3 lượt xem dự đoán mỗi ngày',
                price: 0,
                currency: 'VND',
                interval: 'month',
                popular: false,
                features: [
                    'Lịch thi đấu & kết quả theo thời gian thực',
                    '3 lượt xem chi tiết dự đoán mỗi ngày',
                    'Thống kê hiệu năng mô hình cơ bản',
                    'Cập nhật BXH & bảng xếp hạng Elo',
                ],
            },
            {
                id: SubscriptionPlan.PRO_MONTHLY,
                name: 'Pro Hàng Tháng',
                description: 'Dành cho người chơi chuyên nghiệp cần dự đoán AI chi tiết và không giới hạn',
                price: 249000,
                currency: 'VND',
                interval: 'month',
                popular: true,
                features: [
                    'Không giới hạn lượt xem chi tiết dự đoán',
                    'Giải thích chi tiết (Feature Snapshot & AI Insights)',
                    'Lịch sử hiệu năng mô hình theo thời gian thực',
                    'Thông báo diễn biến trận đấu sớm',
                    'Hỗ trợ khách hàng ưu tiên',
                ],
            },
            {
                id: SubscriptionPlan.PRO_YEARLY,
                name: 'Pro Hàng Năm',
                description: 'Tiết kiệm 25% chi phí với toàn bộ quyền lợi của gói Pro',
                price: 1790000,
                currency: 'VND',
                interval: 'year',
                popular: false,
                features: [
                    'Toàn bộ tính năng của gói Pro Hàng Tháng',
                    'Tiết kiệm 25% so với thanh toán theo tháng',
                    'Ưu tiên truy cập các mô hình AI thử nghiệm mới',
                    'Huy hiệu Pro độc quyền trên nền tảng',
                ],
            },
            {
                id: SubscriptionPlan.VIP_MONTHLY,
                name: 'VIP Insights Hàng Tháng',
                description: 'Gói cao cấp nhất với báo cáo phân tích độc quyền và tín hiệu chuyên sâu',
                price: 499000,
                currency: 'VND',
                interval: 'month',
                popular: false,
                features: [
                    'Toàn bộ tính năng của gói Pro',
                    'Báo cáo phân tích chuyên sâu trước trận đấu',
                    'Cảnh báo biến động odds và tỷ lệ thắng tức thì',
                    'Kênh trao đổi & hỗ trợ trực tiếp từ chuyên gia dữ liệu',
                ],
            },
            {
                id: SubscriptionPlan.VIP_YEARLY,
                name: 'VIP Insights Hàng Năm',
                description: 'Toàn bộ quyền lợi của gói VIP với chi phí tiết kiệm hơn 40%',
                price: 3590000,
                currency: 'VND',
                interval: 'year',
                popular: false,
                features: [
                    'Toàn bộ tính năng của gói VIP Hàng Tháng',
                    'Tiết kiệm hơn 40% so với thanh toán theo tháng',
                    'Báo cáo phân tích chuyên sâu trước trận đấu',
                    'Cảnh báo biến động odds và tỷ lệ thắng tức thì',
                    'Kênh trao đổi & hỗ trợ trực tiếp 1-1 từ chuyên gia dữ liệu',
                ],
            },
        ];
    }

    /**
     * Lấy thông tin thanh toán theo ID
     */
    async getPaymentById(paymentId: string, userId: string, userRole?: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                subscription: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Không tìm thấy bản ghi thanh toán');
        }

        if (payment.userId !== userId && userRole !== 'admin') {
            throw new BadRequestException('Bạn không có quyền xem thông tin thanh toán này');
        }

        return payment;
    }

    /**
     * Lấy thông tin gói hiện tại của người dùng
     */
    async getUserSubscription(userId: string) {
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                userId,
                status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
            },
            orderBy: { createdAt: 'desc' },
        });

        const recentPayments = await this.prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        return {
            subscription: subscription || null,
            recentPayments,
            plans: PLAN_PRICES,
        };
    }
}
