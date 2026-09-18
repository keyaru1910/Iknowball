import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/telegram')
export class TelegramController {
    constructor(private readonly telegramService: TelegramService) {}

    /**
     * Lấy thông tin trạng thái liên kết Telegram của người dùng
     */
    @UseGuards(JwtAuthGuard)
    @Get('status')
    async getStatus(@CurrentUser('id') userId: string) {
        const data = await this.telegramService.getStatus(userId);
        return { data, meta: null, error: null };
    }

    /**
     * Sinh mã và Deep Link kết nối Telegram Bot
     */
    @UseGuards(JwtAuthGuard)
    @Post('connect-token')
    async generateConnectToken(@CurrentUser('id') userId: string) {
        const data = await this.telegramService.generateConnectToken(userId);
        return { data, meta: null, error: null };
    }

    /**
     * Hủy liên kết Telegram
     */
    @UseGuards(JwtAuthGuard)
    @Post('disconnect')
    async disconnect(@CurrentUser('id') userId: string) {
        const data = await this.telegramService.disconnect(userId);
        return { data, meta: null, error: null };
    }

    /**
     * Gửi thông báo kiểm tra (Test Notification)
     */
    @UseGuards(JwtAuthGuard)
    @Post('test-notification')
    async sendTestNotification(@CurrentUser('id') userId: string) {
        const data = await this.telegramService.sendTestNotification(userId);
        return { data, meta: null, error: null };
    }

    /**
     * Webhook nhận cập nhật từ Telegram Bot
     */
    @Public()
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() payload: any) {
        return this.telegramService.handleWebhook(payload);
    }

    /**
     * Giả lập liên kết Telegram cho môi trường test/demo
     */
    @UseGuards(JwtAuthGuard)
    @Post('simulate-connect')
    async simulateConnect(
        @CurrentUser('id') userId: string,
        @Body() body: { telegramUsername?: string; chatId?: string },
    ) {
        const username = body.telegramUsername || 'VIP_User_' + userId.slice(0, 4);
        const chatId = body.chatId || 'mock_chat_' + Math.floor(Math.random() * 100000000);

        const data = await this.telegramService.handleWebhook({
            message: {
                text: `/start ${(await this.telegramService.generateConnectToken(userId)).token}`,
                chat: { id: chatId },
                from: { username },
            },
        });
        return { data, meta: null, error: null };
    }
}
