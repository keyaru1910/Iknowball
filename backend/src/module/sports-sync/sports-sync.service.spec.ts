// src/module/sports-sync/sports-sync.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SportsSyncService } from './sports-sync.service';
import { SyncJobStatus, MatchStatus } from '@prisma/client';

describe('SportsSyncService', () => {
  let service: SportsSyncService;
  let mockPrisma: any;
  let mockProvider: any;
  let mockEloService: any;
  let mockCacheService: any;

  beforeEach(() => {
    mockPrisma = {
      syncJobLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1', jobName: 'test-job', status: SyncJobStatus.FAILED }),
        update: vi.fn().mockResolvedValue({ id: 'log-1', status: SyncJobStatus.SUCCESS }),
      },
      sport: {
        upsert: vi.fn().mockResolvedValue({ id: 'sport-football', name: 'football' }),
      },
      league: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([
          { id: 'l1', externalId: '39', season: '2024', sport: { name: 'football' } },
        ]),
        upsert: vi.fn().mockResolvedValue({ id: 'l1' }),
      },
      team: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([
          { id: 't1', externalId: 'team-1', league: { id: 'l1', externalId: '39', season: '2024' } },
        ]),
        upsert: vi.fn().mockResolvedValue({ id: 't1' }),
      },
      match: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({ id: 'm1' }),
      },
      standing: {
        upsert: vi.fn().mockResolvedValue({ id: 's1' }),
      },
      teamStats: {
        upsert: vi.fn().mockResolvedValue({ id: 'ts1' }),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn().mockResolvedValue(1),
    };

    mockProvider = {
      sportName: 'football',
      fetchLeagues: vi.fn().mockResolvedValue([
        { externalId: '39', name: 'Premier League', country: 'England', season: '2024' },
      ]),
      fetchTeams: vi.fn().mockResolvedValue([
        { externalId: 'team-1', leagueExternalId: '39', name: 'Arsenal', shortName: 'ARS', logoUrl: null, foundedYear: 1886 },
      ]),
      fetchFixtures: vi.fn().mockResolvedValue([
        {
          externalId: 'fix-1',
          leagueExternalId: '39',
          homeTeamExternalId: 'team-1',
          awayTeamExternalId: 'team-2',
          matchDate: new Date('2026-09-15T15:00:00Z'),
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          rawData: { id: 'fix-1' },
        },
      ]),
      fetchStandings: vi.fn().mockResolvedValue([
        {
          leagueExternalId: '39',
          teamExternalId: 'team-1',
          season: '2024',
          rank: 1,
          points: 15,
          played: 5,
          won: 5,
          drawn: 0,
          lost: 0,
          goalsFor: 12,
          goalsAgainst: 2,
        },
      ]),
    };

    mockEloService = {
      applyFinishedMatch: vi.fn().mockResolvedValue(undefined),
    };

    mockCacheService = {
      delByPattern: vi.fn().mockResolvedValue(undefined),
    };

    service = new SportsSyncService(
      mockPrisma,
      mockProvider,
      mockEloService,
      mockCacheService,
      { football: mockProvider },
    );
  });

  it('syncLeagues() nên fetch leagues, upsert và xóa cache', async () => {
    const result = await service.syncLeagues();

    expect(mockProvider.fetchLeagues).toHaveBeenCalled();
    expect(mockPrisma.league.upsert).toHaveBeenCalled();
    expect(mockCacheService.delByPattern).toHaveBeenCalledWith('matches:*');
    expect(result.processedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.ids).toContain('l1');
  });

  it('syncTeams() nên fetch teams và upsert từng đội', async () => {
    const result = await service.syncTeams(['l1']);

    expect(mockProvider.fetchTeams).toHaveBeenCalledWith('39', '2024');
    expect(mockPrisma.team.upsert).toHaveBeenCalled();
    expect(result.processedCount).toBe(1);
    expect(result.failedCount).toBe(0);
  });

  it('syncStandings() nên fetch standings và cập nhật cả Standing lẫn TeamStats', async () => {
    mockPrisma.team.findUnique.mockResolvedValueOnce({ id: 't1', externalId: 'team-1' });

    const result = await service.syncStandings(['l1']);

    expect(mockProvider.fetchStandings).toHaveBeenCalledWith('39', '2024');
    expect(mockPrisma.standing.upsert).toHaveBeenCalled();
    expect(mockPrisma.teamStats.upsert).toHaveBeenCalled();
    expect(result.processedCount).toBe(1);
    expect(result.failedCount).toBe(0);
  });

  it('startSyncLog() và finishSyncLog() ghi nhận đúng log', async () => {
    const log = await service.startSyncLog('sync-leagues');
    expect(mockPrisma.syncJobLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        jobName: 'sync-leagues',
        status: SyncJobStatus.FAILED,
      }),
    });
    expect(log.id).toBe('log-1');

    await service.finishSyncLog('log-1', SyncJobStatus.SUCCESS, 10);
    expect(mockPrisma.syncJobLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: expect.objectContaining({
        status: SyncJobStatus.SUCCESS,
        recordsProcessed: 10,
      }),
    });
  });
});
