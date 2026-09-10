import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from './health.service';
import axios from 'axios';

vi.mock('axios');

describe('HealthService', () => {
  let service: HealthService;
  let mockPrisma: any;
  let mockCache: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };
    mockCache = {
      ping: vi.fn().mockResolvedValue(true),
    };
    service = new HealthService(mockPrisma, mockCache);
  });

  it('trả về status healthy khi tất cả services hoạt động tốt', async () => {
    (axios.get as any).mockResolvedValue({ status: 200, data: { status: 'healthy' } });

    const result = await service.checkHealth();
    expect(result.status).toBe('healthy');
    expect(result.services.database.status).toBe('up');
    expect(result.services.redis.status).toBe('up');
    expect(result.services.predictionService.status).toBe('up');
  });

  it('trả về status degraded khi Redis hoặc Prediction Service ngắt kết nối nhưng Database vẫn chạy', async () => {
    mockCache.ping.mockResolvedValue(false);
    (axios.get as any).mockRejectedValue(new Error('Connection refused'));

    const result = await service.checkHealth();
    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('up');
    expect(result.services.redis.status).toBe('down');
    expect(result.services.predictionService.status).toBe('down');
  });

  it('trả về status unhealthy khi Database gặp lỗi', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB Connection failed'));
    (axios.get as any).mockResolvedValue({ status: 200 });

    const result = await service.checkHealth();
    expect(result.status).toBe('unhealthy');
    expect(result.services.database.status).toBe('down');
  });
});
