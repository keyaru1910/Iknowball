import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Lấy danh sách thông báo của người dùng
     */
    @Get()
    async getMyNotifications(
        @CurrentUser('id') userId: string,
        @Query('limit') limit?: string,
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) || 20 : 20;
        const data = await this.notificationService.getUserNotifications(userId, parsedLimit);
        return { data, meta: null, error: null };
    }

    /**
     * Đánh dấu thông báo là đã đọc
     */
    @Patch(':id/read')
    async markAsRead(
        @CurrentUser('id') userId: string,
        @Param('id') notificationId: string,
    ) {
        const data = await this.notificationService.markAsRead(notificationId, userId);
        return { data, meta: null, error: null };
    }
}
