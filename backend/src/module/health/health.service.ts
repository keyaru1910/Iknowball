import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../shared/cache.service';

export interface ServiceHealthDetail {
  status: 'up' | 'down';
  latencyMs?: number;
  message?: string;
  url?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  queueEnabled: boolean;
  services: {
    database: ServiceHealthDetail;
    redis: ServiceHealthDetail;
    predictionService: ServiceHealthDetail;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Kiểm tra toàn diện trạng thái hoạt động của các dịch vụ phụ thuộc:
   * - PostgreSQL (bắt buộc)
   * - Redis (cache & queue)
   * - Prediction Service (Python ML microservice)
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const [dbHealth, redisHealth, predictionHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkPredictionService(),
    ]);

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (dbHealth.status === 'down') {
      overallStatus = 'unhealthy';
    } else if (redisHealth.status === 'down' || predictionHealth.status === 'down') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      queueEnabled: process.env.ENABLE_SYNC_QUEUE === 'true',
      services: {
        database: dbHealth,
        redis: redisHealth,
        predictionService: predictionHealth,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealthDetail> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      this.logger.error(`Database health check failed: ${err.message}`);
      return {
        status: 'down',
        message: err.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealthDetail> {
    const start = Date.now();
    try {
      const isAlive = await this.cacheService.ping();
      if (!isAlive) {
        return {
          status: 'down',
          message: 'Redis ping returned false or client disconnected',
        };
      }
      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        status: 'down',
        message: err.message,
      };
    }
  }

  private async checkPredictionService(): Promise<ServiceHealthDetail> {
    const start = Date.now();
    const url = process.env.PREDICTION_SERVICE_URL || 'http://localhost:8001';
    try {
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      if (response.status === 200) {
        return {
          status: 'up',
          latencyMs: Date.now() - start,
          url,
        };
      }
      return {
        status: 'down',
        message: `HTTP status ${response.status}`,
        url,
      };
    } catch (err: any) {
      return {
        status: 'down',
        message: err.message,
        url,
      };
    }
  }
}
