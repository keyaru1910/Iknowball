// src/module/sports-sync/sports-sync.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SyncJobStatus } from '@prisma/client';
import { SportsSyncService } from './sports-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  SPORTS_SYNC_QUEUE,
  SPORTS_SYNC_SCHEDULER_QUEUE,
  SportsSyncJob,
} from './constants/job-names';

export interface TriggerSyncDto {
  type?:
    | 'full'
    | 'leagues'
    | 'teams'
    | 'matches'
    | 'standings'
    | 'live'
    | 'upcoming'
    | 'finished';
  sport?: 'football' | 'basketball';
  days?: number;
}

export interface GetSyncJobsQueryDto {
  page?: string;
  limit?: string;
  status?: SyncJobStatus;
  jobName?: string;
}

/**
 * Controller quản trị dành riêng cho Admin để kích hoạt đồng bộ và giám sát trạng thái Job
 */
@Controller('api/v1/admin/sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SportsSyncController {
  private readonly logger = new Logger(SportsSyncController.name);

  constructor(
    private readonly sportsSyncService: SportsSyncService,
    private readonly prisma: PrismaService,
    @InjectQueue(SPORTS_SYNC_QUEUE)
    private readonly syncQueue: Queue,
    @InjectQueue(SPORTS_SYNC_SCHEDULER_QUEUE)
    private readonly schedulerQueue: Queue,
  ) {}

  /**
   * Kích hoạt đồng bộ có kiểm soát theo môn thể thao và phân loại
   */
  @Post('trigger')
  async triggerSync(@Body() dto: TriggerSyncDto) {
    const type = dto.type || 'full';
    const sport = dto.sport;
    this.logger.log(`[Admin] Kích hoạt sync thủ công: loại=${type}, sport=${sport || 'all'}`);

    let resultData: any;

    switch (type) {
      case 'full': {
        const leagues = await this.sportsSyncService.syncLeagues(sport);
        const teams = await this.sportsSyncService.syncTeams(undefined, sport);
        const matches = await this.sportsSyncService.syncMatches({ sportName: sport });
        const standings = await this.sportsSyncService.syncStandings(undefined, sport);
        resultData = { leagues, teams, matches, standings };
        break;
      }

      case 'leagues':
        resultData = await this.sportsSyncService.syncLeagues(sport);
        break;

      case 'teams':
        resultData = await this.sportsSyncService.syncTeams(undefined, sport);
        break;

      case 'matches':
        resultData = await this.sportsSyncService.syncMatches({ sportName: sport });
        break;

      case 'standings':
        resultData = await this.sportsSyncService.syncStandings(undefined, sport);
        break;

      case 'live':
        resultData = await this.sportsSyncService.syncLiveMatches(sport);
        break;

      case 'upcoming':
        resultData = await this.sportsSyncService.syncUpcomingMatches(dto.days ?? 7, sport);
        break;

      case 'finished':
        resultData = await this.sportsSyncService.syncFinishedMatches(sport);
        break;

      default:
        resultData = await this.sportsSyncService.syncLeagues(sport);
    }

    return {
      data: resultData,
      meta: {
        message: `Kích hoạt đồng bộ (${type}) thành công`,
        timestamp: new Date().toISOString(),
      },
      error: null,
    };
  }

  /**
   * Xem danh sách lịch sử chạy SyncJobLog
   */
  @Get('jobs')
  async getSyncJobs(@Query() query: GetSyncJobsQueryDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.jobName) {
      where.jobName = {
        contains: query.jobName,
        mode: 'insensitive',
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.syncJobLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.syncJobLog.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    };
  }

  /**
   * Xem chi tiết một bản ghi SyncJobLog
   */
  @Get('jobs/:id')
  async getSyncJobById(@Param('id') id: string) {
    const jobLog = await this.prisma.syncJobLog.findUnique({
      where: { id },
    });

    if (!jobLog) {
      throw new NotFoundException(`Không tìm thấy nhật ký sync có ID: ${id}`);
    }

    return {
      data: jobLog,
      meta: null,
      error: null,
    };
  }

  /**
   * Xem tình trạng hàng đợi BullMQ (Active, Waiting, Completed, Failed, Delayed)
   */
  @Get('queues/status')
  async getQueuesStatus() {
    const [
      syncWaiting,
      syncActive,
      syncCompleted,
      syncFailed,
      syncDelayed,
      schedulerRepeatables,
    ] = await Promise.all([
      this.syncQueue.getWaitingCount(),
      this.syncQueue.getActiveCount(),
      this.syncQueue.getCompletedCount(),
      this.syncQueue.getFailedCount(),
      this.syncQueue.getDelayedCount(),
      this.schedulerQueue.getRepeatableJobs(),
    ]);

    return {
      data: {
        syncQueue: {
          name: SPORTS_SYNC_QUEUE,
          waiting: syncWaiting,
          active: syncActive,
          completed: syncCompleted,
          failed: syncFailed,
          delayed: syncDelayed,
        },
        schedulerQueue: {
          name: SPORTS_SYNC_SCHEDULER_QUEUE,
          repeatableJobsCount: schedulerRepeatables.length,
          repeatableJobs: schedulerRepeatables.map((j) => ({
            key: j.key,
            name: j.name,
            id: j.id,
            pattern: j.pattern,
            next: j.next ? new Date(j.next).toISOString() : null,
          })),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
      error: null,
    };
  }
}
