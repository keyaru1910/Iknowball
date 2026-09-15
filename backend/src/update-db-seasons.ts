import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from 'redis';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
} as any);

async function main() {
  console.log('====================================================');
  console.log('🔄 CẬP NHẬT DATABASE SEASONS & BUST CACHE');
  console.log('====================================================\n');

  // 1. CẬP NHẬT MÙA CHO LEAGUES
  console.log('--- 1. CẬP NHẬT BẢNG LEAGUE ---');
  const footballLeagues = await prisma.league.updateMany({
    where: {
      sport: { name: 'football' },
    },
    data: {
      season: '2026-2027',
    },
  });
  console.log(`✅ Đã cập nhật ${footballLeagues.count} giải bóng đá sang mùa "2026-2027"`);

  const basketballLeagues = await prisma.league.updateMany({
    where: {
      sport: { name: 'basketball' },
    },
    data: {
      season: '2025-2026',
    },
  });
  console.log(`✅ Đã cập nhật ${basketballLeagues.count} giải bóng rổ (NBA) sang mùa "2025-2026"`);

  // 2. KHỬ TRÙNG LẶP STANDINGS (DE-DUPLICATION)
  console.log('\n--- 2. KHỬ TRÙNG LẶP BẢNG STANDINGS ---');
  const allStandings = await prisma.standing.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  for (const s of allStandings) {
    const key = `${s.leagueId}_${s.teamId}_${s.season}`;
    if (seen.has(key)) {
      duplicateIds.push(s.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicateIds.length > 0) {
    console.log(`📌 Tìm thấy ${duplicateIds.length} bản ghi Standing trùng lặp, đang tiến hành xóa...`);
    const deleteResult = await prisma.standing.deleteMany({
      where: { id: { in: duplicateIds } },
    });
    console.log(`✅ Đã xóa thành công ${deleteResult.count} bản ghi Standing trùng.`);
  } else {
    console.log('✅ Bảng Standing không có bản ghi trùng lặp nào.');
  }

  // 3. XÓA SẠCH REDIS CACHE
  console.log('\n--- 3. XÓA TOÀN BỘ REDIS CACHE ---');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisClient = createClient({ url: redisUrl, socket: { reconnectStrategy: () => false } });
  try {
    await redisClient.connect();
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`✅ Đã xóa sạch ${keys.length} keys trong Redis cache!`);
    } else {
      console.log('✅ Redis cache đang trống.');
    }
    await redisClient.quit();
  } catch (err: any) {
    console.warn(`ℹ️ Redis không hoạt động hoặc không cần xóa cache: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log('🏁 HOÀN TẤT CẬP NHẬT DATABASE VÀ CACHE');
  console.log('====================================================');
  await prisma.$disconnect();
}

main().catch(console.error);
