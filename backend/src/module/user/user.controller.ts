import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private userService: UserService) {}

    @Get('profile')
    async getProfile(@CurrentUser('id') userId: string) {
        const user = await this.userService.findById(userId);
        return { data: user, meta: null, error: null };
    }

    @Patch('profile')
    async updateProfile(
        @CurrentUser('id') userId: string,
        @Body() body: { fullName?: string; avatarUrl?: string },
    ) {
        const user = await this.userService.updateProfile(userId, body);
        return { data: user, meta: null, error: null };
    }

    @Get('api-keys')
    async listApiKeys(@CurrentUser('id') userId: string) {
        const keys = await this.userService.getApiKeys(userId);
        return { data: keys, meta: null, error: null };
    }

    @Patch('api-keys/generate')
    @Post('api-keys')
    async generateApiKey(
        @CurrentUser('id') userId: string,
        @Body() body: { name?: string },
    ) {
        const key = await this.userService.createApiKey(userId, body?.name);
        return { data: key, meta: null, error: null };
    }

    @Delete('api-keys/:id')
    async revokeApiKey(
        @CurrentUser('id') userId: string,
        @Param('id') keyId: string,
    ) {
        await this.userService.revokeApiKey(userId, keyId);
        return { data: { success: true }, meta: null, error: null };
    }
}

