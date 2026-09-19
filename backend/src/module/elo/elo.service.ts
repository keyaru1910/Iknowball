import { Injectable, Logger, Inject } from '@nestjs/common';
import { MatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calculateEloUpdate, DEFAULT_ELO, EloResult, kFactor } from './elo.calculator';

@Injectable()
export class EloService {
  private readonly logger = new Logger(EloService.name);
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Áp dụng cập nhật Elo cho một trận đấu đã kết thúc.
   * Sử dụng transaction để đảm bảo tính nguyên tử (atomicity).
   * Bỏ qua nếu trận đã được xử lý (eloProcessedAt != null).
   */
  async applyFinishedMatch(matchId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { league: true },
      });
      if (!match || match.status !== MatchStatus.FINISHED || match.eloProcessedAt) return;
      if (match.homeScore === null || match.awayScore === null) return;

      const [homeStats, awayStats] = await Promise.all([
        tx.teamStats.upsert({
          where: { teamId_leagueId_season: { teamId: match.homeTeamId, leagueId: match.leagueId, season: match.season } },
          update: {},
          create: { teamId: match.homeTeamId, leagueId: match.leagueId, season: match.season },
        }),
        tx.teamStats.upsert({
          where: { teamId_leagueId_season: { teamId: match.awayTeamId, leagueId: match.leagueId, season: match.season } },
          update: {},
          create: { teamId: match.awayTeamId, leagueId: match.leagueId, season: match.season },
        }),
      ]);
      const actual: EloResult = match.homeScore > match.awayScore ? 1 : match.homeScore < match.awayScore ? 0 : 0.5;
      const update = calculateEloUpdate(
        Number(homeStats.eloRating ?? DEFAULT_ELO), Number(awayStats.eloRating ?? DEFAULT_ELO), actual,
        Math.max(kFactor(homeStats.matchesPlayed), kFactor(awayStats.matchesPlayed)),
      );
      await Promise.all([
        tx.teamStats.update({ where: { id: homeStats.id }, data: { eloRating: new Prisma.Decimal(update.homeElo) } }),
        tx.teamStats.update({ where: { id: awayStats.id }, data: { eloRating: new Prisma.Decimal(update.awayElo) } }),
        tx.match.update({ where: { id: match.id }, data: { eloProcessedAt: new Date() } }),
      ]);
    });
  }

  /**
   * Xử lý tuần tự (theo thứ tự thời gian) tất cả các trận đấu FINISHED
   * chưa được cập nhật Elo (eloProcessedAt = null).
   *
   * Đảm bảo Elo được cập nhật đúng thứ tự thời gian (matchDate ASC, id ASC)
   * để chống data leakage trong quá trình sinh dự đoán.
   *
   * @returns Số trận đã xử lý thành công.
   */
  async processPendingFinishedMatches(): Promise<number> {
    const pendingMatches = await this.prisma.match.findMany({
      where: { status: MatchStatus.FINISHED, eloProcessedAt: null, homeScore: { not: null }, awayScore: { not: null } },
      orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });

    if (pendingMatches.length === 0) return 0;

    this.logger.log(`Xử lý Elo tuần tự cho ${pendingMatches.length} trận đấu đang chờ...`);
    let processed = 0;
    for (const match of pendingMatches) {
      try {
        await this.applyFinishedMatch(match.id);
        processed++;
      } catch (err) {
        this.logger.error(`Lỗi khi cập nhật Elo trận ${match.id}: ${(err as Error).message}`);
      }
    }
    this.logger.log(`Hoàn tất cập nhật Elo: ${processed}/${pendingMatches.length} trận.`);
    return processed;
  }

  /** Replays a league season chronologically after a historical correction or initial rollout. */
  async rebuildLeagueSeason(leagueId: string, season: string): Promise<number> {
    await this.prisma.$transaction([
      this.prisma.teamStats.updateMany({ where: { leagueId, season }, data: { eloRating: new Prisma.Decimal(DEFAULT_ELO) } }),
      this.prisma.match.updateMany({ where: { leagueId, season, status: MatchStatus.FINISHED }, data: { eloProcessedAt: null } }),
    ]);
    const matches = await this.prisma.match.findMany({
      where: { leagueId, season, status: MatchStatus.FINISHED },
      orderBy: [{ matchDate: 'asc' }, { id: 'asc' }], select: { id: true },
    });
    for (const match of matches) await this.applyFinishedMatch(match.id);
    return matches.length;
  }

  /**
   * Lấy chuỗi lịch sử biến động điểm Elo của một đội bóng qua các trận đấu trong mùa giải.
   */
  async getEloHistory(teamId: string, season?: string, leagueId?: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, logoUrl: true },
    });

    if (!team) {
      return {
        team: { id: teamId, name: 'Đội bóng', logoUrl: null },
        currentElo: DEFAULT_ELO,
        peakElo: DEFAULT_ELO,
        lowestElo: DEFAULT_ELO,
        history: [],
      };
    }

    const latestStats = await this.prisma.teamStats.findFirst({
      where: {
        teamId,
        ...(season ? { season } : {}),
        ...(leagueId ? { leagueId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });

    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        ...(season ? { season } : {}),
        ...(leagueId ? { leagueId } : {}),
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: [{ matchDate: 'asc' }, { id: 'asc' }],
    });

    let runningElo = DEFAULT_ELO;
    let peakElo = DEFAULT_ELO;
    let lowestElo = DEFAULT_ELO;
    const history: Array<{
      matchId: string;
      matchDate: Date;
      opponent: { id: string; name: string; logoUrl: string | null };
      isHome: boolean;
      score: string;
      result: 'W' | 'D' | 'L';
      eloBefore: number;
      eloAfter: number;
      eloChange: number;
    }> = [];

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const isHome = m.homeTeamId === teamId;
      const opponent = isHome ? m.awayTeam : m.homeTeam;
      const homeScore = m.homeScore ?? 0;
      const awayScore = m.awayScore ?? 0;
      const teamScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;

      const result: 'W' | 'D' | 'L' = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';
      const actualEloResult: EloResult = homeScore > awayScore ? 1 : homeScore < awayScore ? 0 : 0.5;

      const eloBefore = runningElo;
      const update = calculateEloUpdate(
        isHome ? eloBefore : DEFAULT_ELO,
        isHome ? DEFAULT_ELO : eloBefore,
        actualEloResult,
        kFactor(i + 1),
      );

      const eloAfter = Math.round((isHome ? update.homeElo : update.awayElo) * 10) / 10;
      const eloChange = Math.round((eloAfter - eloBefore) * 10) / 10;
      runningElo = eloAfter;

      if (runningElo > peakElo) peakElo = runningElo;
      if (runningElo < lowestElo) lowestElo = runningElo;

      history.push({
        matchId: m.id,
        matchDate: m.matchDate,
        opponent,
        isHome,
        score: `${homeScore} - ${awayScore}`,
        result,
        eloBefore,
        eloAfter,
        eloChange,
      });
    }

    const currentElo = latestStats?.eloRating ? Number(latestStats.eloRating) : runningElo;

    return {
      team,
      currentElo,
      peakElo: Math.max(peakElo, currentElo),
      lowestElo: Math.min(lowestElo, currentElo),
      history,
    };
  }

  /**
   * So sánh lịch sử Elo của 2 đội bóng để vẽ biểu đồ song song
   */
  async compareTeamsElo(homeTeamId: string, awayTeamId: string, season?: string) {
    const [homeElo, awayElo] = await Promise.all([
      this.getEloHistory(homeTeamId, season),
      this.getEloHistory(awayTeamId, season),
    ]);

    return {
      homeTeam: homeElo,
      awayTeam: awayElo,
      eloDifference: Math.round((homeElo.currentElo - awayElo.currentElo) * 10) / 10,
    };
  }
}
