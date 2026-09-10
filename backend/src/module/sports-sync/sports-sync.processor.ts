// src/module/sports-sync/sports-sync.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SyncJobStatus } from '@prisma/client';
import { SPORTS_SYNC_QUEUE, SportsSyncJob } from './constants/job-names';
import { SportsSyncService, SyncResult } from './sports-sync.service';

@Processor(SPORTS_SYNC_QUEUE, { concurrency: 5 })
export class SportsSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SportsSyncProcessor.name);

  constructor(private readonly sportsSyncService: SportsSyncService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const syncLog = await this.sportsSyncService.startSyncLog(job.name);
    const sportName = job.data?.sportName;

    try {
      let result: SyncResult;

      switch (job.name) {
        case SportsSyncJob.SYNC_LEAGUES:
          result = await this.sportsSyncService.syncLeagues(sportName);
          break;

        case SportsSyncJob.SYNC_TEAMS: {
          const childValues = await job.getChildrenValues();
          const leagueIds = Object.values(childValues).flat() as string[];
          result = await this.sportsSyncService.syncTeams(
            leagueIds.length > 0 ? leagueIds : undefined,
            sportName,
          );
          break;
        }

        case SportsSyncJob.SYNC_MATCHES: {
          const childValues = await job.getChildrenValues();
          const teamIds = Object.values(childValues).flat() as string[];
          result = await this.sportsSyncService.syncMatches({
            teamIds: teamIds.length > 0 ? teamIds : undefined,
            sportName,
          });
          break;
        }

        case SportsSyncJob.SYNC_STANDINGS: {
          result = await this.sportsSyncService.syncStandings(
            job.data?.leagueIds,
            sportName,
          );
          break;
        }

        case SportsSyncJob.SYNC_LIVE:
          result = await this.sportsSyncService.syncLiveMatches(sportName);
          break;

        case SportsSyncJob.SYNC_FINISHED:
          result = await this.sportsSyncService.syncFinishedMatches(sportName);
          break;

        case SportsSyncJob.SYNC_UPCOMING:
          result = await this.sportsSyncService.syncUpcomingMatches(
            job.data?.days ?? 7,
            sportName,
          );
          break;

        default:
          throw new Error(`Không hỗ trợ loại job: ${job.name}`);
      }

      // Phân loại trạng thái: SUCCESS | FAILED | PARTIAL
      let status: SyncJobStatus;
      if (result.failedCount === 0) {
        status = SyncJobStatus.SUCCESS;
      } else if (result.ids.length === 0) {
        status = SyncJobStatus.FAILED;
      } else {
        status = SyncJobStatus.PARTIAL;
      }

      const errorSummary =
        result.errors && result.errors.length > 0
          ? result.errors.slice(0, 20).join(' | ')
          : undefined;

      await this.sportsSyncService.finishSyncLog(
        syncLog.id,
        status,
        result.processedCount,
        errorSummary,
      );

      // Chỉ kích hoạt BullMQ retry khi toàn bộ bản ghi thất bại
      if (status === SyncJobStatus.FAILED) {
        throw new Error(`${job.name}: Toàn bộ ${result.failedCount} bản ghi đều thất bại`);
      }

      return result.ids;
    } catch (err: any) {
      this.logger.error(`Job ${job.name} thất bại: ${err.message}`, err.stack);
      await this.sportsSyncService.finishSyncLog(
        syncLog.id,
        SyncJobStatus.FAILED,
        0,
        err.message,
      );
      throw err;
    }
  }
}