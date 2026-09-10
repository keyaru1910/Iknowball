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
      const existing = await this.schedulerQueue.getRepeatableJobs();
      for (const job of existing) {
        await this.schedulerQueue.removeRepeatableByKey(job.key);
      }

      // 1. Full sync hằng ngày lúc 03:00 sáng
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FULL_SYNC,
        {},
        {
          repeat: { pattern: '0 3 * * *' },
          jobId: 'daily-full-sync',
        },
      );

      // 2. Upcoming sync mỗi 6 tiếng
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_UPCOMING_SYNC,
        {},
        {
          repeat: { pattern: '0 */6 * * *' },
          jobId: 'upcoming-matches-sync',
        },
      );

      // 3. Match-day sync mỗi 30 phút
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_MATCH_DAY_SYNC,
        {},
        {
          repeat: { pattern: '*/30 * * * *' },
          jobId: 'match-day-sync',
        },
      );

      // 4. Live sync mỗi 2 phút
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_LIVE_SYNC,
        {},
        {
          repeat: { pattern: '*/2 * * * *' },
          jobId: 'live-matches-sync',
        },
      );

      // 5. Finished sync mỗi 10 phút
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FINISHED_SYNC,
        {},
        {
          repeat: { pattern: '*/10 * * * *' },
          jobId: 'finished-matches-sync',
        },
      );

      this.logger.log('Đã đăng ký toàn bộ lịch đồng bộ tự động (full, upcoming, match-day, live, finished)');
    } catch (err: any) {
      this.logger.warn(`Không thể khởi tạo cron scheduler: ${err.message}`);
    }
  }

  /**
   * Xử lý điều phối các Trigger Job
   */
  async process(job: Job): Promise<void> {
    switch (job.name) {
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

      case SportsSyncJob.TRIGGER_UPCOMING_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_UPCOMING, { days: 7 });
        break;

      case SportsSyncJob.TRIGGER_MATCH_DAY_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_MATCHES, {});
        break;

      case SportsSyncJob.TRIGGER_LIVE_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_LIVE, {});
        break;

      case SportsSyncJob.TRIGGER_FINISHED_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_FINISHED, {});
        break;

      default:
        this.logger.warn(`Không nhận diện được Scheduler Trigger: ${job.name}`);
    }
  }
}
