// src/module/sports-data/adapters/zafronix.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
} from './football-provider.interface';

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

@Injectable()
export class ZafronixMapper {
  toLeague(config: { externalId: string; name: string; country: string }, season: string): NormalizedLeague {
    return {
      externalId: config.externalId,
      name: config.name,
      country: config.country,
      season,
    };
  }

  toTeam(teamName: string, leagueExternalId: string): NormalizedTeam {
    const cleanName = teamName.trim();
    const teamSlug = slug(cleanName);
    return {
      externalId: `zafronix:${leagueExternalId}:${teamSlug}`,
      leagueExternalId,
      name: cleanName,
      shortName: null,
      logoUrl: null,
      foundedYear: null,
    };
  }

  toFixture(raw: any, leagueExternalId: string, season: string): NormalizedFixture {
    const rawDate = raw.date || raw.kickoffUtc || raw.kickoff;
    let matchDate: Date;
    if (raw.kickoffUtc) {
      matchDate = new Date(raw.kickoffUtc);
    } else if (rawDate && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
      matchDate = new Date(`${rawDate.slice(0, 10)}T12:00:00.000Z`);
    } else {
      matchDate = new Date();
    }

    const homeTeamName = (raw.homeTeam || raw.home || 'Home Team').trim();
    const awayTeamName = (raw.awayTeam || raw.away || 'Away Team').trim();
    const homeTeamExternalId = `zafronix:${leagueExternalId}:${slug(homeTeamName)}`;
    const awayTeamExternalId = `zafronix:${leagueExternalId}:${slug(awayTeamName)}`;

    let status: NormalizedFixture['status'] = 'SCHEDULED';
    if (raw.status === 'finished' || (raw.homeScore !== null && raw.homeScore !== undefined && raw.awayScore !== null && raw.awayScore !== undefined)) {
      status = 'FINISHED';
    } else if (raw.status === 'live' || raw.status === 'halftime') {
      status = 'LIVE';
    } else if (raw.status === 'postponed') {
      status = 'POSTPONED';
    } else if (raw.status === 'cancelled' || raw.status === 'canceled') {
      status = 'CANCELED';
    }

    const fixtureId = raw.id || `zafronix:${leagueExternalId}:${slug(season)}:${slug(raw.stage || 'league')}:${slug(homeTeamName)}:${slug(awayTeamName)}`;

    return {
      externalId: String(fixtureId),
      leagueExternalId,
      homeTeamExternalId,
      awayTeamExternalId,
      matchDate,
      status,
      homeScore: raw.homeScore !== undefined && raw.homeScore !== null ? Number(raw.homeScore) : null,
      awayScore: raw.awayScore !== undefined && raw.awayScore !== null ? Number(raw.awayScore) : null,
      rawData: raw,
    };
  }

  toStanding(raw: any, leagueExternalId: string, season: string): NormalizedStanding {
    const teamName = raw.team || raw.name || 'Team';
    return {
      leagueExternalId,
      teamExternalId: `zafronix:${leagueExternalId}:${slug(teamName)}`,
      season,
      rank: raw.rank || raw.position || 1,
      points: raw.points ?? raw.pts ?? 0,
      played: raw.played ?? raw.p ?? 0,
      won: raw.won ?? raw.w ?? 0,
      drawn: raw.drawn ?? raw.d ?? 0,
      lost: raw.lost ?? raw.l ?? 0,
      goalsFor: raw.goalsFor ?? raw.gf ?? 0,
      goalsAgainst: raw.goalsAgainst ?? raw.ga ?? 0,
    };
  }
}
