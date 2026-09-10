// src/module/sports-sync/sports-sync.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SportsSyncController } from './sports-sync.controller';
import { SyncJobStatus } from '@prisma/client';

describe('SportsSyncController', () => {
  let controller: SportsSyncController;
  let mockSyncService: any;
  let mockPrisma: any;
  let mockSyncQueue: any;
  let mockSchedulerQueue: any;

  beforeEach(() => {
    mockSyncService = {
      syncLeagues: vi.fn().mockResolvedValue({ ids: ['l1'], processedCount: 1, failedCount: 0, errors: [] }),
      syncTeams: vi.fn().mockResolvedValue({ ids: ['t1'], processedCount: 1, failedCount: 0, errors: [] }),
      syncMatches: vi.fn().mockResolvedValue({ ids: ['m1'], processedCount: 1, failedCount: 0, errors: [] }),
      syncStandings: vi.fn().mockResolvedValue({ ids: ['s1'], processedCount: 1, failedCount: 0, errors: [] }),
      syncLiveMatches: vi.fn().mockResolvedValue({ ids: [], processedCount: 0, failedCount: 0, errors: [] }),
      syncFinishedMatches: vi.fn().mockResolvedValue({ ids: ['m1'], processedCount: 1, failedCount: 0, errors: [] }),
      syncUpcomingMatches: vi.fn().mockResolvedValue({ ids: ['m2'], processedCount: 1, failedCount: 0, errors: [] }),
    };

    mockPrisma = {
      syncJobLog: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'log-1', jobName: 'sync-leagues', status: SyncJobStatus.SUCCESS, recordsProcessed: 5 },
        ]),
        count: vi.fn().mockResolvedValue(1),
        findUnique: vi.fn().mockResolvedValue({
          id: 'log-1',
          jobName: 'sync-leagues',
          status: SyncJobStatus.SUCCESS,
          recordsProcessed: 5,
        }),
      },
    };

    mockSyncQueue = {
      getWaitingCount: vi.fn().mockResolvedValue(0),
      getActiveCount: vi.fn().mockResolvedValue(1),
      getCompletedCount: vi.fn().mockResolvedValue(10),
      getFailedCount: vi.fn().mockResolvedValue(0),
      getDelayedCount: vi.fn().mockResolvedValue(0),
    };

    mockSchedulerQueue = {
      getRepeatableJobs: vi.fn().mockResolvedValue([
        { key: 'daily-sync', name: 'trigger-full-sync', id: '1', pattern: '0 3 * * *', next: 1726000000000 },
      ]),
    };

    controller = new SportsSyncController(
      mockSyncService,
      mockPrisma,
      mockSyncQueue,
      mockSchedulerQueue,
    );
  });

  it('POST /trigger full sync nên gọi đủ các dịch vụ đồng bộ', async () => {
    const res = await controller.triggerSync({ type: 'full', sport: 'football' });

    expect(mockSyncService.syncLeagues).toHaveBeenCalledWith('football');
    expect(mockSyncService.syncTeams).toHaveBeenCalledWith(undefined, 'football');
    expect(mockSyncService.syncMatches).toHaveBeenCalledWith({ sportName: 'football' });
    expect(mockSyncService.syncStandings).toHaveBeenCalledWith(undefined, 'football');
    expect(res.data.leagues.ids).toContain('l1');
    expect(res.meta.message).toContain('thành công');
  });

  it('GET /jobs nên trả về danh sách lịch sử và phân trang', async () => {
    const res = await controller.getSyncJobs({ page: '1', limit: '10' });

    expect(mockPrisma.syncJobLog.findMany).toHaveBeenCalled();
    expect(res.data.length).toBe(1);
    expect(res.meta.total).toBe(1);
    expect(res.meta.page).toBe(1);
  });

  it('GET /jobs/:id nên trả về chi tiết job log', async () => {
    const res = await controller.getSyncJobById('log-1');

    expect(mockPrisma.syncJobLog.findUnique).toHaveBeenCalledWith({ where: { id: 'log-1' } });
    expect(res.data.id).toBe('log-1');
  });

  it('GET /queues/status nên trả về số lượng job của BullMQ và Repeatable jobs', async () => {
    const res = await controller.getQueuesStatus();

    expect(res.data.syncQueue.active).toBe(1);
    expect(res.data.syncQueue.completed).toBe(10);
    expect(res.data.schedulerQueue.repeatableJobsCount).toBe(1);
  });
});
