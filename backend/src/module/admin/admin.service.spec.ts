import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
    let service: AdminService;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            user: {
                count: vi.fn().mockResolvedValue(100),
                findMany: vi.fn().mockResolvedValue([]),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
            role: {
                findUnique: vi.fn(),
                create: vi.fn(),
            },
            subscription: {
                count: vi.fn().mockResolvedValue(25),
                findMany: vi.fn().mockResolvedValue([]),
            },
            payment: {
                aggregate: vi.fn().mockResolvedValue({
                    _sum: { amount: 1500 },
                    _count: { id: 30 },
                }),
                count: vi.fn().mockResolvedValue(30),
                findMany: vi.fn().mockResolvedValue([]),
            },
            syncJobLog: {
                findMany: vi.fn().mockResolvedValue([]),
                count: vi.fn().mockResolvedValue(10),
            },
            modelPerformance: {
                findFirst: vi.fn().mockResolvedValue(null),
                findMany: vi.fn().mockResolvedValue([]),
            },
            auditLog: {
                create: vi.fn(),
                findMany: vi.fn().mockResolvedValue([]),
                count: vi.fn().mockResolvedValue(5),
            },
            refreshToken: {
                updateMany: vi.fn(),
            },
        };

        service = new AdminService(prisma as PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should get dashboard stats correctly', async () => {
        const stats = await service.getDashboardStats();
        expect(stats.users.total).toBe(100);
        expect(stats.billing.activeSubscriptions).toBe(25);
        expect(stats.billing.totalRevenue).toBe(1500);
    });

    it('should ban user and revoke all refresh tokens and write audit log', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'target-1',
            email: 'baduser@example.com',
            status: 'active',
        });
        prisma.user.update.mockResolvedValue({
            id: 'target-1',
            status: 'banned',
        });

        const updated = await service.updateUserStatus('admin-1', 'target-1', {
            status: 'banned',
            reason: 'Tài khoản spam vi phạm chính sách',
        });

        expect(updated.status).toBe('banned');
        expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
            where: { userId: 'target-1', revokedAt: null },
            data: { revokedAt: expect.any(Date) },
        });
        expect(prisma.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                actorId: 'admin-1',
                targetUserId: 'target-1',
                action: 'USER_BANNED',
            }),
        });
    });

    it('should update user role and write audit log', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'target-2',
            email: 'vipuser@example.com',
            role: { name: 'user' },
        });
        prisma.role.findUnique.mockResolvedValue({ id: 'role-premium', name: 'premium' });
        prisma.user.update.mockResolvedValue({
            id: 'target-2',
            roleId: 'role-premium',
        });

        const updated = await service.updateUserRole('admin-1', 'target-2', {
            role: 'premium',
        });

        expect(updated).toBeDefined();
        expect(prisma.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                actorId: 'admin-1',
                targetUserId: 'target-2',
                action: 'USER_ROLE_CHANGED',
            }),
        });
    });
});
