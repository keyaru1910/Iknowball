import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';

// ── Mock các dependencies ──────────────────────────────────────────────────

const mockPrisma = {
  match: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  teamStats: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  prediction: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  predictionResult: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  predictionView: {
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  modelPerformance: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
};

// Mock axios
vi.mock('axios', () => {
  const mockCreate = vi.fn().mockReturnValue({
    post: vi.fn(),
  });
  return { default: { create: mockCreate }, AxiosError: class AxiosError extends Error {} };
});

import { PredictionService } from './prediction.service';

// ── Factory ───────────────────────────────────────────────────────────────

function createService() {
  const service = new PredictionService(mockPrisma as any);
  return service;
}

// ── Test Suites ────────────────────────────────────────────────────────────

describe('PredictionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── featureSnapshot: chống data leakage ───────────────────────────────

  describe('featureSnapshot (point-in-time data leakage prevention)', () => {
    it('ném NotFoundException nếu không tìm thấy trận đấu', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);
      const service = createService();
      await expect((service as any).featureSnapshot('FAKE_MATCH_ID')).rejects.toThrow(NotFoundException);
    });

    it('truy vấn recent form đội nhà với matchDate < trận đấu hiện tại', async () => {
      const matchDate = new Date('2025-08-01T15:00:00Z');
      mockPrisma.match.findUnique.mockResolvedValue({
        id: 'M1',
        homeTeamId: 'HT',
        awayTeamId: 'AT',
        leagueId: 'L1',
        matchDate,
        league: { season: '2025', sport: { name: 'football' } },
      });
      mockPrisma.teamStats.findUnique.mockResolvedValue({ eloRating: 1600, matchesPlayed: 10, wins: 7 });
      mockPrisma.match.count.mockResolvedValue(3);
      // Recent form đội nhà: 2 trận thắng, 1 trận thua
      mockPrisma.match.findMany
        .mockResolvedValueOnce([
          { homeTeamId: 'HT', homeScore: 2, awayScore: 0 }, // HT thắng 2-0 sân nhà
          { homeTeamId: 'AT', homeScore: 2, awayScore: 0 }, // HT thua 0-2 sân khách (AT ghi 2 bàn)
          { homeTeamId: 'HT', homeScore: 3, awayScore: 1 }, // HT thắng 3-1 sân nhà
        ])
        // Recent form đội khách: 0 trận
        .mockResolvedValueOnce([]);

      const service = createService();
      const snapshot = await (service as any).featureSnapshot('M1');

      // Kiểm tra recent form đội nhà truy vấn đúng điều kiện chống data leakage
      const findManyCalls = mockPrisma.match.findMany.mock.calls;
      // Cả 2 truy vấn recent form phải có matchDate: { lt: matchDate }
      expect(findManyCalls[0][0].where.matchDate).toEqual({ lt: matchDate });
      expect(findManyCalls[1][0].where.matchDate).toEqual({ lt: matchDate });
      // H2H cũng phải có matchDate: { lt: matchDate }
      expect(mockPrisma.match.count.mock.calls[0][0].where.matchDate).toEqual({ lt: matchDate });

      // homeRecentForm: 2/3 trận thắng = 0.667
      expect(snapshot.homeRecentForm).toBeCloseTo(2 / 3, 3);
      // awayRecentForm: 0 trận → mặc định 0.5
      expect(snapshot.awayRecentForm).toBe(0.5);
    });
  });

  // ── generateForMatch: tính bất biến + atomicity ───────────────────────

  describe('generateForMatch (immutability & atomicity)', () => {
    it('bỏ qua và trả về bản ghi cũ nếu đã có prediction cùng modelVersion', async () => {
      const existingPrediction = { id: 'P1', matchId: 'M1', modelVersion: 'elo-v1' };
      mockPrisma.prediction.findUnique.mockResolvedValue(existingPrediction);
      const service = createService();

      const result = await service.generateForMatch('M1');

      expect(result).toBe(existingPrediction);
      // KHÔNG gọi featureSnapshot hoặc Python service
      expect(mockPrisma.match.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.prediction.create).not.toHaveBeenCalled();
    });

    it('không lưu prediction nếu Python service lỗi (atomicity)', async () => {
      mockPrisma.prediction.findUnique.mockResolvedValue(null);
      const matchDate = new Date('2025-08-01T15:00:00Z');
      mockPrisma.match.findUnique.mockResolvedValue({
        id: 'M1',
        homeTeamId: 'HT',
        awayTeamId: 'AT',
        leagueId: 'L1',
        matchDate,
        league: { season: '2025', sport: { name: 'football' } },
      });
      mockPrisma.teamStats.findUnique.mockResolvedValue({ eloRating: 1500, matchesPlayed: 5, wins: 3 });
      mockPrisma.match.count.mockResolvedValue(0);
      mockPrisma.match.findMany.mockResolvedValue([]).mockResolvedValue([]);

      const service = createService();
      // Giả lập Python service luôn lỗi
      (service as any).client = { post: vi.fn().mockRejectedValue(new Error('Connection refused')) };

      await expect(service.generateForMatch('M1')).rejects.toThrow(ServiceUnavailableException);
      // Không được lưu prediction nửa vời
      expect(mockPrisma.prediction.create).not.toHaveBeenCalled();
    });
  });

  // ── generateUpcoming: bỏ qua lỗi từng trận, không dừng toàn bộ job ───

  describe('generateUpcoming', () => {
    it('tiếp tục xử lý các trận còn lại khi một trận bị lỗi', async () => {
      mockPrisma.match.findMany.mockResolvedValue([{ id: 'M1' }, { id: 'M2' }, { id: 'M3' }]);
      mockPrisma.prediction.findUnique.mockResolvedValue(null);

      const service = createService();
      const generateSpy = vi.spyOn(service, 'generateForMatch')
        .mockRejectedValueOnce(new Error('Lỗi trận M1'))  // M1 lỗi
        .mockResolvedValueOnce({ id: 'P2' } as any)        // M2 ok
        .mockResolvedValueOnce({ id: 'P3' } as any);       // M3 ok

      const result = await service.generateUpcoming();

      expect(generateSpy).toHaveBeenCalledTimes(3);
      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  // ── evaluatePending: tính đúng logLoss và brierScore ──────────────────

  describe('evaluatePending', () => {
    it('tính logLoss và brierScore đúng cho dự đoán chính xác', async () => {
      const prediction = {
        id: 'P1',
        homeWinProb: 0.7,
        drawProb: 0.2,
        awayWinProb: 0.1,
        predictedOutcome: 'HOME_WIN',
        match: { homeScore: 2, awayScore: 0, status: 'FINISHED' },
      };
      mockPrisma.prediction.findMany.mockResolvedValue([prediction]);
      mockPrisma.predictionResult.create.mockResolvedValue({});
      mockPrisma.predictionResult.findMany.mockResolvedValue([]);
      mockPrisma.modelPerformance.upsert.mockResolvedValue({});

      const service = createService();
      const result = await service.evaluatePending();

      expect(result).toBe(1);
      const createCall = mockPrisma.predictionResult.create.mock.calls[0][0].data;
      // logLoss = -log(0.7) ≈ 0.3567
      expect(createCall.logLoss).toBeCloseTo(-Math.log(0.7), 4);
      // brierScore: ((0.7-1)^2 + (0.2-0)^2 + (0.1-0)^2) / 3 ≈ 0.0380
      const expectedBrier = ((0.7 - 1) ** 2 + (0.2 - 0) ** 2 + (0.1 - 0) ** 2) / 3;
      expect(createCall.brierScore).toBeCloseTo(expectedBrier, 4);
      expect(createCall.isCorrect).toBe(true);
      expect(createCall.actualOutcome).toBe('HOME_WIN');
    });

    it('tính logLoss đúng cho dự đoán sai', async () => {
      const prediction = {
        id: 'P2',
        homeWinProb: 0.1,
        drawProb: 0.2,
        awayWinProb: 0.7,
        predictedOutcome: 'AWAY_WIN',
        match: { homeScore: 1, awayScore: 0, status: 'FINISHED' }, // HOME_WIN thực tế
      };
      mockPrisma.prediction.findMany.mockResolvedValue([prediction]);
      mockPrisma.predictionResult.create.mockResolvedValue({});
      mockPrisma.predictionResult.findMany.mockResolvedValue([]);
      mockPrisma.modelPerformance.upsert.mockResolvedValue({});

      const service = createService();
      await service.evaluatePending();

      const createCall = mockPrisma.predictionResult.create.mock.calls[0][0].data;
      // actual = HOME_WIN, homeWinProb = 0.1 → logLoss = -log(0.1) ≈ 2.302
      expect(createCall.logLoss).toBeCloseTo(-Math.log(0.1), 4);
      expect(createCall.isCorrect).toBe(false);
    });
  });

  // ── performance: truy vấn đúng leagueId ───────────────────────────────

  describe('performance', () => {
    it('trả về dữ liệu hiệu năng với số dạng number (không phải Decimal)', async () => {
      mockPrisma.modelPerformance.findMany.mockResolvedValue([
        {
          id: 'MP1',
          modelVersion: 'elo-v1',
          leagueId: 'L1',
          periodStart: new Date('2025-08-04'),
          periodEnd: new Date('2025-08-11'),
          accuracy: { toString: () => '0.65000', valueOf: () => 0.65 },
          precision: { toString: () => '0.62000', valueOf: () => 0.62 },
          recall: { toString: () => '0.60000', valueOf: () => 0.60 },
          f1: { toString: () => '0.61000', valueOf: () => 0.61 },
          avgLogLoss: { toString: () => '0.9200000', valueOf: () => 0.92 },
          avgBrierScore: { toString: () => '0.2100000', valueOf: () => 0.21 },
          sampleSize: 40,
          league: { id: 'L1', name: 'Premier League' },
        },
      ]);

      const service = createService();
      const result = await service.performance('L1');

      expect(result).toHaveLength(1);
      expect(typeof result[0].accuracy).toBe('number');
      expect(typeof result[0].avgLogLoss).toBe('number');
    });
  });
});
