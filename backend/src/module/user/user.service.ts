import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findById(id: string): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                role: true,
                subscriptions: {
                    where: { status: { in: ['ACTIVE', 'TRIALING'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }
        return UserResponseDto.fromEntity(user);
    }

    async updateProfile(id: string, data: { fullName?: string; avatarUrl?: string }) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
            include: {
                role: true,
                subscriptions: {
                    where: { status: { in: ['ACTIVE', 'TRIALING'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        return UserResponseDto.fromEntity(user);
    }

    /** Lấy danh sách API Keys của người dùng */
    async getApiKeys(userId: string) {
        return await this.prisma.apiKey.findMany({
            where: { userId },
            select: {
                id: true,
                keyPrefix: true,
                name: true,
                lastUsedAt: true,
                revokedAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Tạo mới API Key cá nhân (Chỉ dành cho gói VIP và Admin) */
    async createApiKey(userId: string, name?: string) {
        const user = await this.findById(userId);
        if (user.tier !== 'vip' && user.tier !== 'admin') {
            throw new Error('Tính năng cấp Developer API Key chỉ dành riêng cho tài khoản VIP Insights.');
        }

        const rawToken = 'ikb_live_' + (await import('crypto')).randomBytes(24).toString('hex');
        const keyPrefix = rawToken.slice(0, 16) + '...';
        const keyHash = (await import('crypto')).createHash('sha256').update(rawToken).digest('hex');

        const key = await this.prisma.apiKey.create({
            data: {
                userId,
                name: name || 'iKnowBall VIP Key',
                keyPrefix,
                keyHash,
            },
        });

        return {
            id: key.id,
            name: key.name,
            keyPrefix: key.keyPrefix,
            apiKey: rawToken, // Trả về 1 lần duy nhất lúc tạo
            createdAt: key.createdAt,
        };
    }

    /** Thu hồi API Key */
    async revokeApiKey(userId: string, apiKeyId: string) {
        const key = await this.prisma.apiKey.findFirst({
            where: { id: apiKeyId, userId },
        });

        if (!key) {
            throw new NotFoundException('Không tìm thấy API Key');
        }

        return await this.prisma.apiKey.update({
            where: { id: apiKeyId },
            data: { revokedAt: new Date() },
        });
    }
}

