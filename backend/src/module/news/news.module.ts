import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsProcessor, NewsScheduler, NEWS_QUEUE } from './news.scheduler';

const isQueueEnabled = process.env.ENABLE_SYNC_QUEUE === 'true';

@Module({
  imports: isQueueEnabled ? [BullModule.registerQueue({ name: NEWS_QUEUE })] : [],
  controllers: [NewsController],
  providers: [
    NewsService,
    ...(isQueueEnabled ? [NewsScheduler, NewsProcessor] : []),
  ],
  exports: [NewsService],
})
export class NewsModule {}

