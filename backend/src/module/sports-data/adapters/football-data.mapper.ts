// src/module/sports-data/adapters/football-data.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  NormalizedFixture,
  NormalizedLeague,
  NormalizedStanding,
  NormalizedTeam,
} from './football-provider.interface';
import { normalizeTeamSlug } from './zafronix.mapper';
import { FootballDataLeagueConfig } from './football-data.adapter';

@Injectable()
export class FootballDataMapper {
  toLeague(config: FootballDataLeagueConfig, season: string): NormalizedLeague {
    return {
      externalId: config.externalId,
      name: config.name,
      country: config.country,
      season,
    };
  }

  toTeam(raw: any, leagueExternalId: string): NormalizedTeam {
    const teamName = raw.name || raw.shortName || 'Team';
    const teamSlug = normalizeTeamSlug(teamName);
    return {
      externalId: `zafronix:${leagueExternalId}:${teamSlug}`,
      leagueExternalId,
      name: teamName.trim(),
      shortName: raw.tla || raw.shortName || null,
      logoUrl: raw.crest || null,
      foundedYear: raw.founded ? Number(raw.founded) : null,
    };
  }

  toFixture(raw: any, leagueExternalId: string, season: string): NormalizedFixture {
    const matchDate = raw.utcDate ? new Date(raw.utcDate) : new Date();
    const homeTeamName = (raw.homeTeam?.name || raw.homeTeam?.shortName || 'Home Team').trim();
    const awayTeamName = (raw.awayTeam?.name || raw.awayTeam?.shortName || 'Away Team').trim();

    const homeTeamExternalId = `zafronix:${leagueExternalId}:${normalizeTeamSlug(homeTeamName)}`;
    const awayTeamExternalId = `zafronix:${leagueExternalId}:${normalizeTeamSlug(awayTeamName)}`;

    let status: NormalizedFixture['status'] = 'SCHEDULED';
    const rawStatus = (raw.status || '').toUpperCase();
    if (rawStatus === 'FINISHED' || rawStatus === 'AWARDED') {
      status = 'FINISHED';
    } else if (rawStatus === 'IN_PLAY' || rawStatus === 'PAUSED' || rawStatus === 'LIVE') {
      status = 'LIVE';
    } else if (rawStatus === 'POSTPONED') {
      status = 'POSTPONED';
    } else if (rawStatus === 'CANCELLED' || rawStatus === 'SUSPENDED') {
      status = 'CANCELED';
    }

    const homeScore = raw.score?.fullTime?.home !== undefined ? raw.score.fullTime.home : null;
    const awayScore = raw.score?.fullTime?.away !== undefined ? raw.score.fullTime.away : null;

    return {
      externalId: String(raw.id || `fd:${leagueExternalId}:${season}:${normalizeTeamSlug(homeTeamName)}-${normalizeTeamSlug(awayTeamName)}`),
      leagueExternalId,
      homeTeamExternalId,
      awayTeamExternalId,
      matchDate,
      status,
      homeScore: homeScore !== null ? Number(homeScore) : null,
      awayScore: awayScore !== null ? Number(awayScore) : null,
      rawData: raw,
    };
  }

  toStanding(raw: any, leagueExternalId: string, season: string): NormalizedStanding {
    const teamName = raw.team?.name || raw.team?.shortName || 'Team';
    return {
      leagueExternalId,
      teamExternalId: `zafronix:${leagueExternalId}:${normalizeTeamSlug(teamName)}`,
      season,
      rank: raw.position || 1,
      points: raw.points ?? 0,
      played: raw.playedGames ?? 0,
      won: raw.won ?? 0,
      drawn: raw.draw ?? 0,
      lost: raw.lost ?? 0,
      goalsFor: raw.goalsFor ?? 0,
      goalsAgainst: raw.goalsAgainst ?? 0,
    };
  }
}
