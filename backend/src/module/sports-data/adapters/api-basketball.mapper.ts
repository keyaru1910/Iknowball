// src/module/sports-data/adapters/api-basketball.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
} from './football-provider.interface';

@Injectable()
export class ApiBasketballMapper {
  toLeague(raw: any): NormalizedLeague {
    return {
      externalId: 'nba',
      name: raw.name || 'NBA',
      country: raw.country?.name || 'USA',
      season: raw.seasons?.[0]?.season || '2024-2025',
    };
  }

  toTeam(raw: any): NormalizedTeam {
    return {
      externalId: String(raw.id),
      leagueExternalId: 'nba',
      name: raw.name,
      shortName: raw.code ?? null,
      logoUrl: raw.logo ?? null,
      foundedYear: null,
    };
  }

  toFixture(raw: any): NormalizedFixture {
    let status: NormalizedFixture['status'] = 'SCHEDULED';
    const rawStatus = (raw.status?.short || raw.status?.long || '').toUpperCase();
    if (['FT', 'AOT', 'POST'].includes(rawStatus)) {
      status = 'FINISHED';
    } else if (['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'HT', 'BT', 'LIVE'].includes(rawStatus)) {
      status = 'LIVE';
    } else if (['POSTP', 'INT'].includes(rawStatus)) {
      status = 'POSTPONED';
    } else if (['CANC', 'ABD'].includes(rawStatus)) {
      status = 'CANCELED';
    }

    return {
      externalId: String(raw.id),
      leagueExternalId: 'nba',
      homeTeamExternalId: String(raw.teams?.home?.id ?? ''),
      awayTeamExternalId: String(raw.teams?.away?.id ?? ''),
      matchDate: new Date(raw.date),
      status,
      homeScore: status === 'FINISHED' || status === 'LIVE' ? raw.scores?.home?.total ?? null : null,
      awayScore: status === 'FINISHED' || status === 'LIVE' ? raw.scores?.away?.total ?? null : null,
      rawData: raw,
    };
  }

  toStanding(raw: any, season: string): NormalizedStanding {
    return {
      leagueExternalId: 'nba',
      teamExternalId: String(raw.team?.id ?? ''),
      season,
      rank: raw.position || 1,
      points: (raw.games?.win?.total ?? 0) * 2,
      played: raw.games?.played ?? 0,
      won: raw.games?.win?.total ?? 0,
      drawn: 0,
      lost: raw.games?.lose?.total ?? 0,
      goalsFor: raw.points?.for ?? 0,
      goalsAgainst: raw.points?.against ?? 0,
    };
  }
}
