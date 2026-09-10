import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, WebhookEventStatus } from '@prisma/client';

describe('PaymentService', () => {
    let service: PaymentService;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            user: {
                findUnique: vi.fn(),
                update: vi.fn(),
            },
            role: {
                findUnique: vi.fn(),
                create: vi.fn(),
            },
            subscription: {
                findFirst: vi.fn(),
                findUnique: vi.fn(),
                upsert: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
            },
            payment: {
                create: vi.fn(),
                findMany: vi.fn(),
            },
            webhookEvent: {
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
            auditLog: {
                create: vi.fn(),
            },
            $transaction: vi.fn(async (callback) => callback(prisma)),
        };

        service = new PaymentService(prisma as PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create mock checkout session when Stripe key is not configured', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            fullName: 'Test User',
        });

        const result = await service.createCheckoutSession('user-1', {
            plan: SubscriptionPlan.PRO_MONTHLY,
        });

        expect(result).toBeDefined();
        expect(result.mode).toBe('test_mock');
        expect(result.url).toContain('/payment/success');
    });

    it('should handle already processed webhook event (idempotency)', async () => {
        prisma.webhookEvent.findUnique.mockResolvedValue({
            id: 'evt_123',
            status: WebhookEventStatus.PROCESSED,
        });

        const result = await service.handleWebhook('{}', 'fake_sig');
        expect(result).toBeDefined();
    });

    it('should get user subscription and payment history', async () => {
        prisma.subscription.findFirst.mockResolvedValue({
            id: 'sub-1',
            userId: 'user-1',
            plan: SubscriptionPlan.PRO_MONTHLY,
            status: 'ACTIVE',
        });
        prisma.payment.findMany.mockResolvedValue([
            {
                id: 'pay-1',
                amount: 9.99,
                status: 'SUCCEEDED',
            },
        ]);

        const result = await service.getUserSubscription('user-1');
        expect(result.subscription).toBeDefined();
        expect(result.recentPayments.length).toBe(1);
    });

    it('should return subscription plans list', () => {
        const plans = service.getSubscriptionPlans();
        expect(plans).toBeDefined();
        expect(plans.length).toBe(4);
        expect(plans[0].id).toBe(SubscriptionPlan.FREE);
    });

    it('should get payment by id when user is owner', async () => {
        prisma.payment.findUnique = vi.fn().mockResolvedValue({
            id: 'pay-123',
            userId: 'user-1',
            amount: 9.99,
            status: 'SUCCEEDED',
        });

        const payment = await service.getPaymentById('pay-123', 'user-1');
        expect(payment).toBeDefined();
        expect(payment.id).toBe('pay-123');
    });

    it('should throw error when non-owner non-admin user requests payment detail', async () => {
        prisma.payment.findUnique = vi.fn().mockResolvedValue({
            id: 'pay-123',
            userId: 'user-other',
            amount: 9.99,
            status: 'SUCCEEDED',
        });

        await expect(service.getPaymentById('pay-123', 'user-1', 'user')).rejects.toThrow();
    });
});
