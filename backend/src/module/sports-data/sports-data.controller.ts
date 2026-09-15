// src/module/sports-data/sports-data.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { SportsDataService } from './sports-data.service';

@Controller('api/v1')
export class SportsDataController {
  constructor(private readonly sportsDataService: SportsDataService) {}

  @Get('leagues')
  async getLeagues(
    @Query('sport') sport?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10) || 50));

    const result = await this.sportsDataService.getLeagues(sport, pageNum, limitNum);
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      error: null,
    };
  }

  @Get('leagues/:id/standings')
  async getStandings(
    @Param('id') leagueId: string,
    @Query('season') season?: string,
  ) {
    const data = await this.sportsDataService.getStandings(leagueId, season);
    return { data, meta: { total: data.length }, error: null };
  }

  @Get('teams/:id')
  async getTeamById(@Param('id') id: string) {
    const data = await this.sportsDataService.getTeamById(id);
    return { data, meta: null, error: null };
  }

  @Get('teams/:id/form')
  async getTeamForm(@Param('id') id: string) {
    const data = await this.sportsDataService.getTeamForm(id);
    return { data, meta: null, error: null };
  }

  @Get('teams/:id/stats')
  async getTeamStats(@Param('id') id: string) {
    const data = await this.sportsDataService.getTeamStats(id);
    return { data, meta: null, error: null };
  }

  @Get('statistics/players')
  async getPlayerStatistics(
    @Query('sport') sport?: string,
    @Query('leagueId') leagueId?: string,
    @Query('season') season?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10) || 50));
    const data = await this.sportsDataService.getPlayerStatistics({
      sport,
      leagueId,
      season,
      sortBy,
      limit: limitNum,
    });
    return { data, meta: { total: data.length }, error: null };
  }

  @Get('statistics/teams')
  async getTeamSeasonStatistics(
    @Query('sport') sport?: string,
    @Query('leagueId') leagueId?: string,
    @Query('season') season?: string,
  ) {
    const data = await this.sportsDataService.getTeamSeasonStatistics({
      sport,
      leagueId,
      season,
    });
    return { data, meta: { total: data.length }, error: null };
  }
}

