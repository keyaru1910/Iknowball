// notification/notification.service.ts
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private resend: Resend | null = null;

    constructor(@Optional() private readonly prisma?: PrismaService) {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey && apiKey !== '...' && apiKey.startsWith('re_')) {
            this.resend = new Resend(apiKey);
        } else {
            this.logger.warn('RESEND_API_KEY chưa cấu hình — email xác thực sẽ không được gửi (chạy ở chế độ mock).');
        }
    }

    /**
     * Gửi email xác thực tài khoản qua Resend
     */
    async sendVerificationEmail(email: string, token: string) {
        if (!this.resend) {
            this.logger.warn(`[MOCK EMAIL] sendVerificationEmail → ${email} (token=${token})`);
            return;
        }

        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        const { error } = await this.resend.emails.send({
            from: 'iKnowBall <no-reply@iknowball.com>',
            to: email,
            subject: 'Xác thực email của bạn',
            html: `
        <p>Nhấn vào link bên dưới để xác thực email (hết hạn sau 24 giờ):</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
        });

        if (error) {
            throw new Error(`Không thể gửi email xác thực: ${error.message}`);
        }
    }

    /**
     * Tạo thông báo trong hệ thống cho người dùng
     */
    async createInAppNotification(data: {
        userId: string;
        title: string;
        message: string;
        type?: 'info' | 'warning' | 'success' | 'system';
        metadata?: any;
    }) {
        if (!this.prisma) return null;
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || 'info',
                data: data.metadata || null,
            },
        });
    }

    /**
     * Lấy danh sách thông báo của người dùng
     */
    async getUserNotifications(userId: string, limit = 20) {
        if (!this.prisma) return [];
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Đánh dấu đã đọc thông báo
     */
    async markAsRead(notificationId: string, userId: string) {
        if (!this.prisma) return null;
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
}
