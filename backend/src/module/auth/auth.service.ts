import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { RegisterDto } from '../dto/register.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { getEmailVerifySecret, getJwtRefreshSecret, getJwtSecret } from '../../config/env.validation';

const BCRYPT_COST_FACTOR = 12;
const EMAIL_VERIFY_EXPIRES_IN = '24h';

export interface GoogleUserProfile { googleId: string; email: string; fullName?: string; avatarUrl?: string; }

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private notificationService: NotificationService,
    ) { }

    async register(dto: RegisterDto): Promise<UserResponseDto> {
        // 1. Kiểm tra email đã tồn tại chưa
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            // Không tiết lộ email đã tồn tại dưới dạng khác nếu muốn chống enumeration,
            // nhưng với portfolio project trả 409 rõ ràng là chấp nhận được.
            throw new ConflictException('Email đã được đăng ký');
        }

        // 2. Hash password
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST_FACTOR);

        // 3. Lấy role "user" mặc định
        const userRole = await this.prisma.role.findUnique({
            where: { name: 'user' },
        });
        if (!userRole) {
            // Role phải được seed sẵn lúc setup DB — nếu thiếu là lỗi cấu hình hệ thống
            throw new Error('Role "user" chưa được seed trong DB');
        }

        // 4. Tạo user (transaction không cần thiết ở đây vì chỉ 1 write)
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                fullName: dto.fullName ?? null,
                roleId: userRole.id,
                emailVerifiedAt: null,
                status: 'active',
            },
            include: { role: true },
        });

        // 5. Sinh token verify email (JWT riêng, secret + expiry riêng)
        const verifyToken = this.jwtService.sign(
            { sub: user.id, purpose: 'verify-email' },
            {
                secret: process.env.EMAIL_VERIFY_SECRET,
                expiresIn: EMAIL_VERIFY_EXPIRES_IN,
            },
        );

        // 6. Gửi email verify (không await chặn response nếu muốn phản hồi nhanh,
        // nhưng nên await + try/catch để log lỗi gửi mail rõ ràng)
        try {
            await this.notificationService.sendVerificationEmail(
                user.email,
                verifyToken,
            );
        } catch (err) {
            // Không rollback việc tạo user chỉ vì gửi mail lỗi —
            // cho phép user bấm "resend verification email" sau.
            // Chỉ log lỗi để theo dõi qua Pino logger.
            console.error('Gửi email verify thất bại:', err);
        }

        // 7. Trả về, loại bỏ passwordHash
        return UserResponseDto.fromEntity(user);
    }
    async verifyEmail(token: string): Promise<UserResponseDto> {
    let payload: { sub: string; purpose: string };

    try {
        payload = this.jwtService.verify(token, {
            secret: getEmailVerifySecret(),
        });
    } catch (error) {
        throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    if (payload.purpose !== 'verify-email') {
        throw new BadRequestException('Token không hợp lệ');
    }

    const user = await this.prisma.user.update({
        where: { id: payload.sub },
        data: { emailVerifiedAt: new Date() },
        include: { role: true },
    });

    return UserResponseDto.fromEntity(user);
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email }, include: { role: true } });
        if (!user || !user.passwordHash) return null;
        if (user.status !== 'active') throw new UnauthorizedException('Tài khoản đã bị khóa');
        if (!(await bcrypt.compare(pass, user.passwordHash))) return null;
        const { passwordHash: _, ...result } = user;
        return result;
    }

    async login(user: any, deviceInfo?: string) {
        const payload = { sub: user.id, email: user.email, role: user.role?.name ?? user.role ?? 'user' };
        const accessToken = this.jwtService.sign(payload, { secret: getJwtSecret(), expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any });
        const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, { secret: getJwtRefreshSecret(), expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any });
        await this.prisma.refreshToken.create({ data: { userId: user.id, tokenHash: await bcrypt.hash(refreshToken, BCRYPT_COST_FACTOR), deviceInfo: deviceInfo ?? null, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
        return { user: UserResponseDto.fromEntity(user), tokens: { accessToken, refreshToken } };
    }

    async refreshToken(refreshToken: string) {
        let payload: { sub: string; type: string };
        try { payload = this.jwtService.verify(refreshToken, { secret: getJwtRefreshSecret() }); }
        catch { throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn'); }
        if (payload.type !== 'refresh') throw new UnauthorizedException('Token không phải là refresh token');
        const stored = await this.prisma.refreshToken.findMany({ where: { userId: payload.sub } });
        let active: any = null;
        let revoked: any = null;
        for (const token of stored) {
            if (await bcrypt.compare(refreshToken, token.tokenHash)) {
                if (token.revokedAt !== null || token.expiresAt <= new Date()) revoked = token;
                else active = token;
                break;
            }
        }
        if (revoked) {
            await this.prisma.refreshToken.updateMany({ where: { userId: payload.sub, revokedAt: null }, data: { revokedAt: new Date() } });
            throw new UnauthorizedException('Phát hiện token không hợp lệ hoặc đã bị thu hồi. Toàn bộ phiên đăng nhập đã bị vô hiệu hóa.');
        }
        if (!active) throw new UnauthorizedException('Refresh token không tìm thấy trong hệ thống');
        await this.prisma.refreshToken.update({ where: { id: active.id }, data: { revokedAt: new Date() } });
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
        if (!user || user.status !== 'active') throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị khóa');
        return this.login(user);
    }

    async logout(userId: string, refreshToken?: string) {
        if (!refreshToken) {
            await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
            return { message: 'Đăng xuất thành công' };
        }
        const tokens = await this.prisma.refreshToken.findMany({ where: { userId, revokedAt: null } });
        for (const token of tokens) {
            if (await bcrypt.compare(refreshToken, token.tokenHash)) {
                await this.prisma.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
                break;
            }
        }
        return { message: 'Đăng xuất thành công' };
    }

    async validateGoogleUser(profile: GoogleUserProfile) {
        const account = await this.prisma.oAuthAccount.findUnique({ where: { provider_providerUserId: { provider: 'google', providerUserId: profile.googleId } }, include: { user: { include: { role: true } } } });
        if (account) return account.user;
        let user = await this.prisma.user.findUnique({ where: { email: profile.email }, include: { role: true } });
        let role = await this.prisma.role.findUnique({ where: { name: 'user' } });
        if (!role) role = await this.prisma.role.create({ data: { name: 'user' } });
        if (!user) user = await this.prisma.user.create({ data: { email: profile.email, fullName: profile.fullName ?? null, avatarUrl: profile.avatarUrl ?? null, emailVerifiedAt: new Date(), roleId: role.id, status: 'active' }, include: { role: true } });
        await this.prisma.oAuthAccount.create({ data: { userId: user.id, provider: 'google', providerUserId: profile.googleId } });
        return user;
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) return { message: 'Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục sẽ được gửi' };
        const rawToken = this.jwtService.sign({ sub: user.id, purpose: 'reset-password' }, { secret: getEmailVerifySecret(), expiresIn: '1h' });
        await this.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: await bcrypt.hash(rawToken, BCRYPT_COST_FACTOR), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
        return { message: 'Hướng dẫn khôi phục mật khẩu đã được gửi', resetToken: rawToken };
    }

    async resetPassword(dto: ResetPasswordDto) {
        let payload: { sub: string; purpose: string };
        try { payload = this.jwtService.verify(dto.token, { secret: getEmailVerifySecret() }); }
        catch { throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn'); }
        if (payload.purpose !== 'reset-password') throw new BadRequestException('Token không hợp lệ');
        await this.prisma.user.update({ where: { id: payload.sub }, data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_COST_FACTOR) } });
        return { message: 'Đặt lại mật khẩu thành công' };
    }
}
