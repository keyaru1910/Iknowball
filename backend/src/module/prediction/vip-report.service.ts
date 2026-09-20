import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PredictionService } from './prediction.service';

export interface VipReportResponse {
  isLocked: boolean;
  userTier: 'guest' | 'free' | 'pro' | 'vip' | 'admin';
  headline: string;
  summary: string;
  tacticalAnalysis?: string;
  keyBattles?: Array<{ title: string; description: string }>;
  predictedScore?: string;
  confidence?: string;
  recommendation?: string;
  generatedBy?: string;
  generatedAt?: string;
  lockedMessage?: string;
  scoreDetails?: Record<string, any>;
}

@Injectable()
export class VipReportService {
  private readonly logger = new Logger(VipReportService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PredictionService)) private readonly predictionService: PredictionService,
  ) {}

  /**
   * Lấy hoặc sinh báo cáo nhận định AI chuyên sâu cho trận đấu (dành cho gói VIP)
   */
  async getOrGenerateVipReport(
    matchId: string,
    user?: { id?: string; role?: string; tier?: string },
    forceRegenerate = false,
  ): Promise<VipReportResponse> {
    let match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: { include: { sport: true } },
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        vipReport: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Không tìm thấy thông tin trận đấu');
    }

    // Đảm bảo trận đấu có dữ liệu dự đoán toán học ML & Poisson xG
    if (!match.predictions?.length) {
      try {
        await this.predictionService.generateForMatch(matchId);
        match = await this.prisma.match.findUnique({
          where: { id: matchId },
          include: {
            homeTeam: true,
            awayTeam: true,
            league: { include: { sport: true } },
            predictions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            vipReport: true,
          },
        }) || match;
      } catch (err: any) {
        this.logger.warn(`[getOrGenerateVipReport] Lỗi khi tự động sinh dự đoán: ${err.message}`);
      }
    }

    // Xác định phân hạng người dùng
    let userTier: 'guest' | 'free' | 'pro' | 'vip' | 'admin' = 'guest';
    let isVip = false;

    if (user?.id) {
      if (user.role === 'admin' || user.tier === 'admin') {
        isVip = true;
        userTier = 'admin';
      } else if (user.tier === 'vip') {
        isVip = true;
        userTier = 'vip';
      } else {
        const activeSub = await this.prisma.subscription.findFirst({
          where: {
            userId: user.id,
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
            currentPeriodEnd: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (activeSub) {
          if ([SubscriptionPlan.VIP_MONTHLY, SubscriptionPlan.VIP_YEARLY].includes(activeSub.plan as any)) {
            isVip = true;
            userTier = 'vip';
          } else {
            userTier = 'pro';
          }
        } else if (user.role === 'premium') {
          userTier = 'pro';
        } else {
          userTier = 'free';
        }
      }
    }

    // Kiểm tra xem đã có báo cáo trong DB chưa (nếu không bắt buộc regenerate)
    let report = match.vipReport;

    if (!report || forceRegenerate) {
      report = await this.generateAndSaveReport(match);
    }

    const prediction = match.predictions?.[0];
    const scoreDetails = (prediction?.featuresSnapshot as any)?.scoreDetails ||
                         (prediction?.featuresSnapshot as any)?.explanation?.scoreDetails;

    // Nếu người dùng không phải VIP/Admin, trả về bản Teaser Preview bị khóa
    if (!isVip) {
      const teaserSummary = report.summary.length > 120
        ? report.summary.slice(0, 120) + '...'
        : report.summary;

      return {
        isLocked: true,
        userTier,
        headline: report.headline,
        summary: teaserSummary,
        confidence: '👑 VIP Insights Exclusive',
        lockedMessage:
          'Phân tích chiến thuật chuyên sâu, sơ đồ khắc chế và dự đoán kịch bản tỷ số chỉ dành riêng cho thành viên VIP Insights. Nâng cấp ngay để mở khóa toàn bộ báo cáo!',
      };
    }

    // Trả về báo cáo đầy đủ cho VIP/Admin
    return {
      isLocked: false,
      userTier,
      headline: report.headline,
      summary: report.summary,
      tacticalAnalysis: report.tacticalAnalysis,
      keyBattles: (report.keyBattles as any) || [],
      predictedScore: report.predictedScore || undefined,
      confidence: report.confidence || 'HIGH',
      recommendation: report.recommendation || undefined,
      generatedBy: report.generatedBy,
      generatedAt: report.createdAt.toISOString(),
      scoreDetails,
    };
  }

  /**
   * Sinh báo cáo nhận định AI và lưu vào DB với Deep Context
   */
  private async generateAndSaveReport(match: any) {
    const prediction = match.predictions?.[0];
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;
    const league = match.league;
    const isBasketball = league.sport?.name === 'basketball' || league.sportId?.includes('basketball');

    // Lấy ngữ cảnh sâu từ DB (Elo, Stats, Standing, Top Players, News)
    const [
      homeStats,
      awayStats,
      h2hMatches,
      homeStanding,
      awayStanding,
      homeSeasonStats,
      awaySeasonStats,
      topPlayersHome,
      topPlayersAway,
      relatedNews,
    ] = await Promise.all([
      this.prisma.teamStats.findFirst({
        where: { teamId: homeTeam.id, leagueId: league.id },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.teamStats.findFirst({
        where: { teamId: awayTeam.id, leagueId: league.id },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.match.findMany({
        where: {
          OR: [
            { homeTeamId: homeTeam.id, awayTeamId: awayTeam.id },
            { homeTeamId: awayTeam.id, awayTeamId: homeTeam.id },
          ],
          status: 'FINISHED',
        },
        orderBy: { matchDate: 'desc' },
        take: 5,
      }),
      this.prisma.standing.findUnique({
        where: { leagueId_teamId_season: { leagueId: league.id, teamId: homeTeam.id, season: match.season } },
      }),
      this.prisma.standing.findUnique({
        where: { leagueId_teamId_season: { leagueId: league.id, teamId: awayTeam.id, season: match.season } },
      }),
      this.prisma.teamSeasonStatistics.findUnique({
        where: { teamId_leagueId_season: { teamId: homeTeam.id, leagueId: league.id, season: match.season } },
      }),
      this.prisma.teamSeasonStatistics.findUnique({
        where: { teamId_leagueId_season: { teamId: awayTeam.id, leagueId: league.id, season: match.season } },
      }),
      this.prisma.playerStatistics.findMany({
        where: { teamId: homeTeam.id, leagueId: league.id, season: match.season },
        orderBy: isBasketball ? { pointsAvg: 'desc' } : { goals: 'desc' },
        take: 3,
      }),
      this.prisma.playerStatistics.findMany({
        where: { teamId: awayTeam.id, leagueId: league.id, season: match.season },
        orderBy: isBasketball ? { pointsAvg: 'desc' } : { goals: 'desc' },
        take: 3,
      }),
      this.prisma.newsArticle.findMany({
        where: {
          OR: [
            { title: { contains: homeTeam.name, mode: 'insensitive' } },
            { title: { contains: awayTeam.name, mode: 'insensitive' } },
          ],
        },
        take: 2,
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    const homeElo = homeStats ? Number(homeStats.eloRating) : 1500;
    const awayElo = awayStats ? Number(awayStats.eloRating) : 1500;
    const homeProb = prediction ? Math.round(Number(prediction.homeWinProb) * 100) : 50;
    const drawProb = prediction?.drawProb ? Math.round(Number(prediction.drawProb) * 100) : (isBasketball ? 0 : 25);
    const awayProb = prediction ? Math.round(Number(prediction.awayWinProb) * 100) : 50;

    const scoreDetails = (prediction?.featuresSnapshot as any)?.scoreDetails ||
                         (prediction?.featuresSnapshot as any)?.explanation?.scoreDetails;

    let generatedData: {
      headline: string;
      summary: string;
      tacticalAnalysis: string;
      keyBattles: Array<{ title: string; description: string }>;
      predictedScore: string;
      confidence: string;
      recommendation: string;
      generatedBy: string;
    };

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_KEY;
    if (geminiKey) {
      try {
        generatedData = await this.callGeminiApi(geminiKey, {
          homeName: homeTeam.name,
          awayName: awayTeam.name,
          leagueName: league.name,
          homeElo,
          awayElo,
          homeProb,
          drawProb,
          awayProb,
          h2hCount: h2hMatches.length,
          sport: isBasketball ? 'bóng rổ' : 'bóng đá',
          isBasketball,
          homeStandingRank: homeStanding?.rank,
          awayStandingRank: awayStanding?.rank,
          homeSeasonStats,
          awaySeasonStats,
          topPlayersHome,
          topPlayersAway,
          recentNews: relatedNews.map((n) => n.title),
          scoreDetails,
        });
      } catch (err: any) {
        this.logger.warn(`Lỗi khi gọi Gemini Flash API: ${err.message}. Chuyển sang Heuristic AI Synthesis.`);
        generatedData = this.generateHeuristicReport({
          homeName: homeTeam.name,
          awayName: awayTeam.name,
          leagueName: league.name,
          homeElo,
          awayElo,
          homeProb,
          drawProb,
          awayProb,
          isBasketball,
          homeSeasonStats,
          awaySeasonStats,
          scoreDetails,
        });
      }
    } else {
      generatedData = this.generateHeuristicReport({
        homeName: homeTeam.name,
        awayName: awayTeam.name,
        leagueName: league.name,
        homeElo,
        awayElo,
        homeProb,
        drawProb,
        awayProb,
        isBasketball,
        homeSeasonStats,
        awaySeasonStats,
        scoreDetails,
      });
    }

    return await this.prisma.vipMatchReport.upsert({
      where: { matchId: match.id },
      create: {
        matchId: match.id,
        headline: generatedData.headline,
        summary: generatedData.summary,
        tacticalAnalysis: generatedData.tacticalAnalysis,
        keyBattles: generatedData.keyBattles,
        predictedScore: generatedData.predictedScore,
        confidence: generatedData.confidence,
        recommendation: generatedData.recommendation,
        generatedBy: generatedData.generatedBy,
      },
      update: {
        headline: generatedData.headline,
        summary: generatedData.summary,
        tacticalAnalysis: generatedData.tacticalAnalysis,
        keyBattles: generatedData.keyBattles,
        predictedScore: generatedData.predictedScore,
        confidence: generatedData.confidence,
        recommendation: generatedData.recommendation,
        generatedBy: generatedData.generatedBy,
      },
    });
  }

  /**
   * Gọi Google Gemini API với Deep Context Prompt
   */
  private async callGeminiApi(
    apiKey: string,
    context: {
      homeName: string;
      awayName: string;
      leagueName: string;
      homeElo: number;
      awayElo: number;
      homeProb: number;
      drawProb: number;
      awayProb: number;
      h2hCount: number;
      sport: string;
      isBasketball: boolean;
      homeStandingRank?: number;
      awayStandingRank?: number;
      homeSeasonStats?: any;
      awaySeasonStats?: any;
      topPlayersHome?: any[];
      topPlayersAway?: any[];
      recentNews?: string[];
      scoreDetails?: any;
    },
  ) {
    const domainSpecificPrompt = context.isBasketball
      ? `- Môn: BÓNG RỔ (NBA / Basketball).
- Yêu cầu phong cách: Sử dụng chuẩn xác các thuật ngữ bóng rổ (Pace & Space, Khả năng ném 3 điểm 3PT%, Tranh chấp Rebound bảng rổ, Điểm phản công nhanh Fast-break, Khắc chế Pick-and-Roll, Thể lực Back-to-Back).
- Điểm ghi TB: ${context.homeName} (${context.homeSeasonStats?.pointsForAvg ?? 112} pts) vs ${context.awayName} (${context.awaySeasonStats?.pointsForAvg ?? 110} pts).
- Kèo chấp điểm AI dự báo: ${context.scoreDetails?.projectedSpread ?? (context.homeProb > context.awayProb ? '-4.5' : '+4.5')}, Tổng điểm O/U: ${context.scoreDetails?.projectedTotalPoints ?? '220.5'}.`
      : `- Môn: BÓNG ĐÁ (Football / Soccer).
- Yêu cầu phong cách: Sử dụng chuẩn xác các thuật ngữ bóng đá (Pressing tầm cao, Khối phòng ngự thấp Low-block, Chuyển đổi trạng thái Transition, Tình huống cố định Set-piece, Hiệu suất bàn thắng xG).
- Hiệu số mùa: ${context.homeName} (${context.homeSeasonStats?.goalsFor ?? 25} bàn ghi/${context.homeSeasonStats?.goalsAgainst ?? 18} bàn lọt) vs ${context.awayName} (${context.awaySeasonStats?.goalsFor ?? 20} bàn ghi/${context.awaySeasonStats?.goalsAgainst ?? 22} bàn lọt).
- Dự đoán tỷ số Poisson: ${context.scoreDetails?.predictedScore ?? '2-1'}, Tài Xỉu 2.5: ${(context.scoreDetails?.overUnder25?.overProb ?? 0.55) * 100}% Tài.`;

    const prompt = `Bạn là một Chuyên Gia Phân Tích Dữ Liệu Thể Thao Cao Cấp tại iKnowBall VIP Insights.
Hãy phân tích trận đấu sau bằng tiếng Việt với phong cách sắc bén, chuyên môn sâu sắc, học thuật và định lượng:
- Trận đấu: ${context.homeName} (Chủ nhà, Hạng ${context.homeStandingRank ?? '-'}) vs ${context.awayName} (Khách, Hạng ${context.awayStandingRank ?? '-'})
- Giải đấu: ${context.leagueName}
- Điểm Elo Rating: ${context.homeName} (${context.homeElo}) vs ${context.awayName} (${context.awayElo}) (Chênh lệch: ${context.homeElo - context.awayElo} điểm)
- Xác suất ML iKnowBall: Chủ nhà thắng ${context.homeProb}%, ${context.isBasketball ? '' : `Hòa ${context.drawProb}%, `}Khách thắng ${context.awayProb}%
- Số trận đối đầu ghi nhận: ${context.h2hCount} trận.
${domainSpecificPrompt}
${context.recentNews?.length ? `- Tin tức nóng liên quan: ${context.recentNews.join(' | ')}` : ''}

Yêu cầu trả về JSON chuẩn DUY NHẤT (không bọc trong markdown code fence, không có chữ ngoài json):
{
  "headline": "Tiêu đề bài nhận định giật tít chuyên môn sâu sắc",
  "summary": "Đoạn tóm tắt tổng quan từ 2 đến 3 câu về tương quan lực lượng và bối cảnh trận đấu.",
  "tacticalAnalysis": "Phân tích chiến thuật chi tiết 200-350 từ: Lối chơi chủ đạo, điểm nóng then chốt, khắc chế chiến thuật và khả năng tận dụng sai lầm đối phương.",
  "keyBattles": [
    { "title": "Tên điểm nóng 1", "description": "Mô tả phân tích cuộc đối đầu then chốt" },
    { "title": "Tên điểm nóng 2", "description": "Mô tả phân tích cuộc đối đầu then chốt" }
  ],
  "predictedScore": "${context.isBasketball ? '112-106' : '2-1'}",
  "confidence": "HIGH hoặc MEDIUM",
  "recommendation": "Khuyến nghị góc nhìn dữ liệu cho nhà phân tích"
}`;

    // Thử gọi gemini-2.0-flash hoặc gemini-1.5-flash
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    ];

    let lastErr: Error | null = null;
    for (const url of endpoints) {
      try {
        const response = await axios.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1200,
            },
          },
          { timeout: 9000 },
        );

        const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        return {
          headline: parsed.headline || `${context.homeName} vs ${context.awayName}: Cục diện chiến thuật`,
          summary: parsed.summary || 'Tóm tắt phân tích trận đấu.',
          tacticalAnalysis: parsed.tacticalAnalysis || 'Phân tích chiến thuật chi tiết.',
          keyBattles: parsed.keyBattles || [],
          predictedScore: parsed.predictedScore || context.scoreDetails?.predictedScore || (context.homeProb > context.awayProb ? (context.isBasketball ? '112-106' : '2-1') : (context.isBasketball ? '104-110' : '1-2')),
          confidence: parsed.confidence || 'HIGH',
          recommendation: parsed.recommendation || 'Xem xét các chỉ số tương quan thực tế.',
          generatedBy: 'GEMINI_FLASH',
        };
      } catch (err: any) {
        lastErr = err;
      }
    }

    throw lastErr || new Error('Gemini API call failed');
  }

  /**
   * Bộ sinh báo cáo chuyên sâu Heuristic Fallback phân định rõ Bóng đá và Bóng rổ
   */
  private generateHeuristicReport(ctx: {
    homeName: string;
    awayName: string;
    leagueName: string;
    homeElo: number;
    awayElo: number;
    homeProb: number;
    drawProb: number;
    awayProb: number;
    isBasketball: boolean;
    homeSeasonStats?: any;
    awaySeasonStats?: any;
    scoreDetails?: any;
  }) {
    const eloDiff = ctx.homeElo - ctx.awayElo;
    const isHomeFavored = ctx.homeProb >= ctx.awayProb;
    const dominantProb = Math.max(ctx.homeProb, ctx.awayProb, ctx.drawProb || 0);

    let confidence = 'HIGH';
    if (dominantProb < 45) {
      confidence = 'MODERATE';
    } else if (dominantProb < 60) {
      confidence = 'MEDIUM';
    }

    if (ctx.isBasketball) {
      // 🏀 BÓNG RỔ HEURISTIC
      const projectedSpread = ctx.scoreDetails?.projectedSpread ?? (eloDiff > 0 ? -4.5 : 4.5);
      const predictedScore = ctx.scoreDetails?.predictedScore ?? (isHomeFavored ? '114-108' : '106-112');
      const stronger = isHomeFavored ? ctx.homeName : ctx.awayName;
      const weaker = isHomeFavored ? ctx.awayName : ctx.homeName;
      const favoredProb = Math.max(ctx.homeProb, ctx.awayProb);

      return {
        headline: `${stronger} Nắm Ưu Thế Nhịp Độ Trận Đấu Trước ${weaker} Tại ${ctx.leagueName}`,
        summary: `Mô hình AI dự báo ${stronger} chiếm ưu thế về hiệu suất tấn công và khả năng kiểm soát khu vực dưới bảng rổ. Lợi thế chuyên môn giúp ${stronger} đạt xác suất thắng ${favoredProb}%.`,
        tacticalAnalysis: `${stronger} có xu hướng đẩy nhanh nhịp độ (Pace) và khai thác triệt để các pha chuyển trạng thái phản công nhanh (Fast-break). Ngược lại, ${weaker} cần chú trọng kiểm soát bóng và hạn chế tối đa các tình huống mất bóng (Turnovers) để không bị đối phương nới rộng cách biệt điểm số. Kèo chấp điểm dự kiến xoay quanh mốc ${projectedSpread > 0 ? `+${projectedSpread}` : projectedSpread} điểm.`,
        keyBattles: [
          {
            title: `Trận địa tranh chấp Rebound & Hiệu suất ném ngoài vòng cung (3PT%)`,
            description: `Khả năng bảo vệ bảng rổ phòng ngự và tận dụng các cơ hội ném 3 điểm trống trải sẽ là thước đo định đoạt thế trận.`,
          },
          {
            title: `Khắc chế Pick-and-Roll & Chiều sâu đội hình băng ghế dự bị`,
            description: `Khả năng xoay tua đội hình và duy trì hiệu suất ghi điểm của dàn dự bị (Bench units) trong hiệp 2 và hiệp 3.`,
          },
        ],
        predictedScore,
        confidence,
        recommendation: `Kịch bản ${stronger} giành thắng lợi với cách biệt điểm số dự báo là phương án có độ tin cậy thống kê cao.`,
        generatedBy: 'HEURISTIC_AI',
      };
    } else {
      // ⚽ BÓNG ĐÁ HEURISTIC
      // Lấy tỷ số dự đoán từ mô hình Poisson xG hoặc suy luận phù hợp
      let predictedScore = ctx.scoreDetails?.predictedScore;
      if (!predictedScore) {
        if (ctx.homeProb >= 55) predictedScore = '2-1';
        else if (ctx.awayProb >= 55) predictedScore = '1-2';
        else if (ctx.drawProb >= 30) predictedScore = '1-1';
        else predictedScore = isHomeFavored ? '2-1' : '1-2';
      }

      // Kịch bản 1: Đội nhà áp đảo rõ rệt
      if (ctx.homeProb >= 55 || eloDiff >= 70) {
        return {
          headline: `${ctx.homeName} Nắm Thế Chủ Động & Áp Đặt Sức Ép Trước ${ctx.awayName}`,
          summary: `Điểm tựa sân nhà kết hợp cùng chỉ số Elo vượt trội (${ctx.homeElo} vs ${ctx.awayElo}) mang lại cho ${ctx.homeName} cơ hội chiến thắng lên tới ${ctx.homeProb}%.`,
          tacticalAnalysis: `${ctx.homeName} nhiều khả năng sẽ dâng cao đội hình nhằm áp đặt quyền kiểm soát ngay từ khu vực 1/3 sân đối phương. Về phía ${ctx.awayName}, phòng ngự khối thấp (Low-block) và chờ đợi cơ hội phản công biên sẽ là phương án khả dĩ nhất để nuôi hy vọng có điểm.`,
          keyBattles: [
            {
              title: `Khả năng xuyên phá hành lang cánh & Tận dụng bóng cố định`,
              description: `Sức ép liên tục từ các quả tạt và tình huống phạt góc của ${ctx.homeName} sẽ thử thách độ tập trung của hàng thủ ${ctx.awayName}.`,
            },
            {
              title: `Tốc độ chuyển đổi trạng thái phản công của ${ctx.awayName}`,
              description: `Khai thác khoảng trống sau lưng các hậu vệ dâng cao của đội chủ nhà sẽ là chìa khóa duy nhất cho đội khách.`,
            },
          ],
          predictedScore,
          confidence,
          recommendation: `Kịch bản ${ctx.homeName} kiểm soát thế trận và giành trọn 3 điểm có độ hội tụ xác suất cao (${ctx.homeProb}%).`,
          generatedBy: 'HEURISTIC_AI',
        };
      }

      // Kịch bản 2: Đội khách vượt trội
      if (ctx.awayProb >= 55 || eloDiff <= -70) {
        return {
          headline: `${ctx.awayName} Thể Hiện Bản Lĩnh Vượt Trội Khi Hành Quân Tới Sân ${ctx.homeName}`,
          summary: `Dù phải thi đấu xa nhà, ${ctx.awayName} với mức Elo ${ctx.awayElo} vượt trội so với ${ctx.homeElo} của đội chủ nhà được mô hình định lượng đánh giá nắm giữ ${ctx.awayProb}% cơ hội chiến thắng.`,
          tacticalAnalysis: `${ctx.awayName} sở hữu chiều sâu đội hình và tính tổ chức đồng bộ, giúp họ duy trì cự ly đội hình lý tưởng và áp đặt nhịp điệu thi đấu. ${ctx.homeName} sẽ cần phải duy trì sự tập trung tối đa ở hàng thủ và hạn chế tối đa các lỗi cá nhân nguy hiểm trước vòng cấm.`,
          keyBattles: [
            {
              title: `Khả năng kiểm soát trung tuyến của ${ctx.awayName}`,
              description: `Trục tiền vệ của đội khách có khả năng thoát pressing và phân phối bóng tốt hơn, giúp duy trì quyền kiểm soát bóng chủ động.`,
            },
            {
              title: `Khả năng phong tỏa ngòi nổ tấn công của ${ctx.homeName}`,
              description: `Hàng thủ ${ctx.homeName} cần tổ chức bọc lót nhiều lớp để ngăn chặn các đường chuyền chọc khe trung lộ.`,
            },
          ],
          predictedScore,
          confidence,
          recommendation: `Mô hình dự báo ưu thế trọn vẹn dành cho ${ctx.awayName} (${ctx.awayProb}% xác suất thắng).`,
          generatedBy: 'HEURISTIC_AI',
        };
      }

      // Kịch bản 3: Thế trận giằng co / Tương đương Elo
      return {
        headline: `${ctx.homeName} vs ${ctx.awayName}: Thế Trận Cân Não & Trận Đấu Giằng Co`,
        summary: `Hai đội có mức điểm Elo tương đương (${ctx.homeElo} vs ${ctx.awayElo}), hứa hẹn một màn so tài quyết liệt. Lợi thế sân nhà giúp ${ctx.homeName} đạt ${ctx.homeProb}% cơ hội thắng, trong khi tỷ lệ hòa được ghi nhận ở mức ${ctx.drawProb}%.`,
        tacticalAnalysis: `Cả hai câu lạc bộ đều sở hữu hệ thống pressing tầm trung chặt chẽ và không muốn để lộ sơ hở sớm. Khu trung tuyến sẽ là chiến trường nảy lửa nơi các tiền vệ tranh chấp từng mét vuông sân. Trận đấu nhiều khả năng được định đoạt bởi một khoảnh khắc tỏa sáng cá nhân hoặc tình huống cố định.`,
        keyBattles: [
          {
            title: `Cuộc chiến đoạt bóng 2 & Nhịp điệu trung tuyến`,
            description: `Khả năng tranh chấp bóng hai (second ball) và duy trì cự ly đội hình sẽ quyết định bên nào làm chủ cục diện trên sân.`,
          },
          {
            title: `Khoảnh khắc đột biến cá nhân & Tận dụng tình huống cố định`,
            description: `Trong thế trận giằng co chặt chẽ, các pha đá phạt trực tiếp hoặc phạt góc sẽ là chìa khóa mở khóa tỷ số trận đấu.`,
          },
        ],
        predictedScore,
        confidence,
        recommendation: `Trận đấu có tính cân bằng cao. Dự kiến tỷ số sát nút với xác suất cao thuộc về kịch bản ${predictedScore}.`,
        generatedBy: 'HEURISTIC_AI',
      };
    }
  }

  /**
   * Trợ lý ảo AI hỏi đáp thông minh theo trận đấu (Match AI Chat Assistant)
   */
  async chatWithMatchAi(
    matchId: string,
    message: string,
    user?: { id?: string; role?: string; tier?: string },
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: { include: { sport: true } },
        predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
        vipReport: true,
      },
    });

    if (!match) throw new NotFoundException('Không tìm thấy thông tin trận đấu');

    const isBasketball = match.league.sport?.name === 'basketball';
    const pred = match.predictions?.[0];
    const scoreDetails = (pred?.featuresSnapshot as any)?.scoreDetails ||
                         (pred?.featuresSnapshot as any)?.explanation?.scoreDetails;

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_KEY;
    if (!geminiKey) {
      return {
        reply: `Dựa trên dữ liệu định lượng của iKnowBall: ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.league.name}), xác suất chiến thắng nghiêng về ${Number(pred?.homeWinProb ?? 0.5) >= Number(pred?.awayWinProb ?? 0.5) ? match.homeTeam.name : match.awayTeam.name} (${Math.round(Math.max(Number(pred?.homeWinProb ?? 0.5), Number(pred?.awayWinProb ?? 0.5)) * 100)}%). ${scoreDetails?.predictedScore ? `Tỷ số dự kiến: ${scoreDetails.predictedScore}.` : ''}`,
      };
    }

    const prompt = `Bạn là Trợ Lý Phân Tích Dữ Liệu Thể Thao Cao Cấp iKnowBall.
Dưới đây là thông tin trận đấu:
- Trận: ${match.homeTeam.name} (Sân nhà) vs ${match.awayTeam.name} (Khách)
- Môn: ${isBasketball ? 'Bóng rổ' : 'Bóng đá'} (${match.league.name})
- Xác suất AI: Chủ nhà ${Math.round(Number(pred?.homeWinProb ?? 0.5) * 100)}%, Khách ${Math.round(Number(pred?.awayWinProb ?? 0.5) * 100)}%
- Chi tiết tỷ số/kèo AI: ${JSON.stringify(scoreDetails || {})}
- Tóm tắt VIP: ${match.vipReport?.summary || ''}

Người dùng hỏi: "${message}"
Hãy trả lời ngắn gọn (3 đến 5 câu), súc tích, mang tính chuyên môn cao, định lượng và tập trung thẳng vào câu hỏi của người dùng bằng tiếng Việt.`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { timeout: 9000 },
      );
      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Chưa thể phân tích câu trả lời vào lúc này.';
      return { reply: reply.trim() };
    } catch {
      return {
        reply: `Theo phân tích mô hình iKnowBall cho trận ${match.homeTeam.name} vs ${match.awayTeam.name}: Lợi thế đang nghiêng về ${Number(pred?.homeWinProb ?? 0.5) >= Number(pred?.awayWinProb ?? 0.5) ? match.homeTeam.name : match.awayTeam.name} với tỷ lệ thắng xấp xỉ ${Math.round(Math.max(Number(pred?.homeWinProb ?? 0.5), Number(pred?.awayWinProb ?? 0.5)) * 100)}%.`,
      };
    }
  }
}
