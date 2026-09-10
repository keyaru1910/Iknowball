import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/admin-user.dto';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

    /**
     * Lấy số liệu thống kê tổng quan cho Admin Dashboard
     */
    async getDashboardStats() {
        const [
            totalUsers,
            bannedUsers,
            premiumUsers,
            activeSubscriptions,
            totalPaymentsResult,
            recentSyncLogs,
            latestPerformance,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: 'banned' } }),
            this.prisma.user.count({ where: { role: { name: 'premium' } } }),
            this.prisma.subscription.count({
                where: { status: SubscriptionStatus.ACTIVE },
            }),
            this.prisma.payment.aggregate({
                where: { status: PaymentStatus.SUCCEEDED },
                _sum: { amount: true },
                _count: { id: true },
            }),
            this.prisma.syncJobLog.findMany({
                orderBy: { startedAt: 'desc' },
                take: 5,
            }),
            this.prisma.modelPerformance.findFirst({
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            users: {
                total: totalUsers,
                banned: bannedUsers,
                premium: premiumUsers,
            },
            billing: {
                activeSubscriptions,
                totalRevenue: Number(totalPaymentsResult._sum.amount || 0),
                totalTransactions: totalPaymentsResult._count.id,
            },
            system: {
                recentSyncLogs,
                latestModelPerformance: latestPerformance ? {
                    ...latestPerformance,
                    accuracy: Number(latestPerformance.accuracy),
                    precision: Number(latestPerformance.precision),
                    recall: Number(latestPerformance.recall),
                    f1: Number(latestPerformance.f1),
                    avgLogLoss: Number(latestPerformance.avgLogLoss),
                    avgBrierScore: Number(latestPerformance.avgBrierScore),
                } : null,
            },
        };
    }

    /**
     * Danh sách người dùng phân trang kèm bộ lọc
     */
    async getUsers(query: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
    }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.search) {
            where.OR = [
                { email: { contains: query.search, mode: 'insensitive' } },
                { fullName: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.role) {
            where.role = { name: query.role };
        }
        if (query.status) {
            where.status = query.status;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    emailVerifiedAt: true,
                    status: true,
                    role: { select: { id: true, name: true } },
                    createdAt: true,
                    updatedAt: true,
                    subscriptions: {
                        where: { status: SubscriptionStatus.ACTIVE },
                        select: { id: true, plan: true, status: true, currentPeriodEnd: true },
                        take: 1,
                    },
                    _count: {
                        select: { payments: true, predictionViews: true },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            items: users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Cập nhật trạng thái người dùng (Ban / Unban) kèm ghi Audit Log
     */
    async updateUserStatus(
        adminId: string,
        targetUserId: string,
        dto: UpdateUserStatusDto,
        ip?: string,
        userAgent?: string,
    ) {
        if (adminId === targetUserId) {
            throw new BadRequestException('Quản trị viên không thể tự khóa tài khoản của chính mình');
        }

        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!targetUser) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        const oldStatus = targetUser.status;

        // Nếu ban tài khoản -> Thu hồi tất cả refresh tokens của user
        if (dto.status === 'banned') {
            await this.prisma.refreshToken.updateMany({
                where: { userId: targetUserId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: targetUserId },
            data: { status: dto.status },
            include: { role: true },
        });

        // Ghi nhận Audit Log
        await this.prisma.auditLog.create({
            data: {
                actorId: adminId,
                targetUserId,
                action: dto.status === 'banned' ? 'USER_BANNED' : 'USER_UNBANNED',
                details: {
                    oldStatus,
                    newStatus: dto.status,
                    reason: dto.reason || null,
                },
                ipAddress: ip || null,
                userAgent: userAgent || null,
            },
        });

        return updatedUser;
    }

    /**
     * Thay đổi vai trò người dùng (User / Premium / Admin) kèm ghi Audit Log
     */
    async updateUserRole(
        adminId: string,
        targetUserId: string,
        dto: UpdateUserRoleDto,
        ip?: string,
        userAgent?: string,
    ) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: { role: true },
        });

        if (!targetUser) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        let role = await this.prisma.role.findUnique({
            where: { name: dto.role },
        });

        if (!role) {
            role = await this.prisma.role.create({
                data: { name: dto.role },
            });
        }

        const oldRole = targetUser.role?.name;

        const updatedUser = await this.prisma.user.update({
            where: { id: targetUserId },
            data: { roleId: role.id },
            include: { role: true },
        });

        // Ghi nhận Audit Log
        await this.prisma.auditLog.create({
            data: {
                actorId: adminId,
                targetUserId,
                action: 'USER_ROLE_CHANGED',
                details: {
                    oldRole,
                    newRole: dto.role,
                },
                ipAddress: ip || null,
                userAgent: userAgent || null,
            },
        });

        return updatedUser;
    }

    /**
     * Danh sách giao dịch thanh toán
     */
    async getPayments(query: { page?: number; limit?: number; status?: PaymentStatus }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) {
            where.status = query.status;
        }

        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true, fullName: true },
                    },
                    subscription: {
                        select: { id: true, plan: true, status: true },
                    },
                },
            }),
            this.prisma.payment.count({ where }),
        ]);

        return {
            items: payments.map(p => ({
                ...p,
                amount: Number(p.amount),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Danh sách gói đăng ký Subscriptions
     */
    async getSubscriptions(query: { page?: number; limit?: number; status?: SubscriptionStatus }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) {
            where.status = query.status;
        }

        const [subscriptions, total] = await Promise.all([
            this.prisma.subscription.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true, fullName: true },
                    },
                },
            }),
            this.prisma.subscription.count({ where }),
        ]);

        return {
            items: subscriptions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Xem nhật ký đồng bộ dữ liệu thể thao
     */
    async getSyncLogs(query: { page?: number; limit?: number; jobName?: string }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.jobName) {
            where.jobName = { contains: query.jobName, mode: 'insensitive' };
        }

        const [logs, total] = await Promise.all([
            this.prisma.syncJobLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startedAt: 'desc' },
            }),
            this.prisma.syncJobLog.count({ where }),
        ]);

        return {
            items: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Xem báo cáo hiệu năng mô hình AI
     */
    async getModelPerformance(query: { leagueId?: string; modelVersion?: string }) {
        const where: any = {};
        if (query.leagueId) {
            where.leagueId = query.leagueId;
        }
        if (query.modelVersion) {
            where.modelVersion = query.modelVersion;
        }

        const performanceRecords = await this.prisma.modelPerformance.findMany({
            where,
            orderBy: { periodStart: 'desc' },
            include: {
                league: {
                    select: { id: true, name: true, season: true },
                },
            },
            take: 50,
        });

        return performanceRecords.map(r => ({
            ...r,
            accuracy: Number(r.accuracy),
            precision: Number(r.precision),
            recall: Number(r.recall),
            f1: Number(r.f1),
            avgLogLoss: Number(r.avgLogLoss),
            avgBrierScore: Number(r.avgBrierScore),
        }));
    }

    /**
     * Xem toàn bộ nhật ký kiểm toán (Audit Logs)
     */
    async getAuditLogs(query: { page?: number; limit?: number; action?: string }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.action) {
            where.action = query.action;
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: { select: { id: true, email: true, fullName: true } },
                    targetUser: { select: { id: true, email: true, fullName: true } },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            items: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
