// src/module/sports-sync/sports-sync.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Prisma, MatchStatus, SyncJobStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type {
    SportsDataProvider,
    NormalizedLeague,
    NormalizedTeam,
} from '../sports-data/adapters/football-provider.interface';
import { computeContentHash } from './untils/hash.util';

export interface SyncResult {
    ids: string[];
    processedCount: number;
    failedCount: number;
    errors: string[];
}

interface ResolvedMatch {
    id: string;
    externalId: string;
    leagueId: string;
    homeTeamId: string;
    awayTeamId: string;
    matchDate: Date;
    status: MatchStatus;
    homeScore: number | null;
    awayScore: number | null;
    rawData: Record<string, any>;
    hash: string;
}

const BATCH_CHUNK_SIZE = 500;

@Injectable()
export class SportsSyncService {
    private readonly logger = new Logger(SportsSyncService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject('SPORTS_DATA_PROVIDER')
        private readonly sportsApi: SportsDataProvider,
    ) { }

    // Tạo bản ghi log ban đầu khi bắt đầu job
    async startSyncLog(jobName: string) {
        return this.prisma.syncJobLog.create({
            data: {
                jobName,
                status: SyncJobStatus.FAILED,
                startedAt: new Date(),
            },
        });
    }

    // Cập nhật trạng thái log khi job hoàn tất hoặc gặp lỗi
    async finishSyncLog(
        id: string,
        status: SyncJobStatus,
        recordsProcessed: number,
        errorMessage?: string,
    ) {
        return this.prisma.syncJobLog.update({
            where: { id },
            data: {
                status,
                finishedAt: new Date(),
                recordsProcessed,
                errorMessage,
            },
        });
    }

    // Đảm bảo có môn thể thao mặc định (VD: football)
    private async ensureDefaultSport() {
        return this.prisma.sport.upsert({
            where: { name: 'football' },
            update: {},
            create: { name: 'football' },
        });
    }

    // Upsert League có kiểm tra contentHash để tránh ghi vô ích
    private async upsertLeagueIfChanged(l: NormalizedLeague, sportId: string) {
        const payload = {
            sportId,
            name: l.name,
            country: l.country,
            externalId: l.externalId,
            season: l.season,
        };
        const hash = computeContentHash(payload);

        const existing = await this.prisma.league.findUnique({
            where: { externalId: l.externalId },
            select: { id: true, contentHash: true },
        });

        if (existing && existing.contentHash === hash) {
            return { id: existing.id, changed: false };
        }

        const league = await this.prisma.league.upsert({
            where: { externalId: l.externalId },
            update: {
                name: l.name,
                country: l.country,
                season: l.season,
                contentHash: hash,
            },
            create: {
                sportId,
                name: l.name,
                country: l.country,
                externalId: l.externalId,
                season: l.season,
                contentHash: hash,
            },
            select: { id: true },
        });

        return { id: league.id, changed: true };
    }

    // 1. Đồng bộ Giải đấu (Leagues)
    async syncLeagues(): Promise<SyncResult> {
        const leagues = await this.sportsApi.fetchLeagues(); // Nếu API sập hoàn toàn, throw tại đây -> job fail thật sự
        const ids: string[] = [];
        const errors: string[] = [];

        const defaultSport = await this.ensureDefaultSport();

        for (const l of leagues) {
            try {
                const { id } = await this.upsertLeagueIfChanged(l, defaultSport.id);
                ids.push(id);
            } catch (err: any) {
                // Lỗi của 1 league -> cô lập lỗi, log lại và tiếp tục batch
                errors.push(`${l.externalId}: ${err.message}`);
                this.logger.warn(`League ${l.externalId} upsert failed: ${err.message}`);
            }
        }

        return {
            ids,
            processedCount: ids.length,
            failedCount: errors.length,
            errors,
        };
    }

    // Upsert Team có kiểm tra contentHash
    private async upsertTeamIfChanged(t: NormalizedTeam, leagueId: string) {
        const payload = {
            leagueId,
            name: t.name,
            shortName: t.shortName,
            logoUrl: t.logoUrl,
            externalId: t.externalId,
            foundedYear: t.foundedYear,
        };
        const hash = computeContentHash(payload);

        const existing = await this.prisma.team.findUnique({
            where: { externalId: t.externalId },
            select: { id: true, contentHash: true },
        });

        if (existing && existing.contentHash === hash) {
            return { id: existing.id, changed: false };
        }

        const team = await this.prisma.team.upsert({
            where: { externalId: t.externalId },
            update: {
                leagueId,
                name: t.name,
                shortName: t.shortName,
                logoUrl: t.logoUrl,
                foundedYear: t.foundedYear,
                contentHash: hash,
            },
            create: {
                leagueId,
                name: t.name,
                shortName: t.shortName,
                logoUrl: t.logoUrl,
                externalId: t.externalId,
                foundedYear: t.foundedYear,
                contentHash: hash,
            },
            select: { id: true },
        });

        return { id: team.id, changed: true };
    }

    // 2. Đồng bộ Đội bóng (Teams)
    async syncTeams(leagueIds?: string[]): Promise<SyncResult> {
        const ids: string[] = [];
        const errors: string[] = [];

        const leagues = await this.prisma.league.findMany({
            where: leagueIds && leagueIds.length > 0 ? { id: { in: leagueIds } } : undefined,
        });

        for (const league of leagues) {
            try {
                const teams = await this.sportsApi.fetchTeams(league.externalId, league.season);

                for (const t of teams) {
                    try {
                        const { id } = await this.upsertTeamIfChanged(t, league.id);
                        ids.push(id);
                    } catch (err: any) {
                        errors.push(`Team ${t.externalId}: ${err.message}`);
                        this.logger.warn(`Team ${t.externalId} upsert failed: ${err.message}`);
                    }
                }
            } catch (err: any) {
                errors.push(`Fetch teams for league ${league.externalId} failed: ${err.message}`);
                this.logger.warn(`Fetch teams for league ${league.externalId} failed: ${err.message}`);
            }
        }

        return {
            ids,
            processedCount: ids.length,
            failedCount: errors.length,
            errors,
        };
    }

    // 3. Đồng bộ Trận đấu (Matches)
    async syncMatches(teamIds?: string[]): Promise<SyncResult> {
        const errors: string[] = [];

        const teamsInDb = await this.prisma.team.findMany({
            where: teamIds && teamIds.length > 0 ? { id: { in: teamIds } } : undefined,
            include: { league: true },
        });

        const leagueMap = new Map<string, { externalId: string; season: string; id: string }>();
        for (const team of teamsInDb) {
            if (team.league) {
                leagueMap.set(team.league.id, {
                    externalId: team.league.externalId,
                    season: team.league.season,
                    id: team.league.id,
                });
            }
        }

        // ---- Bước 1: RESOLVE — Isolate lỗi từng match ----
        const resolved: ResolvedMatch[] = [];

        for (const [, league] of leagueMap) {
            try {
                const matches = await this.sportsApi.fetchFixtures(league.externalId, league.season);

                for (const m of matches) {
                    try {
                        const [homeTeam, awayTeam] = await Promise.all([
                            this.prisma.team.findUnique({ where: { externalId: m.homeTeamExternalId } }),
                            this.prisma.team.findUnique({ where: { externalId: m.awayTeamExternalId } }),
                        ]);

                        if (!homeTeam || !awayTeam) {
                            const errorMsg = `Match ${m.externalId}: missing team(s) (home: ${m.homeTeamExternalId}, away: ${m.awayTeamExternalId})`;
                            errors.push(errorMsg);
                            this.logger.warn(errorMsg);
                            continue;
                        }

                        resolved.push({
                            id: randomUUID(),
                            externalId: m.externalId,
                            leagueId: league.id,
                            homeTeamId: homeTeam.id,
                            awayTeamId: awayTeam.id,
                            matchDate: m.matchDate,
                            status: m.status,
                            homeScore: m.homeScore,
                            awayScore: m.awayScore,
                            rawData: m.rawData,
                            hash: computeContentHash(m.rawData),
                        });
                    } catch (err: any) {
                        errors.push(`Match ${m.externalId} resolve failed: ${err.message}`);
                        this.logger.warn(`Match ${m.externalId} resolve failed: ${err.message}`);
                    }
                }
            } catch (err: any) {
                errors.push(`Fetch fixtures for league ${league.externalId} failed: ${err.message}`);
                this.logger.warn(`Fetch fixtures for league ${league.externalId} failed: ${err.message}`);
            }
        }

        // ---- Bước 2: WRITE — Batch upsert theo chunk, có hash-guard ----
        const changedIds: string[] = [];

        for (let i = 0; i < resolved.length; i += BATCH_CHUNK_SIZE) {
            const chunk = resolved.slice(i, i + BATCH_CHUNK_SIZE);
            try {
                const { changedExternalIds } = await this.batchUpsertMatches(chunk);
                changedIds.push(...changedExternalIds);
            } catch (err: any) {
                this.logger.warn(
                    `Batch upsert chunk [${i}-${i + chunk.length}] failed: ${err.message}. Falling back to per-row upsert.`,
                );
                for (const m of chunk) {
                    try {
                        await this.upsertMatchIfChanged(m);
                        changedIds.push(m.externalId);
                    } catch (rowErr: any) {
                        errors.push(`Match ${m.externalId} upsert failed: ${rowErr.message}`);
                        this.logger.warn(`Match ${m.externalId} upsert failed: ${rowErr.message}`);
                    }
                }
            }
        }

        return {
            ids: changedIds,
            processedCount: resolved.length,
            failedCount: errors.length,
            errors,
        };
    }

    // Batch upsert bằng Raw SQL tránh N+1 khi sync số lượng lớn
    private async batchUpsertMatches(matches: ResolvedMatch[]) {
        if (matches.length === 0) {
            return { upserted: 0, skipped: 0, changedExternalIds: [] as string[] };
        }

        const externalIds = matches.map((m) => m.externalId);

        const existing = await this.prisma.$queryRaw<{ externalId: string; contentHash: string | null }[]>`
            SELECT "externalId", "contentHash" FROM "Match" WHERE "externalId" = ANY(${externalIds})
        `;
        const existingHashMap = new Map(existing.map((e) => [e.externalId, e.contentHash]));

        const changed = matches.filter((m) => existingHashMap.get(m.externalId) !== m.hash);

        if (changed.length === 0) {
            this.logger.log(`Batch: ${matches.length} matches, không đổi -> bỏ qua write`);
            return { upserted: 0, skipped: matches.length, changedExternalIds: [] as string[] };
        }

        const values = changed.map(
            (m) => Prisma.sql`(
                ${m.id}, ${m.externalId}, ${m.leagueId}, ${m.homeTeamId}, ${m.awayTeamId},
                ${m.matchDate}, ${m.status}::"MatchStatus", ${m.homeScore}, ${m.awayScore},
                ${JSON.stringify(m.rawData)}::jsonb, ${m.hash}, now(), now()
            )`,
        );

        await this.prisma.$executeRaw`
            INSERT INTO "Match" (
                id, "externalId", "leagueId", "homeTeamId", "awayTeamId",
                "matchDate", status, "homeScore", "awayScore", "rawData", "contentHash", "createdAt", "updatedAt"
            )
            VALUES ${Prisma.join(values)}
            ON CONFLICT ("externalId") DO UPDATE SET
                status        = EXCLUDED.status,
                "homeScore"   = EXCLUDED."homeScore",
                "awayScore"   = EXCLUDED."awayScore",
                "rawData"     = EXCLUDED."rawData",
                "contentHash" = EXCLUDED."contentHash",
                "updatedAt"   = EXCLUDED."updatedAt"
            WHERE "Match"."contentHash" IS DISTINCT FROM EXCLUDED."contentHash"
        `;

        return {
            upserted: changed.length,
            skipped: matches.length - changed.length,
            changedExternalIds: changed.map((m) => m.externalId),
        };
    }

    // Per-row fallback upsert
    private async upsertMatchIfChanged(m: ResolvedMatch) {
        const existing = await this.prisma.match.findUnique({
            where: { externalId: m.externalId },
            select: { contentHash: true },
        });
        if (existing?.contentHash === m.hash) return;

        await this.prisma.match.upsert({
            where: { externalId: m.externalId },
            update: {
                status: m.status,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                rawData: m.rawData as any,
                contentHash: m.hash,
            },
            create: {
                id: m.id,
                externalId: m.externalId,
                leagueId: m.leagueId,
                homeTeamId: m.homeTeamId,
                awayTeamId: m.awayTeamId,
                matchDate: m.matchDate,
                status: m.status,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                rawData: m.rawData as any,
                contentHash: m.hash,
            },
        });
    }
}