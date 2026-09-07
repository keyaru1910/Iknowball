// api-football.provider.ts
import { Injectable } from '@nestjs/common';
import { SportsDataProvider, NormalizedLeague, NormalizedTeam, NormalizedFixture } from './football-provider.interface';
import { ApiFootballAdapter } from './api-football.adapter';
import { ApiFootballMapper } from './api-football.mapper';

@Injectable()
export class ApiFootballProvider implements SportsDataProvider {
    constructor(
        private readonly adapter: ApiFootballAdapter,
        private readonly mapper: ApiFootballMapper,
    ) { }

    async fetchLeagues(country?: string): Promise<NormalizedLeague[]> {
        const raw = await this.adapter.getLeagues(country);
        return raw.map((r) => this.mapper.toLeague(r));
    }

    async fetchTeams(leagueExternalId: string, season: string): Promise<NormalizedTeam[]> {
        const raw = await this.adapter.getTeams(leagueExternalId, season);
        return raw.map((r) => this.mapper.toTeam(r));
    }

    async fetchFixtures(leagueExternalId: string, season: string): Promise<NormalizedFixture[]> {
        const raw = await this.adapter.getFixtures(leagueExternalId, season);
        return raw.map((r) => this.mapper.toFixture(r));
    }
}