// src/modules/sports-sync/sports-sync-scheduler.processor.ts
import { Processor, WorkerHost, InjectFlowProducer } from '@nestjs/bullmq';
import { Job, FlowProducer } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    SPORTS_SYNC_QUEUE,
    SPORTS_SYNC_FLOW_PRODUCER,
    SPORTS_SYNC_SCHEDULER_QUEUE,
    SportsSyncJob,
} from './constants/job-names';

@Processor(SPORTS_SYNC_SCHEDULER_QUEUE)
export class SportsSyncSchedulerProcessor extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(SportsSyncSchedulerProcessor.name);

    constructor(
        @InjectFlowProducer(SPORTS_SYNC_FLOW_PRODUCER)
        private readonly flowProducer: FlowProducer,
        @InjectQueue(SPORTS_SYNC_SCHEDULER_QUEUE)
        private readonly schedulerQueue: Queue,
    ) {
        super();
    }

    // Đăng ký repeatable job khi module khởi động.
    // Dùng jobId cố định + xoá repeatable cũ trước để tránh nhân bản cron entry
    // mỗi lần app restart (gotcha kinh điển của BullMQ repeatable jobs).
    async onModuleInit() {
        const existing = await this.schedulerQueue.getRepeatableJobs();
        for (const job of existing) {
            await this.schedulerQueue.removeRepeatableByKey(job.key);
        }

        await this.schedulerQueue.add(
            SportsSyncJob.TRIGGER_FULL_SYNC,
            {},
            {
                repeat: { pattern: '0 3 * * *' }, // 3h sáng hằng ngày — chỉnh theo nhu cầu
                jobId: 'daily-full-sync',
            },
        );
        this.logger.log('Registered repeatable job: daily-full-sync (0 3 * * *)');
    }

    async process(job: Job): Promise<void> {
        if (job.name !== SportsSyncJob.TRIGGER_FULL_SYNC) return;

        // Dựng flow: sync-matches (parent) phụ thuộc sync-teams (child)
        // phụ thuộc sync-leagues (grandchild). BullMQ đảm bảo grandchild chạy
        // xong trước thì child mới chạy, child xong thì parent mới chạy.
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

        this.logger.log('Full sync flow enqueued (leagues → teams → matches)');
    }
}