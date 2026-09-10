import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { Throttle } from '@nestjs/throttler';

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

    // Move phương thức này vào bên trong class AuthController
    @Post('verify-email')
    @HttpCode(200)
    async verifyEmail(@Body('token') token: string) {
        const result = await this.authService.verifyEmail(token);
        return { data: result, meta: null, error: null };
    }
}