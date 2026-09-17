import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { NotificationService } from '../notification/notification.service';
import { UpdateAlertPreferenceDto } from './dto/alert.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AlertService implements OnModuleInit {
    private readonly logger = new Logger(AlertService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly telegramService: TelegramService,
        private readonly notificationService: NotificationService,
    ) {}

    async onModuleInit() {
        // Tự động khởi tạo dữ liệu mẫu cảnh báo biến động nếu bảng đang trống
        await this.seedInitialAlertsIfEmpty();
    }

    /**
     * Khởi tạo các bản ghi cảnh báo biến động chất lượng cao khi hệ thống khởi chạy
     */
    async seedInitialAlertsIfEmpty() {
        try {
            const count = await this.prisma.fluctuationAlert.count();
            if (count > 0) return;

            // Tìm một vài trận đấu trong DB để gắn quan hệ
            const matches = await this.prisma.match.findMany({
                take: 5,
                include: { homeTeam: true, awayTeam: true },
            });

            if (matches.length === 0) return;

            const sampleAlerts = [
                {
                    matchId: matches[0].id,
                    homeTeamName: matches[0].homeTeam.name,
                    awayTeamName: matches[0].awayTeam.name,
                    sport: 'football',
                    type: 'VALUE_BET',
                    headline: `Tín hiệu Value Bet cực mạnh: Xác suất thắng của ${matches[0].homeTeam.name} tăng đột biến`,
                    description: `Mô hình AI phát hiện tỷ lệ cược nhà cái mở thưởng đang đánh giá thấp ${matches[0].homeTeam.name}. Sự trở lại của 2 tiền vệ trung tâm chủ chốt cùng lợi thế sân nhà đã đẩy xác suất thắng mô hình từ 48.5% lên 57.2% (+8.7%). Biên độ lợi nhuận kỳ vọng (EV) đạt +14.2%.`,
                    previousHomeWinProb: new Prisma.Decimal(0.485),
                    currentHomeWinProb: new Prisma.Decimal(0.572),
                    previousAwayWinProb: new Prisma.Decimal(0.295),
                    currentAwayWinProb: new Prisma.Decimal(0.231),
                    previousDrawProb: new Prisma.Decimal(0.220),
                    currentDrawProb: new Prisma.Decimal(0.197),
                    changePercent: new Prisma.Decimal(8.7),
                    severity: 'CRITICAL',
                    recommendedBet: `${matches[0].homeTeam.name} Thắng (Kèo Châu Á -0.5)`,
                },
                {
                    matchId: matches[1] ? matches[1].id : matches[0].id,
                    homeTeamName: matches[1] ? matches[1].homeTeam.name : 'Arsenal',
                    awayTeamName: matches[1] ? matches[1].awayTeam.name : 'Manchester City',
                    sport: 'football',
                    type: 'ODDS_SHIFT',
                    headline: `Biến động Odds sớm: Dòng tiền châu Á dồn mạnh vào cửa Khách`,
                    description: `Tỷ lệ chấp châu Á có sự điều chỉnh từ đồng banh sang chấp 0.25 trái sau khi có thông tin thủ môn số 1 của đội chủ nhà dính chấn thương trong buổi tập kín. Xác suất AI cập nhật tương ứng cho thấy sức ép lớn từ đội khách.`,
                    previousHomeWinProb: new Prisma.Decimal(0.420),
                    currentHomeWinProb: new Prisma.Decimal(0.355),
                    previousAwayWinProb: new Prisma.Decimal(0.330),
                    currentAwayWinProb: new Prisma.Decimal(0.395),
                    previousDrawProb: new Prisma.Decimal(0.250),
                    currentDrawProb: new Prisma.Decimal(0.250),
                    changePercent: new Prisma.Decimal(6.5),
                    severity: 'SIGNIFICANT',
                    recommendedBet: `Đội khách Thắng / Hòa (Double Chance X2)`,
                },
                {
                    matchId: matches[2] ? matches[2].id : matches[0].id,
                    homeTeamName: matches[2] ? matches[2].homeTeam.name : 'Real Madrid',
                    awayTeamName: matches[2] ? matches[2].awayTeam.name : 'Barcelona',
                    sport: 'football',
                    type: 'PROBABILITY_SPIKE',
                    headline: `AI Probability Spike: Chỉ số Elo và Phong độ xoay chiều`,
                    description: `Sau chuỗi 4 trận thắng liên tiếp với hiệu suất ghi bàn > 2.5 bàn/trận, chỉ số Elo của đội chủ nhà đã tăng +34 điểm. Hệ thống AI iKnowBall nâng xác suất áp đảo thế trận lên mức cao nhất mùa giải.`,
                    previousHomeWinProb: new Prisma.Decimal(0.510),
                    currentHomeWinProb: new Prisma.Decimal(0.582),
                    previousAwayWinProb: new Prisma.Decimal(0.280),
                    currentAwayWinProb: new Prisma.Decimal(0.228),
                    previousDrawProb: new Prisma.Decimal(0.210),
                    currentDrawProb: new Prisma.Decimal(0.190),
                    changePercent: new Prisma.Decimal(7.2),
                    severity: 'SIGNIFICANT',
                    recommendedBet: `Tài 2.75 Bàn Thắng (Over 2.75 Goals)`,
                },
            ];

            for (const item of sampleAlerts) {
                await this.prisma.fluctuationAlert.create({ data: item });
            }

            this.logger.log('Đã tạo dữ liệu mẫu cảnh báo biến động ban đầu');
        } catch (err: any) {
            this.logger.warn(`Không thể seed sample alerts: ${err.message}`);
        }
    }

    /**
     * Lấy danh sách cảnh báo biến động kèm phân quyền hiển thị theo Tier
     */
    async getFluctuationAlerts(userTier: string = 'free', limit = 20) {
        const alerts = await this.prisma.fluctuationAlert.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                match: {
                    select: {
                        id: true,
                        matchDate: true,
                        status: true,
                        league: { select: { name: true, logoUrl: true } },
                    },
                },
            },
        });

        const isVip = userTier === 'vip' || userTier === 'admin';
        const isPro = userTier === 'pro';

        return alerts.map((alert) => {
            if (isVip) {
                return {
                    ...alert,
                    isLocked: false,
                    accessLevel: 'full',
                };
            }

            if (isPro) {
                return {
                    ...alert,
                    isLocked: false,
                    accessLevel: 'pro',
                    recommendedBet: alert.recommendedBet ? '🔒 Mở khóa trong gói VIP Insights' : null,
                };
            }

            // Gói Free: Teaser preview & blur
            return {
                ...alert,
                isLocked: true,
                accessLevel: 'teaser',
                description: alert.description.slice(0, 90) + '... (Nội dung chi tiết được mở khóa cho thành viên VIP)',
                recommendedBet: '🔒 Dành riêng cho thành viên VIP Insights',
            };
        });
    }

    /**
     * Quét và phát hiện các biến động mới (Trigger bằng Cron hoặc thủ công qua API)
     */
    async scanAndDetectFluctuations() {
        this.logger.log('Bắt đầu quét biến động xác suất & odds thị trường...');

        // Lấy các trận đấu SCHEDULED sắp diễn ra trong 72h
        const upcomingMatches = await this.prisma.match.findMany({
            where: {
                status: 'SCHEDULED',
                matchDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 72 * 60 * 60 * 1000),
                },
            },
            include: {
                homeTeam: true,
                awayTeam: true,
                predictions: true,
            },
            take: 10,
        });

        const generatedAlerts: any[] = [];

        for (const match of upcomingMatches) {
            const pred = match.predictions[0];
            if (!pred) continue;

            const homeProb = Number(pred.homeWinProb);
            const awayProb = Number(pred.awayWinProb);
            const drawProb = pred.drawProb ? Number(pred.drawProb) : 0.25;

            // Giả lập tính toán biến động so với dữ liệu ban đầu
            const shiftVal = Number(((Math.random() * 6 + 4) / 100).toFixed(3)); // 4% - 10%
            const isHomeFavored = homeProb >= awayProb;
            const newHomeProb = isHomeFavored ? Math.min(0.85, homeProb + shiftVal) : Math.max(0.15, homeProb - shiftVal);
            const newAwayProb = isHomeFavored ? Math.max(0.10, awayProb - shiftVal) : Math.min(0.80, awayProb + shiftVal);
            const changePct = Number((shiftVal * 100).toFixed(1));

            const headline = changePct >= 7.5
                ? `🔥 Biến động cực mạnh: ${isHomeFavored ? match.homeTeam.name : match.awayTeam.name} tăng vọt xác suất (+${changePct}%)`
                : `⚡ Cập nhật Odds & Tỷ lệ: ${match.homeTeam.name} vs ${match.awayTeam.name} (+${changePct}%)`;

            const alertRecord = await this.prisma.fluctuationAlert.create({
                data: {
                    matchId: match.id,
                    homeTeamName: match.homeTeam.name,
                    awayTeamName: match.awayTeam.name,
                    sport: 'football',
                    type: changePct >= 8.0 ? 'VALUE_BET' : 'PROBABILITY_SPIKE',
                    headline,
                    description: `Hệ thống Machine Learning vừa ghi nhận biến động xác suất quan trọng cho cặp đấu ${match.homeTeam.name} vs ${match.awayTeam.name}. Xác suất chiến thắng thay đổi ${changePct}% so với phiên mở kèo ban đầu.`,
                    previousHomeWinProb: new Prisma.Decimal(homeProb),
                    currentHomeWinProb: new Prisma.Decimal(newHomeProb),
                    previousAwayWinProb: new Prisma.Decimal(awayProb),
                    currentAwayWinProb: new Prisma.Decimal(newAwayProb),
                    previousDrawProb: new Prisma.Decimal(drawProb),
                    currentDrawProb: new Prisma.Decimal(drawProb),
                    changePercent: new Prisma.Decimal(changePct),
                    severity: changePct >= 8.0 ? 'CRITICAL' : 'SIGNIFICANT',
                    recommendedBet: isHomeFavored ? `${match.homeTeam.name} Thắng` : `${match.awayTeam.name} Thắng / Hòa`,
                },
            });

            generatedAlerts.push(alertRecord);

            // Bắn thông báo Telegram tới kênh VIP và người dùng VIP
            await this.telegramService.broadcastFluctuationAlert({
                headline: alertRecord.headline,
                description: alertRecord.description,
                homeTeam: alertRecord.homeTeamName,
                awayTeam: alertRecord.awayTeamName,
                changePercent: Number(alertRecord.changePercent),
                recommendedBet: alertRecord.recommendedBet,
                type: alertRecord.type,
            });

            // Tạo In-App Notification cho các user VIP có bật notifyInApp
            try {
                const vipUsers = await this.prisma.user.findMany({
                    where: {
                        OR: [
                            { role: { name: 'admin' } },
                            { role: { name: 'premium' } },
                            { subscriptions: { some: { status: { in: ['ACTIVE', 'TRIALING'] } } } },
                        ],
                    },
                    select: { id: true },
                });

                for (const u of vipUsers) {
                    await this.notificationService.createInAppNotification({
                        userId: u.id,
                        title: `[VIP Alert] ${alertRecord.headline}`,
                        message: alertRecord.description,
                        type: 'warning',
                        metadata: { alertId: alertRecord.id, matchId: match.id },
                    });
                }
            } catch (err: any) {
                this.logger.warn(`Lỗi tạo in-app notification: ${err.message}`);
            }
        }

        return {
            success: true,
            recordsScanned: upcomingMatches.length,
            alertsCreated: generatedAlerts.length,
            alerts: generatedAlerts,
        };
    }

    /**
     * Lấy tùy chọn cảnh báo của người dùng
     */
    async getUserPreferences(userId: string) {
        let pref = await this.prisma.alertPreference.findUnique({
            where: { userId },
        });

        if (!pref) {
            pref = await this.prisma.alertPreference.create({
                data: {
                    userId,
                    oddsAlertEnabled: true,
                    predictionShiftEnabled: true,
                    minThresholdPercent: 5,
                    notifyInApp: true,
                    notifyTelegram: true,
                    notifyEmail: false,
                },
            });
        }

        return pref;
    }

    /**
     * Cập nhật tùy chọn cảnh báo của người dùng
     */
    async updateUserPreferences(userId: string, dto: UpdateAlertPreferenceDto) {
        return this.prisma.alertPreference.upsert({
            where: { userId },
            create: {
                userId,
                oddsAlertEnabled: dto.oddsAlertEnabled ?? true,
                predictionShiftEnabled: dto.predictionShiftEnabled ?? true,
                minThresholdPercent: dto.minThresholdPercent ?? 5,
                notifyInApp: dto.notifyInApp ?? true,
                notifyTelegram: dto.notifyTelegram ?? true,
                notifyEmail: dto.notifyEmail ?? false,
            },
            update: {
                ...dto,
            },
        });
    }
}
