// src/module/sports-sync/sports-sync.service.ts
import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { Prisma, MatchStatus, SyncJobStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type {
  SportsDataProvider,
  NormalizedLeague,
  NormalizedTeam,
  NormalizedStanding,
} from '../sports-data/adapters/football-provider.interface';
import { SPORTS_DATA_PROVIDERS } from '../sports-data/sports-data.module';
import { computeContentHash } from './untils/hash.util';
import { EloService } from '../elo/elo.service';
import { CacheService } from '../shared/cache.service';

export interface SyncResult {
  ids: string[];
  processedCount: number;
  failedCount: number;
  errors: string[];
}

interface ResolvedMatch {
  id: string;
  externalId: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: Date;
  season: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  rawData: Record<string, any>;
  hash: string;
}

const BATCH_CHUNK_SIZE = 500;

/**
 * Service điều phối đồng bộ dữ liệu thể thao (Football & NBA)
 */
@Injectable()
export class SportsSyncService {
  private readonly logger = new Logger(SportsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('SPORTS_DATA_PROVIDER')
    private readonly defaultSportsApi: SportsDataProvider,
    private readonly eloService: EloService,
    private readonly cacheService: CacheService,
    @Optional()
    @Inject(SPORTS_DATA_PROVIDERS)
    private readonly sportsProvidersMap?: Record<string, SportsDataProvider>,
  ) {}

  /**
   * Lấy provider phù hợp theo tên môn thể thao hoặc trả về default
   */
  private getProvider(sportName?: string): SportsDataProvider {
    if (sportName && this.sportsProvidersMap && this.sportsProvidersMap[sportName.toLowerCase()]) {
      return this.sportsProvidersMap[sportName.toLowerCase()];
    }
    return this.defaultSportsApi;
  }

  /**
   * Lấy danh sách toàn bộ providers có trong hệ thống
   */
  private getAllProviders(): SportsDataProvider[] {
    if (this.sportsProvidersMap && Object.keys(this.sportsProvidersMap).length > 0) {
      return Object.values(this.sportsProvidersMap);
    }
    return [this.defaultSportsApi];
  }

  /**
   * Xóa toàn bộ Cache liên quan sau khi đồng bộ dữ liệu thành công
   */
  async invalidateCache() {
    try {
      await Promise.all([
        this.cacheService.delByPattern('matches:*'),
        this.cacheService.delByPattern('match_detail:*'),
        this.cacheService.delByPattern('standings:*'),
        this.cacheService.delByPattern('leagues:*'),
        this.cacheService.delByPattern('team_detail:*'),
      ]);
      this.logger.log('Đã làm mới (invalidation) cache Redis sau khi đồng bộ.');
    } catch (err: any) {
      this.logger.warn(`Lỗi khi xóa cache: ${err.message}`);
    }
  }

  /**
   * Khởi tạo bản ghi log ban đầu khi bắt đầu một job
   */
  async startSyncLog(jobName: string) {
    return this.prisma.syncJobLog.create({
      data: {
        jobName,
        status: SyncJobStatus.FAILED,
        startedAt: new Date(),
      },
    });
  }

  /**
   * Cập nhật trạng thái và kết quả sau khi job hoàn tất
   */
  async finishSyncLog(
    id: string,
    status: SyncJobStatus,
    recordsProcessed: number,
    errorMessage?: string,
  ) {
    return this.prisma.syncJobLog.update({
      where: { id },
      data: {
        status,
        finishedAt: new Date(),
        recordsProcessed,
        errorMessage,
      },
    });
  }

  /**
   * Đảm bảo môn thể thao tồn tại trong bảng Sport
   */
  private async ensureSport(sportName: string) {
    return this.prisma.sport.upsert({
      where: { name: sportName.toLowerCase() },
      update: {},
      create: { name: sportName.toLowerCase() },
    });
  }

  /**
   * Upsert Giải đấu (League) có kiểm tra contentHash
   */
  private async upsertLeagueIfChanged(l: NormalizedLeague, sportId: string) {
    const payload = {
      sportId,
      name: l.name,
      country: l.country,
      externalId: l.externalId,
      season: l.season,
    };
    const hash = computeContentHash(payload);

    const existing = await this.prisma.league.findUnique({
      where: { externalId: l.externalId },
      select: { id: true, contentHash: true },
    });

    if (existing && existing.contentHash === hash) {
      return { id: existing.id, changed: false };
    }

    const league = await this.prisma.league.upsert({
      where: { externalId: l.externalId },
      update: {
        name: l.name,
        country: l.country,
        season: l.season,
        contentHash: hash,
      },
      create: {
        sportId,
        name: l.name,
        country: l.country,
        externalId: l.externalId,
        season: l.season,
        contentHash: hash,
      },
      select: { id: true },
    });

    return { id: league.id, changed: true };
  }

  /**
   * 1. Đồng bộ Giải đấu (Leagues)
   */
  async syncLeagues(sportName?: string): Promise<SyncResult> {
    const providers = sportName ? [this.getProvider(sportName)] : this.getAllProviders();
    const ids: string[] = [];
    const errors: string[] = [];

    for (const provider of providers) {
      try {
        const sportRecord = await this.ensureSport(provider.sportName);
        const leagues = await provider.fetchLeagues();

        for (const l of leagues) {
          try {
            const { id } = await this.upsertLeagueIfChanged(l, sportRecord.id);
            ids.push(id);
          } catch (err: any) {
            errors.push(`League ${l.externalId}: ${err.message}`);
            this.logger.warn(`League ${l.externalId} upsert thất bại: ${err.message}`);
          }
        }
      } catch (err: any) {
        errors.push(`Fetch leagues thất bại cho môn ${provider.sportName}: ${err.message}`);
        this.logger.error(`Fetch leagues thất bại cho môn ${provider.sportName}: ${err.message}`);
      }
    }

    await this.invalidateCache();

    return {
      ids,
      processedCount: ids.length,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * Upsert Đội bóng (Team) có kiểm tra contentHash
   */
  private async upsertTeamIfChanged(t: NormalizedTeam, leagueId: string) {
    const payload = {
      leagueId,
      name: t.name,
      shortName: t.shortName,
      logoUrl: t.logoUrl,
      externalId: t.externalId,
      foundedYear: t.foundedYear,
    };
    const hash = computeContentHash(payload);

    const existing = await this.prisma.team.findUnique({
      where: { externalId: t.externalId },
      select: { id: true, contentHash: true },
    });

    if (existing && existing.contentHash === hash) {
      return { id: existing.id, changed: false };
    }

    const team = await this.prisma.team.upsert({
      where: { externalId: t.externalId },
      update: {
        leagueId,
        name: t.name,
        shortName: t.shortName,
        logoUrl: t.logoUrl,
        foundedYear: t.foundedYear,
        contentHash: hash,
      },
      create: {
        leagueId,
        name: t.name,
        shortName: t.shortName,
        logoUrl: t.logoUrl,
        externalId: t.externalId,
        foundedYear: t.foundedYear,
        contentHash: hash,
      },
      select: { id: true },
    });

    return { id: team.id, changed: true };
  }

  /**
   * 2. Đồng bộ Đội bóng (Teams)
   */
  async syncTeams(leagueIds?: string[], sportName?: string): Promise<SyncResult> {
    const ids: string[] = [];
    const errors: string[] = [];

    const whereClause: Prisma.LeagueWhereInput = {};
    if (leagueIds && leagueIds.length > 0) {
      whereClause.id = { in: leagueIds };
    }
    if (sportName) {
      whereClause.sport = { name: sportName.toLowerCase() };
    }

    const leagues = await this.prisma.league.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: { sport: true },
    });

    for (const league of leagues) {
      try {
        const provider = this.getProvider(league.sport.name);
        const teams = await provider.fetchTeams(league.externalId, league.season);

        for (const t of teams) {
          try {
            const { id } = await this.upsertTeamIfChanged(t, league.id);
            ids.push(id);
          } catch (err: any) {
            errors.push(`Team ${t.externalId}: ${err.message}`);
            this.logger.warn(`Team ${t.externalId} upsert thất bại: ${err.message}`);
          }
        }
      } catch (err: any) {
        errors.push(`Fetch teams cho league ${league.externalId} thất bại: ${err.message}`);
        this.logger.warn(`Fetch teams cho league ${league.externalId} thất bại: ${err.message}`);
      }
    }

    await this.invalidateCache();

    return {
      ids,
      processedCount: ids.length,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * 3. Đồng bộ Trận đấu (Matches / Fixtures)
   */
  async syncMatches(options?: {
    teamIds?: string[];
    leagueIds?: string[];
    sportName?: string;
    status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELED';
    fromDate?: Date;
    toDate?: Date;
  }): Promise<SyncResult> {
    const errors: string[] = [];

    const whereClause: Prisma.LeagueWhereInput = {};
    if (options?.leagueIds && options.leagueIds.length > 0) {
      whereClause.id = { in: options.leagueIds };
    }
    if (options?.sportName) {
      whereClause.sport = { name: options.sportName.toLowerCase() };
    }

    const leagues = await this.prisma.league.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: { sport: true },
    });

    const resolved: ResolvedMatch[] = [];

    for (const league of leagues) {
      try {
        const provider = this.getProvider(league.sport.name);
        const fixtures = await provider.fetchFixtures(league.externalId, league.season, {
          status: options?.status,
          fromDate: options?.fromDate,
          toDate: options?.toDate,
        });

        for (const m of fixtures) {
          try {
            const [homeTeam, awayTeam] = await Promise.all([
              this.prisma.team.findUnique({ where: { externalId: m.homeTeamExternalId } }),
              this.prisma.team.findUnique({ where: { externalId: m.awayTeamExternalId } }),
            ]);

            if (!homeTeam || !awayTeam) {
              const errorMsg = `Match ${m.externalId}: Thiếu đội bóng (home: ${m.homeTeamExternalId}, away: ${m.awayTeamExternalId})`;
              errors.push(errorMsg);
              continue;
            }

            resolved.push({
              id: randomUUID(),
              externalId: m.externalId,
              leagueId: league.id,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              matchDate: m.matchDate,
              season: league.season,
              status: m.status as MatchStatus,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
              rawData: m.rawData,
              hash: computeContentHash(m.rawData),
            });
          } catch (err: any) {
            errors.push(`Match ${m.externalId} resolve thất bại: ${err.message}`);
          }
        }
      } catch (err: any) {
        errors.push(`Fetch fixtures cho league ${league.externalId} thất bại: ${err.message}`);
      }
    }

    // Ghi dữ liệu vào Database theo Chunk
    const changedIds: string[] = [];

    for (let i = 0; i < resolved.length; i += BATCH_CHUNK_SIZE) {
      const chunk = resolved.slice(i, i + BATCH_CHUNK_SIZE);
      try {
        const { changedExternalIds } = await this.batchUpsertMatches(chunk);
        changedIds.push(...changedExternalIds);
      } catch (err: any) {
        this.logger.warn(`Batch upsert thất bại, chuyển sang fallback per-row: ${err.message}`);
        for (const m of chunk) {
          try {
            await this.upsertMatchIfChanged(m);
            changedIds.push(m.externalId);
          } catch (rowErr: any) {
            errors.push(`Match ${m.externalId} upsert thất bại: ${rowErr.message}`);
          }
        }
      }
    }

    // Kích hoạt tính toán ELO cho các trận vừa FINISHED
    const finishedMatches = await this.prisma.match.findMany({
      where: {
        externalId: { in: changedIds },
        status: MatchStatus.FINISHED,
        eloProcessedAt: null,
      },
      select: { id: true },
    });

    for (const match of finishedMatches) {
      try {
        await this.eloService.applyFinishedMatch(match.id);
      } catch (eloErr: any) {
        this.logger.warn(`Tính ELO cho match ${match.id} thất bại: ${eloErr.message}`);
      }
    }

    await this.invalidateCache();

    return {
      ids: changedIds,
      processedCount: resolved.length,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * 4. Đồng bộ Bảng xếp hạng (Standings) và Thống kê Đội bóng (TeamStats)
   */
  async syncStandings(leagueIds?: string[], sportName?: string): Promise<SyncResult> {
    const ids: string[] = [];
    const errors: string[] = [];

    const whereClause: Prisma.LeagueWhereInput = {};
    if (leagueIds && leagueIds.length > 0) {
      whereClause.id = { in: leagueIds };
    }
    if (sportName) {
      whereClause.sport = { name: sportName.toLowerCase() };
    }

    const leagues = await this.prisma.league.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: { sport: true },
    });

    for (const league of leagues) {
      try {
        const provider = this.getProvider(league.sport.name);
        if (!provider.fetchStandings) continue;

        const standings = await provider.fetchStandings(league.externalId, league.season);

        for (const s of standings) {
          try {
            const team = await this.prisma.team.findUnique({
              where: { externalId: s.teamExternalId },
            });

            if (!team) {
              errors.push(`Standing: Không tìm thấy team ${s.teamExternalId}`);
              continue;
            }

            // Upsert bảng Standing
            const standingRecord = await this.prisma.standing.upsert({
              where: {
                leagueId_teamId_season: {
                  leagueId: league.id,
                  teamId: team.id,
                  season: s.season,
                },
              },
              update: {
                rank: s.rank,
                points: s.points,
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
              },
              create: {
                leagueId: league.id,
                teamId: team.id,
                season: s.season,
                rank: s.rank,
                points: s.points,
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
              },
            });

            // Đồng thời cập nhật bảng TeamStats tương ứng
            await this.prisma.teamStats.upsert({
              where: {
                teamId_leagueId_season: {
                  teamId: team.id,
                  leagueId: league.id,
                  season: s.season,
                },
              },
              update: {
                matchesPlayed: s.played,
                wins: s.won,
                draws: s.drawn,
                losses: s.lost,
                goalsFor: s.goalsFor ?? 0,
                goalsAgainst: s.goalsAgainst ?? 0,
              },
              create: {
                teamId: team.id,
                leagueId: league.id,
                season: s.season,
                matchesPlayed: s.played,
                wins: s.won,
                draws: s.drawn,
                losses: s.lost,
                goalsFor: s.goalsFor ?? 0,
                goalsAgainst: s.goalsAgainst ?? 0,
              },
            });

            ids.push(standingRecord.id);
          } catch (itemErr: any) {
            errors.push(`Standing ${s.teamExternalId} upsert thất bại: ${itemErr.message}`);
          }
        }
      } catch (err: any) {
        errors.push(`Fetch standings cho league ${league.externalId} thất bại: ${err.message}`);
      }
    }

    await this.invalidateCache();

    return {
      ids,
      processedCount: ids.length,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * 5. Đồng bộ các trận đấu đang diễn ra (LIVE)
   */
  async syncLiveMatches(sportName?: string): Promise<SyncResult> {
    return this.syncMatches({
      sportName,
      status: 'LIVE',
    });
  }

  /**
   * 6. Đồng bộ các trận đấu vừa kết thúc (FINISHED), chốt kết quả và standings
   */
  async syncFinishedMatches(sportName?: string): Promise<SyncResult> {
    const fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 giờ qua
    const matchResult = await this.syncMatches({
      sportName,
      status: 'FINISHED',
      fromDate,
    });

    // Đồng bộ lại Standings sau khi các trận đấu kết thúc
    await this.syncStandings(undefined, sportName);

    return matchResult;
  }

  /**
   * 7. Đồng bộ các trận đấu sắp tới (UPCOMING) trong N ngày
   */
  async syncUpcomingMatches(days = 7, sportName?: string): Promise<SyncResult> {
    const fromDate = new Date();
    const toDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.syncMatches({
      sportName,
      status: 'SCHEDULED',
      fromDate,
      toDate,
    });
  }

  /**
   * 8. Đồng bộ các trận đấu trong ngày (MATCH-DAY)
   */
  async syncMatchDay(sportName?: string): Promise<SyncResult> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.syncMatches({
      sportName,
      fromDate: startOfDay,
      toDate: endOfDay,
    });
  }

  /**
   * Batch upsert các trận đấu bằng Raw SQL
   */
  private async batchUpsertMatches(matches: ResolvedMatch[]) {
    if (matches.length === 0) {
      return { upserted: 0, skipped: 0, changedExternalIds: [] as string[] };
    }

    const externalIds = matches.map((m) => m.externalId);

    const existing = await this.prisma.$queryRaw<{ externalId: string; contentHash: string | null }[]>`
      SELECT "externalId", "contentHash" FROM "Match" WHERE "externalId" = ANY(${externalIds})
    `;
    const existingHashMap = new Map(existing.map((e) => [e.externalId, e.contentHash]));

    const changed = matches.filter((m) => existingHashMap.get(m.externalId) !== m.hash);

    if (changed.length === 0) {
      return { upserted: 0, skipped: matches.length, changedExternalIds: [] as string[] };
    }

    const values = changed.map(
      (m) => Prisma.sql`(
        ${m.id}, ${m.externalId}, ${m.leagueId}, ${m.homeTeamId}, ${m.awayTeamId},
        ${m.matchDate}, ${m.season}, ${m.status}::"MatchStatus", ${m.homeScore}, ${m.awayScore},
        ${JSON.stringify(m.rawData)}::jsonb, ${m.hash}, now(), now()
      )`,
    );

    await this.prisma.$executeRaw`
      INSERT INTO "Match" (
        id, "externalId", "leagueId", "homeTeamId", "awayTeamId",
        "matchDate", season, status, "homeScore", "awayScore", "rawData", "contentHash", "createdAt", "updatedAt"
      )
      VALUES ${Prisma.join(values)}
      ON CONFLICT ("externalId") DO UPDATE SET
        "matchDate"   = EXCLUDED."matchDate",
        season          = EXCLUDED.season,
        status          = EXCLUDED.status,
        "homeScore"   = EXCLUDED."homeScore",
        "awayScore"   = EXCLUDED."awayScore",
        "rawData"     = EXCLUDED."rawData",
        "contentHash" = EXCLUDED."contentHash",
        "updatedAt"   = EXCLUDED."updatedAt"
      WHERE "Match"."contentHash" IS DISTINCT FROM EXCLUDED."contentHash"
    `;

    return {
      upserted: changed.length,
      skipped: matches.length - changed.length,
      changedExternalIds: changed.map((m) => m.externalId),
    };
  }

  /**
   * Per-row fallback upsert trận đấu
   */
  private async upsertMatchIfChanged(m: ResolvedMatch) {
    const existing = await this.prisma.match.findUnique({
      where: { externalId: m.externalId },
      select: { contentHash: true },
    });
    if (existing?.contentHash === m.hash) return;

    await this.prisma.match.upsert({
      where: { externalId: m.externalId },
      update: {
        matchDate: m.matchDate,
        season: m.season,
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        rawData: m.rawData as any,
        contentHash: m.hash,
      },
      create: {
        id: m.id,
        externalId: m.externalId,
        leagueId: m.leagueId,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        matchDate: m.matchDate,
        season: m.season,
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        rawData: m.rawData as any,
        contentHash: m.hash,
      },
    });
  }
}
