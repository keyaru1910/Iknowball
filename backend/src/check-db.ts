import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
} as any);

async function check() {
  console.log('--- KIEM TRA DATABASE ---');
  const leagues = await prisma.league.findMany({
    include: { sport: true }
  });
  console.log('Leagues:', leagues.map(l => ({ id: l.id, name: l.name, externalId: l.externalId, season: l.season, sport: l.sport.name })));

  const teamStats = await prisma.teamStats.groupBy({
    by: ['season', 'leagueId'],
    _count: { id: true }
  });
  console.log('TeamStats theo league & season:', teamStats);

  const standings = await prisma.standing.groupBy({
    by: ['season', 'leagueId'],
    _count: { id: true }
  });
  console.log('Standings theo league & season:', standings);

  const playerStats = await prisma.playerStatistics.groupBy({
    by: ['season', 'sport', 'leagueId'],
    _count: { id: true }
  });
  console.log('PlayerStatistics theo league, sport & season:', playerStats);

  const teamSeasonStats = await prisma.teamSeasonStatistics.groupBy({
    by: ['season', 'sport', 'leagueId'],
    _count: { id: true }
  });
  console.log('TeamSeasonStatistics theo league, sport & season:', teamSeasonStats);
  
  await prisma.$disconnect();
}

check().catch(console.error);
