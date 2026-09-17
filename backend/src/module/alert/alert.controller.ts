import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { UpdateAlertPreferenceDto } from './dto/alert.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';

@Controller('alerts')
export class AlertController {
    constructor(private readonly alertService: AlertService) {}

    /**
     * Lấy danh sách các cảnh báo biến động odds & xác suất AI mới nhất
     * Tự động lọc phân quyền theo tier của người dùng (Free, Pro, VIP)
     */
    @Public()
    @Get('fluctuations')
    async getFluctuations(
        @Req() req: any,
        @Query('limit') limit?: string,
    ) {
        const userTier = req.user?.tier || 'free';
        const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 20, 50) : 20;
        return this.alertService.getFluctuationAlerts(userTier, parsedLimit);
    }

    /**
     * Kích hoạt quét biến động thị trường thủ công (Cronjob hoặc Admin)
     */
    @UseGuards(JwtAuthGuard)
    @Post('scan')
    async scanFluctuations() {
        return this.alertService.scanAndDetectFluctuations();
    }

    /**
     * Lấy tùy chọn nhận thông báo cảnh báo của người dùng
     */
    @UseGuards(JwtAuthGuard)
    @Get('preferences')
    async getPreferences(@CurrentUser('id') userId: string) {
        return this.alertService.getUserPreferences(userId);
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
        return this.alertService.updateUserPreferences(userId, dto);
    }
}
