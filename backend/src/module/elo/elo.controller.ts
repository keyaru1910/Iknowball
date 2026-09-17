import { Controller, Get, Param, Query } from '@nestjs/common';
import { EloService } from './elo.service';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/elo')
export class EloController {
  constructor(private readonly eloService: EloService) {}

  /**
   * Lấy lịch sử biến động điểm Elo của một đội bóng
   */
  @Get('history/:teamId')
  @Public()
  async getHistory(
    @Param('teamId') teamId: string,
    @Query('season') season?: string,
    @Query('leagueId') leagueId?: string,
  ) {
    const data = await this.eloService.getEloHistory(teamId, season, leagueId);
    return { data, meta: null, error: null };
  }

  /**
   * So sánh lịch sử Elo của 2 đội bóng đối đầu
   */
  @Get('compare')
  @Public()
  async compareTeams(
    @Query('homeTeamId') homeTeamId: string,
    @Query('awayTeamId') awayTeamId: string,
    @Query('season') season?: string,
  ) {
    if (!homeTeamId || !awayTeamId) {
      return {
        data: null,
        meta: null,
        error: { message: 'Vui lòng cung cấp cả homeTeamId và awayTeamId' },
      };
    }
    const data = await this.eloService.compareTeamsElo(homeTeamId, awayTeamId, season);
    return { data, meta: null, error: null };
  }
}
