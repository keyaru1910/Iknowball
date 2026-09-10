import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PredictionService } from './prediction.service';
import { EloService } from '../elo/elo.service';

@Controller('api/v1/predictions')
export class PredictionController {
  constructor(
    private readonly service: PredictionService,
    private readonly eloService: EloService,
  ) {}

  /** Danh sách dự đoán (public, phân trang) */
  @Get()
  @Public()
  async list(
    @Query('league') league?: string,
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const result = await this.service.list(league, date, pageNum, limitNum);
    return {
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
      error: null,
    };
  }

  /** Tổng hợp hiệu năng mô hình theo tuần (public) */
  @Get('performance')
  @Public()
  async performance(@Query('league') league?: string) {
    const data = await this.service.performance(league);
    return { data, meta: null, error: null };
  }

  /** Lịch sử hiệu năng mô hình (premium/admin) */
  @Get('performance/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('premium', 'admin')
  async history(@Query('league') league?: string) {
    const data = await this.service.performance(league, true);
    return { data, meta: null, error: null };
  }

  /**
   * Lấy kết quả backtest so sánh baseline gần nhất (public).
   * Dùng dữ liệu dự đoán đã được đánh giá (PredictionResult) trong DB.
   */
  @Get('backtest')
  @Public()
  async getBacktest(
    @Query('league') league?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    const data = await this.service.runBacktest(league, fromDate, toDate);
    return { data, meta: null, error: null };
  }

  /**
   * Kích hoạt chạy backtest ngay lập tức (admin only).
   * Trả về kết quả so sánh Model vs Random vs Higher-Elo baseline.
   */
  @Post('backtest/run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async runBacktest(
    @Query('league') league?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    const data = await this.service.runBacktest(league, fromDate, toDate);
    return { data, meta: null, error: null };
  }

  /** Rebuild Elo theo thứ tự thời gian cho một giải đấu/mùa (admin only) */
  @Post('elo/rebuild')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async rebuildElo(@Query('league') league: string, @Query('season') season: string) {
    const processed = await this.eloService.rebuildLeagueSeason(league, season);
    return { data: { processed }, meta: null, error: null };
  }

  /**
   * Xử lý tuần tự tất cả trận FINISHED chưa cập nhật Elo (admin only).
   * Nên chạy trước khi generateUpcoming để đảm bảo Elo cập nhật.
   */
  @Post('elo/process-pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async processPendingElo() {
    const processed = await this.eloService.processPendingFinishedMatches();
    return { data: { processed }, meta: null, error: null };
  }

  /** Chi tiết dự đoán cho một trận đấu (optional auth – premium thấy explanation) */
  @Get(':matchId')
  @UseGuards(OptionalJwtAuthGuard)
  async detail(
    @Param('matchId') matchId: string,
    @CurrentUser() user?: { id: string; role: string },
  ) {
    const data = await this.service.detail(matchId, user);
    return { data, meta: null, error: null };
  }
}
