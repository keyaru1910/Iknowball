import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
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
}
