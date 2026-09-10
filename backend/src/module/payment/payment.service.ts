import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import {
    PaymentStatus,
    SubscriptionPlan,
    SubscriptionStatus,
    WebhookEventStatus,
} from '@prisma/client';

const PLAN_PRICES = {
    [SubscriptionPlan.PRO_MONTHLY]: {
        amount: 999, // 9.99 USD in cents
        currency: 'usd',
        name: 'iKnowBall Pro (Hàng Tháng)',
        interval: 'month' as const,
    },
    [SubscriptionPlan.PRO_YEARLY]: {
        amount: 8999, // 89.99 USD in cents
        currency: 'usd',
        name: 'iKnowBall Pro (Hàng Năm)',
        interval: 'year' as const,
    },
    [SubscriptionPlan.VIP_MONTHLY]: {
        amount: 1999, // 19.99 USD in cents
        currency: 'usd',
        name: 'iKnowBall VIP Insights',
        interval: 'month' as const,
    },
    [SubscriptionPlan.FREE]: {
        amount: 0,
        currency: 'usd',
        name: 'iKnowBall Free',
        interval: 'month' as const,
    },
};

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly stripe: Stripe | null = null;
    private readonly webhookSecret: string | null = null;

    constructor(private prisma: PrismaService) {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || null;

        if (stripeKey) {
            this.stripe = new Stripe(stripeKey, {
                apiVersion: '2025-02-24.acacia' as any,
            });
            this.logger.log('Stripe SDK initialized in test/live mode');
        } else {
            this.logger.warn('STRIPE_SECRET_KEY is not set. Stripe test/mock mode is active.');
        }
    }

    /**
     * Lấy hoặc tạo Stripe Customer ID cho người dùng
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
     * Khởi tạo Stripe Checkout Session
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

        // Nếu chưa cấu hình Stripe Key (chạy local dev stub)
        if (!this.stripe) {
            this.logger.warn(`Mock checkout session created for user ${userId} plan ${dto.plan}`);
            return {
                url: `${frontendUrl}/payment/success?session_id=mock_session_${Date.now()}&mock=true`,
                sessionId: `mock_session_${Date.now()}`,
                mode: 'test_mock',
            };
        }

        const customerId = await this.getOrCreateStripeCustomer(userId, user.email, user.fullName || undefined);
        const planConfig = PLAN_PRICES[dto.plan];

        // Tạo Stripe Checkout Session
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
     * Tạo Stripe Customer Portal session để quản lý hoặc hủy gói
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
     * Xử lý Stripe Webhook bảo mật, xác thực chữ ký và Idempotency
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

        // 1. Kiểm tra Idempotency - Tránh xử lý lặp lại event
        const existingEvent = await this.prisma.webhookEvent.findUnique({
            where: { id: event.id },
        });

        if (existingEvent && existingEvent.status === WebhookEventStatus.PROCESSED) {
            this.logger.log(`Event ${event.id} already processed. Skipping.`);
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

        // 2. Thực thi xử lý sự kiện trong Prisma Transaction
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

    /**
     * Xử lý chi tiết các loại Stripe Event trong DB Transaction
     */
    private async processStripeEventInTransaction(event: Stripe.Event): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const userId = session.client_reference_id || session.metadata?.userId;
                    const planStr = (session.metadata?.plan as SubscriptionPlan) || SubscriptionPlan.PRO_MONTHLY;

                    if (!userId) {
                        this.logger.warn(`Checkout session ${session.id} missing userId`);
                        return;
                    }

                    // Đảm bảo role 'premium' tồn tại
                    let premiumRole = await tx.role.findUnique({ where: { name: 'premium' } });
                    if (!premiumRole) {
                        premiumRole = await tx.role.create({ data: { name: 'premium' } });
                    }

                    // Nâng cấp quyền người dùng lên premium
                    await tx.user.update({
                        where: { id: userId },
                        data: { roleId: premiumRole.id },
                    });

                    // Lấy hoặc tạo Subscription
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

                    // Ghi nhận Payment
                    await tx.payment.create({
                        data: {
                            userId,
                            subscriptionId: dbSubscription.id,
                            stripeSessionId: session.id,
                            stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                            amount: (session.amount_total || 0) / 100,
                            currency: session.currency || 'usd',
                            status: PaymentStatus.SUCCEEDED,
                            paymentMethod: session.payment_method_types?.[0] || 'card',
                        },
                    });

                    // Ghi nhận Audit Log
                    await tx.auditLog.create({
                        data: {
                            targetUserId: userId,
                            action: 'SUBSCRIPTION_PURCHASED',
                            details: {
                                plan: planStr,
                                amount: (session.amount_total || 0) / 100,
                                sessionId: session.id,
                                subscriptionId,
                            },
                        },
                    });
                    break;
                }

                case 'customer.subscription.updated': {
                    const sub = event.data.object as any;
                    const statusMapping: Record<string, SubscriptionStatus> = {
                        active: SubscriptionStatus.ACTIVE,
                        trialing: SubscriptionStatus.TRIALING,
                        past_due: SubscriptionStatus.PAST_DUE,
                        canceled: SubscriptionStatus.CANCELED,
                        unpaid: SubscriptionStatus.UNPAID,
                        incomplete: SubscriptionStatus.INCOMPLETE,
                    };

                    const status = statusMapping[sub.status] || SubscriptionStatus.ACTIVE;

                    await tx.subscription.updateMany({
                        where: { stripeSubscriptionId: sub.id },
                        data: {
                            status,
                            currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : new Date(),
                            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : new Date(),
                            cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
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

                        // Hạ quyền về 'user' nếu người dùng không còn subscription nào active
                        const userRole = await tx.role.findUnique({ where: { name: 'user' } });
                        if (userRole) {
                            await tx.user.update({
                                where: { id: dbSub.userId },
                                data: { roleId: userRole.id },
                            });
                        }

                        // Ghi Audit Log
                        await tx.auditLog.create({
                            data: {
                                targetUserId: dbSub.userId,
                                action: 'SUBSCRIPTION_CANCELED',
                                details: {
                                    subscriptionId: sub.id,
                                },
                            },
                        });
                    }
                    break;
                }

                case 'invoice.payment_failed': {
                    const invoice = event.data.object as any;
                    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;

                    if (subscriptionId) {
                        await tx.subscription.updateMany({
                            where: { stripeSubscriptionId: subscriptionId },
                            data: { status: SubscriptionStatus.PAST_DUE },
                        });
                    }
                    break;
                }

                default:
                    this.logger.debug(`Unhandled stripe event type: ${event.type}`);
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
                currency: 'USD',
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
                price: 9.99,
                currency: 'USD',
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
                price: 89.99,
                currency: 'USD',
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
                name: 'VIP Insights',
                description: 'Gói cao cấp nhất với báo cáo phân tích độc quyền và tín hiệu chuyên sâu',
                price: 19.99,
                currency: 'USD',
                interval: 'month',
                popular: false,
                features: [
                    'Toàn bộ tính năng của gói Pro',
                    'Báo cáo phân tích chuyên sâu trước trận đấu',
                    'Cảnh báo biến động odds và tỷ lệ thắng tức thì',
                    'Kênh trao đổi & hỗ trợ trực tiếp từ chuyên gia dữ liệu',
                ],
            },
        ];
    }

    /**
     * Lấy thông tin thanh toán theo ID (kiểm tra quyền: owner hoặc admin)
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
