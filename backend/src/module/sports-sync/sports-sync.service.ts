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
import { computeContentHash } from './utils/hash.util';
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

    // Kích hoạt tính toán ELO tuần tự theo thứ tự thời gian cho các trận vừa FINISHED
    const finishedMatches = await this.prisma.match.findMany({
      where: {
        externalId: { in: changedIds },
        status: MatchStatus.FINISHED,
        eloProcessedAt: null,
      },
      orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
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
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.syncMatches({
      sportName,
      status: 'LIVE',
      fromDate: startOfDay,
      toDate: endOfDay,
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
   * 6b. Đồng bộ kết quả NBA sau khi trận kết thúc.
   *
   * Khung giờ: 02:00–13:00 VN (UTC+7) — tương đương 19:00 UTC hôm trước → 06:00 UTC hôm nay.
   * Trận NBA thường diễn ra 08:00–12:00 VN (tối hôm trước giờ Mỹ), kết thúc trước 13:00 VN.
   *
   * BXH được cập nhật từ API endpoint /standings — 1 request duy nhất, không tốn thêm quota.
   */
  async syncNbaFinishedMatches(): Promise<SyncResult> {
    const nbaLeague = await this.prisma.league.findFirst({
      where: { externalId: 'nba' },
      include: { sport: true },
    });

    if (!nbaLeague) {
      this.logger.warn('syncNbaFinishedMatches: Chưa có league NBA trong DB, bỏ qua.');
      return { ids: [], processedCount: 0, failedCount: 0, errors: ['NBA league chưa được sync'] };
    }

    // Khung giờ VN (UTC+7):  02:00 VN = 19:00 UTC hôm trước | 13:00 VN = 06:00 UTC hôm nay
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setUTCHours(19, 0, 0, 0);
    fromDate.setUTCDate(fromDate.getUTCDate() - 1); // 19:00 UTC ngày hôm trước

    const toDate = new Date(now);
    toDate.setUTCHours(6, 0, 0, 0); // 06:00 UTC hôm nay

    this.logger.log(
      `syncNbaFinishedMatches: Lấy kết quả từ ${fromDate.toISOString()} đến ${toDate.toISOString()}`,
    );

    const result = await this.syncMatches({
      leagueIds: [nbaLeague.id],
      status: 'FINISHED',
      fromDate,
      toDate,
    });

    // Cập nhật BXH NBA từ API /standings (chỉ 1 request)
    if (result.processedCount > 0 || result.ids.length > 0) {
      this.logger.log('syncNbaFinishedMatches: Đồng bộ BXH NBA từ API...');
      await this.syncStandings([nbaLeague.id]);
    }

    return result;
  }


  /**
   * Tính toán lại BXH NBA từ toàn bộ matches FINISHED trong DB — không gọi API.
   * Dùng sau khi sync kết quả trận đấu để tiết kiệm request.
   */
  private async recalculateNbaStandingsFromDb(leagueId: string, season: string): Promise<void> {
    const finishedMatches = await this.prisma.match.findMany({
      where: {
        leagueId,
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    });

    // Tổng hợp thống kê từng đội
    const statsMap = new Map<string, {
      won: number; lost: number; played: number;
      pointsFor: number; pointsAgainst: number;
    }>();

    const ensureTeam = (teamId: string) => {
      if (!statsMap.has(teamId)) {
        statsMap.set(teamId, { won: 0, lost: 0, played: 0, pointsFor: 0, pointsAgainst: 0 });
      }
      return statsMap.get(teamId)!;
    };

    for (const m of finishedMatches) {
      const home = ensureTeam(m.homeTeamId);
      const away = ensureTeam(m.awayTeamId);
      const homeScore = m.homeScore ?? 0;
      const awayScore = m.awayScore ?? 0;

      home.played += 1;
      home.pointsFor += homeScore;
      home.pointsAgainst += awayScore;
      away.played += 1;
      away.pointsFor += awayScore;
      away.pointsAgainst += homeScore;

      if (homeScore > awayScore) { home.won += 1; away.lost += 1; }
      else { away.won += 1; home.lost += 1; }
    }

    // Xếp hạng theo số trận thắng giảm dần
    const ranked = Array.from(statsMap.entries())
      .sort(([, a], [, b]) => b.won - a.won || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst));

    // Upsert bảng Standing và TeamStats
    for (let i = 0; i < ranked.length; i++) {
      const [teamId, stats] = ranked[i];
      const rank = i + 1;
      const rankPoints = stats.won * 2; // NBA: 2 điểm/thắng, 0 điểm/thua

      try {
        await this.prisma.standing.upsert({
          where: { leagueId_teamId_season: { leagueId, teamId, season } },
          update: {
            rank,
            points: rankPoints,
            played: stats.played,
            won: stats.won,
            drawn: 0,
            lost: stats.lost,
          },
          create: {
            leagueId,
            teamId,
            season,
            rank,
            points: rankPoints,
            played: stats.played,
            won: stats.won,
            drawn: 0,
            lost: stats.lost,
          },
        });

        await this.prisma.teamStats.upsert({
          where: { teamId_leagueId_season: { teamId, leagueId, season } },
          update: {
            matchesPlayed: stats.played,
            wins: stats.won,
            draws: 0,
            losses: stats.lost,
            goalsFor: stats.pointsFor,
            goalsAgainst: stats.pointsAgainst,
          },
          create: {
            teamId,
            leagueId,
            season,
            matchesPlayed: stats.played,
            wins: stats.won,
            draws: 0,
            losses: stats.lost,
            goalsFor: stats.pointsFor,
            goalsAgainst: stats.pointsAgainst,
          },
        });
      } catch (err: any) {
        this.logger.warn(`recalculateNbaStandings: team ${teamId} lỗi: ${err.message}`);
      }
    }

    this.logger.log(`recalculateNbaStandingsFromDb: Đã cập nhật BXH ${ranked.length} đội NBA từ DB.`);
    await this.invalidateCache();
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
   * 7b. Đồng bộ lịch thi đấu sắp tới với giới hạn số trận phân chia theo môn thể thao
   *
   * @param maxFootball   - Số trận tối đa cho bóng đá (mặc định 10)
   * @param maxBasketball - Số trận tối đa cho bóng rổ (mặc định 10)
   * @param days          - Số ngày tới cần lấy fixture (mặc định 7)
   */
  async syncFixturesLimited(maxFootball = 10, maxBasketball = 10, days = 7): Promise<SyncResult> {
    // Danh sách externalId các giải ưu tiên, thứ tự = độ ưu tiên giảm dần
    // Bóng đá dùng externalId số (API-Football), NBA dùng 'nba' (Balldontlie)
    const PRIORITY_LEAGUE_EXTERNAL_IDS: string[] = [
      '39',  // Premier League (Anh)
      '140', // La Liga (Tây Ban Nha)
      '135', // Serie A (Ý)
      '78',  // Bundesliga (Đức)
      '61',  // Ligue 1 (Pháp)
      '2',   // UEFA Champions League
      '3',   // UEFA Europa League
      'nba', // NBA (Bóng rổ Mỹ)
    ];

    const fromDate = new Date();
    const toDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const errors: string[] = [];

    // Lấy toàn bộ leagues đang có trong DB
    const allLeagues = await this.prisma.league.findMany({
      include: { sport: true },
    });

    // Nhóm A: giải ưu tiên (theo đúng thứ tự mảng priority)
    const priorityLeagues = PRIORITY_LEAGUE_EXTERNAL_IDS
      .map((extId) => allLeagues.find((l) => l.externalId === extId))
      .filter(Boolean) as typeof allLeagues;

    // Nhóm B: các giải còn lại (lấp slot nếu nhóm A chưa đủ)
    const otherLeagues = allLeagues.filter(
      (l) => !PRIORITY_LEAGUE_EXTERNAL_IDS.includes(l.externalId),
    );

    // Xử lý theo thứ tự: ưu tiên trước, phần còn lại sau
    const orderedLeagues = [...priorityLeagues, ...otherLeagues];

    const resolved: ResolvedMatch[] = [];
    let resolvedFootball = 0;
    let resolvedBasketball = 0;

    for (const league of orderedLeagues) {
      const isBasketball = league.sport.name.toLowerCase() === 'basketball';
      
      // Dừng nếu môn thể thao này đã đủ slot
      if (isBasketball && resolvedBasketball >= maxBasketball) continue;
      if (!isBasketball && resolvedFootball >= maxFootball) continue;

      try {
        const provider = this.getProvider(league.sport.name);
        const fixtures = await provider.fetchFixtures(league.externalId, league.season, {
          status: 'SCHEDULED',
          fromDate,
          toDate,
        });

        // Sắp xếp theo ngày gần nhất
        fixtures.sort(
          (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
        );

        // Tính slot còn lại cho môn thể thao này
        const slotsLeft = isBasketball 
          ? (maxBasketball - resolvedBasketball)
          : (maxFootball - resolvedFootball);

        const fixturesToProcess = fixtures.slice(0, slotsLeft);

        for (const m of fixturesToProcess) {
          try {
            const [homeTeam, awayTeam] = await Promise.all([
              this.prisma.team.findUnique({ where: { externalId: m.homeTeamExternalId } }),
              this.prisma.team.findUnique({ where: { externalId: m.awayTeamExternalId } }),
            ]);

            if (!homeTeam || !awayTeam) {
              errors.push(
                `Fixture ${m.externalId}: Thiếu đội bóng (home: ${m.homeTeamExternalId}, away: ${m.awayTeamExternalId})`,
              );
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
            
            if (isBasketball) resolvedBasketball++;
            else resolvedFootball++;
          } catch (err: any) {
            errors.push(`Fixture ${m.externalId} resolve thất bại: ${err.message}`);
          }
        }
      } catch (err: any) {
        errors.push(`Fetch fixtures cho league ${league.externalId} thất bại: ${err.message}`);
        this.logger.warn(`Fetch fixtures cho league ${league.externalId} thất bại: ${err.message}`);
      }
    }

    this.logger.log(
      `syncFixturesLimited: Đã resolve ${resolvedFootball}/${maxFootball} bóng đá, ${resolvedBasketball}/${maxBasketball} bóng rổ từ ${orderedLeagues.length} giải`,
    );

    // Ghi vào DB theo chunk
    const changedIds: string[] = [];

    for (let i = 0; i < resolved.length; i += BATCH_CHUNK_SIZE) {
      const chunk = resolved.slice(i, i + BATCH_CHUNK_SIZE);
      try {
        const { changedExternalIds } = await this.batchUpsertMatches(chunk);
        changedIds.push(...changedExternalIds);
      } catch (err: any) {
        this.logger.warn(`Batch upsert fixtures thất bại, chuyển sang fallback per-row: ${err.message}`);
        for (const m of chunk) {
          try {
            await this.upsertMatchIfChanged(m);
            changedIds.push(m.externalId);
          } catch (rowErr: any) {
            errors.push(`Fixture ${m.externalId} upsert thất bại: ${rowErr.message}`);
          }
        }
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
        "updatedAt"   = EXCLUDED."updatedAt",
        "eloProcessedAt" = CASE
          WHEN ("Match"."homeScore" IS DISTINCT FROM EXCLUDED."homeScore" OR "Match"."awayScore" IS DISTINCT FROM EXCLUDED."awayScore" OR "Match"."status" IS DISTINCT FROM EXCLUDED."status")
          THEN NULL
          ELSE "Match"."eloProcessedAt"
        END
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
      select: { contentHash: true, homeScore: true, awayScore: true, status: true },
    });
    if (existing?.contentHash === m.hash) return;

    const scoreOrStatusChanged =
      !existing ||
      existing.homeScore !== m.homeScore ||
      existing.awayScore !== m.awayScore ||
      existing.status !== m.status;

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
        ...(scoreOrStatusChanged ? { eloProcessedAt: null } : {}),
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
