import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TelegramService implements OnModuleInit {
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

    async onModuleInit() {
        // Tự động kiểm tra và cấu hình webhook nếu có TELEGRAM_WEBHOOK_URL
        const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
        if (this.botToken && webhookUrl) {
            try {
                await this.setupWebhook(webhookUrl);
            } catch (err: any) {
                this.logger.warn(`Không thể tự động thiết lập Telegram Webhook khi khởi động: ${err.message}`);
            }
        }
    }

    /**
     * Tự động cài đặt Webhook URL tới Telegram Bot API
     */
    async setupWebhook(webhookUrl?: string): Promise<{ success: boolean; description?: string }> {
        if (!this.botToken) {
            return { success: false, description: 'Chưa cấu hình TELEGRAM_BOT_TOKEN' };
        }

        const targetUrl = webhookUrl || process.env.TELEGRAM_WEBHOOK_URL;
        if (!targetUrl) {
            throw new BadRequestException('Vui lòng cung cấp URL webhook hợp lệ (vd: https://your-domain.com/api/v1/telegram/webhook)');
        }

        try {
            const res = await axios.post(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
                url: targetUrl,
                allowed_updates: ['message', 'callback_query'],
                drop_pending_updates: false,
            });

            this.logger.log(`Telegram Webhook setup response: ${JSON.stringify(res.data)}`);
            return {
                success: res.data?.ok || false,
                description: res.data?.description || 'Cài đặt Webhook thành công',
            };
        } catch (error: any) {
            this.logger.error(`Lỗi thiết lập Telegram Webhook: ${error.response?.data?.description || error.message}`);
            return {
                success: false,
                description: error.response?.data?.description || error.message,
            };
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
     * Gửi thông báo khi nâng cấp hoặc gia hạn gói VIP thành công
     */
    async sendSubscriptionSuccessNotification(userId: string, planName: string, expiresAt: Date, amount: number) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { telegramChatId: true, fullName: true, email: true },
            });

            if (!user || !user.telegramChatId) {
                return;
            }

            const name = user.fullName || user.email.split('@')[0];
            const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
            const formattedDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(expiresAt);

            const message = `
🎉 <b>CHÚC MỪNG BẠN ĐÃ KÍCH HOẠT THÀNH CÔNG GÓI VIP</b>

Xin chào <b>${name}</b>,
Tài khoản của bạn đã được nâng cấp thành công trên nền tảng iKnowBall.

💎 <b>Thông tin gói:</b> ${planName}
💰 <b>Số tiền thanh toán:</b> ${formattedAmount}
⏳ <b>Hạn dùng đến:</b> ${formattedDate}

🌟 <b>Đặc quyền kích hoạt ngay:</b>
1. Xem 100% dự đoán AI bóng đá & bóng rổ không giới hạn.
2. Tham gia nhóm VIP Signals độc quyền: <a href="${this.vipGroupLink}">Tham Gia Kênh VIP Ngay</a>
3. Tự động nhận thông báo biến động Odds & Value Bet 24/7.

Cảm ơn bạn đã đồng hành cùng iKnowBall! 🚀
            `.trim();

            await this.sendMessage(user.telegramChatId, message, 'HTML');
        } catch (error: any) {
            this.logger.warn(`Không thể gửi thông báo kích hoạt subscription qua Telegram: ${error.message}`);
        }
    }

    /**
     * Xử lý Webhook từ Telegram Bot (khi người dùng gửi tin nhắn hoặc bấm Start)
     */
    async handleWebhook(payload: any) {
        if (!payload || !payload.message) {
            return { ok: true, note: 'No message in payload' };
        }

        const msg = payload.message;
        const rawText: string = (msg.text || '').trim();
        const chatId = String(msg.chat?.id);
        const username = msg.from?.username || msg.from?.first_name || 'VIP Member';

        // 1. Xử lý lệnh: /start <token> hoặc /start
        if (rawText.startsWith('/start')) {
            const parts = rawText.split(' ');
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
                            telegramConnectToken: null,
                        },
                    });

                    // Gửi lời chào mừng
                    const welcomeMsg = `
🎉 <b>Chúc mừng! Bạn đã liên kết thành công với iKnowBall VIP</b>

Xin chào <b>${username}</b>, tài khoản Telegram của bạn đã kết nối thành công với email <b>${user.email}</b>.

🌟 <b>Đặc quyền kích hoạt:</b>
• Nhận cảnh báo biến động odds & Value Bet tức thì 24/7
• Truy cập kênh tín hiệu VIP độc quyền: <a href="${this.vipGroupLink}">Tham Gia Kênh VIP</a>
• Gõ <code>/predictions</code> để xem các dự đoán hot hôm nay
• Gõ <code>/vip</code> để kiểm tra tình trạng gói thành viên

Chúc bạn có những nhận định chuẩn xác nhất! ⚽🏀
                    `.trim();

                    await this.sendMessage(chatId, welcomeMsg, 'HTML');
                    return { ok: true, connectedUser: user.email };
                }
            }

            // Trường hợp user gõ /start không có token
            const generalStartMsg = `
👋 <b>Chào mừng bạn đến với iKnowBall Intelligence Bot!</b>

Tôi là bot hỗ trợ cung cấp tín hiệu phân tích dữ liệu thể thao bằng AI từ nền tảng <b>iKnowBall</b>.

🔹 <b>Các lệnh hỗ trợ:</b>
• <code>/predictions</code> - Top dự đoán AI các trận đấu hôm nay
• <code>/odds</code> - Danh sách biến động tỷ lệ kèo & Value Bet mới nhất
• <code>/vip</code> - Tra cứu thông tin gói đăng ký của bạn
• <code>/help</code> - Hướng dẫn chi tiết sử dụng

🔗 <i>Để liên kết tài khoản và nhận thông báo cá nhân hóa, vui lòng vào website iKnowBall > mục VIP Lounge > Kết nối Telegram.</i>
            `.trim();
            await this.sendMessage(chatId, generalStartMsg, 'HTML');
            return { ok: true };
        }

        // 2. Xử lý lệnh: /vip hoặc /status
        if (rawText.startsWith('/vip') || rawText.startsWith('/status')) {
            const user = await this.prisma.user.findUnique({
                where: { telegramChatId: chatId },
                include: {
                    role: true,
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            });

            if (!user) {
                await this.sendMessage(chatId, `
⚠️ <b>Tài khoản chưa được liên kết</b>

Tài khoản Telegram của bạn chưa được liên kết với bất kỳ tài khoản nào trên iKnowBall.
Vui lòng truy cập trang web iKnowBall để lấy mã kết nối 1-chạm nhé!
                `.trim(), 'HTML');
                return { ok: true };
            }

            const sub = user.subscriptions[0];
            const isVip = user.role.name === 'admin' || user.role.name === 'premium' || !!sub;
            const planName = sub ? sub.plan : isVip ? 'Gói Đặc Quyền (Admin/VIP)' : 'Gói Miễn Phí (Free)';
            const expiryStr = sub ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date(sub.currentPeriodEnd)) : (isVip ? 'Vô thời hạn' : 'Không giới hạn');

            const statusMsg = `
👑 <b>THÔNG TIN THÀNH VIÊN iKNOWBALL</b>

👤 <b>Người dùng:</b> ${user.fullName || user.email}
📧 <b>Email:</b> ${user.email}
🎖️ <b>Hạng tài khoản:</b> <b>${planName}</b>
⏳ <b>Hạn dùng:</b> ${expiryStr}
📡 <b>Kênh VIP:</b> <a href="${this.vipGroupLink}">Truy cập Kênh VIP</a>

${isVip ? '✅ <i>Bạn đang được hưởng toàn bộ đặc quyền cảnh báo Real-time và Phân tích AI chuyên sâu!</i>' : '⚡ <i>Nâng cấp gói Pro/VIP trên website để mở khóa 100% dự đoán!</i>'}
            `.trim();

            await this.sendMessage(chatId, statusMsg, 'HTML');
            return { ok: true };
        }

        // 3. Xử lý lệnh: /predictions hoặc /tips
        if (rawText.startsWith('/predictions') || rawText.startsWith('/tips')) {
            try {
                // Lấy 5 trận đấu sắp diễn ra có dự đoán AI
                const now = new Date();
                const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

                const matches = await this.prisma.match.findMany({
                    where: {
                        matchDate: { gte: now, lte: next48Hours },
                        status: { in: ['SCHEDULED', 'LIVE'] },
                    },
                    orderBy: { matchDate: 'asc' },
                    take: 5,
                    include: {
                        homeTeam: true,
                        awayTeam: true,
                        league: true,
                        predictions: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                });

                if (matches.length === 0) {
                    await this.sendMessage(chatId, '⚽ Hiện chưa có lịch thi đấu mới trong 48 giờ tới hoặc đang cập nhật dữ liệu. Bạn hãy quay lại sau nhé!', 'HTML');
                    return { ok: true };
                }

                let tipsMsg = `🎯 <b>TOP DỰ ĐOÁN AI NỔI BẬT HÔM NAY</b>\n\n`;

                for (const m of matches) {
                    const timeStr = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(m.matchDate));
                    const pred = m.predictions[0];

                    tipsMsg += `⚽ <b>${m.homeTeam.name} vs ${m.awayTeam.name}</b>\n`;
                    tipsMsg += `🏆 Giải: <i>${m.league.name}</i> | ⏰ ${timeStr}\n`;

                    if (pred) {
                        const homePct = (Number(pred.homeWinProb) * 100).toFixed(1);
                        const drawPct = pred.drawProb ? (Number(pred.drawProb) * 100).toFixed(1) : '0';
                        const awayPct = (Number(pred.awayWinProb) * 100).toFixed(1);

                        tipsMsg += `📊 Xác suất: 🏠 ${homePct}% | 🤝 ${drawPct}% | ✈️ ${awayPct}%\n`;
                        tipsMsg += `💡 <b>Dự đoán:</b> <code>${pred.predictedOutcome}</code>\n\n`;
                    } else {
                        tipsMsg += `📊 <i>Đang phân tích định lượng...</i>\n\n`;
                    }
                }

                tipsMsg += `👉 Xem đầy đủ phân tích tại: <a href="https://iknowball.com/predictions">iKnowBall Predictions</a>`;

                await this.sendMessage(chatId, tipsMsg, 'HTML');
                return { ok: true };
            } catch (err: any) {
                this.logger.error(`Lỗi xử lý /predictions: ${err.message}`);
                await this.sendMessage(chatId, '❌ Có lỗi khi lấy dữ liệu dự đoán. Vui lòng thử lại sau!', 'HTML');
                return { ok: true };
            }
        }

        // 4. Xử lý lệnh: /odds hoặc /alerts
        if (rawText.startsWith('/odds') || rawText.startsWith('/alerts')) {
            try {
                const alerts = await this.prisma.fluctuationAlert.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 4,
                });

                if (alerts.length === 0) {
                    await this.sendMessage(chatId, '📈 Hiện tại chưa có biến động tỷ lệ odds bất thường nào được ghi nhận. Hệ thống AI đang quét liên tục 24/7.', 'HTML');
                    return { ok: true };
                }

                let alertMsg = `⚡ <b>CẢNH BÁO BIẾN ĐỘNG KÈO & VALUE BETS GẦN NHẤT</b>\n\n`;

                for (const a of alerts) {
                    const emoji = a.type === 'VALUE_BET' ? '🎯' : '⚡';
                    alertMsg += `${emoji} <b>${a.homeTeamName || 'Chủ nhà'} vs ${a.awayTeamName || 'Đội khách'}</b>\n`;
                    alertMsg += `📌 <i>${a.headline}</i>\n`;
                    alertMsg += `💡 ${a.description}\n\n`;
                }

                alertMsg += `👉 Chi tiết: <a href="https://iknowball.com">iKnowBall Live Platform</a>`;
                await this.sendMessage(chatId, alertMsg, 'HTML');
                return { ok: true };
            } catch (err: any) {
                this.logger.error(`Lỗi xử lý /odds: ${err.message}`);
                await this.sendMessage(chatId, '❌ Có lỗi khi tải danh sách cảnh báo. Vui lòng thử lại sau!', 'HTML');
                return { ok: true };
            }
        }

        // 5. Xử lý lệnh: /help
        if (rawText.startsWith('/help')) {
            const helpMsg = `
📖 <b>HƯỚNG DẪN SỬ DỤNG iKNOWBALL VIP BOT</b>

Dưới đây là các lệnh bạn có thể gửi cho bot:

🔹 <code>/predictions</code> - Xem top 5 nhận định & xác suất AI các trận đấu hôm nay
🔹 <code>/odds</code> - Xem cảnh báo biến động odds và tín hiệu Value Bet
🔹 <code>/vip</code> - Tra cứu hạn dùng và tình trạng tài khoản VIP của bạn
🔹 <code>/help</code> - Xem lại hướng dẫn sử dụng

💬 <b>Kênh hỗ trợ kỹ thuật:</b> @iKnowBall_Support
🌐 <b>Website:</b> <a href="https://iknowball.com">iknowball.com</a>
            `.trim();

            await this.sendMessage(chatId, helpMsg, 'HTML');
            return { ok: true };
        }

        // 6. Phản hồi mặc định nếu tin nhắn không thuộc lệnh nào
        await this.sendMessage(chatId, `
🤖 Tôi đã nhận được tin nhắn của bạn. Hãy gửi <code>/help</code> để xem danh sách các lệnh hỗ trợ nhận định và phân tích nhé!
        `.trim(), 'HTML');

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
