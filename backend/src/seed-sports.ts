/**
 * Script khởi tạo dữ liệu thể thao mẫu (Leagues, Teams, Matches, Standings, Predictions).
 * Dùng để kiểm thử hiển thị trên Frontend ngay lập tức.
 * 
 * Chạy bằng: npm run seed:sports
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, MatchStatus, PredictionOutcome } from '@prisma/client';
import { createClient } from 'redis';

const MODEL_VERSION = 'elo-v1';

async function seedSports() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL chưa được cấu hình');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter } as any);

  try {
    console.log('🌱 Bắt đầu nạp dữ liệu thể thao mẫu (Mock Data)...\n');

    // 1. Khởi tạo / Tìm Sports (football, basketball)
    const football = await prisma.sport.upsert({
      where: { name: 'football' },
      update: {},
      create: { name: 'football' },
    });

    const basketball = await prisma.sport.upsert({
      where: { name: 'basketball' },
      update: {},
      create: { name: 'basketball' },
    });

    console.log('✅ 1. Đã chuẩn bị môn thể thao: Football, Basketball');

    // 2. Khởi tạo Leagues
    const plLeague = await prisma.league.upsert({
      where: { externalId: '39' },
      update: { name: 'Premier League', season: '2024-2025' },
      create: {
        name: 'Premier League',
        country: 'England',
        externalId: '39',
        season: '2024-2025',
        sportId: football.id,
      },
    });

    const clLeague = await prisma.league.upsert({
      where: { externalId: '2' },
      update: { name: 'UEFA Champions League', season: '2024-2025' },
      create: {
        name: 'UEFA Champions League',
        country: 'Europe',
        externalId: '2',
        season: '2024-2025',
        sportId: football.id,
      },
    });

    const laligaLeague = await prisma.league.upsert({
      where: { externalId: '140' },
      update: { name: 'La Liga', season: '2024-2025' },
      create: {
        name: 'La Liga',
        country: 'Spain',
        externalId: '140',
        season: '2024-2025',
        sportId: football.id,
      },
    });

    const nbaLeague = await prisma.league.upsert({
      where: { externalId: '12' },
      update: { name: 'NBA', season: '2024-2025' },
      create: {
        name: 'NBA',
        country: 'USA',
        externalId: '12',
        season: '2024-2025',
        sportId: basketball.id,
      },
    });

    console.log('✅ 2. Đã tạo các giải đấu: Premier League, Champions League, La Liga, NBA');

    // 3. Khởi tạo Teams (Bóng đá & Bóng rổ)
    const teamsData = [
      // Premier League
      { name: 'Arsenal', shortName: 'ARS', externalId: '42', leagueId: plLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/42.png' },
      { name: 'Manchester City', shortName: 'MCI', externalId: '50', leagueId: plLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/50.png' },
      { name: 'Liverpool', shortName: 'LIV', externalId: '40', leagueId: plLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/40.png' },
      { name: 'Chelsea', shortName: 'CHE', externalId: '49', leagueId: plLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/49.png' },
      { name: 'Manchester United', shortName: 'MUN', externalId: '33', leagueId: plLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/33.png' },
      { name: 'Tottenham Hotspur', shortName: 'TOT', externalId: '47', leagueId: plLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/47.png' },
      { name: 'Aston Villa', shortName: 'AVL', externalId: '66', leagueId: plLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/66.png' },
      { name: 'Newcastle United', shortName: 'NEW', externalId: '34', leagueId: plLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/34.png' },

      // La Liga
      { name: 'Real Madrid', shortName: 'RMA', externalId: '541', leagueId: laligaLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/541.png' },
      { name: 'Barcelona', shortName: 'BAR', externalId: '529', leagueId: laligaLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/529.png' },
      { name: 'Atletico Madrid', shortName: 'ATM', externalId: '530', leagueId: laligaLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/530.png' },

      // Champions League
      { name: 'Bayern Munich', shortName: 'BAY', externalId: '157', leagueId: clLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/157.png' },
      { name: 'Paris Saint Germain', shortName: 'PSG', externalId: '85', leagueId: clLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/85.png' },
      { name: 'Inter Milan', shortName: 'INT', externalId: '505', leagueId: clLeague.id, logoUrl: 'https://media.api-sports.io/football/teams/505.png' },

      // NBA
      { name: 'Los Angeles Lakers', shortName: 'LAL', externalId: 'nba_14', leagueId: nbaLeague.id, logoUrl: 'https://media.api-sports.io/basketball/teams/14.png' },
      { name: 'Golden State Warriors', shortName: 'GSW', externalId: 'nba_10', leagueId: nbaLeague.id, logoUrl: 'https://media.api-sports.io/basketball/teams/10.png' },
      { name: 'Boston Celtics', shortName: 'BOS', externalId: 'nba_2', leagueId: nbaLeague.id, logoUrl: 'https://media.api-sports.io/basketball/teams/2.png' },
      { name: 'Miami Heat', shortName: 'MIA', externalId: 'nba_16', leagueId: nbaLeague.id, logoUrl: 'https://media.api-sports.io/basketball/teams/16.png' },
    ];

    const teamMap: Record<string, any> = {};

    for (const t of teamsData) {
      const team = await prisma.team.upsert({
        where: { externalId: t.externalId },
        update: { name: t.name, shortName: t.shortName, logoUrl: t.logoUrl, leagueId: t.leagueId },
        create: {
          name: t.name,
          shortName: t.shortName,
          logoUrl: t.logoUrl,
          externalId: t.externalId,
          leagueId: t.leagueId,
        },
      });
      teamMap[t.name] = team;
    }

    console.log(`✅ 3. Đã tạo ${teamsData.length} đội bóng và câu lạc bộ`);

    // 4. Khởi tạo Bảng Xếp Hạng (Standings) cho Premier League, La Liga & NBA qua các mùa 24/25, 25/26, 26/27
    const seasons = ['2024-2025', '2025-2026', '2026-2027'];

    const standingsDataByLeague: Record<string, any[]> = {
      [plLeague.id]: [
        { teamName: 'Liverpool', rank: 1, points: 67, played: 28, won: 20, drawn: 7, lost: 1, gf: 65, ga: 22 },
        { teamName: 'Manchester City', rank: 2, points: 63, played: 28, won: 19, drawn: 6, lost: 3, gf: 62, ga: 25 },
        { teamName: 'Arsenal', rank: 3, points: 61, played: 28, won: 18, drawn: 7, lost: 3, gf: 58, ga: 24 },
        { teamName: 'Chelsea', rank: 4, points: 49, played: 28, won: 14, drawn: 7, lost: 7, gf: 52, ga: 38 },
        { teamName: 'Aston Villa', rank: 5, points: 46, played: 28, won: 13, drawn: 7, lost: 8, gf: 45, ga: 40 },
        { teamName: 'Newcastle United', rank: 6, points: 44, played: 28, won: 13, drawn: 5, lost: 10, gf: 47, ga: 39 },
        { teamName: 'Tottenham Hotspur', rank: 7, points: 40, played: 28, won: 12, drawn: 4, lost: 12, gf: 55, ga: 44 },
        { teamName: 'Manchester United', rank: 8, points: 38, played: 28, won: 11, drawn: 5, lost: 12, gf: 37, ga: 41 },
      ],
      [laligaLeague.id]: [
        { teamName: 'Real Madrid', rank: 1, points: 69, played: 28, won: 21, drawn: 6, lost: 1, gf: 60, ga: 18 },
        { teamName: 'Barcelona', rank: 2, points: 64, played: 28, won: 20, drawn: 4, lost: 4, gf: 68, ga: 26 },
        { teamName: 'Atletico Madrid', rank: 3, points: 56, played: 28, won: 16, drawn: 8, lost: 4, gf: 48, ga: 21 },
      ],
      [nbaLeague.id]: [
        { teamName: 'Boston Celtics', rank: 1, points: 52, played: 60, won: 48, drawn: 0, lost: 12, gf: 7200, ga: 6540 },
        { teamName: 'Los Angeles Lakers', rank: 2, points: 42, played: 60, won: 38, drawn: 0, lost: 22, gf: 6980, ga: 6810 },
        { teamName: 'Golden State Warriors', rank: 3, points: 38, played: 60, won: 34, drawn: 0, lost: 26, gf: 6890, ga: 6790 },
        { teamName: 'Miami Heat', rank: 4, points: 34, played: 60, won: 30, drawn: 0, lost: 30, gf: 6600, ga: 6620 },
      ],
    };

    for (const seasonName of seasons) {
      for (const [leagueId, teamStandings] of Object.entries(standingsDataByLeague)) {
        for (const s of teamStandings) {
          const team = teamMap[s.teamName];
          if (team) {
            await prisma.standing.upsert({
              where: {
                leagueId_teamId_season: {
                  leagueId,
                  teamId: team.id,
                  season: seasonName,
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
                leagueId,
                teamId: team.id,
                season: seasonName,
                rank: s.rank,
                points: s.points,
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
              },
            });

            // Upsert TeamStats tương ứng
            await prisma.teamStats.upsert({
              where: {
                teamId_leagueId_season: {
                  teamId: team.id,
                  leagueId,
                  season: seasonName,
                },
              },
              update: {
                matchesPlayed: s.played,
                wins: s.won,
                draws: s.drawn,
                losses: s.lost,
                goalsFor: s.gf,
                goalsAgainst: s.ga,
                eloRating: 1600 + (10 - s.rank) * 25,
              },
              create: {
                teamId: team.id,
                leagueId,
                season: seasonName,
                matchesPlayed: s.played,
                wins: s.won,
                draws: s.drawn,
                losses: s.lost,
                goalsFor: s.gf,
                goalsAgainst: s.ga,
                eloRating: 1600 + (10 - s.rank) * 25,
              },
            });
          }
        }
      }
    }

    console.log('✅ 4. Đã tạo Bảng xếp hạng Standings cho Premier League, La Liga & NBA qua các mùa 24/25, 25/26, 26/27');

    // 5. Khởi tạo Matches & Predictions cho Hôm qua, Hôm nay, Ngày mai
    const now = new Date();
    
    // Tạo mốc giờ linh hoạt
    const makeDate = (dayOffset: number, hour: number, minute = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hour, minute, 0, 0);
      return d;
    };

    const matchesToSeed = [
      // HÔM NAY - TRỰC TIẾP (LIVE)
      {
        externalId: 'mock_match_live_1',
        leagueId: plLeague.id,
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        matchDate: makeDate(0, now.getHours(), Math.max(0, now.getMinutes() - 35)),
        status: MatchStatus.LIVE,
        homeScore: 2,
        awayScore: 1,
        prediction: { home: 0.52, draw: 0.28, away: 0.20, outcome: PredictionOutcome.HOME_WIN },
      },
      // HÔM NAY - SẮP DIỄN RA (UPCOMING)
      {
        externalId: 'mock_match_today_upcoming_1',
        leagueId: plLeague.id,
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
        matchDate: makeDate(0, 20, 0),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
        prediction: { home: 0.45, draw: 0.30, away: 0.25, outcome: PredictionOutcome.HOME_WIN },
      },
      {
        externalId: 'mock_match_today_upcoming_2',
        leagueId: laligaLeague.id,
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        matchDate: makeDate(0, 22, 30),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
        prediction: { home: 0.48, draw: 0.26, away: 0.26, outcome: PredictionOutcome.HOME_WIN },
      },
      // HÔM NAY - NBA
      {
        externalId: 'mock_match_nba_today_1',
        leagueId: nbaLeague.id,
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        matchDate: makeDate(0, 19, 0),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
        prediction: { home: 0.55, draw: 0.0, away: 0.45, outcome: PredictionOutcome.HOME_WIN },
      },

      // HÔM QUA - ĐÃ KẾT THÚC (FINISHED)
      {
        externalId: 'mock_match_yesterday_1',
        leagueId: plLeague.id,
        homeTeam: 'Tottenham Hotspur',
        awayTeam: 'Manchester United',
        matchDate: makeDate(-1, 21, 0),
        status: MatchStatus.FINISHED,
        homeScore: 3,
        awayScore: 1,
        prediction: { home: 0.42, draw: 0.31, away: 0.27, outcome: PredictionOutcome.HOME_WIN },
      },
      {
        externalId: 'mock_match_yesterday_2',
        leagueId: clLeague.id,
        homeTeam: 'Bayern Munich',
        awayTeam: 'Paris Saint Germain',
        matchDate: makeDate(-1, 23, 0),
        status: MatchStatus.FINISHED,
        homeScore: 2,
        awayScore: 2,
        prediction: { home: 0.38, draw: 0.33, away: 0.29, outcome: PredictionOutcome.DRAW },
      },

      // NGÀY MAI & TƯƠNG LAI (UPCOMING)
      {
        externalId: 'mock_match_tomorrow_1',
        leagueId: plLeague.id,
        homeTeam: 'Aston Villa',
        awayTeam: 'Newcastle United',
        matchDate: makeDate(1, 20, 0),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
        prediction: { home: 0.39, draw: 0.32, away: 0.29, outcome: PredictionOutcome.HOME_WIN },
      },
      {
        externalId: 'mock_match_tomorrow_2',
        leagueId: nbaLeague.id,
        homeTeam: 'Boston Celtics',
        awayTeam: 'Miami Heat',
        matchDate: makeDate(1, 18, 30),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
        prediction: { home: 0.62, draw: 0.0, away: 0.38, outcome: PredictionOutcome.HOME_WIN },
      },
      {
        externalId: 'mock_match_dayafter_1',
        leagueId: clLeague.id,
        homeTeam: 'Real Madrid',
        awayTeam: 'Inter Milan',
        matchDate: makeDate(2, 21, 0),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
        prediction: { home: 0.58, draw: 0.24, away: 0.18, outcome: PredictionOutcome.HOME_WIN },
      },
    ];

    for (const m of matchesToSeed) {
      const homeTeam = teamMap[m.homeTeam];
      const awayTeam = teamMap[m.awayTeam];

      if (!homeTeam || !awayTeam) {
        console.warn(`⚠️ Bỏ qua trận ${m.homeTeam} vs ${m.awayTeam} vì thiếu team`);
        continue;
      }

      const match = await prisma.match.upsert({
        where: { externalId: m.externalId },
        update: {
          leagueId: m.leagueId,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          matchDate: m.matchDate,
          status: m.status,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
        },
        create: {
          externalId: m.externalId,
          leagueId: m.leagueId,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          matchDate: m.matchDate,
          status: m.status,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
        },
      });

      // Tạo dự đoán AI cho trận đấu
      if (m.prediction) {
        await prisma.prediction.upsert({
          where: {
            matchId_modelVersion: {
              matchId: match.id,
              modelVersion: MODEL_VERSION,
            },
          },
          update: {
            homeWinProb: m.prediction.home,
            drawProb: m.prediction.draw,
            awayWinProb: m.prediction.away,
            predictedOutcome: m.prediction.outcome,
          },
          create: {
            matchId: match.id,
            modelVersion: MODEL_VERSION,
            homeWinProb: m.prediction.home,
            drawProb: m.prediction.draw,
            awayWinProb: m.prediction.away,
            predictedOutcome: m.prediction.outcome,
            featuresSnapshot: {
              homeElo: 1650,
              awayElo: 1600,
              confidence: 'high',
            },
          },
        });
      }
    }

    console.log(`✅ 5. Đã tạo ${matchesToSeed.length} trận đấu (Live, Upcoming, Finished) kèm dự đoán AI`);

    // 6. Xóa Redis Cache nếu có để FE nhận data mới ngay lập tức
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redis = createClient({ url: redisUrl });
      await redis.connect();
      const keys = await redis.keys('matches:*');
      const leagueKeys = await redis.keys('leagues:*');
      const standingKeys = await redis.keys('standings:*');
      const allKeys = [...keys, ...leagueKeys, ...standingKeys];
      if (allKeys.length > 0) {
        await redis.del(allKeys);
        console.log(`🧹 6. Đã xóa ${allKeys.length} Redis cache keys`);
      }
      await redis.disconnect();
    } catch (err: any) {
      console.log('ℹ️  Bỏ qua xóa Redis cache (Redis có thể chưa chạy hoặc không bắt buộc)');
    }

    console.log('\n🎉 NẠP DỮ LIỆU THÀNH CÔNG! Hãy refresh lại giao diện Frontend để xem kết quả.');
  } finally {
    await prisma.$disconnect();
  }
}

seedSports().catch((err) => {
  console.error('❌ Lỗi khi seed dữ liệu thể thao:', err);
  process.exit(1);
});
