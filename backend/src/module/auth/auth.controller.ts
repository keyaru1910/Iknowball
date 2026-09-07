import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('api/v1/auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    @HttpCode(201)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async register(@Body() dto: RegisterDto) {
        const user = await this.authService.register(dto);
        return { data: user, meta: null, error: null };
    }

    @Post('verify-email')
    @HttpCode(200)
    async verifyEmail(@Body('token') token: string) {
        if (!token) {
            throw new BadRequestException('Token xác thực là bắt buộc');
        }
        const user = await this.authService.verifyEmail(token);
        return { data: user, meta: null, error: null };
    }

    @Post('login')
    @HttpCode(200)
    @UseGuards(LocalAuthGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async login(@Req() req: any, @Body() _dto: LoginDto) {
        const result = await this.authService.login(req.user);
        return { data: result, meta: null, error: null };
    }

    @Post('refresh')
    @HttpCode(200)
    async refreshToken(@Body() dto: RefreshTokenDto) {
        const result = await this.authService.refreshToken(dto.refreshToken);
        return { data: result, meta: null, error: null };
    }

    @Post('logout')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async logout(@CurrentUser('id') userId: string, @Body('refreshToken') refreshToken?: string) {
        const result = await this.authService.logout(userId, refreshToken);
        return { data: result, meta: null, error: null };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser() user: any) {
        return { data: user, meta: null, error: null };
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Redirects to Google Login
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallback(@Req() req: any) {
        const result = await this.authService.login(req.user);
        return { data: result, meta: null, error: null };
    }

    @Post('forgot-password')
    @HttpCode(200)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        const result = await this.authService.forgotPassword(dto);
        return { data: result, meta: null, error: null };
    }

    @Post('reset-password')
    @HttpCode(200)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        const result = await this.authService.resetPassword(dto);
        return { data: result, meta: null, error: null };
    }
}
