import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import axios from 'axios';
import { createClient } from 'redis';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
} as any);

async function main() {
  console.log('====================================================');
  console.log('🔍 IKNOWBALL DATA PIPELINE DIAGNOSTIC REPORT');
  console.log('====================================================\n');

  // 1. KIỂM TRA DATABASE (POSTGRESQL)
  console.log('--- 1. DATABASE STATE ---');
  try {
    const leagues = await prisma.league.findMany({
      include: { sport: true },
      orderBy: { name: 'asc' },
    });
    console.log(`📌 Tổng số Leagues trong DB: ${leagues.length}`);
    for (const l of leagues) {
      console.log(`   - [${l.sport.name.toUpperCase()}] ${l.name} (ExtID: ${l.externalId}) -> Season trong DB: "${l.season}" (ID: ${l.id})`);
    }

    const matchStats = await prisma.match.groupBy({
      by: ['season'],
      _count: { id: true },
      _min: { matchDate: true },
      _max: { matchDate: true },
    });
    console.log('\n📌 Thống kê Trận đấu (Match) theo mùa giải:');
    if (matchStats.length === 0) {
      console.log('   (Chưa có trận đấu nào trong DB)');
    } else {
      for (const ms of matchStats) {
        console.log(`   - Season "${ms.season}": ${ms._count.id} trận | Từ: ${ms._min.matchDate?.toISOString().split('T')[0]} Đến: ${ms._max.matchDate?.toISOString().split('T')[0]}`);
      }
    }

    const standings = await prisma.standing.groupBy({
      by: ['season', 'leagueId'],
      _count: { id: true },
    });
    console.log('\n📌 Thống kê BXH (Standing) theo mùa giải & League:');
    for (const s of standings) {
      const lg = leagues.find(l => l.id === s.leagueId);
      console.log(`   - League: ${lg?.name || s.leagueId} | Season: "${s.season}" | Số đội: ${s._count.id}`);
    }

    const syncLogs = await prisma.syncJobLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
    });
    console.log('\n📌 5 Lịch sử Sync gần nhất (SyncJobLog):');
    if (syncLogs.length === 0) {
      console.log('   (Chưa có bản ghi SyncJobLog nào)');
    } else {
      for (const log of syncLogs) {
        console.log(`   - Job: ${log.jobName} | Status: ${log.status} | Processed: ${log.recordsProcessed} | Bắt đầu: ${log.startedAt.toISOString()} | Lỗi: ${log.errorMessage || 'Không'}`);
      }
    }
  } catch (err: any) {
    console.error('❌ Lỗi truy vấn Database:', err.message);
  }

  // 2. KIỂM TRA CACHE (REDIS)
  console.log('\n--- 2. REDIS CACHE STATE ---');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisClient = createClient({ url: redisUrl, socket: { reconnectStrategy: () => false } });
  try {
    await redisClient.connect();
    console.log('✅ Kết nối Redis thành công!');
    const keys = await redisClient.keys('*');
    console.log(`📌 Tổng số Cache keys đang có: ${keys.length}`);
    for (const k of keys.slice(0, 15)) {
      const ttl = await redisClient.ttl(k);
      console.log(`   - Key: "${k}" (TTL: ${ttl}s)`);
    }
    if (keys.length > 15) {
      console.log(`   ... và ${keys.length - 15} keys khác.`);
    }
    await redisClient.quit();
  } catch (err: any) {
    console.warn(`⚠️ Không thể kết nối Redis (${redisUrl}): ${err.message}`);
  }

  // 3. KIỂM TRA EXTERNAL API TRỰC TIẾP
  console.log('\n--- 3. TEST DIRECT EXTERNAL API ---');
  
  // 3.1 API-Football
  console.log('⚽ Testing API-Football (Premier League - ID 39)...');
  try {
    const res = await axios.get('https://v3.football.api-sports.io/leagues', {
      params: { id: 39, current: 'true' },
      headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY || '' },
      timeout: 6000,
    });
    const seasons = res.data?.response?.[0]?.seasons;
    const currentSeason = seasons?.find((s: any) => s.current);
    console.log('   ✅ API-Football kết nối thành công!');
    console.log(`   📌 API-Football xác nhận Premier League Current Season: ${currentSeason?.year} (start: ${currentSeason?.start}, end: ${currentSeason?.end})`);
    if (seasons) {
      console.log(`   📌 Các mùa gần nhất có trên API: ${seasons.slice(-3).map((s: any) => `${s.year} (current: ${s.current})`).join(', ')}`);
    }
  } catch (err: any) {
    console.error('   ❌ Lỗi gọi API-Football:', err.response?.data || err.message);
  }

  // 3.2 Balldontlie / NBA
  console.log('\n🏀 Testing Balldontlie (NBA Teams/Games)...');
  try {
    const res = await axios.get('https://api.balldontlie.io/v1/teams', {
      headers: { Authorization: process.env.BALLDONTLIE_API_KEY || '' },
      timeout: 6000,
    });
    console.log('   ✅ Balldontlie kết nối thành công!');
    console.log(`   📌 Số đội NBA trả về: ${res.data?.data?.length || 0}`);
  } catch (err: any) {
    console.error('   ❌ Lỗi gọi Balldontlie:', err.response?.data || err.message);
  }

  console.log('\n====================================================');
  console.log('🏁 CHẨN ĐOÁN HOÀN TẤT');
  console.log('====================================================');
  await prisma.$disconnect();
}

main().catch(console.error);
