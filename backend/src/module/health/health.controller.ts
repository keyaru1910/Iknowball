import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Endpoint chính phục vụ Docker Compose Healthcheck và Kubernetes Liveness/Readiness probe
   */
  @Get('health')
  async getHealth(@Res() res: Response) {
    const result = await this.healthService.checkHealth();
    const httpStatus =
      result.status === 'unhealthy'
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.OK;

    return res.status(httpStatus).json(result);
  }

  /**
   * Alias endpoint cho API client hoặc dashboard monitoring
   */
  @Get('api/v1/health')
  async getApiHealth(@Res() res: Response) {
    const result = await this.healthService.checkHealth();
    const httpStatus =
      result.status === 'unhealthy'
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.OK;

    return res.status(httpStatus).json({
      data: result,
      meta: { checkedAt: result.timestamp },
      error: null,
    });
  }

  /**
   * Lightweight probe kiểm tra backend server còn sống
   */
  @Get('health/live')
  getLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}
