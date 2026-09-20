import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) } as any);

import { createClient } from 'redis';

async function checkAroundToday() {
  const allMatches = await prisma.match.findMany({
    select: { id: true, externalId: true, matchDate: true, league: { select: { name: true } } },
  });

  const fakeMatches = allMatches.filter(
    (m) => !/^\d+$/.test(m.externalId) && !m.externalId.startsWith('fd:') && !m.externalId.startsWith('bdl:'),
  );

  console.log(`Total matches in DB: ${allMatches.length}`);
  console.log(`Found ${fakeMatches.length} non-API fake/mock matches to delete.`);

  if (fakeMatches.length > 0) {
    const deleted = await prisma.match.deleteMany({
      where: { id: { in: fakeMatches.map((m) => m.id) } },
    });
    console.log(`✅ Đã xóa hoàn toàn ${deleted.count} trận đấu mock/fake khỏi database.`);
  }

  // Flush Redis Cache
  try {
    const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redis.connect();
    await redis.flushAll();
    await redis.disconnect();
    console.log('✅ Đã xóa sạch Redis cache.');
  } catch (err) {
    console.warn('⚠️ Lỗi Redis:', err);
  }

  const todayMatches = await prisma.match.findMany({
    where: {
      matchDate: {
        gte: new Date('2026-09-20T00:00:00Z'),
        lte: new Date('2026-09-20T23:59:59Z'),
      },
    },
    orderBy: { matchDate: 'asc' },
    include: { league: true, homeTeam: true, awayTeam: true },
  });

  console.log(`\nRemaining REAL matches TODAY (2026-09-20): ${todayMatches.length}`);
  for (const m of todayMatches) {
    console.log(`${m.externalId} | ${m.league.name} | ${m.homeTeam.name} vs ${m.awayTeam.name} | Status: ${m.status} | Score: ${m.homeScore}-${m.awayScore} | Time: ${m.matchDate.toISOString()}`);
  }
  await prisma.$disconnect();
}




checkAroundToday().catch(console.error);
