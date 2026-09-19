// src/clean-and-resync.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SportsSyncService } from './module/sports-sync/sports-sync.service';
import { EloService } from './module/elo/elo.service';
import { PrismaService } from './module/prisma/prisma.service';

async function main() {
  console.log('====================================================');
  console.log('🚀 IKNOWBALL: FULL CLEAN & RE-SYNC PIPELINE (STEP 2)');
  console.log('====================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const syncService = app.get(SportsSyncService);
  const eloService = app.get(EloService);
  const prisma = app.get(PrismaService);

  // 1. Dọn dẹp các bản ghi Standings bị duplicate
  console.log('--- 1. DỌN DẸP BẢNG XẾP HẠNG (STANDINGS) TRÙNG LẶP ---');
  try {
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
      const delRes = await prisma.standing.deleteMany({
        where: { id: { in: duplicateIds } },
      });
      console.log(`✅ Đã xóa ${delRes.count} bản ghi Standings bị trùng lặp.`);
    } else {
      console.log('✅ Bảng Standings sạch sẽ, không có bản ghi trùng lặp.');
    }
  } catch (err: any) {
    console.warn('⚠️ Lỗi khi dọn dẹp Standings:', err.message);
  }

  // 2. Đồng bộ Giải đấu (Leagues)
  console.log('\n--- 2. ĐỒNG BỘ GIẢI ĐẤU (LEAGUES) ---');
  const leaguesRes = await syncService.syncLeagues();
  console.log(`✅ Đồng bộ Leagues: ${leaguesRes.processedCount} giải thành công. Lỗi: ${leaguesRes.failedCount}`);

  // 3. Đồng bộ Đội bóng (Teams)
  console.log('\n--- 3. ĐỒNG BỘ ĐỘI BÓNG (TEAMS) ---');
  const teamsRes = await syncService.syncTeams();
  console.log(`✅ Đồng bộ Teams: ${teamsRes.processedCount} đội thành công. Lỗi: ${teamsRes.failedCount}`);

  // 4. Đồng bộ Bảng xếp hạng (Standings)
  console.log('\n--- 4. ĐỒNG BỘ BẢNG XẾP HẠNG (STANDINGS) ---');
  const standingsRes = await syncService.syncStandings();
  console.log(`✅ Đồng bộ Standings: ${standingsRes.processedCount} bản ghi thành công. Lỗi: ${standingsRes.failedCount}`);

  // 5. Đồng bộ Lịch thi đấu & Kết quả (Matches)
  console.log('\n--- 5. ĐỒNG BỘ LỊCH THI ĐẤU & KẾT QUẢ TRẬN ĐẤU (MATCHES) ---');
  const matchesRes = await syncService.syncMatches();
  console.log(`✅ Đồng bộ Matches: ${matchesRes.processedCount} trận thành công. Lỗi: ${matchesRes.failedCount}`);
  if (matchesRes.errors.length > 0) {
    console.log(`⚠️ Các cảnh báo: ${matchesRes.errors.slice(0, 5).join(' | ')}`);
  }

  // 6. Xử lý và tính toán Elo rating cho tất cả các trận FINISHED đang chờ
  console.log('\n--- 6. TÍNH TOÁN VÀ CẬP NHẬT ELO RATING CHO CÁC TRẬN FINISHED ---');
  const eloProcessedCount = await eloService.processPendingFinishedMatches();
  console.log(`✅ Đã tính toán và cập nhật điểm Elo thành công cho ${eloProcessedCount} trận đấu.`);

  // 7. Báo cáo thống kê Database & Top 10 Elo rating
  console.log('\n--- 7. BÁO CÁO THỐNG KÊ DATABASE SAU ĐỒNG BỘ ---');
  const totalMatches = await prisma.match.count();
  const totalTeams = await prisma.team.count();
  const totalLeagues = await prisma.league.count();
  const matchBySeason = await prisma.match.groupBy({
    by: ['season'],
    _count: { id: true },
  });

  console.log(`📌 Tổng số Giải đấu: ${totalLeagues}`);
  console.log(`📌 Tổng số Đội bóng: ${totalTeams}`);
  console.log(`📌 Tổng số Trận đấu: ${totalMatches}`);
  for (const m of matchBySeason) {
    console.log(`   - Mùa "${m.season}": ${m._count.id} trận`);
  }

  const topEloTeams = await prisma.teamStats.findMany({
    where: { season: '2026-2027' },
    include: { team: true, league: true },
    orderBy: { eloRating: 'desc' },
    take: 10,
  });

  if (topEloTeams.length > 0) {
    console.log('\n🏆 TOP 10 ĐỘI BÓNG CÓ ĐIỂM ELO CAO NHẤT (MÙA 2026–2027):');
    topEloTeams.forEach((t, idx) => {
      console.log(`   ${idx + 1}. ${t.team.name} (${t.league.name}) - Elo: ${Number(t.eloRating).toFixed(1)}`);
    });
  }

  // 8. Xóa cache Redis
  console.log('\n--- 8. XÓA CACHE VÀ LÀM MỚI TOÀN BỘ REDIS ---');
  await syncService.invalidateCache();
  console.log('✅ Đã xóa sạch cache Redis (matches, standings, leagues, statistics, team_detail).');

  console.log('\n====================================================');
  console.log('🏁 BƯỚC 2 HOÀN TẤT THÀNH CÔNG RỰC RỠ!');
  console.log('====================================================');

  await app.close();
}

main().catch((err) => {
  console.error('❌ Lỗi khi chạy clean-and-resync:', err);
  process.exit(1);
});
