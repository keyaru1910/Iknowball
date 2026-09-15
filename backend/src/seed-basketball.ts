/**
 * Seed dữ liệu thống kê NBA (Basketball) cho 2 mùa giải 2024-2025 và 2025-2026
 * Chạy lệnh: npm run seed:basketball
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

interface PlayerStatItem {
  externalId: string;
  playerName: string;
  teamName: string;
  teamLogoUrl: string;
  season: string;
  sport: string;
  position: string;
  appearances: number;
  minutesPlayed: number;
  pointsAvg: number;
  reboundsAvg: number;
  assistsAvg: number;
  stealsAvg: number;
  blocksAvg: number;
  fieldGoalPercentage: number;
}

interface TeamStatItem {
  teamName: string;
  teamLogoUrl: string;
  season: string;
  sport: string;
  played: number;
  wins: number;
  draws: number | null;
  losses: number;
  winPercentage: number;
  pointsForAvg: number;
  pointsAgainstAvg: number;
  pointDifferential: number;
}

interface BasketballDataFile {
  seasons: string[];
  teams: TeamStatItem[];
  players: PlayerStatItem[];
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function invalidateSportsCache() {
  try {
    const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redis.connect();
    const keys = (
      await Promise.all(
        ['statistics:*', 'leagues:*', 'teams:*', 'standings:*'].map((pattern) =>
          redis.keys(pattern),
        ),
      )
    ).flat();
    if (keys.length) await redis.del(keys);
    await redis.disconnect();
  } catch {
    // Redis optional khi seed
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL chưa được cấu hình');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  } as any);

  const jsonPath = join(process.cwd(), 'data', 'basketball', 'nba_stats_24_26.json');
  console.log(`🏀 Đang đọc file thống kê NBA: ${jsonPath}...`);

  const rawJson = await readFile(jsonPath, 'utf8');
  const data: BasketballDataFile = JSON.parse(rawJson);

  console.log(`📊 Tìm thấy: ${data.teams.length} đội bóng và ${data.players.length} bản ghi cầu thủ cho 2 mùa (${data.seasons.join(', ')}).`);

  // 1. Sport & League
  const basketballSport = await prisma.sport.upsert({
    where: { name: 'basketball' },
    update: {},
    create: { name: 'basketball' },
  });

  const nbaLeague = await prisma.league.upsert({
    where: { externalId: 'nba' },
    update: {
      name: 'NBA',
      country: 'USA',
      season: '2025-2026',
      logoUrl: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    },
    create: {
      externalId: 'nba',
      name: 'NBA',
      country: 'USA',
      season: '2025-2026',
      logoUrl: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
      sportId: basketballSport.id,
    },
  });

  // 2. Cache team records by Name
  const teamIdMap = new Map<string, string>();

  console.log('⏳ Đang cập nhật danh sách Đội bóng & Thống kê Đội theo mùa...');
  for (const item of data.teams) {
    const extId = `nba-${slug(item.teamName)}`;
    let teamId = teamIdMap.get(item.teamName);

    if (!teamId) {
      const team = await prisma.team.upsert({
        where: { externalId: extId },
        update: {
          name: item.teamName,
          logoUrl: item.teamLogoUrl,
          leagueId: nbaLeague.id,
        },
        create: {
          externalId: extId,
          name: item.teamName,
          logoUrl: item.teamLogoUrl,
          leagueId: nbaLeague.id,
        },
      });
      teamId = team.id;
      teamIdMap.set(item.teamName, teamId);
    }

    // Upsert TeamSeasonStatistics
    await prisma.teamSeasonStatistics.upsert({
      where: {
        teamId_leagueId_season: {
          teamId,
          leagueId: nbaLeague.id,
          season: item.season,
        },
      },
      update: {
        played: item.played,
        wins: item.wins,
        draws: null,
        losses: item.losses,
        pointsForAvg: item.pointsForAvg,
        pointsAgainstAvg: item.pointsAgainstAvg,
      },
      create: {
        teamId,
        leagueId: nbaLeague.id,
        season: item.season,
        sport: 'basketball',
        played: item.played,
        wins: item.wins,
        draws: null,
        losses: item.losses,
        pointsForAvg: item.pointsForAvg,
        pointsAgainstAvg: item.pointsAgainstAvg,
      },
    });
  }

  // 3. Upsert Players & PlayerStatistics
  console.log('⏳ Đang cập nhật Cầu thủ & Thống kê Cầu thủ theo mùa...');
  let playerCount = 0;
  for (const item of data.players) {
    let teamId = teamIdMap.get(item.teamName);
    if (!teamId) {
      const extId = `nba-${slug(item.teamName)}`;
      const team = await prisma.team.upsert({
        where: { externalId: extId },
        update: { name: item.teamName, logoUrl: item.teamLogoUrl, leagueId: nbaLeague.id },
        create: { externalId: extId, name: item.teamName, logoUrl: item.teamLogoUrl, leagueId: nbaLeague.id },
      });
      teamId = team.id;
      teamIdMap.set(item.teamName, teamId);
    }

    const playerExtId = item.externalId || `nba-player-${slug(item.playerName)}`;
    const player = await prisma.player.upsert({
      where: { externalId: playerExtId },
      update: {
        fullName: item.playerName,
        position: item.position,
        teamId,
      },
      create: {
        externalId: playerExtId,
        fullName: item.playerName,
        position: item.position,
        teamId,
      },
    });

    await prisma.playerStatistics.upsert({
      where: {
        playerId_leagueId_season: {
          playerId: player.id,
          leagueId: nbaLeague.id,
          season: item.season,
        },
      },
      update: {
        playerName: item.playerName,
        teamId,
        appearances: item.appearances,
        minutesPlayed: item.minutesPlayed,
        pointsAvg: item.pointsAvg,
        reboundsAvg: item.reboundsAvg,
        assistsAvg: item.assistsAvg,
        stealsAvg: item.stealsAvg,
      },
      create: {
        playerId: player.id,
        playerName: item.playerName,
        teamId,
        leagueId: nbaLeague.id,
        season: item.season,
        sport: 'basketball',
        appearances: item.appearances,
        minutesPlayed: item.minutesPlayed,
        pointsAvg: item.pointsAvg,
        reboundsAvg: item.reboundsAvg,
        assistsAvg: item.assistsAvg,
        stealsAvg: item.stealsAvg,
      },
    });

    playerCount++;
  }

  await invalidateSportsCache();
  console.log(`✅ Đã seed thành công ${data.teams.length} đội bóng và ${playerCount} bản ghi thống kê cầu thủ NBA!`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Lỗi seed basketball stats:', err);
  process.exit(1);
});
