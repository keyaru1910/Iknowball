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
    const isCronEnabled =
      process.env.ENABLE_SYNC_CRON === 'true' ||
      process.env.ENABLE_CRON === 'true' ||
      process.env.ENABLE_FOOTBALL_2026_27_SYNC === 'true';

    if (!isCronEnabled) {
      this.logger.log('Pipeline sports sync cron đang tắt; không đăng ký lịch đồng bộ tự động.');
      return;
    }
    try {
      // Xóa toàn bộ cron cũ trước khi đăng ký mới
      const existing = await this.schedulerQueue.getRepeatableJobs();
      for (const job of existing) {
        await this.schedulerQueue.removeRepeatableByKey(job.key);
      }

      const cronTz = process.env.CRON_TZ || 'Asia/Ho_Chi_Minh';

      // ────────────────────────────────────────────────────────────────
      // Chiến lược Free plan — Prediction-first
      // Đã bỏ: sync standings, sync live scores (không hiển thị trên frontend)
      // Giữ: sync matches/finished (cần cho Elo + Prediction evaluate)
      // ────────────────────────────────────────────────────────────────

      // 1. Full sync (Leagues + Teams + Matches) mỗi ngày lúc 03:00 sáng VN
      //    → Dữ liệu tĩnh ít thay đổi, chỉ cần sync 1 lần/ngày
      //    → Không sync standings (frontend đã bỏ trang BXH, tiết kiệm quota)
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FULL_SYNC,
        {},
        {
          repeat: { pattern: '0 3 * * *', tz: cronTz },
          jobId: 'daily-full-sync',
        },
      );

      // 2. Sync kết quả trận vừa kết thúc — 01:00 sáng VN
      //    → Bắt các trận tối hôm trước (Premier League, Serie A đá ~22:00-23:00 VN)
      //    → QUAN TRỌNG cho prediction: cần kết quả để cập nhật Elo + evaluate predictions
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FINISHED_SYNC,
        {},
        {
          repeat: { pattern: '0 1 * * *', tz: cronTz },
          jobId: 'finished-matches-sync-1am',
        },
      );

      // 3. Sync kết quả trận vừa kết thúc — 04:00 sáng VN
      //    → Bắt các trận muộn (La Liga đá ~02:00-03:00 VN)
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FINISHED_SYNC,
        {},
        {
          repeat: { pattern: '0 4 * * *', tz: cronTz },
          jobId: 'finished-matches-sync-4am',
        },
      );

      // [ĐÃ BỎ] Sync Bảng xếp hạng — không còn cần vì frontend đã bỏ trang standings
      // Standings data vẫn tồn tại trong DB từ seed, chỉ không sync mới nữa
      // Tiết kiệm ~5-10 API requests/ngày cho prediction pipeline

      // 5. Sync lịch thi đấu giới hạn (≤10 trận, ưu tiên giải lớn) — 07:00 sáng VN
      //    → Cập nhật fixtures 7 ngày tới mỗi sáng, tiết kiệm API
      //    NBA cũng nằm trong danh sách này (externalId: 'nba')
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_FIXTURES_LIMITED_SYNC,
        {},
        {
          repeat: { pattern: '0 7 * * *', tz: cronTz },
          jobId: 'fixtures-limited-sync-7am',
        },
      );

      // 6. Sync kết quả và BXH NBA — 14:00 chiều VN
      //    Trận NBA thường đá từ 08:00–12:00 VN, kết thúc trước 14:00
      //    BXH NBA được tính lại từ DB, không gọi thêm API standings
      await this.schedulerQueue.add(
        SportsSyncJob.TRIGGER_NBA_FINISHED_SYNC,
        {},
        {
          repeat: { pattern: '0 14 * * *', tz: cronTz },
          jobId: 'nba-finished-sync-2pm',
        },
      );

      this.logger.log(
        `Đã đăng ký lịch đồng bộ Prediction-first (${cronTz}): ` +
        'Full(03:00) | Finished-Football(01:00+04:00) | Fixtures(07:00) | NBA(14:00) — Standings: TẮT',
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
      // Full sync: Leagues → Teams → Matches (03:00 sáng)
      // Ghi chú: Standings đã bỏ khỏi flow (frontend không hiển thị BXH)
      case SportsSyncJob.TRIGGER_FULL_SYNC:
        await this.flowProducer.add({
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
        });
        this.logger.log('Đã xếp hàng Full Sync Flow (Leagues → Teams → Matches)');
        break;

      // Sync kết quả trận đấu vừa kết thúc (01:00 và 04:00 sáng)
      case SportsSyncJob.TRIGGER_FINISHED_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_FINISHED, {});
        break;

      // [ĐÃ BỎ] Sync bảng xếp hạng — không cần vì frontend đã bỏ trang standings
      // case SportsSyncJob.TRIGGER_STANDINGS_SYNC:
      //   await this.syncQueue.add(SportsSyncJob.SYNC_STANDINGS, {});
      //   break;

      // Sync lịch thi đấu giới hạn — tối đa 10 trận bóng đá, 10 trận bóng rổ (07:00 sáng)
      case SportsSyncJob.TRIGGER_FIXTURES_LIMITED_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_FIXTURES_LIMITED, {
          maxFootball: 10,
          maxBasketball: 10,
          days: 7,
        });
        break;

      // Sync kết quả NBA và tính lại BXH từ DB — không gọi thêm API (14:00 chiều)
      case SportsSyncJob.TRIGGER_NBA_FINISHED_SYNC:
        await this.syncQueue.add(SportsSyncJob.SYNC_NBA_FINISHED, {});
        break;

      default:
        this.logger.warn(`Không nhận diện được Scheduler Trigger: ${job.name}`);
    }
  }
}
