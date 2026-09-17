import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

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
}

@Injectable()
export class VipReportService {
  private readonly logger = new Logger(VipReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy hoặc sinh báo cáo nhận định AI chuyên sâu cho trận đấu (dành cho gói VIP)
   */
  async getOrGenerateVipReport(
    matchId: string,
    user?: { id?: string; role?: string; tier?: string },
  ): Promise<VipReportResponse> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
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

    // Kiểm tra xem đã có báo cáo trong DB chưa
    let report = match.vipReport;

    if (!report) {
      report = await this.generateAndSaveReport(match);
    }

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
    };
  }

  /**
   * Sinh báo cáo nhận định AI và lưu vào DB
   */
  private async generateAndSaveReport(match: any) {
    const prediction = match.predictions?.[0];
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;
    const league = match.league;

    // Lấy thống kê Elo và phong độ của 2 đội
    const [homeStats, awayStats, h2hMatches] = await Promise.all([
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
    ]);

    const homeElo = homeStats ? Number(homeStats.eloRating) : 1500;
    const awayElo = awayStats ? Number(awayStats.eloRating) : 1500;
    const homeProb = prediction ? Math.round(Number(prediction.homeWinProb) * 100) : 45;
    const drawProb = prediction?.drawProb ? Math.round(Number(prediction.drawProb) * 100) : 25;
    const awayProb = prediction ? Math.round(Number(prediction.awayWinProb) * 100) : 30;

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

    // Thử gọi Gemini API nếu có cấu hình GEMINI_API_KEY
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
          sport: league.sportId?.includes('basketball') ? 'bóng rổ' : 'bóng đá',
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
          h2hMatches,
          homeStats,
          awayStats,
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
        h2hMatches,
        homeStats,
        awayStats,
      });
    }

    // Lưu vào database
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
   * Gọi Google Gemini API để sinh báo cáo
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
    },
  ) {
    const prompt = `Bạn là một Chuyên Gia Phân Tích Dữ Liệu Thể Thao Cao Cấp tại iKnowBall VIP Insights.
Hãy phân tích trận đấu sau bằng tiếng Việt với phong cách sắc bén, chuyên sâu, học thuật và định lượng:
- Trận đấu: ${context.homeName} (Chủ nhà) vs ${context.awayName} (Khách)
- Giải đấu: ${context.leagueName} (${context.sport})
- Điểm Elo Rating: ${context.homeName} (${context.homeElo}) vs ${context.awayName} (${context.awayElo}) (Chênh lệch: ${context.homeElo - context.awayElo} điểm)
- Xác suất Machine Learning iKnowBall: Chủ nhà thắng ${context.homeProb}%, Hòa ${context.drawProb}%, Khách thắng ${context.awayProb}%
- Số trận đối đầu gần đây ghi nhận: ${context.h2hCount} trận.

Yêu cầu trả về JSON chuẩn DUY NHẤT (không bọc trong markdown code fence, không có chữ ngoài json):
{
  "headline": "Tiêu đề bài nhận định giật tít chuyên môn sâu sắc",
  "summary": "Đoạn tóm tắt tổng quan từ 2 đến 3 câu về tương quan lực lượng và bối cảnh trận đấu.",
  "tacticalAnalysis": "Phân tích chiến thuật chi tiết 200-350 từ: Lối chơi chủ đạo, điểm nóng tuyến giữa, khả năng chuyển trạng thái và điểm yếu cấu trúc phòng ngự.",
  "keyBattles": [
    { "title": "Tên điểm nóng 1", "description": "Mô tả phân tích cuộc đối đầu then chốt" },
    { "title": "Tên điểm nóng 2", "description": "Mô tả phân tích cuộc đối đầu then chốt" }
  ],
  "predictedScore": "Tỷ số dự đoán sát thực nhất (Ví dụ: '2-1' hoặc '1-1')",
  "confidence": "Mức độ tự tin: 'HIGH' hoặc 'MEDIUM' hoặc 'MODERATE'",
  "recommendation": "Khuyến nghị góc nhìn dữ liệu cho nhà phân tích"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      },
      { timeout: 10000 },
    );

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      headline: parsed.headline || `${context.homeName} vs ${context.awayName}: Cục diện chiến thuật`,
      summary: parsed.summary || 'Tóm tắt phân tích trận đấu.',
      tacticalAnalysis: parsed.tacticalAnalysis || 'Phân tích chiến thuật chi tiết.',
      keyBattles: parsed.keyBattles || [],
      predictedScore: parsed.predictedScore || (context.homeProb > context.awayProb ? '2-1' : '1-2'),
      confidence: parsed.confidence || 'HIGH',
      recommendation: parsed.recommendation || 'Xem xét các chỉ số tương quan thực tế.',
      generatedBy: 'GEMINI_FLASH',
    };
  }

  /**
   * Bộ sinh báo cáo chuyên sâu dựa trên thuật toán Heuristic & Dữ liệu thực tế (Fallback 100% tin cậy)
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
    h2hMatches: any[];
    homeStats: any;
    awayStats: any;
  }) {
    const eloDiff = ctx.homeElo - ctx.awayElo;
    const isHomeFavored = ctx.homeProb > ctx.awayProb;
    const dominantProb = Math.max(ctx.homeProb, ctx.awayProb, ctx.drawProb);

    let confidence = 'HIGH';
    if (dominantProb < 45) {
      confidence = 'MODERATE';
    } else if (dominantProb < 60) {
      confidence = 'MEDIUM';
    }

    let headline = '';
    let summary = '';
    let tacticalAnalysis = '';
    let predictedScore = '2-1';
    let recommendation = '';

    if (Math.abs(eloDiff) > 80) {
      const stronger = eloDiff > 0 ? ctx.homeName : ctx.awayName;
      const weaker = eloDiff > 0 ? ctx.awayName : ctx.homeName;
      headline = `${stronger} Áp Đảo Về Đẳng Cấp Elo Trước ${weaker} Tại ${ctx.leagueName}`;
      summary = `Mô hình AI ghi nhận chênh lệch thực lực đáng kể (${Math.abs(eloDiff)} điểm Elo) nghiêng về ${stronger}. Lợi thế chiều sâu đội hình và tính tổ chức lối chơi tạo cơ sở vững chắc cho khả năng kiểm soát thế trận của ${stronger}.`;
      tacticalAnalysis = `${stronger} có xu hướng đẩy cao cự ly đội hình và áp đặt quyền kiểm soát ở 1/3 sân đối phương. Trái lại, ${weaker} nhiều khả năng phải lùi sâu phòng ngự khối thấp (low-block) và chờ đợi cơ hội phản công từ các đường bóng dài. Điểm quyết định cục diện sẽ nằm ở khả năng chuyển hóa cơ hội từ các pha đánh biên và tình huống cố định của ${stronger}.`;
      predictedScore = eloDiff > 0 ? '2-0' : '1-2';
      recommendation = `Kịch bản ${stronger} giành trọn điểm số có độ hội tụ xác suất cao nhất (${Math.max(ctx.homeProb, ctx.awayProb)}%).`;
    } else {
      headline = `${ctx.homeName} vs ${ctx.awayName}: Thế Trận Cân Não & Trận Đấu Giằng Co`;
      summary = `Hai đội có mức điểm Elo tương đương (${ctx.homeElo} vs ${ctx.awayElo}), hứa hẹn một màn so tài quyết liệt. Lợi thế sân nhà ${ctx.homeName} đóng vai trò then chốt giúp nâng xác suất chiến thắng lên ${ctx.homeProb}%.`;
      tacticalAnalysis = `Cả hai câu lạc bộ đều sở hữu hệ thống pressing tầm trung chặt chẽ. Khu trung tuyến sẽ là chiến trường nảy lửa nơi các tiền vệ tranh chấp từng mét vuông sân. Với tỷ lệ hòa dự báo ở mức ${ctx.drawProb}%, trận đấu có thể được định đoạt bởi khoảnh khắc tỏa sáng cá nhân hoặc một sai lầm nhỏ ở hàng thủ.`;
      predictedScore = ctx.homeProb >= 40 ? '2-1' : (ctx.awayProb >= 40 ? '1-2' : '1-1');
      recommendation = `Trận đấu có tính rủi ro cân bằng cao. Nên chú trọng yếu tố bàn thắng hiệp 2 và khả năng xoay chuyển nhân sự từ băng ghế dự bị.`;
    }

    const keyBattles = [
      {
        title: `Trận địa tuyến giữa & Tỷ lệ kiểm soát bóng`,
        description: `Khả năng thoát pressing và phân phối bóng của trục tiền vệ ${isHomeFavored ? ctx.homeName : ctx.awayName} sẽ quyết định nhịp độ và quyền chủ động trên sân.`,
      },
      {
        title: `Hiệu suất chuyển hóa cơ hội phản công`,
        description: `Hàng thủ ${ctx.awayName} cần cảnh giác cao độ với các pha khoét nách trung lộ và tình huống cố định từ phía ${ctx.homeName}.`,
      },
    ];

    return {
      headline,
      summary,
      tacticalAnalysis,
      keyBattles,
      predictedScore,
      confidence,
      recommendation,
      generatedBy: 'HEURISTIC_AI',
    };
  }
}
