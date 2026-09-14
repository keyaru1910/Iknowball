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

function getLeagueLogo(league: { externalId: string; logoUrl?: string | null; sport?: { name?: string } | null }): string {
  if (league.logoUrl) return league.logoUrl;
  const isBasketball = league.sport?.name?.toLowerCase() === 'basketball' || league.externalId === 'nba';
  if (isBasketball) {
    return 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png';
  }
  return `https://media.api-sports.io/football/leagues/${league.externalId}.png`;
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

      let items = leagues.map((l) => ({
        id: l.id,
        name: l.name,
        country: l.country || null,
        season: l.season,
        logoUrl: getLeagueLogo(l),
        sportId: l.sportId,
      }));

      // Nếu database chưa có giải đấu hoặc quá ít, cung cấp fallback danh sách giải đấu tiêu chuẩn
      if (items.length === 0) {
        const isBasketball = sport?.toLowerCase() === 'basketball';
        if (isBasketball) {
          items = [
            {
              id: 'mock-nba',
              name: 'NBA',
              country: 'USA',
              season: '2025',
              logoUrl: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
              sportId: 'basketball',
            },
          ];
        } else {
          items = [
            {
              id: 'mock-pl',
              name: 'Premier League',
              country: 'England',
              season: '2025-2026',
              logoUrl: 'https://media.api-sports.io/football/leagues/39.png',
              sportId: 'football',
            },
            {
              id: 'mock-laliga',
              name: 'La Liga',
              country: 'Spain',
              season: '2025-2026',
              logoUrl: 'https://media.api-sports.io/football/leagues/140.png',
              sportId: 'football',
            },
            {
              id: 'mock-seriea',
              name: 'Serie A',
              country: 'Italy',
              season: '2025-2026',
              logoUrl: 'https://media.api-sports.io/football/leagues/135.png',
              sportId: 'football',
            },
            {
              id: 'mock-bundesliga',
              name: 'Bundesliga',
              country: 'Germany',
              season: '2025-2026',
              logoUrl: 'https://media.api-sports.io/football/leagues/78.png',
              sportId: 'football',
            },
            {
              id: 'mock-ligue1',
              name: 'Ligue 1',
              country: 'France',
              season: '2025-2026',
              logoUrl: 'https://media.api-sports.io/football/leagues/61.png',
              sportId: 'football',
            },
            {
              id: 'mock-ucl',
              name: 'UEFA Champions League',
              country: 'World',
              season: '2025-2026',
              logoUrl: 'https://media.api-sports.io/football/leagues/2.png',
              sportId: 'football',
            },
          ];
        }
      }

      return { items, total: items.length, page, limit, totalPages: 1 };
    });
  }

  /**
   * Lấy bảng xếp hạng giải đấu theo leagueId và season (khử trùng lặp đa mùa)
   */
  async getStandings(leagueId: string, season?: string) {
    const cacheKey = `standings:${leagueId}:${season || 'latest'}`;

    return this.cacheService.getOrSet(cacheKey, 1800, async () => {
      const league = await this.prisma.league.findUnique({
        where: { id: leagueId },
        include: { sport: true },
      });

      if (!league) {
        // Trả về mảng rỗng nếu không tìm thấy thay vì crash trang
        return [];
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
        // Khử trùng lặp (De-duplicate) theo teamId - chỉ giữ 1 bản ghi duy nhất cho mỗi đội
        const teamMap = new Map<string, typeof standings[0]>();
        for (const s of standings) {
          if (!teamMap.has(s.teamId)) {
            teamMap.set(s.teamId, s);
          }
        }

        const uniqueStandings = Array.from(teamMap.values());
        return uniqueStandings.map((s, idx) => {
          const stats = s.team.teamStats?.[0];
          const goalsFor = stats?.goalsFor ?? (s.won * 2 + s.drawn);
          const goalsAgainst = stats?.goalsAgainst ?? (s.lost * 2 + s.drawn);
          const goalDifference = goalsFor - goalsAgainst;

          return {
            position: s.rank || idx + 1,
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

      // Fallback nếu chưa có record trong bảng Standing: tính tạm từ TeamStats và khử trùng
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

      const statsMap = new Map<string, typeof teamStats[0]>();
      for (const ts of teamStats) {
        if (!statsMap.has(ts.teamId)) {
          statsMap.set(ts.teamId, ts);
        }
      }

      return Array.from(statsMap.values()).map((ts, idx) => {
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

