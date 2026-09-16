import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) } as any);

async function checkAroundToday() {
  const now = new Date('2026-09-16T00:00:00Z');
  const start = new Date('2026-09-15T00:00:00Z');
  const end = new Date('2026-09-22T23:59:59Z');

  const matches = await prisma.match.findMany({
    where: {
      matchDate: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { matchDate: 'asc' },
    include: { league: true, homeTeam: true, awayTeam: true },
  });

  console.log(`Matches between 2026-09-15 and 2026-09-22: ${matches.length}`);
  for (const m of matches.slice(0, 15)) {
    console.log(`${m.matchDate.toISOString()} | ${m.league.name} | ${m.homeTeam.name} vs ${m.awayTeam.name} | Status: ${m.status} | Score: ${m.homeScore}-${m.awayScore}`);
  }
  await prisma.$disconnect();
}

checkAroundToday().catch(console.error);
