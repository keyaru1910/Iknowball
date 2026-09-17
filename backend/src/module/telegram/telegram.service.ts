import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken: string | null;
    private readonly botUsername: string;
    private readonly vipGroupLink: string;
    private readonly vipGroupId: string | null;

    constructor(private readonly prisma: PrismaService) {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
        this.botUsername = process.env.TELEGRAM_BOT_USERNAME || 'iKnowBall_VIP_Bot';
        this.vipGroupLink = process.env.TELEGRAM_VIP_GROUP_LINK || 'https://t.me/+iknowball_vip_signals';
        this.vipGroupId = process.env.TELEGRAM_VIP_GROUP_ID || null;

        if (this.botToken) {
            this.logger.log(`Telegram Bot initialized with username @${this.botUsername}`);
        } else {
            this.logger.warn('TELEGRAM_BOT_TOKEN chưa được cấu hình. Hệ thống chạy ở chế độ Telegram Simulator / Mock Mode.');
        }
    }

    /**
     * Gửi tin nhắn qua Telegram Bot API
     */
    async sendMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
        if (!this.botToken) {
            this.logger.log(`[TELEGRAM MOCK] Send message to chatId=${chatId}:\n${text}`);
            return true;
        }

        try {
            await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: chatId,
                text,
                parse_mode: parseMode,
                disable_web_page_preview: false,
            });
            return true;
        } catch (error: any) {
            this.logger.error(`Lỗi gửi tin nhắn Telegram tới chatId ${chatId}: ${error.response?.data?.description || error.message}`);
            return false;
        }
    }

    /**
     * Lấy thông tin trạng thái liên kết Telegram của User
     */
    async getStatus(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                telegramChatId: true,
                telegramUsername: true,
                telegramConnectedAt: true,
                telegramConnectToken: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        return {
            isConnected: !!user.telegramChatId,
            telegramChatId: user.telegramChatId,
            telegramUsername: user.telegramUsername,
            telegramConnectedAt: user.telegramConnectedAt,
            botUsername: this.botUsername,
            vipGroupInviteLink: this.vipGroupLink,
            hasPendingToken: !!user.telegramConnectToken,
        };
    }

    /**
     * Tạo mã kết nối Telegram 1-click cho người dùng
     */
    async generateConnectToken(userId: string) {
        const randomHex = crypto.randomBytes(8).toString('hex');
        const token = `ikb_${userId.replace(/-/g, '').slice(0, 8)}_${randomHex}`;

        await this.prisma.user.update({
            where: { id: userId },
            data: { telegramConnectToken: token },
        });

        const deepLink = `https://t.me/${this.botUsername}?start=${token}`;

        return {
            token,
            botUsername: this.botUsername,
            deepLink,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(deepLink)}`,
        };
    }

    /**
     * Hủy liên kết Telegram
     */
    async disconnect(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                telegramChatId: null,
                telegramUsername: null,
                telegramConnectedAt: null,
                telegramConnectToken: null,
            },
        });

        return { success: true, message: 'Đã hủy liên kết tài khoản Telegram thành công' };
    }

    /**
     * Gửi tin nhắn kiểm tra (Test Notification) cho User
     */
    async sendTestNotification(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { telegramChatId: true, fullName: true, email: true },
        });

        if (!user || !user.telegramChatId) {
            throw new BadRequestException('Bạn chưa liên kết tài khoản Telegram!');
        }

        const name = user.fullName || user.email.split('@')[0];
        const message = `
👑 <b>iKnowBall VIP Intelligence Notification</b>

Xin chào <b>${name}</b>!
Hệ thống kết nối cảnh báo thời gian thực giữa tài khoản iKnowBall và Telegram của bạn đã hoạt động hoàn hảo.

🔔 <b>Tính năng đang kích hoạt:</b>
• ⚡ <i>Cảnh báo biến động odds sớm</i>
• 📈 <i>Tín hiệu thay đổi xác suất AI > 5%</i>
• 🎯 <i>Gợi ý kèo Value Bet độc quyền</i>

Chúc bạn có những nhận định chuẩn xác nhất! ⚽🏀
        `.trim();

        const success = await this.sendMessage(user.telegramChatId, message, 'HTML');
        return { success, message: success ? 'Đã gửi thông báo thử nghiệm thành công' : 'Không thể gửi tin nhắn Telegram' };
    }

    /**
     * Xử lý Webhook từ Telegram Bot (khi người dùng gửi tin nhắn hoặc bấm Start)
     */
    async handleWebhook(payload: any) {
        if (!payload || !payload.message) {
            return { ok: true, note: 'No message in payload' };
        }

        const msg = payload.message;
        const text: string = msg.text || '';
        const chatId = String(msg.chat?.id);
        const username = msg.from?.username || msg.from?.first_name || 'VIP Member';

        // Xử lý lệnh: /start <token>
        if (text.startsWith('/start')) {
            const parts = text.trim().split(' ');
            const token = parts[1];

            if (token) {
                const user = await this.prisma.user.findUnique({
                    where: { telegramConnectToken: token },
                });

                if (user) {
                    await this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            telegramChatId: chatId,
                            telegramUsername: username,
                            telegramConnectedAt: new Date(),
                            telegramConnectToken: null, // Clear token sau khi dùng
                        },
                    });

                    // Gửi lời chào mừng
                    const welcomeMsg = `
🎉 <b>Chúc mừng! Bạn đã liên kết thành công với iKnowBall VIP</b>

Xin chào <b>${username}</b>, tài khoản của bạn đã được kết nối với email <b>${user.email}</b>.

🌟 <b>Đặc quyền VIP:</b>
1. Nhận cảnh báo biến động odds tức thì.
2. Link tham gia nhóm VIP Telegram độc quyền: <a href="${this.vipGroupLink}">Tham Gia Ngay</a>
3. Tín hiệu Value Bet từ mô hình Machine Learning.
                    `.trim();

                    await this.sendMessage(chatId, welcomeMsg, 'HTML');
                    return { ok: true, connectedUser: user.email };
                }
            }

            // Trường hợp user gõ /start không có token hoặc token không hợp lệ
            await this.sendMessage(chatId, `
👋 Chào bạn! Để liên kết tài khoản iKnowBall, vui lòng truy cập trang Cài đặt VIP trên website iKnowBall và bấm nút <b>"Kết nối Telegram"</b>.
            `.trim(), 'HTML');
        }

        return { ok: true };
    }

    /**
     * Broadcast cảnh báo biến động tới nhóm VIP Telegram và các user VIP đã kết nối bot
     */
    async broadcastFluctuationAlert(alert: {
        headline: string;
        description: string;
        homeTeam: string;
        awayTeam: string;
        changePercent: number;
        recommendedBet?: string | null;
        type: string;
    }) {
        const typeEmoji = alert.type === 'VALUE_BET' ? '🎯 VALUE BET' : alert.type === 'ODDS_SHIFT' ? '⚡ ODDS BIẾN ĐỘNG' : '📈 AI SHIFT';
        const formattedMsg = `
🚨 <b>[iKnowBall VIP] CẢNH BÁO BIẾN ĐỘNG: ${typeEmoji}</b>

⚽ <b>${alert.homeTeam} vs ${alert.awayTeam}</b>
📊 <b>Biến động:</b> +${alert.changePercent}%
📌 <b>Tiêu đề:</b> ${alert.headline}

💡 <b>Phân tích:</b>
${alert.description}

${alert.recommendedBet ? `🎯 <b>Gợi ý cược AI:</b> <code>${alert.recommendedBet}</code>` : ''}

👉 Xem chi tiết trên hệ thống: <a href="https://iknowball.com/predictions">iKnowBall Predictions</a>
        `.trim();

        // 1. Gửi tới VIP Channel/Group nếu có
        if (this.vipGroupId) {
            await this.sendMessage(this.vipGroupId, formattedMsg, 'HTML');
        }

        // 2. Gửi tới danh sách user VIP đã kết nối Telegram
        try {
            const vipUsers = await this.prisma.user.findMany({
                where: {
                    telegramChatId: { not: null },
                    OR: [
                        { role: { name: 'admin' } },
                        { role: { name: 'premium' } },
                        { subscriptions: { some: { status: { in: ['ACTIVE', 'TRIALING'] } } } },
                    ],
                },
                select: { telegramChatId: true },
            });

            for (const u of vipUsers) {
                if (u.telegramChatId) {
                    await this.sendMessage(u.telegramChatId, formattedMsg, 'HTML');
                }
            }
        } catch (err: any) {
            this.logger.warn(`Lỗi gửi broadcast alert tới VIP users: ${err.message}`);
        }
    }
}
