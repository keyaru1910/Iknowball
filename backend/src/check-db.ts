import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) } as any);

async function check() {
  const count = await prisma.match.count();
  const footballCount = await prisma.match.count({ where: { league: { sport: { name: 'football' } } } });
  const sample = await prisma.match.findMany({
    take: 10,
    orderBy: { matchDate: 'desc' },
    include: { league: true, homeTeam: true, awayTeam: true },
  });
  console.log('Total matches in DB:', count);
  console.log('Football matches in DB:', footballCount);
  console.log('\nTop 10 most recent matches:');
  for (const m of sample) {
    console.log(`${m.matchDate.toISOString()} | ${m.league.name} | ${m.homeTeam.name} vs ${m.awayTeam.name} | Status: ${m.status} | Score: ${m.homeScore}-${m.awayScore}`);
  }
  await prisma.$disconnect();
}

check().catch(console.error);
