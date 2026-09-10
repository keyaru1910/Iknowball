import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PredictionJob, PREDICTION_QUEUE } from './prediction.constants';
import { PredictionService } from './prediction.service';
import { EloService } from '../elo/elo.service';

@Processor(PREDICTION_QUEUE)
export class PredictionProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(PredictionProcessor.name);

  constructor(
    @InjectQueue(PREDICTION_QUEUE) private readonly queue: Queue,
    private readonly service: PredictionService,
    private readonly eloService: EloService,
  ) {
    super();
  }

  async onModuleInit() {
    // Xóa tất cả job lặp cũ trước khi đăng ký lại để tránh duplicate
    const repeatable = await this.queue.getRepeatableJobs();
    await Promise.all(repeatable.map((job) => this.queue.removeRepeatableByKey(job.key)));

    // Sinh dự đoán hàng ngày lúc 6:00 SA (giờ VN) cho các trận 48h tới
    await this.queue.add(PredictionJob.GENERATE, {}, {
      jobId: 'daily-generate-predictions',
      repeat: { pattern: '0 6 * * *', tz: 'Asia/Ho_Chi_Minh' },
    });

    // Đánh giá kết quả mỗi 3 giờ (khi trận đấu kết thúc cập nhật vào DB)
    // Quy trình: Cập nhật Elo tuần tự → Đánh giá kết quả dự đoán → Tổng hợp hiệu năng
    await this.queue.add(PredictionJob.EVALUATE, {}, {
      jobId: 'evaluate-predictions',
      repeat: { pattern: '0 */3 * * *', tz: 'Asia/Ho_Chi_Minh' },
    });
  }

  async process(job: Job) {
    if (job.name === PredictionJob.GENERATE) {
      this.logger.log('[PredictionJob.GENERATE] Bắt đầu sinh dự đoán cho các trận 48h tới...');
      // Cập nhật Elo tuần tự trước khi sinh dự đoán để feature snapshot chính xác
      const eloProcessed = await this.eloService.processPendingFinishedMatches();
      this.logger.log(`[PredictionJob.GENERATE] Đã cập nhật Elo cho ${eloProcessed} trận.`);
      const result = await this.service.generateUpcoming();
      this.logger.log(`[PredictionJob.GENERATE] Hoàn tất: ${result.succeeded} thành công / ${result.total} tổng.`);
      return result;
    }

    if (job.name === PredictionJob.EVALUATE) {
      this.logger.log('[PredictionJob.EVALUATE] Bắt đầu đánh giá kết quả dự đoán...');
      // Đảm bảo Elo được cập nhật trước khi evaluate
      const eloProcessed = await this.eloService.processPendingFinishedMatches();
      this.logger.log(`[PredictionJob.EVALUATE] Đã cập nhật Elo cho ${eloProcessed} trận.`);
      const evaluated = await this.service.evaluatePending();
      this.logger.log(`[PredictionJob.EVALUATE] Hoàn tất đánh giá ${evaluated} dự đoán.`);
      return { evaluated };
    }

    this.logger.warn(`[PredictionProcessor] Unknown prediction job: ${job.name}`);
  }
}
