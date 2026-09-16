// src/sync-zafronix-data.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SportsSyncService } from './module/sports-sync/sports-sync.service';
import { PrismaService } from './module/prisma/prisma.service';
import { MatchStatus } from '@prisma/client';

async function main() {
  console.log('====================================================');
  console.log('⚽ IKNOWBALL: ĐỒNG BỘ DỮ LIỆU BÓNG ĐÁ TỪ ZAFRONIX APIS');
  console.log('====================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const syncService = app.get(SportsSyncService);
  const prisma = app.get(PrismaService);

  // 1. Dọn dẹp các trận Champions League mẫu cũ bị gán nhầm ngày hôm nay
  console.log('--- 1. DỌN DẸP TRẬN ĐẤU MẪU CŨ BỊ LỆCH NGÀY ---');
  const deletedOldSample = await prisma.match.deleteMany({
    where: {
      externalId: {
        startsWith: 'archive:2025-2026:champions-league:',
      },
      matchDate: {
        gte: new Date('2026-09-01T00:00:00Z'),
      },
    },
  });
  console.log(`✅ Đã dọn dẹp ${deletedOldSample.count} trận Champions League mẫu cũ bị lệch sang tháng 9/2026.`);

  // 2. Đồng bộ giải đấu
  console.log('\n--- 2. ĐỒNG BỘ GIẢI ĐẤU (LEAGUES) ---');
  const leagueRes = await syncService.syncLeagues('football');
  console.log(`✅ Đồng bộ giải đấu: ${leagueRes.processedCount} bản ghi thành công.`);

  // 3. Đồng bộ đội bóng
  console.log('\n--- 3. ĐỒNG BỘ ĐỘI BÓNG (TEAMS) ---');
  const teamsRes = await syncService.syncTeams();
  console.log(`✅ Đồng bộ đội bóng: ${teamsRes.processedCount} bản ghi thành công.`);

  // 4. Đồng bộ các trận đấu mùa hiện tại từ Zafronix
  console.log('\n--- 4. ĐỒNG BỘ LỊCH THI ĐẤU & KẾT QUẢ (MATCHES) ---');
  const matchesRes = await syncService.syncMatches({ sportName: 'football' });
  console.log(`✅ Đồng bộ trận đấu: ${matchesRes.processedCount} bản ghi thành công.`);
  if (matchesRes.errors.length > 0) {
    console.log(`⚠️ Ghi nhận một số cảnh báo: ${matchesRes.errors.slice(0, 3).join('; ')}`);
  }

  // 5. Làm mới cache
  console.log('\n--- 5. XÓA SẠCH REDIS CACHE ---');
  await syncService.invalidateCache();

  console.log('\n====================================================');
  console.log('🏁 HOÀN TẤT ĐỒNG BỘ ZAFRONIX SPORTS APIS');
  console.log('====================================================');

  await app.close();
}

main().catch((err) => {
  console.error('❌ Lỗi khi đồng bộ:', err);
  process.exit(1);
});
