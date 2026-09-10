/** Imports the checked-in historical football archive. Run: npm run seed:sports */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { MatchStatus, PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

type ArchiveMatch = { round?: string; date: string; time?: string; team1: string; team2: string; score?: { ht?: [number, number]; ft?: [number, number] } };
type ArchiveFile = { name: string; matches: ArchiveMatch[] };
type Competition = { file: string; key: string; externalId: string; name: string; country: string };
type RecordStats = { played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number };

const COMPETITIONS: Competition[] = [
  { file: 'de.1.json', key: 'bundesliga', externalId: '78', name: 'Bundesliga', country: 'Germany' },
  { file: 'en.1.json', key: 'premier-league', externalId: '39', name: 'Premier League', country: 'England' },
  { file: 'es.1.json', key: 'la-liga', externalId: '140', name: 'La Liga', country: 'Spain' },
  { file: 'fr.1.json', key: 'ligue-1', externalId: '61', name: 'Ligue 1', country: 'France' },
  { file: 'it.1.json', key: 'serie-a', externalId: '135', name: 'Serie A', country: 'Italy' },
];
const ARCHIVES = [
  { season: '2024-2025', directory: '2024-25', championsFile: 'uefa.cl.json' },
  { season: '2025-2026', directory: '2025-26', championsFile: 'uefa.c1.json' },
] as const;
const CHAMPIONS = { key: 'champions-league', externalId: '2', name: 'UEFA Champions League', country: 'Europe' };

const slug = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stats = (): RecordStats => ({ played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 });
const fixtureId = (season: string, key: string, match: ArchiveMatch) => `archive:${season}:${key}:${slug(match.round || 'unknown')}:${match.date}:${match.time || '00:00'}:${slug(match.team1)}:${slug(match.team2)}`;
const kickoff = (match: ArchiveMatch) => new Date(`${match.date}T${/^\d{2}:\d{2}$/.test(match.time || '') ? match.time : '12:00'}:00.000Z`);

async function invalidateSportsCache() {
  try {
    const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redis.connect();
    const keys = (await Promise.all(['matches:*', 'match_detail:*', 'standings:*', 'leagues:*', 'team_detail:*', 'h2h:*'].map((pattern) => redis.keys(pattern)))).flat();
    if (keys.length) await redis.del(keys);
    await redis.disconnect();
  } catch {
    // Redis is optional for a seed run.
  }
}

async function readArchive(path: string): Promise<ArchiveFile> {
  const archive = JSON.parse(await readFile(path, 'utf8')) as ArchiveFile;
  if (!archive.name || !Array.isArray(archive.matches)) throw new Error(`Archive không hợp lệ: ${path}`);
  return archive;
}

/** Removes only the old mock sports domain; business and identity records remain intact. */
async function resetLegacyMockSports(prisma: PrismaClient) {
  const leagues = await prisma.league.findMany({ where: { sport: { name: { in: ['football', 'basketball'] } } }, select: { id: true } });
  const leagueIds = leagues.map(({ id }) => id);
  if (!leagueIds.length) return;
  const matches = await prisma.match.findMany({ where: { leagueId: { in: leagueIds } }, select: { id: true } });
  const teams = await prisma.team.findMany({ where: { leagueId: { in: leagueIds } }, select: { id: true } });
  const matchIds = matches.map(({ id }) => id);
  const teamIds = teams.map(({ id }) => id);
  await prisma.$transaction(async (tx) => {
    if (matchIds.length) {
      await tx.prediction.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.matchEvent.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.playerStats.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.match.deleteMany({ where: { id: { in: matchIds } } });
    }
    if (teamIds.length) {
      await tx.playerStats.deleteMany({ where: { player: { teamId: { in: teamIds } } } });
      await tx.player.deleteMany({ where: { teamId: { in: teamIds } } });
    }
    await tx.standing.deleteMany({ where: { leagueId: { in: leagueIds } } });
    await tx.teamStats.deleteMany({ where: { leagueId: { in: leagueIds } } });
    await tx.team.deleteMany({ where: { leagueId: { in: leagueIds } } });
    await tx.league.deleteMany({ where: { id: { in: leagueIds } } });
    await tx.sport.deleteMany({ where: { name: 'basketball' } });
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL chưa được cấu hình');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) } as any);
  const root = join(process.cwd(), 'data', 'football');
  try {
    console.log('⚽ Thay mock sports bằng lịch sử football 2024/25 và 2025/26...');
    await resetLegacyMockSports(prisma);
    const football = await prisma.sport.upsert({ where: { name: 'football' }, update: {}, create: { name: 'football' } });
    const teamIds = new Map<string, string>();
    const tables = new Map<string, Map<string, RecordStats>>();
    let fixtures = 0;

    for (const archive of ARCHIVES) {
      const sources = [
        ...COMPETITIONS.map((competition) => ({ ...competition, path: join(root, archive.directory, competition.file) })),
        { ...CHAMPIONS, path: join(root, archive.directory, archive.championsFile) },
      ];
      for (const source of sources) {
        const data = await readArchive(source.path);
        const league = await prisma.league.upsert({ where: { externalId: source.externalId }, update: { name: source.name, country: source.country, season: archive.season }, create: { externalId: source.externalId, name: source.name, country: source.country, season: archive.season, sportId: football.id } });
        const table = new Map<string, RecordStats>();
        for (const match of data.matches) {
          const resolveTeam = async (name: string) => {
            const key = `${source.key}:${slug(name)}`;
            const known = teamIds.get(key);
            if (known) return known;
            const team = await prisma.team.upsert({ where: { externalId: `archive-team:${key}` }, update: { name, leagueId: league.id }, create: { externalId: `archive-team:${key}`, name, leagueId: league.id } });
            teamIds.set(key, team.id);
            return team.id;
          };
          const [homeTeamId, awayTeamId] = await Promise.all([resolveTeam(match.team1), resolveTeam(match.team2)]);
          const fullTime = match.score?.ft;
          const isFinished = fullTime?.length === 2;
          await prisma.match.upsert({
            where: { externalId: fixtureId(archive.season, source.key, match) },
            update: { leagueId: league.id, homeTeamId, awayTeamId, matchDate: kickoff(match), season: archive.season, status: isFinished ? MatchStatus.FINISHED : MatchStatus.SCHEDULED, homeScore: fullTime?.[0] ?? null, awayScore: fullTime?.[1] ?? null, rawData: match },
            create: { externalId: fixtureId(archive.season, source.key, match), leagueId: league.id, homeTeamId, awayTeamId, matchDate: kickoff(match), season: archive.season, status: isFinished ? MatchStatus.FINISHED : MatchStatus.SCHEDULED, homeScore: fullTime?.[0] ?? null, awayScore: fullTime?.[1] ?? null, rawData: match },
          });
          fixtures++;
          if (!isFinished || !fullTime) continue;
          const home = table.get(homeTeamId) || stats();
          const away = table.get(awayTeamId) || stats();
          home.played++; away.played++; home.goalsFor += fullTime[0]; home.goalsAgainst += fullTime[1]; away.goalsFor += fullTime[1]; away.goalsAgainst += fullTime[0];
          if (fullTime[0] > fullTime[1]) { home.won++; away.lost++; } else if (fullTime[0] < fullTime[1]) { away.won++; home.lost++; } else { home.drawn++; away.drawn++; }
          table.set(homeTeamId, home); table.set(awayTeamId, away);
        }
        tables.set(`${league.id}|${archive.season}`, table);
      }
    }
    for (const [key, table] of tables) {
      const [leagueId, season] = key.split('|');
      const ordered = [...table.entries()].sort(([, a], [, b]) => (b.won * 3 + b.drawn) - (a.won * 3 + a.drawn) || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);
      for (const [index, [teamId, record]] of ordered.entries()) {
        const points = record.won * 3 + record.drawn;
        await prisma.standing.upsert({ where: { leagueId_teamId_season: { leagueId, teamId, season } }, update: { rank: index + 1, points, played: record.played, won: record.won, drawn: record.drawn, lost: record.lost }, create: { leagueId, teamId, season, rank: index + 1, points, played: record.played, won: record.won, drawn: record.drawn, lost: record.lost } });
        await prisma.teamStats.upsert({ where: { teamId_leagueId_season: { teamId, leagueId, season } }, update: { matchesPlayed: record.played, wins: record.won, draws: record.drawn, losses: record.lost, goalsFor: record.goalsFor, goalsAgainst: record.goalsAgainst }, create: { teamId, leagueId, season, matchesPlayed: record.played, wins: record.won, draws: record.drawn, losses: record.lost, goalsFor: record.goalsFor, goalsAgainst: record.goalsAgainst } });
      }
    }
    await invalidateSportsCache();
    console.log(`✅ Đã nạp ${fixtures} fixtures; standings được tính từ kết quả, không có prediction giả.`);
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error('❌ Import thất bại:', error); process.exit(1); });
