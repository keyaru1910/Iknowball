// src/module/sports-sync/sports-sync-scheduler.processor.ts
import { Processor, WorkerHost, InjectFlowProducer } from '@nestjs/bullmq';
import { Job, FlowProducer, Queue } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  SPORTS_SYNC_QUEUE,
  SPORTS_SYNC_FLOW_PRODUCER,
  SPORTS_SYNC_SCHEDULER_QUEUE,
  SportsSyncJob,
} from './constants/job-names';

/**
 * Scheduler Processor quản lý lịch trình chạy định kỳ của các Job đồng bộ
 */
@Processor(SPORTS_SYNC_SCHEDULER_QUEUE)
export class SportsSyncSchedulerProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(SportsSyncSchedulerProcessor.name);

  constructor(
    @InjectFlowProducer(SPORTS_SYNC_FLOW_PRODUCER)
    private readonly flowProducer: FlowProducer,
    @InjectQueue(SPORTS_SYNC_SCHEDULER_QUEUE)
    private readonly schedulerQueue: Queue,
    @InjectQueue(SPORTS_SYNC_QUEUE)
    private readonly syncQueue: Queue,
  ) {
    super();
  }

  /**
   * Đăng ký các Repeatable Cron Jobs khi Module khởi động
   */
  async onModuleInit() {
    if (process.env.ENABLE_FOOTBALL_2026_27_SYNC !== 'true') {
      this.logger.log('Pipeline football 2026/27 đang tắt; không đăng ký lịch đồng bộ dữ liệu thật.');
      return;
    }
    try {
      // Xóa toàn bộ cron cũ trước khi đăng ký mới
      const existing = await this.schedulerQueue.getRepeatableJobs();
      for (const job of existing) {
        await this.schedulerQueue.removeRepeatableByKey(job.key);
      }

      // ────────────────────────────────────────────────────────────────
      // Chiến lược Free plan — ~30 req/ngày (tổng giới hạn 100 req/ngày)
      // ────────────────────────────────────────────────────────────────

      // 1. Full sync (Leagues + Teams) mỗi ngày lúc 03:00 sáng
      //    → Dữ liệu tĩnh ít thay đổi, chỉ cần sync 1 lần/ngày
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FULL_SYNC,
        {},
        {
          repeat: { pattern: '0 3 * * *' },
          jobId: 'daily-full-sync',
        },
      );

      // 2. Sync kết quả trận vừa kết thúc — 01:00 sáng
      //    → Bắt các trận tối hôm trước (Premier League, Serie A đá ~22:00-23:00 VN)
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FINISHED_SYNC,
        {},
        {
          repeat: { pattern: '0 1 * * *' },
          jobId: 'finished-matches-sync-1am',
        },
      );

      // 3. Sync kết quả trận vừa kết thúc — 04:00 sáng
      //    → Bắt các trận muộn (La Liga đá ~02:00-03:00 VN)
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FINISHED_SYNC,
        {},
        {
          repeat: { pattern: '0 4 * * *' },
          jobId: 'finished-matches-sync-4am',
        },
      );

      // 4. Sync Bảng xếp hạng — 02:00 sáng
      //    → Sau khi hết trận buổi tối, cập nhật BXH mỗi ngày
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_STANDINGS_SYNC,
        {},
        {
          repeat: { pattern: '0 2 * * *' },
          jobId: 'standings-sync-2am',
        },
      );

      // 5. Sync lịch thi đấu giới hạn (≤10 trận, ưu tiên giải lớn) — 07:00 sáng
      //    → Cập nhật fixtures 7 ngày tới mỗi sáng, tiết kiệm API
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FIXTURES_LIMITED_SYNC,
        {},
        {
          repeat: { pattern: '0 7 * * *' },
          jobId: 'fixtures-limited-sync-7am',
        },
      );

      this.logger.log(
        'Đã đăng ký lịch đồng bộ Free-plan: ' +
        'Full(03:00) | Finished(01:00 + 04:00) | Standings(02:00) | Fixtures(07:00)',
      );
    } catch (err: any) {
      this.logger.warn(`Không thể khởi tạo cron scheduler: ${err.message}`);
    }
  }


  /**
   * Xử lý điều phối các Trigger Job
   */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      // Full sync: Leagues → Teams → Matches → Standings (03:00 sáng)
      case SportsSyncJob.TRIGGER_FULL_SYNC:
        await this.flowProducer.add({
          name: SportsSyncJob.SYNC_STANDINGS,
          queueName: SPORTS_SYNC_QUEUE,
          data: { triggeredAt: new Date().toISOString() },
          children: [
            {
              name: SportsSyncJob.SYNC_MATCHES,
              queueName: SPORTS_SYNC_QUEUE,
              data: { triggeredAt: new Date().toISOString() },
              children: [
                {
                  name: SportsSyncJob.SYNC_TEAMS,
                  queueName: SPORTS_SYNC_QUEUE,
                  data: {},
                  children: [
                    {
                      name: SportsSyncJob.SYNC_LEAGUES,
                      queueName: SPORTS_SYNC_QUEUE,
                      data: {},
                    },
                  ],
                },
              ],
            },
          ],
        });
        this.logger.log('Đã xếp hàng Full Sync Flow (Leagues → Teams → Matches → Standings)');
        break;

      // Sync kết quả trận đấu vừa kết thúc (01:00 và 04:00 sáng)
      case SportsSyncJob.TRIGGER_FINISHED_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_FINISHED, {});
        break;

      // Sync bảng xếp hạng độc lập (02:00 sáng)
      case SportsSyncJob.TRIGGER_STANDINGS_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_STANDINGS, {});
        break;

      // Sync lịch thi đấu giới hạn — tối đa 10 trận, ưu tiên giải lớn (07:00 sáng)
      case SportsSyncJob.TRIGGER_FIXTURES_LIMITED_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_FIXTURES_LIMITED, {
          maxTotal: 10,
          days: 7,
        });
        break;

      default:
        this.logger.warn(`Không nhận diện được Scheduler Trigger: ${job.name}`);
    }
  }
}
