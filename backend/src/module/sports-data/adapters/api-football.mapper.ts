// api-football.mapper.ts
import { Injectable } from '@nestjs/common';
import { NormalizedLeague, NormalizedTeam, NormalizedFixture } from './football-provider.interface';

@Injectable()
export class ApiFootballMapper {
    toLeague(raw: any): NormalizedLeague {
        return {
            externalId: String(raw.league.id),
            name: raw.league.name,
            country: raw.country?.name ?? null,
            season: String(raw.seasons?.[0]?.year ?? new Date().getFullYear()),
        };
    }

    toTeam(raw: any): NormalizedTeam {
        return {
            externalId: String(raw.team.id),
            leagueExternalId: String(raw.league?.id ?? ''),
            name: raw.team.name,
            shortName: raw.team.code ?? null,
            logoUrl: raw.team.logo ?? null,
            foundedYear: raw.team.founded ?? null,
        };
    }

    toFixture(raw: any): NormalizedFixture {
        return {
            externalId: String(raw.fixture.id),
            leagueExternalId: String(raw.league.id),
            homeTeamExternalId: String(raw.teams.home.id),
            awayTeamExternalId: String(raw.teams.away.id),
            matchDate: new Date(raw.fixture.date),
            status: this.mapStatus(raw.fixture.status.short),
            homeScore: raw.goals.home,
            awayScore: raw.goals.away,
            rawData: raw,
        };
    }

    private mapStatus(shortCode: string): NormalizedFixture['status'] {
        // API-Football dùng mã status riêng (NS, 1H, FT, PST, CANC...)
        const map: Record<string, NormalizedFixture['status']> = {
            NS: 'SCHEDULED',
            '1H': 'LIVE',
            HT: 'LIVE',
            '2H': 'LIVE',
            ET: 'LIVE',
            FT: 'FINISHED',
            AET: 'FINISHED',
            PEN: 'FINISHED',
            PST: 'POSTPONED',
            CANC: 'CANCELED',
            ABD: 'CANCELED',
        };
        return map[shortCode] ?? 'SCHEDULED';
    }
}