import { ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { MatchStatus, PredictionOutcome, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ELO } from '../elo/elo.calculator';
import { FREE_DAILY_DETAIL_LIMIT, MODEL_VERSION } from './prediction.constants';


// ── Kiểu dữ liệu ─────────────────────────────────────────────────────────────

type PredictionResponse = {
  homeWinProb: number;
  drawProb: number | null;
  awayWinProb: number;
  predictedOutcome: PredictionOutcome;
  /** Giải thích định lượng từng yếu tố đóng góp (từ Python service) */
  explanation?: Record<string, unknown>;
};

type OutcomeLabel = 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';

// ── Hằng số HTTP Client ───────────────────────────────────────────────────────

/** Số lần thử tối đa khi gọi Python service */
const MAX_RETRIES = 3;
/** Timeout mỗi lần gọi (ms) */
const REQUEST_TIMEOUT_MS = 5_000;
/** Delay cơ bản cho exponential backoff (ms) */
const BACKOFF_BASE_MS = 500;

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly prisma: PrismaService) {
    this.client = axios.create({
      baseURL: process.env.PREDICTION_SERVICE_URL || 'http://localhost:8001',
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private serializePrediction<T extends { homeWinProb: unknown; drawWinProb?: unknown; drawProb: unknown; awayWinProb: unknown }>(prediction: T) {
    return {
      ...prediction,
      homeWinProb: Number(prediction.homeWinProb),
      drawProb: prediction.drawProb === null ? null : Number(prediction.drawProb),
      awayWinProb: Number(prediction.awayWinProb),
    };
  }

  /**
   * Gọi Python service với cơ chế retry + exponential backoff.
   * Nếu sau MAX_RETRIES lần vẫn thất bại, ném ServiceUnavailableException.
   * Job lỗi KHÔNG tạo prediction nửa vời.
   */
  private async executeWithRetry<T>(requestFn: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await requestFn();
      } catch (err) {
        lastError = err as Error;
        const isAxiosErr = err instanceof AxiosError;
        const status = isAxiosErr ? err.response?.status : undefined;

        // Không retry với lỗi validation (4xx client error)
        if (isAxiosErr && status && status >= 400 && status < 500) {
          this.logger.warn(`[${context}] Lỗi client HTTP ${status}, không retry.`);
          throw err;
        }

        if (attempt < MAX_RETRIES) {
          const delayMs = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
          this.logger.warn(`[${context}] Lần thử ${attempt}/${MAX_RETRIES} thất bại. Retry sau ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    this.logger.error(`[${context}] Thất bại sau ${MAX_RETRIES} lần thử: ${lastError?.message}`);
    throw new ServiceUnavailableException(`Python prediction service không phản hồi sau ${MAX_RETRIES} lần retry.`);
  }

  /**
   * Tạo feature snapshot point-in-time: chỉ dùng dữ liệu CÓ TRƯỚC thời điểm trận đấu.
   * - Elo rating lấy từ TeamStats (đã được cập nhật tuần tự đến trước trận).
   * - Recent form (5 trận gần nhất): CHỈ tính các trận FINISHED có matchDate < match.matchDate.
   * - H2H: CHỈ đếm các trận đối đầu đã kết thúc TRƯỚC match.matchDate.
   * Điều này đảm bảo Zero Data Leakage tuyệt đối.
   */
  private async featureSnapshot(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { league: { include: { sport: true } } },
    });
    if (!match) throw new NotFoundException('Không tìm thấy trận đấu');

    const matchDate = match.matchDate;

    const [home, away, h2h, homeRecentMatches, awayRecentMatches] = await Promise.all([
      // Elo rating hiện tại (đã được cập nhật tuần tự trước trận)
      this.prisma.teamStats.findUnique({
        where: { teamId_leagueId_season: { teamId: match.homeTeamId, leagueId: match.leagueId, season: match.league.season } },
      }),
      this.prisma.teamStats.findUnique({
        where: { teamId_leagueId_season: { teamId: match.awayTeamId, leagueId: match.leagueId, season: match.league.season } },
      }),
      // H2H: CHỈ các trận đã kết thúc TRƯỚC matchDate
      this.prisma.match.count({
        where: {
          leagueId: match.leagueId,
          status: MatchStatus.FINISHED,
          matchDate: { lt: matchDate },
          OR: [
            { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
            { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
          ],
        },
      }),
      // Phong độ đội nhà – 5 trận gần nhất TRƯỚC matchDate (chống data leakage)
      this.prisma.match.findMany({
        where: {
          status: MatchStatus.FINISHED,
          matchDate: { lt: matchDate },
          OR: [{ homeTeamId: match.homeTeamId }, { awayTeamId: match.homeTeamId }],
          homeScore: { not: null },
          awayScore: { not: null },
        },
        orderBy: { matchDate: 'desc' },
        take: 5,
        select: { homeTeamId: true, homeScore: true, awayScore: true },
      }),
      // Phong độ đội khách – 5 trận gần nhất TRƯỚC matchDate (chống data leakage)
      this.prisma.match.findMany({
        where: {
          status: MatchStatus.FINISHED,
          matchDate: { lt: matchDate },
          OR: [{ homeTeamId: match.awayTeamId }, { awayTeamId: match.awayTeamId }],
          homeScore: { not: null },
          awayScore: { not: null },
        },
        orderBy: { matchDate: 'desc' },
        take: 5,
        select: { homeTeamId: true, homeScore: true, awayScore: true },
      }),
    ]);

    // Tính recent form (thắng=1.0, hòa=0.5, thua=0.0)
    const calcForm = (recentMatches: Array<{ homeTeamId: string; homeScore: number | null; awayScore: number | null }>, teamId: string): number => {
      if (recentMatches.length === 0) return 0.5;
      let points = 0;
      for (const m of recentMatches) {
        const isHome = m.homeTeamId === teamId;
        const homeWin = (m.homeScore ?? 0) > (m.awayScore ?? 0);
        const draw = m.homeScore === m.awayScore;
        if (draw) points += 0.5;
        else if ((isHome && homeWin) || (!isHome && !homeWin)) points += 1.0;
      }
      return points / recentMatches.length;
    };

    const homeRecentForm = calcForm(homeRecentMatches, match.homeTeamId);
    const awayRecentForm = calcForm(awayRecentMatches, match.awayTeamId);

    return {
      sport: match.league.sport.name as 'football' | 'basketball',
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeElo: Number(home?.eloRating ?? DEFAULT_ELO),
      awayElo: Number(away?.eloRating ?? DEFAULT_ELO),
      homeMatchesPlayed: home?.matchesPlayed ?? 0,
      awayMatchesPlayed: away?.matchesPlayed ?? 0,
      h2hMatches: h2h,
      homeRecentForm,
      awayRecentForm,
      // Fallback tương thích schema cũ
      homeWinRate: home && home.matchesPlayed ? home.wins / home.matchesPlayed : 0.5,
      awayWinRate: away && away.matchesPlayed ? away.wins / away.matchesPlayed : 0.5,
    };
  }

  /**
   * Tạo prediction cho một trận đấu.
   *
   * TÍNH BẤT BIẾN: Nếu đã có prediction cùng modelVersion, KHÔNG ghi đè.
   * Chỉ tạo mới nếu chưa tồn tại.
   * Nếu Python service lỗi, ném exception – KHÔNG lưu bản ghi dở dang.
   */
  async generateForMatch(matchId: string) {
    // Kiểm tra tính bất biến: bỏ qua nếu đã có prediction cùng modelVersion
    const existing = await this.prisma.prediction.findUnique({
      where: { matchId_modelVersion: { matchId, modelVersion: MODEL_VERSION } },
    });
    if (existing) {
      this.logger.debug(`[generateForMatch] Bỏ qua trận ${matchId}: đã có prediction modelVersion=${MODEL_VERSION}`);
      return existing;
    }

    // Tạo snapshot TRƯỚC khi gọi Python service
    const features = await this.featureSnapshot(matchId);

    // Gọi Python service với retry – ném lỗi nếu thất bại hoàn toàn
    const { data } = await this.executeWithRetry(
      () => this.client.post<PredictionResponse>('/predict', features),
      `generateForMatch(${matchId})`,
    );

    // Lưu prediction trong transaction để đảm bảo tính nguyên tử
    return this.prisma.prediction.create({
      data: {
        matchId,
        modelVersion: MODEL_VERSION,
        homeWinProb: new Prisma.Decimal(data.homeWinProb),
        drawProb: data.drawProb === null ? null : new Prisma.Decimal(data.drawProb),
        awayWinProb: new Prisma.Decimal(data.awayWinProb),
        predictedOutcome: data.predictedOutcome,
        featuresSnapshot: {
          ...features,
          explanation: (data.explanation ?? null) as Prisma.InputJsonValue
        } as Prisma.InputJsonObject,
      },
    });
  }

  /**
   * Sinh dự đoán cho tất cả các trận đấu sẽ diễn ra trong 48 giờ tới.
   * Bỏ qua các trận đã có prediction cùng modelVersion (tính bất biến).
   */
  async generateUpcoming() {
    const now = new Date();
    const until = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.SCHEDULED,
        matchDate: { gte: now, lte: until },
        predictions: { none: { modelVersion: MODEL_VERSION } },
      },
      select: { id: true },
    });

    let succeeded = 0;
    let failed = 0;
    for (const match of matches) {
      try {
        await this.generateForMatch(match.id);
        succeeded++;
      } catch (err) {
        failed++;
        this.logger.error(`[generateUpcoming] Bỏ qua trận ${match.id} do lỗi: ${(err as Error).message}`);
        // Tiếp tục xử lý các trận còn lại – không dừng toàn bộ job
      }
    }

    if (failed > 0) {
      this.logger.warn(`[generateUpcoming] Hoàn tất với ${failed} trận lỗi / ${matches.length} tổng.`);
    }
    return { total: matches.length, succeeded, failed };
  }

  /**
   * Đánh giá tất cả prediction chưa có kết quả nhưng trận đấu đã kết thúc.
   * Tính logLoss và brierScore, sau đó tổng hợp vào ModelPerformance.
   */
  async evaluatePending() {
    const predictions = await this.prisma.prediction.findMany({
      where: {
        result: null,
        match: { status: MatchStatus.FINISHED, homeScore: { not: null }, awayScore: { not: null } },
      },
      include: { match: true },
    });

    for (const prediction of predictions) {
      const actual =
        prediction.match.homeScore! > prediction.match.awayScore!
          ? PredictionOutcome.HOME_WIN
          : prediction.match.homeScore! < prediction.match.awayScore!
            ? PredictionOutcome.AWAY_WIN
            : PredictionOutcome.DRAW;

      const probs: Record<PredictionOutcome, number> = {
        HOME_WIN: Number(prediction.homeWinProb),
        DRAW: Number(prediction.drawProb ?? 0),
        AWAY_WIN: Number(prediction.awayWinProb),
      };

      const logLoss = -Math.log(Math.max(probs[actual], 1e-7));
      const numClasses = prediction.drawProb === null ? 2 : 3;
      const brier =
        Object.values(PredictionOutcome).reduce(
          (sum, outcome) => sum + (probs[outcome] - (outcome === actual ? 1 : 0)) ** 2,
          0,
        ) / numClasses;

      await this.prisma.predictionResult
        .create({
          data: {
            predictionId: prediction.id,
            actualOutcome: actual,
            isCorrect: prediction.predictedOutcome === actual,
            logLoss,
            brierScore: brier,
          },
        })
        .catch(() => undefined); // Bỏ qua nếu đã tồn tại (duplicate)
    }

    await this.aggregateCurrentWeek();
    return predictions.length;
  }

  /**
   * Tổng hợp hiệu năng tuần hiện tại cho từng giải đấu và toàn hệ thống (leagueId=null).
   * Tính Macro Precision, Macro Recall, Macro F1 cho 3 lớp kết quả.
   */
  private async aggregateCurrentWeek() {
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    const periodEnd = new Date(start);
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 7);

    const results = await this.prisma.predictionResult.findMany({
      where: { evaluatedAt: { gte: start, lt: periodEnd } },
      include: { prediction: { include: { match: true } } },
    });

    // Nhóm theo leagueId và thêm nhóm global (null)
    const groups = new Map<string | null, typeof results>();
    for (const result of results) {
      const leagueId = result.prediction.match.leagueId;
      groups.set(leagueId, [...(groups.get(leagueId) ?? []), result]);
      // Thêm vào nhóm global
      groups.set(null, [...(groups.get(null) ?? []), result]);
    }

    for (const [leagueId, entries] of groups) {
      if (entries.length === 0) continue;
      await this._upsertModelPerformance(leagueId, entries, start, periodEnd);
    }
  }

  /** Helper tính và upsert ModelPerformance cho một nhóm entries */
  private async _upsertModelPerformance(
    leagueId: string | null,
    entries: Array<{
      isCorrect: boolean;
      logLoss: unknown;
      brierScore: unknown;
      prediction: { predictedOutcome: PredictionOutcome };
      actualOutcome: PredictionOutcome;
    }>,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const labels = Object.values(PredictionOutcome) as OutcomeLabel[];
    const accuracy = entries.filter((x) => x.isCorrect).length / entries.length;

    const perClass = labels.map((label) => {
      const tp = entries.filter((x) => x.actualOutcome === label && x.prediction.predictedOutcome === label).length;
      const fp = entries.filter((x) => x.actualOutcome !== label && x.prediction.predictedOutcome === label).length;
      const fn = entries.filter((x) => x.actualOutcome === label && x.prediction.predictedOutcome !== label).length;
      const precision = tp + fp ? tp / (tp + fp) : 0;
      const recall = tp + fn ? tp / (tp + fn) : 0;
      return {
        precision,
        recall,
        f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
      };
    });

    const macro = (field: 'precision' | 'recall' | 'f1') =>
      perClass.reduce((sum, metric) => sum + metric[field], 0) / perClass.length;

    const avgLogLoss = entries.reduce((sum, x) => sum + Number(x.logLoss), 0) / entries.length;
    const avgBrierScore = entries.reduce((sum, x) => sum + Number(x.brierScore), 0) / entries.length;

    await this.prisma.modelPerformance.upsert({
      where: {
        modelVersion_leagueId_periodStart_periodEnd: {
          modelVersion: MODEL_VERSION,
          leagueId: leagueId,
          periodStart,
          periodEnd,
        },
      },
      create: {
        modelVersion: MODEL_VERSION,
        leagueId,
        periodStart,
        periodEnd,
        accuracy,
        precision: macro('precision'),
        recall: macro('recall'),
        f1: macro('f1'),
        avgLogLoss,
        avgBrierScore,
        sampleSize: entries.length,
      },
      update: {
        accuracy,
        precision: macro('precision'),
        recall: macro('recall'),
        f1: macro('f1'),
        avgLogLoss,
        avgBrierScore,
        sampleSize: entries.length,
      },
    });
  }

  /**
   * Lấy dữ liệu hiệu năng mô hình (cho Dashboard Performance).
   */
  async performance(leagueId?: string, history = false) {
    const records = await this.prisma.modelPerformance.findMany({
      where: { modelVersion: MODEL_VERSION, ...(leagueId ? { leagueId } : {}) },
      include: { league: { select: { id: true, name: true } } },
      orderBy: { periodStart: history ? 'asc' : 'desc' },
      take: history ? 104 : 12,
    });
    return records.map((record) => ({
      ...record,
      accuracy: Number(record.accuracy),
      precision: Number(record.precision),
      recall: Number(record.recall),
      f1: Number(record.f1),
      avgLogLoss: Number(record.avgLogLoss),
      avgBrierScore: Number(record.avgBrierScore),
    }));
  }

  /**
   * Backtest walk-forward trên dữ liệu DB thực tế (không cần Python service riêng).
   * So sánh Model Elo-v1 (dữ liệu đã lưu) với 2 baselines.
   *
   * @param leagueId - Lọc theo giải đấu (tùy chọn)
   * @param fromDate - Ngày bắt đầu backtest (ISO string, tùy chọn)
   * @param toDate   - Ngày kết thúc backtest (ISO string, tùy chọn)
   */
  async runBacktest(leagueId?: string, fromDate?: string, toDate?: string) {
    const where: Prisma.PredictionWhereInput = {
      modelVersion: MODEL_VERSION,
      result: { isNot: null },
      match: {
        status: MatchStatus.FINISHED,
        ...(leagueId ? { leagueId } : {}),
        ...(fromDate || toDate
          ? {
            matchDate: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate) } : {}),
            },
          }
          : {}),
      },
    };

    const predictions = await this.prisma.prediction.findMany({
      where,
      include: {
        match: { select: { homeScore: true, awayScore: true, matchDate: true, leagueId: true } },
        result: true,
      },
      orderBy: { match: { matchDate: 'asc' } },
    });

    if (predictions.length === 0) {
      return {
        totalMatches: 0,
        model: null,
        randomBaseline: null,
        higherEloBaseline: null,
        message: 'Chưa có dữ liệu đánh giá để backtest.',
      };
    }

    const labels: OutcomeLabel[] = ['HOME_WIN', 'DRAW', 'AWAY_WIN'];

    // Tổng hợp cho từng phương pháp
    let modelCorrect = 0;
    let randomCorrect = 0;
    let higherEloCorrect = 0;
    let totalLogLoss = 0;
    let totalBrier = 0;

    const perMatch = predictions.map((pred) => {
      const actual = pred.result!.actualOutcome as OutcomeLabel;
      const modelPred = pred.predictedOutcome as OutcomeLabel;
      const homeProb = Number(pred.homeWinProb);
      const drawProb = Number(pred.drawProb ?? 0);
      const awayProb = Number(pred.awayWinProb);

      // Baseline Higher-Elo: đội có xác suất thắng cao hơn (bỏ qua form)
      const higherEloPred: OutcomeLabel = homeProb + drawProb > 0.5 ? 'HOME_WIN' : 'AWAY_WIN';
      // Baseline Random: phân phối đều
      const randomPred: OutcomeLabel = labels[Math.floor(Math.random() * labels.length)];

      modelCorrect += modelPred === actual ? 1 : 0;
      randomCorrect += randomPred === actual ? 1 : 0;
      higherEloCorrect += higherEloPred === actual ? 1 : 0;
      totalLogLoss += Number(pred.result!.logLoss);
      totalBrier += Number(pred.result!.brierScore);

      return { matchDate: pred.match.matchDate, actual, modelPred, higherEloPred, randomPred };
    });

    const n = predictions.length;
    return {
      totalMatches: n,
      model: {
        accuracy: modelCorrect / n,
        avgLogLoss: totalLogLoss / n,
        avgBrierScore: totalBrier / n,
      },
      randomBaseline: {
        accuracy: randomCorrect / n,
      },
      higherEloBaseline: {
        accuracy: higherEloCorrect / n,
      },
      improvementOverRandom: {
        accuracy: modelCorrect / n - randomCorrect / n,
      },
      improvementOverHigherElo: {
        accuracy: modelCorrect / n - higherEloCorrect / n,
      },
      perMatch: perMatch.slice(-50), // Trả về 50 trận gần nhất để Dashboard
    };
  }

  // ── Query Methods ──────────────────────────────────────────────────────────

  async list(leagueId?: string, date?: string, page = 1, limit = 20) {
    const where: Prisma.PredictionWhereInput = {
      match: {
        ...(leagueId ? { leagueId } : {}),
        ...(date
          ? {
            matchDate: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lte: new Date(`${date}T23:59:59.999Z`),
            },
          }
          : {}),
      },
    };

    const skip = (page - 1) * limit;
    const [total, predictions] = await Promise.all([
      this.prisma.prediction.count({ where }),
      this.prisma.prediction.findMany({
        where,
        include: {
          match: {
            include: { homeTeam: true, awayTeam: true, league: true },
          },
        },
        orderBy: { match: { matchDate: 'asc' } },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const items = predictions.map((prediction) => this.serializePrediction(prediction));
    return { items, total, page, limit, totalPages };
  }

  async detail(matchId: string, user?: { id: string; role: string }) {
    const prediction = await this.prisma.prediction.findFirst({
      where: { matchId },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true, league: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!prediction) {
      throw new NotFoundException('Chưa có dữ liệu dự đoán cho trận này');
    }

    const isPremium = user?.role === 'premium' || user?.role === 'admin';
    let remainingDailyQuota: number | null = isPremium ? null : FREE_DAILY_DETAIL_LIMIT;

    // Người dùng đăng nhập tài khoản miễn phí (free) thì kiểm tra hạn mức 3 lượt xem chi tiết/ngày
    if (!isPremium && user?.id) {
      const viewedOn = new Date();
      viewedOn.setUTCHours(0, 0, 0, 0);

      const seen = await this.prisma.predictionView.findUnique({
        where: {
          userId_predictionId_viewedOn: { userId: user.id, predictionId: prediction.id, viewedOn },
        },
      });

      const count = await this.prisma.predictionView.count({
        where: { userId: user.id, viewedOn },
      });

      if (!seen) {
        if (count >= FREE_DAILY_DETAIL_LIMIT) {
          throw new ForbiddenException(
            `Bạn đã dùng hết ${FREE_DAILY_DETAIL_LIMIT} lượt xem chi tiết dự đoán hôm nay. Vui lòng nâng cấp gói Premium để xem không giới hạn.`,
          );
        }

        await this.prisma.predictionView.create({
          data: { userId: user.id, predictionId: prediction.id, viewedOn },
        });

        remainingDailyQuota = Math.max(0, FREE_DAILY_DETAIL_LIMIT - (count + 1));
      } else {
        remainingDailyQuota = Math.max(0, FREE_DAILY_DETAIL_LIMIT - count);
      }
    }

    const snapshot = prediction.featuresSnapshot as Record<string, unknown> | null;
    return {
      ...this.serializePrediction(prediction),
      // Premium mới thấy được chi tiết feature snapshot và explanation
      featuresSnapshot: isPremium ? snapshot : undefined,
      explanation: isPremium ? (snapshot?.explanation ?? null) : undefined,
      isPremium,
      tier: isPremium ? 'premium' : (user?.id ? 'free' : 'guest'),
      remainingDailyQuota,
    };
  }
}
