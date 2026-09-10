// src/module/match/match.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('api/v1/matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  async getMatches(
    @Query('date') date?: string,
    @Query('leagueId') leagueId?: string,
    @Query('status') status?: string,
    @Query('sport') sport?: string,
    @Query('season') season?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10) || 50));

    const result = await this.matchService.getMatches({
      date,
      leagueId,
      status,
      sport,
      season,
      page: pageNum,
      limit: limitNum,
    });

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

  @Get(':id')
  async getMatchById(@Param('id') id: string) {
    const data = await this.matchService.getMatchById(id);
    return { data, meta: null, error: null };
  }

  @Get(':id/h2h')
  async getMatchH2H(@Param('id') id: string) {
    const data = await this.matchService.getMatchH2H(id);
    return { data, meta: null, error: null };
  }
}
