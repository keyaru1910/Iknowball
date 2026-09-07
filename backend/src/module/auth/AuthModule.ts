import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { LocalStrategy } from '../strategies/local.strategy';
import { GoogleStrategy } from '../strategies/google.strategy';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'fallback_jwt_secret',
            signOptions: { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any },
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        NotificationService,
        PrismaService,
        JwtStrategy,
        LocalStrategy,
        GoogleStrategy,
        JwtAuthGuard,
        LocalAuthGuard,
        GoogleAuthGuard,
        RolesGuard,
    ],
    exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
