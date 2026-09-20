// src/sync-realtime-data.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SportsSyncService } from './module/sports-sync/sports-sync.service';
import { PrismaService } from './module/prisma/prisma.service';
import { PredictionService } from './module/prediction/prediction.service';
import { EloService } from './module/elo/elo.service';
import { FootballDataAdapter, FOOTBALL_DATA_LEAGUES } from './module/sports-data/adapters/football-data.adapter';
import { FootballDataMapper } from './module/sports-data/adapters/football-data.mapper';
import { MatchStatus } from '@prisma/client';

async function main() {
  console.log('====================================================');
  console.log('🌐 IKNOWBALL: ĐỒNG BỘ DỮ LIỆU THỰC TẾ (REAL-TIME LIVE SYNC)');
  console.log('====================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const syncService = app.get(SportsSyncService);
  const prisma = app.get(PrismaService);
  const eloService = app.get(EloService);
  const predictionService = app.get(PredictionService);
  const footballAdapter = app.get(FootballDataAdapter);
  const footballMapper = app.get(FootballDataMapper);

  // 1. Dọn dẹp triệt để dữ liệu mẫu cũ (mock/archive matches)
  console.log('--- 1. DỌN DẸP DỮ LIỆU MOCK / ARCHIVE CŨ TRÁNH NHẦM LẪN ---');
  const deletedOld = await prisma.match.deleteMany({
    where: {
      OR: [
        { externalId: { startsWith: '2026_archive:' } },
        { externalId: { startsWith: 'archive:' } },
        { externalId: { startsWith: 'ligue1-2026-' } },
        { externalId: { startsWith: 'bundesliga-2026-' } },
        { externalId: { startsWith: 'premierleague-2026-' } },
        { externalId: { startsWith: 'laliga-2026-' } },
        { externalId: { startsWith: 'seriea-2026-' } },
        { externalId: { startsWith: 'championsleague-2026-' } },
      ],
    },
  });
  console.log(`✅ Đã dọn dẹp ${deletedOld.count} trận đấu mock/archive cũ.`);

  // 2. Đồng bộ Giải đấu (Leagues)
  console.log('\n--- 2. ĐỒNG BỘ GIẢI ĐẤU (LEAGUES) ---');
  const leaguesRes = await syncService.syncLeagues('football');
  console.log(`✅ Đồng bộ Leagues: ${leaguesRes.processedCount} giải thành công.`);

  // 3. Đồng bộ Đội bóng (Teams)
  console.log('\n--- 3. ĐỒNG BỘ ĐỘI BÓNG (TEAMS) ---');
  const teamsRes = await syncService.syncTeams(undefined, 'football');
  console.log(`✅ Đồng bộ Teams: ${teamsRes.processedCount} đội thành công.`);

  // 4. Đồng bộ Bảng xếp hạng (Standings)
  console.log('\n--- 4. ĐỒNG BỘ BẢNG XẾP HẠNG (STANDINGS) ---');
  const standingsRes = await syncService.syncStandings(undefined, 'football');
  console.log(`✅ Đồng bộ Standings: ${standingsRes.processedCount} bản ghi thành công.`);

  // 5. Đồng bộ Lịch thi đấu thực tế từ Football-Data.org
  console.log('\n--- 5. ĐỒNG BỘ LỊCH THI ĐẤU & KẾT QUẢ THỰC TẾ (MATCHES) ---');
  const matchesRes = await syncService.syncMatches({ sportName: 'football' });
  console.log(`✅ Đồng bộ Matches: ${matchesRes.processedCount} trận thành công.`);

  // 6. Đồng bộ các trận đấu diễn ra HÔM NAY (Live / Scheduled Today từ /matches)
  console.log('\n--- 6. ĐỒNG BỘ CÁC TRẬN ĐẤU HÔM NAY TỪ /matches ENDPOINT ---');
  try {
    const todayRaw = await footballAdapter.getTodayMatches();
    console.log(`📡 Tìm thấy ${todayRaw.length} trận đấu từ API trong ngày hôm nay.`);
    let liveSynced = 0;

    for (const raw of todayRaw) {
      const compCode = raw.competition?.code;
      const leagueConfig = FOOTBALL_DATA_LEAGUES.find((l) => l.code === compCode);
      if (!leagueConfig) continue;

      const league = await prisma.league.findFirst({
        where: { externalId: leagueConfig.externalId },
      });
      if (!league) continue;

      const normalized = footballMapper.toFixture(raw, leagueConfig.externalId, '2026-2027');

      // Tìm home team và away team
      const homeTeam = await prisma.team.findFirst({
        where: { externalId: normalized.homeTeamExternalId },
      });
      const awayTeam = await prisma.team.findFirst({
        where: { externalId: normalized.awayTeamExternalId },
      });

      if (!homeTeam || !awayTeam) continue;

      await prisma.match.upsert({
        where: { externalId: normalized.externalId },
        update: {
          matchDate: normalized.matchDate,
          status: normalized.status as MatchStatus,
          homeScore: normalized.homeScore,
          awayScore: normalized.awayScore,
          rawData: normalized.rawData as any,
        },
        create: {
          externalId: normalized.externalId,
          leagueId: league.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          matchDate: normalized.matchDate,
          season: '2026-2027',
          status: normalized.status as MatchStatus,
          homeScore: normalized.homeScore,
          awayScore: normalized.awayScore,
          rawData: normalized.rawData as any,
          contentHash: `today-${normalized.externalId}`,
        },

      });
      liveSynced++;
    }
    console.log(`✅ Đã đồng bộ chính xác ${liveSynced} trận đấu diễn ra hôm nay.`);
  } catch (err: any) {
    console.warn('⚠️ Lỗi khi đồng bộ /matches hôm nay:', err.message);
  }

  // 7. Cập nhật Elo rating
  console.log('\n--- 7. CẬP NHẬT ELO RATING CHO CÁC TRẬN ĐÃ KẾT THÚC ---');
  const eloCount = await eloService.processPendingFinishedMatches();
  console.log(`✅ Đã cập nhật Elo rating cho ${eloCount} trận đấu.`);

  // 8. Tạo dự đoán AI
  console.log('\n--- 8. TẠO DỰ ĐOÁN AI CHO CÁC TRẬN ĐẤU MÙA 2026-2027 ---');
  const matchesToPredict = await prisma.match.findMany({
    where: {
      season: '2026-2027',
      predictions: { none: {} },
    },
    take: 500,
  });

  console.log(`📌 Tìm thấy ${matchesToPredict.length} trận đấu chưa có dự đoán...`);
  let createdPred = 0;
  for (const m of matchesToPredict) {
    try {
      await predictionService.generateForMatch(m.id);
      createdPred++;
    } catch {
      // ignore
    }
  }
  console.log(`✅ Hoàn tất tạo ${createdPred} dự đoán AI.`);

  // 9. Xóa Redis cache
  console.log('\n--- 9. XÓA SẠCH REDIS CACHE ---');
  await syncService.invalidateCache();
  await prisma.$disconnect();

  console.log('\n====================================================');
  console.log('🏁 HOÀN TẤT ĐỒNG BỘ REAL-TIME DATA TỪ FOOTBALL-DATA.ORG API!');
  console.log('====================================================');

  await app.close();
}

main().catch((err) => {
  console.error('❌ Lỗi khi đồng bộ:', err);
  process.exit(1);
});
