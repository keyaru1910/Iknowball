import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
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

const COOKIE_REFRESH_TOKEN_KEY = 'refreshToken';

function setRefreshTokenCookie(res?: Response, token?: string): void {
    if (res && typeof res.cookie === 'function' && token) {
        res.cookie(COOKIE_REFRESH_TOKEN_KEY, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/api/v1/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });
    }
}

function clearRefreshTokenCookie(res?: Response): void {
    if (res && typeof res.clearCookie === 'function') {
        res.clearCookie(COOKIE_REFRESH_TOKEN_KEY, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/api/v1/auth',
        });
    }
}

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
    async login(@Req() req: any, @Res({ passthrough: true }) res: Response, @Body() _dto: LoginDto) {
        const userAgent = req?.headers?.['user-agent'];
        const result = userAgent
            ? await this.authService.login(req?.user || req, userAgent)
            : await this.authService.login(req?.user || req);
        setRefreshTokenCookie(res, result.tokens.refreshToken);
        return { data: result, meta: null, error: null };
    }

    @Post('refresh')
    @HttpCode(200)
    async refreshToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Body() dto: RefreshTokenDto,
    ) {
        const token = req.cookies?.[COOKIE_REFRESH_TOKEN_KEY] || dto?.refreshToken;
        if (!token) {
            throw new BadRequestException('Refresh token không được tìm thấy trong cookie hoặc request body');
        }
        const result = await this.authService.refreshToken(token);
        setRefreshTokenCookie(res, result.tokens.refreshToken);
        return { data: result, meta: null, error: null };
    }

    @Post('logout')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @CurrentUser('id') userId: string,
        @Body('refreshToken') bodyRefreshToken?: string,
    ) {
        const token = req.cookies?.[COOKIE_REFRESH_TOKEN_KEY] || bodyRefreshToken;
        const result = await this.authService.logout(userId, token);
        clearRefreshTokenCookie(res);
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
    async googleAuthCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(req?.user || req, req?.headers?.['user-agent']);
        setRefreshTokenCookie(res, result.tokens.refreshToken);
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
