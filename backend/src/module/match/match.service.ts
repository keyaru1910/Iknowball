// src/module/match/match.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../shared/cache.service';
import { MatchStatus } from '@prisma/client';
import { MODEL_VERSION } from '../prediction/prediction.constants';

export interface GetMatchesQueryDto {
  date?: string; // yyyy-MM-dd
  leagueId?: string;
  status?: string; // upcoming | live | finished | postponed | canceled
  sport?: string; // football | basketball
  season?: string; // 24/25 | 2024-2025 | 25/26 | 26/27
  page?: number;
  limit?: number;
}

/**
 * Tính toán mùa giải hiện tại theo mốc thời gian:
 * - Bóng đá: Từ tháng 8 năm Y là mùa "Y-(Y+1)" (Ví dụ: 08/2026 -> 2026-2027)
 * - Bóng rổ: Từ 20/10 năm Y là mùa "Y-(Y+1)" (Ví dụ: trước 20/10/2026 vẫn là 2025-2026)
 */
export function layMuaGiaiHienTai(
  sport: string = 'football',
  mocThoiGian: Date = new Date(),
): string {
  const namHienTai = mocThoiGian.getFullYear();
  const thangHienTai = mocThoiGian.getMonth() + 1;
  const ngayHienTai = mocThoiGian.getDate();

  let namBatDauMua: number;

  if (sport.toLowerCase() === 'basketball') {
    const daVaoMuaMoi = thangHienTai > 10 || (thangHienTai === 10 && ngayHienTai >= 20);
    namBatDauMua = daVaoMuaMoi ? namHienTai : namHienTai - 1;
  } else {
    const daVaoMuaMoi = thangHienTai >= 8;
    namBatDauMua = daVaoMuaMoi ? namHienTai : namHienTai - 1;
  }

  const namKetThucMua = namBatDauMua + 1;
  return `${namBatDauMua}-${namKetThucMua}`;
}

/**
 * Chuẩn hóa các biến thể mùa giải linh hoạt cho mọi năm (ví dụ: 26/27, 2026-2027, 2026,...)
 */
function getSeasonVariants(season?: string): string[] {
  if (!season) return [];
  const clean = season.trim();
  const variants = new Set<string>([clean]);

  // Xử lý dạng "26/27" -> thêm "2026-2027", "2026"
  if (/^\d{2}\/\d{2}$/.test(clean)) {
    const [y1, y2] = clean.split('/');
    variants.add(`20${y1}-20${y2}`);
    variants.add(`20${y1}`);
  }
  // Xử lý dạng "2026-2027" -> thêm "26/27", "2026"
  else if (/^\d{4}-\d{4}$/.test(clean)) {
    const [y1, y2] = clean.split('-');
    variants.add(`${y1.slice(2)}/${y2.slice(2)}`);
    variants.add(y1);
  }
  // Xử lý dạng "2026" -> thêm "26/27", "2026-2027"
  else if (/^\d{4}$/.test(clean)) {
    const y1 = parseInt(clean, 10);
    const y2 = y1 + 1;
    variants.add(`${y1}-${y2}`);
    variants.add(`${String(y1).slice(2)}/${String(y2).slice(2)}`);
  }

  return Array.from(variants);
}

@Injectable()
export class MatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Chuyển đổi status từ Prisma Enum sang format FE mong muốn
   */
  private mapPrismaStatusToFe(status: MatchStatus): string {
    switch (status) {
      case MatchStatus.SCHEDULED:
        return 'upcoming';
      case MatchStatus.LIVE:
        return 'live';
      case MatchStatus.FINISHED:
        return 'finished';
      case MatchStatus.POSTPONED:
        return 'postponed';
      case MatchStatus.CANCELED:
        return 'canceled';
      default:
        return 'upcoming';
    }
  }

  /**
   * Chuyển đổi status từ FE filter sang Prisma Enum
   */
  private mapFeStatusToPrisma(status?: string): MatchStatus | undefined {
    if (!status) return undefined;
    const lower = status.toLowerCase();
    if (lower === 'upcoming' || lower === 'scheduled') return MatchStatus.SCHEDULED;
    if (lower === 'live') return MatchStatus.LIVE;
    if (lower === 'finished') return MatchStatus.FINISHED;
    if (lower === 'postponed') return MatchStatus.POSTPONED;
    if (lower === 'canceled') return MatchStatus.CANCELED;
    return undefined;
  }

  /**
   * Lấy danh sách trận đấu với Redis Cache-Aside và phân trang
   */
  async getMatches(params: GetMatchesQueryDto) {
    const { date, leagueId, status, sport, season } = params;
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const cacheKey = `matches:${sport || 'all'}:${season || 'all'}:${date || 'all'}:${leagueId || 'all'}:${status || 'all'}:p${page}:l${limit}`;

    return this.cacheService.getOrSet(cacheKey, 60, async () => {
      const where: any = {};

      // Filter theo ngày theo múi giờ Việt Nam (UTC+7) để đảm bảo không sót trận rạng sáng và đêm muộn
      if (date) {
        const startOfDay = new Date(`${date}T00:00:00.000+07:00`);
        const endOfDay = new Date(`${date}T23:59:59.999+07:00`);
        where.matchDate = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }

      // Filter theo giải đấu
      if (leagueId) {
        where.leagueId = leagueId;
      }

      // Filter theo trạng thái
      const prismaStatus = this.mapFeStatusToPrisma(status);
      if (prismaStatus) {
        where.status = prismaStatus;
      }

      // Filter theo môn thể thao hoặc mùa giải trên League relation
      if (sport || season) {
        where.league = where.league || {};
        if (sport) {
          where.league.sport = {
            name: {
              equals: sport.toLowerCase(),
              mode: 'insensitive',
            },
          };
        }
        if (season) {
          const seasonVariants = getSeasonVariants(season);
          where.season = {
            in: seasonVariants,
          };
        }
      }

      // Nếu không truyền date và không chọn mùa cụ thể (ví dụ trang chủ lấy các trận gần nhất),
      // ưu tiên lấy các trận từ hôm nay trở đi (tránh bốc trận lịch sử từ năm 2024)
      if (!date && !season && prismaStatus !== MatchStatus.FINISHED) {
        const homQua = new Date(Date.now() - 24 * 60 * 60 * 1000);
        where.matchDate = {
          gte: homQua,
        };
      }

      // Sắp xếp linh hoạt:
      // - Nếu xem trận đã kết thúc (finished) -> Trận gần nhất lên đầu (desc)
      // - Nếu xem lịch thi đấu / sắp tới / theo ngày -> Trận đá sớm lên trước (asc)
      const sapXepTheoThoiGian =
        prismaStatus === MatchStatus.FINISHED
          ? { matchDate: 'desc' as const }
          : { matchDate: 'asc' as const };

      const [total, matches] = await Promise.all([
        this.prisma.match.count({ where }),
        this.prisma.match.findMany({
          where,
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
            predictions: { where: { modelVersion: MODEL_VERSION }, take: 1, orderBy: { createdAt: 'desc' } },
          },
          orderBy: sapXepTheoThoiGian,
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      const items = matches.map((m) => {
        const raw = (m.rawData as Record<string, any>) || {};
        const minute = m.status === MatchStatus.LIVE ? (raw.minute || 45) : null;

        return {
          id: m.id,
          league: m.league?.name || 'Unknown League',
          leagueId: m.leagueId,
          homeTeam: {
            id: m.homeTeam.id,
            name: m.homeTeam.name,
            shortName: m.homeTeam.shortName,
            logoUrl: m.homeTeam.logoUrl,
          },
          awayTeam: {
            id: m.awayTeam.id,
            name: m.awayTeam.name,
            shortName: m.awayTeam.shortName,
            logoUrl: m.awayTeam.logoUrl,
          },
          kickoffTime: m.matchDate.toISOString(),
          status: this.mapPrismaStatusToFe(m.status),
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          minute,
          prediction: m.predictions[0] ? {
            homeWinProb: Number(m.predictions[0].homeWinProb) * 100,
            drawProb: m.predictions[0].drawProb === null ? null : Number(m.predictions[0].drawProb) * 100,
            awayWinProb: Number(m.predictions[0].awayWinProb) * 100,
            modelVersion: m.predictions[0].modelVersion,
          } : undefined,
        };
      });

      return { items, total, page, limit, totalPages };
    });
  }

  /**
   * Lấy chi tiết trận đấu
   */
  async getMatchById(id: string) {
    const cacheKey = `match_detail:${id}`;

    return this.cacheService.getOrSet(cacheKey, 60, async () => {
      const match = await this.prisma.match.findUnique({
        where: { id },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          events: {
            include: {
              player: true,
            },
            orderBy: {
              minute: 'asc',
            },
          },
          predictions: { where: { modelVersion: MODEL_VERSION }, take: 1, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!match) {
        throw new NotFoundException(`Không tìm thấy trận đấu có mã ${id}`);
      }

      const raw = (match.rawData as Record<string, any>) || {};
      const h2h = await this.getMatchH2H(match.id);

      const events = match.events.map((e) => ({
        id: e.id,
        matchId: e.matchId,
        type: e.type,
        minute: e.minute,
        teamId: e.teamId,
        playerId: e.playerId,
        playerName: e.player?.fullName || (e.detail as any)?.playerName || null,
        assistPlayerName: (e.detail as any)?.assistPlayerName || null,
        detail: e.detail,
      }));

      // Stats comparison
      const stats = raw.stats || {
        possession: { home: 52, away: 48 },
        shotsTotal: { home: 14, away: 9 },
        shotsOnTarget: { home: 5, away: 3 },
        corners: { home: 6, away: 4 },
        fouls: { home: 11, away: 13 },
        yellowCards: { home: 2, away: 1 },
        redCards: { home: 0, away: 0 },
        offsides: { home: 1, away: 2 },
        passes: { home: 480, away: 430 },
        passAccuracy: { home: 85, away: 82 },
      };

      return {
        id: match.id,
        league: match.league?.name || 'Unknown League',
        leagueId: match.leagueId,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logoUrl: match.homeTeam.logoUrl,
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logoUrl: match.awayTeam.logoUrl,
        },
        kickoffTime: match.matchDate.toISOString(),
        status: this.mapPrismaStatusToFe(match.status),
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        minute: match.status === MatchStatus.LIVE ? (raw.minute || 45) : null,
        venue: raw.venue || 'Sân vận động chính',
        referee: raw.referee || null,
        round: raw.round || match.league?.season || null,
        events,
        stats,
        h2h,
        prediction: match.predictions[0] ? {
          homeWinProb: Number(match.predictions[0].homeWinProb) * 100,
          drawProb: match.predictions[0].drawProb === null ? null : Number(match.predictions[0].drawProb) * 100,
          awayWinProb: Number(match.predictions[0].awayWinProb) * 100,
          modelVersion: match.predictions[0].modelVersion,
        } : undefined,
      };
    });
  }

  /**
   * Lấy lịch sử đối đầu H2H giữa 2 đội
   */
  async getMatchH2H(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });

    if (!match) {
      throw new NotFoundException(`Trận đấu không tồn tại`);
    }

    const { homeTeamId, awayTeamId } = match;
    const cacheKey = `h2h:${homeTeamId}:${awayTeamId}`;

    return this.cacheService.getOrSet(cacheKey, 300, async () => {
      const pastMatches = await this.prisma.match.findMany({
        where: {
          status: MatchStatus.FINISHED,
          OR: [
            { homeTeamId, awayTeamId },
            { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
          ],
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
        orderBy: {
          matchDate: 'desc',
        },
        take: 10,
      });

      let homeWins = 0;
      let awayWins = 0;
      let draws = 0;

      const formattedMatches = pastMatches.map((pm) => {
        const hs = pm.homeScore ?? 0;
        const as_ = pm.awayScore ?? 0;
        let winnerTeamId: string | null = null;

        if (hs > as_) {
          winnerTeamId = pm.homeTeamId;
          if (pm.homeTeamId === homeTeamId) homeWins++;
          else awayWins++;
        } else if (hs < as_) {
          winnerTeamId = pm.awayTeamId;
          if (pm.awayTeamId === homeTeamId) homeWins++;
          else awayWins++;
        } else {
          draws++;
        }

        return {
          id: pm.id,
          matchDate: pm.matchDate.toISOString(),
          leagueName: pm.league?.name || null,
          homeTeam: {
            id: pm.homeTeam.id,
            name: pm.homeTeam.name,
            logoUrl: pm.homeTeam.logoUrl,
            shortName: pm.homeTeam.shortName,
          },
          awayTeam: {
            id: pm.awayTeam.id,
            name: pm.awayTeam.name,
            logoUrl: pm.awayTeam.logoUrl,
            shortName: pm.awayTeam.shortName,
          },
          homeScore: hs,
          awayScore: as_,
          winnerTeamId,
        };
      });

      return {
        totalMatches: pastMatches.length,
        homeWins,
        awayWins,
        draws,
        matches: formattedMatches,
      };
    });
  }
}
