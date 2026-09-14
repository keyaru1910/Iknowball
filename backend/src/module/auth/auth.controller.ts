import { Controller, Post, Get, Body, HttpCode, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('api/v1/auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @HttpCode(201)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // chống spam đăng ký
    async register(@Body() dto: RegisterDto) {
        const user = await this.authService.register(dto);
        return { data: user, meta: null, error: null }; // đúng convention { data, meta, error } trong doc
    }

    @Post('verify-email')
    @HttpCode(200)
    async verifyEmail(@Body('token') token: string) {
        const result = await this.authService.verifyEmail(token);
        return { data: result, meta: null, error: null };
    }

    @Post('login')
    @HttpCode(200)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async login(@Req() req: any, @Body() dto: LoginDto) {
        const user = req.user || (await this.authService.validateUser(dto.email, dto.password));
        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
        }
        const deviceInfo = req.headers?.['user-agent'];
        const result = deviceInfo ? await this.authService.login(user, deviceInfo) : await this.authService.login(user);
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
    async logout(@CurrentUser('id') userId: string, @Body() dto?: RefreshTokenDto) {
        const result = await this.authService.logout(userId, dto?.refreshToken);
        return { data: result, meta: null, error: null };
    }

    @Post('forgot-password')
    @HttpCode(200)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
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

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@CurrentUser() user: any) {
        return { data: user, meta: null, error: null };
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Tự động chuyển hướng sang trang đăng nhập Google
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallback(@Req() req: any, @Res() res: any) {
        const user = req.user;
        const deviceInfo = req.headers?.['user-agent'];
        const { tokens } = await this.authService.login(user, deviceInfo);

        // Chuyển hướng về Frontend kèm token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(
            `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
        );
    }
}