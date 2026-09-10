// src/module/sports-data/adapters/api-football.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  NormalizedLeague,
  NormalizedTeam,
  NormalizedFixture,
  NormalizedStanding,
} from './football-provider.interface';

/**
 * Mapper chuyển đổi dữ liệu thô từ API-Football sang kiểu chuẩn hóa nội bộ
 */
@Injectable()
export class ApiFootballMapper {
  toLeague(raw: any): NormalizedLeague {
    const currentSeason =
      raw.seasons?.find((s: any) => s.current) ??
      raw.seasons?.[raw.seasons.length - 1];
    return {
      externalId: String(raw.league.id),
      name: raw.league.name,
      country: raw.country?.name ?? null,
      season: String(currentSeason?.year ?? new Date().getFullYear()),
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

  toStanding(raw: any, leagueExternalId: string, season: string): NormalizedStanding {
    return {
      leagueExternalId,
      teamExternalId: String(raw.team.id),
      season,
      rank: raw.rank,
      points: raw.points,
      played: raw.all?.played ?? 0,
      won: raw.all?.win ?? 0,
      drawn: raw.all?.draw ?? 0,
      lost: raw.all?.lose ?? 0,
      goalsFor: raw.all?.goals?.for ?? 0,
      goalsAgainst: raw.all?.goals?.against ?? 0,
    };
  }

  private mapStatus(shortCode: string): NormalizedFixture['status'] {
    // Chuyển mã trạng thái của API-Football sang Enum chuẩn của hệ thống
    const map: Record<string, NormalizedFixture['status']> = {
      TBD: 'SCHEDULED',
      NS: 'SCHEDULED',
      '1H': 'LIVE',
      HT: 'LIVE',
      '2H': 'LIVE',
      ET: 'LIVE',
      BT: 'LIVE',
      P: 'LIVE',
      SUSP: 'LIVE',
      INT: 'LIVE',
      FT: 'FINISHED',
      AET: 'FINISHED',
      PEN: 'FINISHED',
      PST: 'POSTPONED',
      CANC: 'CANCELED',
      ABD: 'CANCELED',
      AWD: 'FINISHED',
      WO: 'FINISHED',
    };
    return map[shortCode] ?? 'SCHEDULED';
  }
}