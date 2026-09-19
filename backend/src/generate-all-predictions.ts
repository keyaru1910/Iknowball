// src/generate-all-predictions.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './module/prisma/prisma.service';
import { PredictionService } from './module/prediction/prediction.service';
import { CacheService } from './module/shared/cache.service';
import { MatchStatus } from '@prisma/client';

async function main() {
  console.log('====================================================');
  console.log('🤖 IKNOWBALL: GENERATE ALL AI PREDICTIONS (STEP 3)');
  console.log('====================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const prisma = app.get(PrismaService);
  const predictionService = app.get(PredictionService);
  const cacheService = app.get(CacheService);

  const season = '2026-2027';

  // 1. Lấy toàn bộ các trận đấu của mùa giải 2026-2027
  console.log(`--- 1. TÌM KIẾM CÁC TRẬN ĐẤU CẦN TẠO DỰ ĐOÁN AI (MÙA ${season}) ---`);
  const matches = await prisma.match.findMany({
    where: { season },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: { include: { sport: true } },
    },
    orderBy: { matchDate: 'asc' },
  });

  console.log(`📌 Tổng cộng có ${matches.length} trận đấu trong database.`);

  // 2. Sinh dự đoán AI cho từng trận đấu
  console.log('\n--- 2. SINH DỰ ĐOÁN TỪ MACHINE LEARNING & ELO MODEL ---');
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    try {
      const pred = await predictionService.generateForMatch(match.id);
      if (pred) {
        createdCount++;
      } else {
        skippedCount++;
      }
    } catch (err: any) {
      errorCount++;
      console.warn(`⚠️ Lỗi khi dự đoán trận ${match.homeTeam.name} vs ${match.awayTeam.name}:`, err.message);
    }

    if ((i + 1) % 50 === 0 || i + 1 === matches.length) {
      console.log(`⏳ Tiến độ: ${i + 1}/${matches.length} trận đã xử lý (${createdCount} dự đoán tạo mới/tồn tại, ${errorCount} lỗi)...`);
    }
  }

  console.log(`✅ Hoàn tất sinh dự đoán: ${createdCount} thành công, ${errorCount} lỗi.`);

  // 3. Đánh giá chất lượng dự đoán cho các trận FINISHED (Brier Score, Log Loss)
  console.log('\n--- 3. ĐÁNH GIÁ ĐỘ CHÍNH XÁC & CHỈ SỐ LOG LOSS / BRIER SCORE ---');
  const evaluatedCount = await predictionService.evaluatePending();
  console.log(`✅ Đã đánh giá và chấm điểm cho ${evaluatedCount} trận đấu đã kết thúc.`);

  // 4. Báo cáo Benchmark và hiệu năng mô hình AI
  console.log('\n--- 4. BÁO CÁO BENCHMARK HIỆU NĂNG MÔ HÌNH AI ---');
  const compareStats = await predictionService.compareModels();
  console.log(`📊 Tổng số trận đã kiểm thử: ${compareStats.totalMatches}`);
  console.log('🏆 So sánh các phiên bản mô hình:');
  compareStats.models.forEach((m, idx) => {
    console.log(`   ${idx + 1}. [${m.status.toUpperCase()}] ${m.name}`);
    console.log(`      • Accuracy : ${(m.accuracy * 100).toFixed(1)}%`);
    console.log(`      • Macro F1 : ${(m.macroF1 * 100).toFixed(1)}%`);
    console.log(`      • Log Loss : ${m.avgLogLoss.toFixed(4)}`);
    console.log(`      • Brier    : ${m.avgBrierScore.toFixed(4)}`);
  });

  console.log('\n🎯 Chi tiết độ chính xác theo từng kịch bản (Per-Class Breakdown):');
  Object.entries(compareStats.perClassBreakdown).forEach(([k, v]) => {
    console.log(`   • ${v.label}: F1-Score: ${(v.f1 * 100).toFixed(1)}% | Precision: ${(v.precision * 100).toFixed(1)}% | Recall: ${(v.recall * 100).toFixed(1)}%`);
  });

  // 5. Xóa cache Redis để UI cập nhật ngay lập tức
  console.log('\n--- 5. XÓA CACHE REDIS CHO PREDICTIONS ---');
  await cacheService.delByPattern('predictions:*');
  await cacheService.delByPattern('matches:*');
  await cacheService.delByPattern('match_detail:*');
  await cacheService.delByPattern('performance:*');
  console.log('✅ Đã làm mới Redis cache thành công.');

  console.log('\n====================================================');
  console.log('🏁 BƯỚC 3: DỮ LIỆU DỰ ĐOÁN AI ĐÃ HOÀN TOÀN SẴN SÀNG!');
  console.log('====================================================');

  await app.close();
}

main().catch((err) => {
  console.error('❌ Lỗi khi chạy generate-all-predictions:', err);
  process.exit(1);
});
