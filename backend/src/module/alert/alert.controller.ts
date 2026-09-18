import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { UpdateAlertPreferenceDto } from './dto/alert.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('api/v1/alerts')
export class AlertController {
    constructor(private readonly alertService: AlertService) {}

    /**
     * Lấy danh sách các cảnh báo biến động odds & xác suất AI mới nhất
     * Tự động lọc phân quyền theo tier của người dùng (Free, Pro, VIP)
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Get('fluctuations')
    async getFluctuations(
        @Req() req: any,
        @Query('limit') limit?: string,
    ) {
        const userTier = req.user?.tier || 'free';
        const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 20, 50) : 20;
        const data = await this.alertService.getFluctuationAlerts(userTier, parsedLimit);
        return { data, meta: null, error: null };
    }

    /**
     * Kích hoạt quét biến động thị trường thủ công (Cronjob hoặc Admin)
     */
    @UseGuards(JwtAuthGuard)
    @Post('scan')
    async scanFluctuations() {
        const data = await this.alertService.scanAndDetectFluctuations();
        return { data, meta: null, error: null };
    }

    /**
     * Lấy tùy chọn nhận thông báo cảnh báo của người dùng
     */
    @UseGuards(JwtAuthGuard)
    @Get('preferences')
    async getPreferences(@CurrentUser('id') userId: string) {
        const data = await this.alertService.getUserPreferences(userId);
        return { data, meta: null, error: null };
    }

    /**
     * Cập nhật tùy chọn nhận thông báo cảnh báo
     */
    @UseGuards(JwtAuthGuard)
    @Put('preferences')
    async updatePreferences(
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateAlertPreferenceDto,
    ) {
        const data = await this.alertService.updateUserPreferences(userId, dto);
        return { data, meta: null, error: null };
    }
}
