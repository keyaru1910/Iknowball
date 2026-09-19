// src/apply-custom-elo-baseline.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './module/prisma/prisma.service';
import { EloService } from './module/elo/elo.service';
import { CacheService } from './module/shared/cache.service';
import { MatchStatus, Prisma } from '@prisma/client';

/**
 * Danh sách điểm Baseline Elo bóng đá từ ClubElo.com
 */
const FOOTBALL_CLUB_ELO_MAP: Record<string, number> = {
  'arsenal': 2061,
  'bayern-munich': 1999,
  'bayern': 1999,
  'barcelona': 1989,
  'fc-barcelona': 1989,
  'paris-saint-germain': 1954,
  'psg': 1954,
  'real-madrid': 1946,
  'manchester-city': 1941,
  'man-city': 1941,
  'liverpool': 1926,
  'inter-milan': 1892,
  'inter': 1892,
  'internazionale': 1892,
  'aston-villa': 1885,
  'manchester-united': 1881,
  'man-united': 1881,
  'chelsea': 1869,
  'atletico-madrid': 1863,
  'borussia-dortmund': 1846,
  'dortmund': 1846,
  'brighton': 1844,
  'brighton-hove-albion': 1844,
  'newcastle-united': 1840,
  'newcastle': 1840,
  'brentford': 1832,
  'everton': 1831,
  'bournemouth': 1822,
  'bayer-leverkusen': 1808,
  'leverkusen': 1808,
  'ac-milan': 1808,
  'milan': 1808,
  'napoli': 1806,
  'fulham': 1801,
  'tottenham-hotspur': 1830,
  'tottenham': 1830,
  'juventus': 1820,
  'roma': 1790,
  'as-roma': 1790,
  'lazio': 1785,
  'atalanta': 1810,
  'real-betis': 1765,
  'betis': 1765,
  'real-sociedad': 1775,
  'villarreal': 1780,
  'athletic-bilbao': 1790,
  'athletic-club': 1790,
  'sevilla': 1740,
  'monaco': 1800,
  'as-monaco': 1800,
  'marseille': 1770,
  'lyon': 1760,
  'olympique-lyonnais': 1760,
  'lille': 1765,
  'eintracht-frankfurt': 1760,
  'rb-leipzig': 1825,
  'leipzig': 1825,
  'vfb-stuttgart': 1780,
  'stuttgart': 1780,
};

/**
 * Danh sách điểm Baseline Elo NBA quy đổi từ Win% & Net Rating 2025-26 (CraftedNBA)
 */
const NBA_ELO_MAP: Record<string, number> = {
  'oklahoma-city-thunder': 1834,
  'thunder': 1834,
  'san-antonio-spurs': 1761,
  'spurs': 1761,
  'detroit-pistons': 1756,
  'pistons': 1756,
  'boston-celtics': 1744,
  'celtics': 1744,
  'new-york-knicks': 1689,
  'knicks': 1689,
  'denver-nuggets': 1662,
  'nuggets': 1662,
  'houston-rockets': 1662,
  'rockets': 1662,
  'cleveland-cavaliers': 1629,
  'cavaliers': 1629,
  'charlotte-hornets': 1630,
  'hornets': 1630,
  'minnesota-timberwolves': 1597,
  'timberwolves': 1597,
  'toronto-raptors': 1585,
  'raptors': 1585,
  'los-angeles-lakers': 1567,
  'lakers': 1567,
  'la-lakers': 1567,
  'atlanta-hawks': 1567,
  'hawks': 1567,
  'miami-heat': 1557,
  'heat': 1557,
  'phoenix-suns': 1545,
  'suns': 1545,
  'orlando-magic': 1525,
  'magic': 1525,
  'la-clippers': 1530,
  'clippers': 1530,
  'los-angeles-clippers': 1530,
  'philadelphia-76ers': 1507,
  '76ers': 1507,
  'sixers': 1507,
  'portland-trail-blazers': 1492,
  'trail-blazers': 1492,
  'blazers': 1492,
  'golden-state-warriors': 1478,
  'warriors': 1478,
  'new-orleans-pelicans': 1353,
  'pelicans': 1353,
  'chicago-bulls': 1343,
  'bulls': 1343,
  'dallas-mavericks': 1333,
  'mavericks': 1333,
  'mavs': 1333,
  'milwaukee-bucks': 1325,
  'bucks': 1325,
  'memphis-grizzlies': 1311,
  'grizzlies': 1311,
  'indiana-pacers': 1251,
  'pacers': 1251,
  'utah-jazz': 1249,
  'jazz': 1249,
  'sacramento-kings': 1211,
  'kings': 1211,
  'brooklyn-nets': 1199,
  'nets': 1199,
  'washington-wizards': 1146,
  'wizards': 1146,
};

const normalizeKey = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|cf|cd|rcd|ud|sd|ca|afc|bsc|sc|sad|fk|vfb|vfl|tsg|tsv)\b/gi, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function main() {
  console.log('====================================================');
  console.log('⚡ APPLY CUSTOM ELO RATINGS FROM CLUBELO & NBA DATA');
  console.log('====================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const prisma = app.get(PrismaService);
  const eloService = app.get(EloService);
  const cacheService = app.get(CacheService);

  const season = '2026-2027';

  // 1. Lấy toàn bộ đội bóng cùng giải đấu trong DB
  console.log(`--- 1. CẬP NHẬT BASELINE ELO CHO MÙA GIẢI "${season}" ---`);
  const allTeams = await prisma.team.findMany({
    include: {
      league: {
        include: { sport: true },
      },
    },
  });

  console.log(`📌 Tìm thấy ${allTeams.length} đội bóng trong DB.`);

  let footballMatched = 0;
  let nbaMatched = 0;

  for (const t of allTeams) {
    const sportName = t.league.sport.name.toLowerCase();
    const cleanSlug = normalizeKey(t.name);
    const extSlug = normalizeKey(t.externalId.split(':').pop() || '');

    let baselineElo: number | null = null;

    if (sportName === 'football') {
      baselineElo =
        FOOTBALL_CLUB_ELO_MAP[cleanSlug] ||
        FOOTBALL_CLUB_ELO_MAP[extSlug] ||
        FOOTBALL_CLUB_ELO_MAP[cleanSlug.replace(/-/g, '')];

      // Nếu không có trong top list, gán giá trị mặc định theo tier giải đấu
      if (!baselineElo) {
        if (t.league.name.includes('Premier League')) baselineElo = 1750;
        else if (t.league.name.includes('La Liga')) baselineElo = 1700;
        else if (t.league.name.includes('Serie A')) baselineElo = 1700;
        else if (t.league.name.includes('Bundesliga')) baselineElo = 1700;
        else if (t.league.name.includes('Ligue 1')) baselineElo = 1650;
        else if (t.league.name.includes('Champions League')) baselineElo = 1750;
        else baselineElo = 1500;
      } else {
        footballMatched++;
      }
    } else if (sportName === 'basketball') {
      baselineElo =
        NBA_ELO_MAP[cleanSlug] ||
        NBA_ELO_MAP[extSlug] ||
        NBA_ELO_MAP[cleanSlug.replace(/-/g, '')];

      if (!baselineElo) baselineElo = 1500;
      else nbaMatched++;
    }

    // Upsert baseline Elo vào TeamStats của mùa giải 2026-2027
    await prisma.teamStats.upsert({
      where: {
        teamId_leagueId_season: {
          teamId: t.id,
          leagueId: t.leagueId,
          season,
        },
      },
      update: {
        eloRating: new Prisma.Decimal(baselineElo),
      },
      create: {
        teamId: t.id,
        leagueId: t.leagueId,
        season,
        eloRating: new Prisma.Decimal(baselineElo),
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      },
    });
  }

  console.log(`✅ Đã thiết lập Baseline Elo chuẩn: Khớp ${footballMatched} CLB bóng đá hàng đầu & ${nbaMatched} đội NBA.`);

  // 2. Reset trạng thái Elo cho các trận FINISHED mùa 2026-2027 để tính toán lại tuần tự
  console.log('\n--- 2. TÍNH TOÁN LẠI ELO TUẦN TỰ CHO CÁC TRẬN ĐÃ KẾT THÚC ---');
  await prisma.match.updateMany({
    where: {
      season,
      status: MatchStatus.FINISHED,
    },
    data: {
      eloProcessedAt: null,
    },
  });

  const updatedEloCount = await eloService.processPendingFinishedMatches();
  console.log(`✅ Đã hoàn tất tính toán lại Elo cho ${updatedEloCount} trận đấu mùa ${season}.`);

  // 3. Hiển thị Top 15 Bảng xếp hạng Elo Bóng đá & NBA
  console.log('\n--- 3. BẢNG XẾP HẠNG ELO RATING MỚI NHẤT (MÙA 2026–2027) ---');

  const topFootball = await prisma.teamStats.findMany({
    where: {
      season,
      league: { sport: { name: 'football' } },
    },
    include: { team: true, league: true },
    orderBy: { eloRating: 'desc' },
    take: 15,
  });

  console.log('\n⚽ TOP 15 BÓNG ĐÁ CHÂU ÂU (ELO RATING - MÙA 2026–2027):');
  topFootball.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.team.name.padEnd(25)} | ${t.league.name.padEnd(20)} | Elo: ${Number(t.eloRating).toFixed(1)}`);
  });

  const topNba = await prisma.teamStats.findMany({
    where: {
      season,
      league: { sport: { name: 'basketball' } },
    },
    include: { team: true, league: true },
    orderBy: { eloRating: 'desc' },
    take: 10,
  });

  if (topNba.length > 0) {
    console.log('\n🏀 TOP 10 BÓNG RỔ NBA (ELO RATING - MÙA 2026–2027):');
    topNba.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.team.name.padEnd(25)} | ${t.league.name.padEnd(10)} | Elo: ${Number(t.eloRating).toFixed(1)}`);
    });
  }

  // 4. Xóa sạch cache Redis
  console.log('\n--- 4. LÀM MỚI TOÀN BỘ REDIS CACHE ---');
  await cacheService.delByPattern('matches:*');
  await cacheService.delByPattern('match_detail:*');
  await cacheService.delByPattern('standings:*');
  await cacheService.delByPattern('leagues:*');
  await cacheService.delByPattern('team_detail:*');
  await cacheService.delByPattern('statistics:*');
  await cacheService.delByPattern('elo:*');
  console.log('✅ Đã làm mới toàn bộ Redis Cache.');

  console.log('\n====================================================');
  console.log('🏁 HOÀN TẤT THIẾT LẬP BẢNG XẾP HẠNG ELO CHUẨN XÁC!');
  console.log('====================================================');

  await app.close();
}

main().catch((err) => {
  console.error('❌ Lỗi khi áp dụng Elo baseline:', err);
  process.exit(1);
});
