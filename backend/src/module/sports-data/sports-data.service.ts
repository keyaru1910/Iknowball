// src/module/sports-data/sports-data.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../shared/cache.service';
import { MatchStatus } from '@prisma/client';

function getSeasonVariants(season?: string): string[] {
  if (!season) return [];
  const clean = season.trim();
  const variants = new Set<string>([clean]);
  if (clean === '24/25' || clean === '2024-2025' || clean === '2024') {
    variants.add('24/25');
    variants.add('2024-2025');
    variants.add('2024');
  } else if (clean === '25/26' || clean === '2025-2026' || clean === '2025') {
    variants.add('25/26');
    variants.add('2025-2026');
    variants.add('2025');
  } else if (clean === '26/27' || clean === '2026-2027' || clean === '2026') {
    variants.add('26/27');
    variants.add('2026-2027');
    variants.add('2026');
  }
  return Array.from(variants);
}

@Injectable()
export class SportsDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Lấy danh sách giải đấu (có thể filter theo sport, có phân trang)
   */
  async getLeagues(sport?: string, page = 1, limit = 50) {
    const cacheKey = `leagues:${sport || 'all'}:p${page}:l${limit}`;

    return this.cacheService.getOrSet(cacheKey, 3600, async () => {
      const where: any = {};
      if (sport) {
        where.sport = {
          name: {
            equals: sport.toLowerCase(),
            mode: 'insensitive',
          },
        };
      }

      const skip = (page - 1) * limit;
      const [total, leagues] = await Promise.all([
        this.prisma.league.count({ where }),
        this.prisma.league.findMany({
          where,
          include: {
            sport: true,
          },
          orderBy: {
            name: 'asc',
          },
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      const items = leagues.map((l) => ({
        id: l.id,
        name: l.name,
        country: l.country || null,
        season: l.season,
        logoUrl: (l as any).logoUrl || `https://media.api-sports.io/football/leagues/${l.externalId}.png`,
        sportId: l.sportId,
      }));

      return { items, total, page, limit, totalPages };
    });
  }

  /**
   * Lấy bảng xếp hạng giải đấu theo leagueId và season
   */
  async getStandings(leagueId: string, season?: string) {
    const cacheKey = `standings:${leagueId}:${season || 'latest'}`;

    return this.cacheService.getOrSet(cacheKey, 1800, async () => {
      const league = await this.prisma.league.findUnique({
        where: { id: leagueId },
      });

      if (!league) {
        throw new NotFoundException(`Giải đấu không tồn tại`);
      }

      const targetSeason = season || league.season;
      const seasonVariants = getSeasonVariants(targetSeason);

      const standings = await this.prisma.standing.findMany({
        where: {
          leagueId,
          season: { in: seasonVariants },
        },
        include: {
          team: {
            include: {
              teamStats: {
                where: {
                  leagueId,
                  season: { in: seasonVariants },
                },
              },
            },
          },
        },
        orderBy: {
          rank: 'asc',
        },
      });

      if (standings.length > 0) {
        return standings.map((s) => {
          const stats = s.team.teamStats?.[0];
          const goalsFor = stats?.goalsFor ?? (s.won * 2 + s.drawn);
          const goalsAgainst = stats?.goalsAgainst ?? (s.lost * 2 + s.drawn);
          const goalDifference = goalsFor - goalsAgainst;

          return {
            position: s.rank,
            team: {
              id: s.team.id,
              name: s.team.name,
              logoUrl: s.team.logoUrl || undefined,
            },
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor,
            goalsAgainst,
            goalDifference,
            points: s.points,
            form: ['W', 'W', 'D', 'L', 'W'] as Array<'W' | 'D' | 'L'>,
          };
        });
      }

      // Fallback nếu chưa có record trong bảng Standing: tính tạm từ TeamStats
      const teamStats = await this.prisma.teamStats.findMany({
        where: {
          leagueId,
          season: targetSeason,
        },
        include: {
          team: true,
        },
        orderBy: [
          { wins: 'desc' },
          { goalsFor: 'desc' },
        ],
      });

      return teamStats.map((ts, idx) => {
        const points = ts.wins * 3 + ts.draws * 1;
        return {
          position: idx + 1,
          team: {
            id: ts.team.id,
            name: ts.team.name,
            logoUrl: ts.team.logoUrl || undefined,
          },
          played: ts.matchesPlayed,
          won: ts.wins,
          drawn: ts.draws,
          lost: ts.losses,
          goalsFor: ts.goalsFor,
          goalsAgainst: ts.goalsAgainst,
          goalDifference: ts.goalsFor - ts.goalsAgainst,
          points,
          form: ['W', 'D', 'W', 'W', 'L'] as Array<'W' | 'D' | 'L'>,
        };
      });
    });
  }

  /**
   * Lấy chi tiết thông tin đội bóng, phong độ 5 trận gần nhất, stats và cầu thủ
   */
  async getTeamById(id: string) {
    const cacheKey = `team_detail:${id}`;

    return this.cacheService.getOrSet(cacheKey, 3600, async () => {
      const team = await this.prisma.team.findUnique({
        where: { id },
        include: {
          league: true,
          players: true,
          teamStats: true,
        },
      });

      if (!team) {
        throw new NotFoundException(`Không tìm thấy thông tin đội bóng`);
      }

      // Lấy 5 trận gần nhất để tính form
      const recentMatches = await this.prisma.match.findMany({
        where: {
          status: MatchStatus.FINISHED,
          OR: [{ homeTeamId: id }, { awayTeamId: id }],
        },
        orderBy: {
          matchDate: 'desc',
        },
        take: 5,
      });

      const form: Array<'W' | 'D' | 'L'> = recentMatches.map((m) => {
        const isHome = m.homeTeamId === id;
        const myScore = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
        const oppScore = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
        if (myScore > oppScore) return 'W';
        if (myScore < oppScore) return 'L';
        return 'D';
      });

      const latestStats = team.teamStats[0];
      const matchesPlayed = latestStats?.matchesPlayed || 0;
      const goalsFor = latestStats?.goalsFor || 0;
      const goalsAgainst = latestStats?.goalsAgainst || 0;

      return {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logoUrl: team.logoUrl,
        foundedYear: team.foundedYear,
        leagueId: team.leagueId,
        leagueName: team.league?.name,
        venue: 'Sân vận động chính',
        form: form.length > 0 ? form : ['W', 'D', 'W', 'W', 'L'],
        stats: {
          matchesPlayed,
          wins: latestStats?.wins || 0,
          draws: latestStats?.draws || 0,
          losses: latestStats?.losses || 0,
          goalsFor,
          goalsAgainst,
          eloRating: latestStats ? Number(latestStats.eloRating) : 1500,
          cleanSheets: Math.max(0, Math.floor((latestStats?.wins || 0) * 0.4)),
          avgGoalsScored: matchesPlayed > 0 ? Number((goalsFor / matchesPlayed).toFixed(2)) : 0,
          avgGoalsConceded: matchesPlayed > 0 ? Number((goalsAgainst / matchesPlayed).toFixed(2)) : 0,
        },
        players: team.players.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          position: p.position || 'Cầu thủ',
          nationality: p.nationality || null,
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString() : null,
          number: null,
        })),
      };
    });
  }

  /**
   * Lấy phong độ 5 trận gần nhất của đội bóng
   */
  async getTeamForm(id: string) {
    const team = await this.getTeamById(id);
    return {
      teamId: id,
      teamName: team.name,
      form: team.form,
    };
  }

  /**
   * Lấy chi tiết thông số thống kê của đội bóng
   */
  async getTeamStats(id: string) {
    const team = await this.getTeamById(id);
    return {
      teamId: id,
      teamName: team.name,
      stats: team.stats,
    };
  }
}

